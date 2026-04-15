// @vitest-environment jsdom
/**
 * FR-SOL-P1: marcador sessionStorage → SOL-L2 após consulta "não encontrado" (simula reload via remount).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { waitFor } from '@testing-library/react';

import GuidesMei from './GuidesMei';
import { MEI_WORKSPACE_STORAGE_KEY } from './guidesMeiWorkspaceStorage';
import { invalidateMeiEmpresaGetCache } from '../utils/guiaMeiEmpresaGetCache';
import { meiEmpresaFase2FailStorageKey } from '../utils/guiaMeiEmpresaFase2FailFlag';
import { PLUGNOTAS_SOL_L2_TITLE } from '../utils/plugnotasEmpresaCadastroSolUx';

const globalWithActFlag = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
globalWithActFlag.IS_REACT_ACT_ENVIRONMENT = true;

const defaultCertStatus = () => ({
  hasUserCertificate: false,
  hasEnvCertificate: false,
  documento: null as string | null,
  documentosAtivos: null as { nfse: boolean; nfe: boolean; nfce: boolean } | null
});

/** GET sem ramo `nfse/nfe/nfce.ativo` → não limpa marcador fase 2 em `loadCertificateStatus`. */
const empresaSemDocumentosParseaveis = { message: 'ok', data: {} };

const {
  useAuthStoreMock,
  authState,
  fetchMeiCertificateStatusMock,
  consultarEmpresaEmissaoNfMock,
  atualizarEmpresaEmissaoNfMock,
  fetchNfsePrestadorPrefillMock
} = vi.hoisted(() => {
  const state = {
    role: 'admin' as const,
    mei: true,
    userId: 'test-user-id' as string | null
  };
  const hook = Object.assign(() => state, { getState: () => state });
  return {
    useAuthStoreMock: hook,
    authState: state,
    fetchMeiCertificateStatusMock: vi.fn(async () => defaultCertStatus()),
    consultarEmpresaEmissaoNfMock: vi.fn(async () => empresaSemDocumentosParseaveis),
    atualizarEmpresaEmissaoNfMock: vi.fn(async () => ({
      cnpj: '12345678000190',
      message: 'ok',
      raw: {}
    })),
    fetchNfsePrestadorPrefillMock: vi.fn(async () => ({
      prestadorCpfCnpj: null,
      prestadorRazaoSocial: null,
      prestadorEmail: null,
      prestadorInscricaoMunicipal: null,
      prestadorEndereco: null,
      sourceRowId: null
    }))
  };
});

vi.mock('../store/authStore', () => ({
  useAuthStore: useAuthStoreMock
}));

vi.mock('../services/guidesMeiService', () => ({
  downloadMeiGuide: vi.fn(async () => ({ blob: new Blob(), filename: 'guia-mei.pdf' })),
  downloadParcelamentoPdf: vi.fn(async () => ({ blob: new Blob(), filename: 'p.pdf' })),
  fetchMeiCertificateStatus: (...args: unknown[]) => fetchMeiCertificateStatusMock(...args),
  fetchMeiPeriods: vi.fn(async () => []),
  fetchMeiPeriodsByCnpj: vi.fn(async () => []),
  fetchParcelamentos: vi.fn(async () => ({ parcelamentos: [] })),
  removeMeiCertificate: vi.fn(async () => undefined),
  uploadMeiCertificate: vi.fn(async () => ({ documento: null })),
  patchMeiCertificateEmitenteNfse: vi.fn(async () => ({})),
  validateMeiGuide: vi.fn(async () => ({
    success: true,
    data: { status: 'ok', details: null }
  }))
}));

vi.mock('../services/meiPrestadorPrefillService', () => ({
  fetchNfsePrestadorPrefill: (...args: unknown[]) => fetchNfsePrestadorPrefillMock(...args)
}));

vi.mock('../services/meiNotasService', () => ({
  arquivarNfse: vi.fn(async () => ({})),
  atualizarNfse: vi.fn(async () => ({})),
  atualizarEmpresaEmissaoNf: (...args: unknown[]) => atualizarEmpresaEmissaoNfMock(...args),
  baixarNfsePdf: vi.fn(async () => ({ blob: new Blob(), filename: 'nota.pdf' })),
  baixarNfseXml: vi.fn(async () => ({ blob: new Blob(), filename: 'nota.xml' })),
  cadastrarCertificadoEmissaoNf: vi.fn(async () => ({ id: 'cert-1', message: 'ok' })),
  cadastrarEmpresaEmissaoNf: vi.fn(async () => ({ cnpj: '12345678000190', message: 'ok' })),
  consultarEmpresaEmissaoNf: (...args: unknown[]) => consultarEmpresaEmissaoNfMock(...args),
  cancelarNfse: vi.fn(async () => ({})),
  emitirNfse: vi.fn(async () => ({ id: 'nfse-1', protocol: 'P-1' })),
  listarCatalogoNfseClientes: vi.fn(async () => []),
  listarCatalogoNfseProdutos: vi.fn(async () => []),
  listarNfse: vi.fn(async () => []),
  obterNfse: vi.fn(async () => ({}))
}));

function setTextInputValue(input: HTMLInputElement, value: string) {
  const desc = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
  desc?.set?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

async function openCertificadoDas(container: HTMLElement, root: ReturnType<typeof createRoot>) {
  await act(async () => {
    root.render(<GuidesMei />);
  });
  const goDas = Array.from(container.querySelectorAll('button')).find((b) =>
    b.textContent?.includes('Certificado e DAS')
  );
  expect(goDas).toBeTruthy();
  await act(async () => {
    goDas?.click();
  });
}

describe('GuidesMei — FR-SOL-P1 sessionStorage SOL-L2', () => {
  beforeEach(() => {
    authState.role = 'admin';
    authState.mei = true;
    authState.userId = 'test-user-id';
    sessionStorage.clear();
    localStorage.removeItem(MEI_WORKSPACE_STORAGE_KEY);
    consultarEmpresaEmissaoNfMock.mockReset();
    consultarEmpresaEmissaoNfMock.mockImplementation(async () => empresaSemDocumentosParseaveis);
    fetchMeiCertificateStatusMock.mockReset();
    fetchMeiCertificateStatusMock.mockImplementation(async () => defaultCertStatus());
  });

  it('remount + sessionStorage pré-preenchido: consulta 404 mostra copy SOL-L2', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await openCertificadoDas(container, root);

    const cnpjInput = container.querySelector(
      'input[placeholder="00.000.000/0001-00"]'
    ) as HTMLInputElement | null;
    expect(cnpjInput).toBeTruthy();
    await act(async () => {
      setTextInputValue(cnpjInput!, '12345678000190');
    });

    await waitFor(() => {
      expect(consultarEmpresaEmissaoNfMock.mock.calls.length).toBeGreaterThanOrEqual(1);
    });

    sessionStorage.setItem(
      meiEmpresaFase2FailStorageKey('test-user-id', '12345678000190'),
      JSON.stringify({ t: Date.now() })
    );
    invalidateMeiEmpresaGetCache('test-user-id', '12345678000190');
    consultarEmpresaEmissaoNfMock.mockRejectedValueOnce(new Error('404 empresa não encontrada'));

    const consultBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Consultar cadastro no emissor')
    );
    expect(consultBtn).toBeTruthy();
    await act(async () => {
      consultBtn?.click();
    });

    await waitFor(() => {
      expect(container.textContent).toContain(PLUGNOTAS_SOL_L2_TITLE);
    });

    await act(async () => {
      root.unmount();
    });

    const root2 = createRoot(container);
    await openCertificadoDas(container, root2);
    const cnpj2 = container.querySelector(
      'input[placeholder="00.000.000/0001-00"]'
    ) as HTMLInputElement | null;
    await act(async () => {
      setTextInputValue(cnpj2!, '12345678000190');
    });
    await waitFor(() => {
      expect(consultarEmpresaEmissaoNfMock.mock.calls.length).toBeGreaterThanOrEqual(1);
    });
    sessionStorage.setItem(
      meiEmpresaFase2FailStorageKey('test-user-id', '12345678000190'),
      JSON.stringify({ t: Date.now() })
    );
    invalidateMeiEmpresaGetCache('test-user-id', '12345678000190');
    consultarEmpresaEmissaoNfMock.mockRejectedValueOnce(new Error('404 not found'));
    const consultBtn2 = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Consultar cadastro no emissor')
    );
    await act(async () => {
      consultBtn2?.click();
    });
    await waitFor(() => {
      expect(container.textContent).toContain(PLUGNOTAS_SOL_L2_TITLE);
    });

    await act(async () => {
      root2.unmount();
    });
    container.remove();
  });
});
