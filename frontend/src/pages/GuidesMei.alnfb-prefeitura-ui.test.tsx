// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { waitFor } from '@testing-library/react';

import GuidesMei from './GuidesMei';
import { ApiClientError } from '../utils/apiClientError';

const globalWithActFlag = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
globalWithActFlag.IS_REACT_ACT_ENVIRONMENT = true;

const defaultCertStatus = () => ({
  hasUserCertificate: false,
  hasEnvCertificate: false,
  documento: null as string | null
});

const {
  useAuthStoreMock,
  authState,
  uploadMeiCertificateMock,
  cadastrarCertificadoEmissaoNfMock,
  cadastrarEmpresaEmissaoNfMock,
  consultarEmpresaEmissaoNfMock,
  atualizarEmpresaEmissaoNfMock,
  patchMeiCertificateEmitenteNfseMock,
  removeMeiCertificateMock,
  fetchMeiCertificateStatusMock
} = vi.hoisted(() => {
  const state = {
    role: 'admin' as 'superadmin' | 'admin' | 'usuario' | 'outsider',
    mei: false as boolean | null,
    userId: 'test-user' as string | null
  };
  const hook = Object.assign(() => state, { getState: () => state });
  return {
    useAuthStoreMock: hook,
    authState: state,
    uploadMeiCertificateMock: vi.fn(),
    cadastrarCertificadoEmissaoNfMock: vi.fn(async () => ({ id: 'cert-1', message: 'ok' })),
    cadastrarEmpresaEmissaoNfMock: vi.fn(async () => ({ cnpj: '12345678000190', message: 'ok' })),
    consultarEmpresaEmissaoNfMock: vi.fn(async () => ({ message: 'ok', data: {} })),
    atualizarEmpresaEmissaoNfMock: vi.fn(async () => ({ cnpj: '12345678000190', message: 'ok', raw: {} })),
    patchMeiCertificateEmitenteNfseMock: vi.fn(async () => ({
      hasUserCertificate: false,
      hasEnvCertificate: false,
      documento: null,
      nfseEmitente: null
    })),
    removeMeiCertificateMock: vi.fn(async () => undefined),
    fetchMeiCertificateStatusMock: vi.fn(async () => defaultCertStatus())
  };
});

vi.mock('../store/authStore', () => ({
  useAuthStore: useAuthStoreMock
}));

vi.mock('../utils/prefeituraPortalCredentialsUi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils/prefeituraPortalCredentialsUi')>();
  return {
    ...actual,
    isPrefeituraPortalCredentialsUiEnabled: () => true
  };
});

vi.mock('../services/guidesMeiService', () => ({
  downloadMeiGuide: vi.fn(async () => ({ blob: new Blob(), filename: 'guia-mei.pdf' })),
  downloadParcelamentoPdf: vi.fn(async () => ({ blob: new Blob(), filename: 'p.pdf' })),
  fetchMeiCertificateStatus: fetchMeiCertificateStatusMock,
  fetchMeiPeriods: vi.fn(async () => []),
  fetchMeiPeriodsByCnpj: vi.fn(async () => []),
  fetchParcelamentos: vi.fn(async () => ({ parcelamentos: [] })),
  patchMeiCertificateEmitenteNfse: patchMeiCertificateEmitenteNfseMock,
  removeMeiCertificate: removeMeiCertificateMock,
  uploadMeiCertificate: uploadMeiCertificateMock,
  validateMeiGuide: vi.fn(async () => ({
    success: true,
    data: { status: 'ok', details: null }
  }))
}));

vi.mock('../services/meiNotasService', () => ({
  arquivarNfse: vi.fn(async () => ({})),
  atualizarNfse: vi.fn(async () => ({})),
  atualizarEmpresaEmissaoNf: atualizarEmpresaEmissaoNfMock,
  baixarNfsePdf: vi.fn(async () => ({ blob: new Blob(), filename: 'nota.pdf' })),
  baixarNfseXml: vi.fn(async () => ({ blob: new Blob(), filename: 'nota.xml' })),
  cadastrarCertificadoEmissaoNf: cadastrarCertificadoEmissaoNfMock,
  cadastrarEmpresaEmissaoNf: cadastrarEmpresaEmissaoNfMock,
  consultarEmpresaEmissaoNf: consultarEmpresaEmissaoNfMock,
  cancelarNfse: vi.fn(async () => ({})),
  emitirNfse: vi.fn(async () => ({ id: 'nfse-1', protocol: 'P-1' })),
  listarCatalogoNfseClientes: vi.fn(async () => []),
  listarCatalogoNfseProdutos: vi.fn(async () => []),
  listarNfse: vi.fn(async () => []),
  obterNfse: vi.fn(async () => ({}))
}));

function setFileInputFiles(input: HTMLInputElement, file: File) {
  const list = {
    length: 1,
    0: file,
    item: (i: number) => (i === 0 ? file : null)
  };
  Object.defineProperty(input, 'files', { value: list, configurable: true });
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function setTextInputValue(input: HTMLInputElement, value: string) {
  const desc = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
  desc?.set?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function fillNfEmissionCompanyMinimum(container: HTMLElement) {
  const setByPlaceholder = (placeholder: string, value: string) => {
    const el = container.querySelector(`input[placeholder="${placeholder}"]`) as HTMLInputElement | null;
    if (!el) throw new Error(`campo ${placeholder} não encontrado`);
    setTextInputValue(el, value);
  };
  setByPlaceholder('Razão social *', 'Empresa Teste MEI LTDA');
  setByPlaceholder('CEP *', '01310100');
  setByPlaceholder('Logradouro *', 'Avenida Paulista');
  setByPlaceholder('Número *', '1000');
  setByPlaceholder('Bairro *', 'Bela Vista');
  setByPlaceholder('Código IBGE cidade *', '3550308');
  setByPlaceholder('Cidade *', 'São Paulo');
  setByPlaceholder('UF *', 'SP');
}

function findGuidesMeiCertPrimaryCta(container: HTMLElement) {
  return Array.from(container.querySelectorAll('button')).find((b) => {
    const t = b.textContent ?? '';
    return t.includes('Enviar certificado') || t.includes('Concluir configuração fiscal');
  });
}

function fillCnpjMei(container: HTMLElement, digits = '12345678000190') {
  const el = container.querySelector('input[placeholder="00.000.000/0001-00"]') as HTMLInputElement | null;
  if (!el) throw new Error('campo CNPJ do MEI não encontrado');
  setTextInputValue(el, digits);
}

describe('GuidesMei — FR-ALNFB UI credenciais prefeitura (fallback disponível)', () => {
  beforeEach(() => {
    authState.role = 'admin';
    authState.mei = false;
    authState.userId = 'test-user';
    uploadMeiCertificateMock.mockReset();
    cadastrarCertificadoEmissaoNfMock.mockReset();
    cadastrarEmpresaEmissaoNfMock.mockReset();
    consultarEmpresaEmissaoNfMock.mockReset();
    atualizarEmpresaEmissaoNfMock.mockReset();
    patchMeiCertificateEmitenteNfseMock.mockReset();
    removeMeiCertificateMock.mockReset();
    fetchMeiCertificateStatusMock.mockReset();
    cadastrarCertificadoEmissaoNfMock.mockImplementation(async () => ({ id: 'cert-plug-1', message: 'ok' }));
    cadastrarEmpresaEmissaoNfMock.mockImplementation(async () => ({ cnpj: '12345678000190', message: 'ok' }));
    consultarEmpresaEmissaoNfMock.mockImplementation(async () => ({ message: 'ok', data: {} }));
    atualizarEmpresaEmissaoNfMock.mockImplementation(async () => ({ cnpj: '12345678000190', message: 'ok', raw: {} }));
    patchMeiCertificateEmitenteNfseMock.mockImplementation(async () => ({
      hasUserCertificate: false,
      hasEnvCertificate: false,
      documento: null,
      nfseEmitente: null
    }));
    removeMeiCertificateMock.mockImplementation(async () => undefined);
    fetchMeiCertificateStatusMock.mockImplementation(async () => defaultCertStatus());
  });

  it('exibe bloco de credenciais e CTA municipal após classificação fallback_available', async () => {
    uploadMeiCertificateMock.mockResolvedValueOnce({
      hasUserCertificate: true,
      hasEnvCertificate: false,
      documento: '12345678000190',
      certValidFrom: null,
      certValidTo: null
    });
    cadastrarEmpresaEmissaoNfMock.mockRejectedValueOnce(
      new ApiClientError('Falha na validação do JSON de Empresa (POST /empresa no emissor fiscal)', {
        plugnotasCode: 'prefeitura_login_required_fallback_available',
        plugnotasRequest: { method: 'POST', path: '/empresa' },
        httpStatus: 400,
        runtimeDecision: { scenario: 'prefeitura_login_required_fallback_available' }
      })
    );

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<GuidesMei />);
    });

    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .find((b) => b.textContent?.includes('Certificado e DAS'))
        ?.click();
    });

    const fileInput = container.querySelector('input[type=file]') as HTMLInputElement;
    const passInput = container.querySelector('input[type=password]') as HTMLInputElement;
    const submitBtn = findGuidesMeiCertPrimaryCta(container);

    await act(async () => {
      fillCnpjMei(container);
      setFileInputFiles(fileInput, new File(['x'], 'test.p12'));
      setTextInputValue(passInput, 'secret');
      fillNfEmissionCompanyMinimum(container);
    });

    await act(async () => {
      submitBtn?.click();
    });

    expect(container.textContent).toContain('Credenciais do portal da prefeitura');
    expect(
      Array.from(container.querySelectorAll('button')).some((b) =>
        b.textContent?.includes('Concluir cadastro com dados da prefeitura')
      )
    ).toBe(true);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('foca o primeiro campo com erro (login) quando o retry municipal falha validação conjunta', async () => {
    uploadMeiCertificateMock.mockResolvedValueOnce({
      hasUserCertificate: true,
      hasEnvCertificate: false,
      documento: '12345678000190',
      certValidFrom: null,
      certValidTo: null
    });
    cadastrarEmpresaEmissaoNfMock.mockRejectedValueOnce(
      new ApiClientError('Falha na validação do JSON de Empresa (POST /empresa no emissor fiscal)', {
        plugnotasCode: 'prefeitura_login_required_fallback_available',
        plugnotasRequest: { method: 'POST', path: '/empresa' },
        httpStatus: 400,
        runtimeDecision: { scenario: 'prefeitura_login_required_fallback_available' }
      })
    );

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<GuidesMei />);
    });

    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .find((b) => b.textContent?.includes('Certificado e DAS'))
        ?.click();
    });

    const fileInput = container.querySelector('input[type=file]') as HTMLInputElement;
    const passInput = container.querySelector('input[type=password]') as HTMLInputElement;
    const submitBtn = findGuidesMeiCertPrimaryCta(container);

    await act(async () => {
      fillCnpjMei(container);
      setFileInputFiles(fileInput, new File(['x'], 'test.p12'));
      setTextInputValue(passInput, 'secret');
      fillNfEmissionCompanyMinimum(container);
    });

    await act(async () => {
      submitBtn?.click();
    });

    const municipalCta = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Concluir cadastro com dados da prefeitura')
    );
    expect(municipalCta).toBeTruthy();

    await act(async () => {
      municipalCta?.click();
    });

    await waitFor(() => {
      expect(document.activeElement?.id).toBe('mei-prefeitura-login');
    });

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
