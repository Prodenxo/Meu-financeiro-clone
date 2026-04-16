// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

import GuidesMei from './GuidesMei';
import { ApiClientError } from '../utils/apiClientError';
import { GUIMEI_CONNECTIVITY_CERTIFICATE_MESSAGE } from '../utils/guiaMeiConnectivityUserMessage';
import { invalidateMeiEmpresaGetCache } from '../utils/guiaMeiEmpresaGetCache';

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
    role: 'usuario' as 'superadmin' | 'admin' | 'usuario' | 'outsider',
    mei: false
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

/** React 18 + input controlado: atualiza o valor de forma que o estado enxergue em testes jsdom. */
function setTextInputValue(input: HTMLInputElement, value: string) {
  const desc = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value'
  );
  desc?.set?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function fillNfEmissionCompanyMinimum(container: HTMLElement) {
  const setByPlaceholder = (placeholder: string, value: string) => {
    const el = container.querySelector(`input[placeholder="${placeholder}"]`) as HTMLInputElement | null;
    if (!el) throw new Error(`campo não encontrado: ${placeholder}`);
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

/** CTA primário do certificado: fluxo DAS-only ou “Concluir configuração fiscal” (canViewNfse). */
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

describe('GuidesMei certificado — conectividade (US-CONN-MEI-03 + US-MEI-FISC-01)', () => {
  beforeEach(() => {
    authState.role = 'usuario';
    authState.mei = false;
    uploadMeiCertificateMock.mockReset();
    cadastrarCertificadoEmissaoNfMock.mockReset();
    cadastrarEmpresaEmissaoNfMock.mockReset();
    consultarEmpresaEmissaoNfMock.mockReset();
    atualizarEmpresaEmissaoNfMock.mockReset();
    patchMeiCertificateEmitenteNfseMock.mockReset();
    cadastrarCertificadoEmissaoNfMock.mockImplementation(async () => ({ id: 'cert-1', message: 'ok' }));
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

  it('exibe alerta de conectividade quando upload falha com erro de rede (fetch)', async () => {
    uploadMeiCertificateMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

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

    const fileInput = container.querySelector('input[type=file]') as HTMLInputElement;
    const passInput = container.querySelector('input[type=password]') as HTMLInputElement;
    const submitBtn = findGuidesMeiCertPrimaryCta(container);

    expect(fileInput && passInput && submitBtn).toBeTruthy();

    await act(async () => {
      setFileInputFiles(fileInput, new File(['x'], 'test.p12'));
      setTextInputValue(passInput, 'secret');
    });

    await act(async () => {
      submitBtn?.click();
    });

    expect(container.textContent).toContain('Servidor ou conexão indisponível');
    expect(container.textContent).toContain(GUIMEI_CONNECTIVITY_CERTIFICATE_MESSAGE);
    expect(container.textContent).toContain('Saiba mais');
    expect(container.textContent).not.toContain(
      'quem recusou o cadastro costuma ser o provedor de emissão fiscal'
    );

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('mantém painel de erro fiscal quando upload falha (mensagem mapeada para fallback humano)', async () => {
    uploadMeiCertificateMock.mockRejectedValueOnce(
      new Error('Falha na validação: certificado rejeitado pelo serviço.')
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
      setFileInputFiles(fileInput, new File(['x'], 'test.p12'));
      setTextInputValue(passInput, 'secret');
    });

    await act(async () => {
      submitBtn?.click();
    });

    expect(container.textContent).not.toContain('Servidor ou conexão indisponível');
    expect(container.textContent).toMatch(/Operação fiscal|Validação ou rejeição no provedor/i);
    expect(container.textContent).toContain('provedor de emissão fiscal');
    const fiscalText = container.textContent ?? '';
    // UI pode mapear o Error para cópia genérica, título POSQA (validação legível) ou expor a mensagem técnica
    expect(
      fiscalText.includes('Não foi possível concluir o pedido') ||
        fiscalText.includes('Falha na validação: certificado rejeitado pelo serviço.')
    ).toBe(true);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('exibe alerta de conectividade quando cadastro fiscal falha por rede após upload MEI (mitigação QA)', async () => {
    authState.role = 'admin';
    authState.mei = false;
    uploadMeiCertificateMock.mockResolvedValueOnce({
      hasUserCertificate: true,
      hasEnvCertificate: false,
      documento: '12345678000190',
      certValidFrom: null,
      certValidTo: null
    });
    cadastrarCertificadoEmissaoNfMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

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

    expect(uploadMeiCertificateMock).toHaveBeenCalled();
    expect(cadastrarCertificadoEmissaoNfMock).toHaveBeenCalled();
    expect(container.textContent).toContain('Servidor ou conexão indisponível');
    expect(container.textContent).toContain(GUIMEI_CONNECTIVITY_CERTIFICATE_MESSAGE);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('exibe alerta de conectividade quando cadastro da empresa fiscal falha por rede após certificado no emissor (US-MEI-FISC-01)', async () => {
    authState.role = 'admin';
    authState.mei = false;
    uploadMeiCertificateMock.mockResolvedValueOnce({
      hasUserCertificate: true,
      hasEnvCertificate: false,
      documento: '12345678000190',
      certValidFrom: null,
      certValidTo: null
    });
    cadastrarCertificadoEmissaoNfMock.mockResolvedValueOnce({ id: 'cert-plug-1', message: 'ok' });
    cadastrarEmpresaEmissaoNfMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

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

    expect(uploadMeiCertificateMock).toHaveBeenCalled();
    expect(cadastrarCertificadoEmissaoNfMock).toHaveBeenCalled();
    expect(cadastrarEmpresaEmissaoNfMock).toHaveBeenCalled();
    expect(container.textContent).toContain('Servidor ou conexão indisponível');
    expect(container.textContent).toContain(GUIMEI_CONNECTIVITY_CERTIFICATE_MESSAGE);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('exibe alerta de conectividade quando cadastro da empresa fiscal falha por rede — perfil usuario + mei (US-MEI-FISC-01)', async () => {
    authState.role = 'usuario';
    authState.mei = true;
    uploadMeiCertificateMock.mockResolvedValueOnce({
      hasUserCertificate: true,
      hasEnvCertificate: false,
      documento: '12345678000190',
      certValidFrom: null,
      certValidTo: null
    });
    cadastrarCertificadoEmissaoNfMock.mockResolvedValueOnce({ id: 'cert-plug-1', message: 'ok' });
    cadastrarEmpresaEmissaoNfMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

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

    expect(uploadMeiCertificateMock).toHaveBeenCalled();
    expect(cadastrarCertificadoEmissaoNfMock).toHaveBeenCalled();
    expect(cadastrarEmpresaEmissaoNfMock).toHaveBeenCalled();
    expect(container.textContent).toContain('Servidor ou conexão indisponível');
    expect(container.textContent).toContain(GUIMEI_CONNECTIVITY_CERTIFICATE_MESSAGE);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('FR-ORQ-CERT: falha só na empresa (sem rede) exibe retry; segundo envio chama só cadastrarEmpresa de novo', async () => {
    authState.role = 'admin';
    authState.mei = false;
    uploadMeiCertificateMock.mockResolvedValueOnce({
      hasUserCertificate: true,
      hasEnvCertificate: false,
      documento: '12345678000190',
      certValidFrom: null,
      certValidTo: null
    });
    cadastrarCertificadoEmissaoNfMock.mockResolvedValueOnce({ id: 'cert-plug-1', message: 'ok' });
    cadastrarEmpresaEmissaoNfMock
      .mockRejectedValueOnce(new Error('regra negócio plugnotas'))
      .mockResolvedValueOnce({ cnpj: '12345678000190', message: 'ok', raw: {} });

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

    expect(container.textContent).toContain('Não foi possível concluir o registro da empresa');
    expect(cadastrarCertificadoEmissaoNfMock).toHaveBeenCalledTimes(1);
    expect(cadastrarEmpresaEmissaoNfMock).toHaveBeenCalledTimes(1);

    const guiaOperacaoLink = container.querySelector('a[href*="guia-mei"]');
    expect(guiaOperacaoLink?.textContent).toMatch(/guia de operação fiscal/i);

    const retryBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Tentar registrar empresa novamente')
    );
    expect(retryBtn).toBeTruthy();

    await act(async () => {
      retryBtn?.click();
    });

    expect(cadastrarCertificadoEmissaoNfMock).toHaveBeenCalledTimes(1);
    expect(cadastrarEmpresaEmissaoNfMock).toHaveBeenCalledTimes(2);
    expect(container.textContent).toContain('Dados do emitente foram registrados');

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('RTCAD: bloqueio municipal estável não oferece CTA principal de retry cego', async () => {
    authState.role = 'admin';
    authState.mei = false;
    uploadMeiCertificateMock.mockResolvedValueOnce({
      hasUserCertificate: true,
      hasEnvCertificate: false,
      documento: '12345678000190',
      certValidFrom: null,
      certValidTo: null
    });
    cadastrarCertificadoEmissaoNfMock.mockResolvedValueOnce({ id: 'cert-plug-1', message: 'ok' });
    cadastrarEmpresaEmissaoNfMock.mockRejectedValueOnce(
      new ApiClientError('Falha na validação do JSON de Empresa (POST /empresa no emissor fiscal)', {
        plugnotasCode: 'prefeitura_login_required_blocked',
        plugnotasRequest: { method: 'POST', path: '/empresa' },
        httpStatus: 400
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

    const retryBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Tentar registrar empresa novamente')
    );
    const primaryBtn = findGuidesMeiCertPrimaryCta(container) as HTMLButtonElement | undefined;

    expect(container.textContent).toContain('Exceção municipal não suportada neste fluxo');
    expect(container.textContent).toContain('guia de operação fiscal');
    expect(container.textContent).not.toMatch(/Utilizador do portal|Senha do portal|login\/senha/i);
    expect(retryBtn).toBeUndefined();
    expect(primaryBtn?.disabled).toBe(true);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('ENDP P0: sucesso operacional após fallback PATCH mantém narrativa de sincronização, sem fluxo paralelo', async () => {
    authState.role = 'admin';
    authState.mei = false;
    uploadMeiCertificateMock.mockResolvedValueOnce({
      hasUserCertificate: true,
      hasEnvCertificate: false,
      documento: '12345678000190',
      certValidFrom: null,
      certValidTo: null
    });
    cadastrarCertificadoEmissaoNfMock.mockResolvedValueOnce({ id: 'cert-plug-1', message: 'ok' });
    cadastrarEmpresaEmissaoNfMock.mockResolvedValueOnce({
      cnpj: '12345678000190',
      message: 'Empresa atualizada',
      operation: 'updated',
      raw: {}
    });

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

    expect(container.textContent).toContain('dados do emitente foram sincronizados');
    expect(container.textContent).not.toContain('Não foi possível concluir o registro da empresa');
    expect(
      Array.from(container.querySelectorAll('button')).some((b) =>
        b.textContent?.includes('Tentar registrar empresa novamente')
      )
    ).toBe(false);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('FR-ORQ-CERT-07: Consultar e Atualizar (sem novo certificado) funcionam sem o CTA Concluir configuração fiscal', async () => {
    authState.role = 'admin';
    authState.mei = false;
    consultarEmpresaEmissaoNfMock.mockClear();
    atualizarEmpresaEmissaoNfMock.mockClear();
    patchMeiCertificateEmitenteNfseMock.mockClear();
    cadastrarCertificadoEmissaoNfMock.mockClear();

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

    await act(async () => {
      fillCnpjMei(container);
      fillNfEmissionCompanyMinimum(container);
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    invalidateMeiEmpresaGetCache(null, '12345678000190');
    consultarEmpresaEmissaoNfMock.mockClear();

    const consultBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Consultar cadastro no emissor')
    );
    expect(consultBtn).toBeTruthy();

    await act(async () => {
      consultBtn!.click();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(consultarEmpresaEmissaoNfMock).toHaveBeenCalled();
    expect(cadastrarCertificadoEmissaoNfMock).not.toHaveBeenCalled();

    atualizarEmpresaEmissaoNfMock.mockClear();
    patchMeiCertificateEmitenteNfseMock.mockClear();

    const atualizarBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Atualizar cadastro (sem novo certificado)')
    );
    expect(atualizarBtn).toBeTruthy();

    await act(async () => {
      atualizarBtn!.click();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(atualizarEmpresaEmissaoNfMock).toHaveBeenCalled();
    expect(patchMeiCertificateEmitenteNfseMock).toHaveBeenCalled();
    expect(cadastrarCertificadoEmissaoNfMock).not.toHaveBeenCalled();

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('RTCAD: consulta preserva contrato estruturado para ambiente/configuração no painel da UI', async () => {
    authState.role = 'admin';
    authState.mei = false;
    consultarEmpresaEmissaoNfMock.mockRejectedValueOnce(
      new ApiClientError('Falha remota genérica', {
        plugnotasCode: 'ambiente_configuracao',
        httpStatus: 401,
        plugnotasRequest: { method: 'GET', path: '/empresa/12345678000190' }
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

    await act(async () => {
      fillCnpjMei(container);
      fillNfEmissionCompanyMinimum(container);
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    invalidateMeiEmpresaGetCache(null, '12345678000190');
    const consultBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Consultar cadastro no emissor')
    );
    expect(consultBtn).toBeTruthy();

    await act(async () => {
      consultBtn?.click();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    const headings = Array.from(container.querySelectorAll('h3')).map((el) => el.textContent || '');
    expect(headings.some((title) => title.includes('Configuração do emissor fiscal'))).toBe(true);
    expect(container.textContent).toMatch(/URL base|token|ambiente/i);
    expect(container.textContent).not.toContain('GET /empresa/12345678000190');

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('ENDP P0: POST falho seguido de GET sem empresa preserva causalidade e não fala em rota errada', async () => {
    authState.role = 'admin';
    authState.mei = false;
    uploadMeiCertificateMock.mockResolvedValueOnce({
      hasUserCertificate: true,
      hasEnvCertificate: false,
      documento: '12345678000190',
      certValidFrom: null,
      certValidTo: null
    });
    cadastrarCertificadoEmissaoNfMock.mockResolvedValueOnce({ id: 'cert-plug-1', message: 'ok' });
    cadastrarEmpresaEmissaoNfMock.mockRejectedValueOnce(
      new ApiClientError('Falha na validação do JSON de Empresa (POST /empresa no emissor fiscal)', {
        plugnotasCode: 'prefeitura_login_required_blocked',
        plugnotasRequest: { method: 'POST', path: '/empresa' },
        httpStatus: 400
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

    const consultBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Consultar cadastro no emissor')
    );
    expect(consultBtn).toBeTruthy();

    consultarEmpresaEmissaoNfMock.mockReset();
    consultarEmpresaEmissaoNfMock.mockRejectedValueOnce(
      new ApiClientError(
        'Não há cadastro desta empresa no emissor fiscal para o token e ambiente configurados. (GET /empresa/12345678000190 no emissor fiscal)',
        {
          plugnotasCode: 'empresa_nao_cadastrada',
          plugnotasRequest: { method: 'GET', path: '/empresa/12345678000190' },
          httpStatus: 400
        }
      )
    );

    await act(async () => {
      consultBtn?.click();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    const text = container.textContent ?? '';
    expect(
      text.includes('Exceção municipal não suportada neste fluxo')
      || text.includes('município exige acesso ao portal da prefeitura')
      || text.includes('credencial do portal municipal')
      || text.includes('não é erro de rota')
      || text.includes('cadastro ainda não foi concluído')
      || text.includes('cadastro ainda não foi criado no emissor')
      || text.includes('o cadastro ainda não foi concluído')
      || text.includes('Os dados do emitente não foram concluídos')
      || text.includes('Você pode tentar registrar a empresa novamente')
    ).toBe(true);
    expect(text).not.toContain('rota errada');
    expect(text).not.toContain('POST /empresa');
    expect(text).not.toContain('GET /empresa/12345678000190');
    expect(text).not.toMatch(/Utilizador do portal|Senha do portal|login\/senha|prefeitura_portal_/i);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('exibe alerta de conectividade ao remover certificado com falha de rede (mitigação QA)', async () => {
    fetchMeiCertificateStatusMock.mockResolvedValue({
      hasUserCertificate: true,
      hasEnvCertificate: false,
      documento: '12345678000190',
      certValidFrom: null,
      certValidTo: null
    });
    removeMeiCertificateMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

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

    const removeBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Remover certificado')
    );
    expect(removeBtn).toBeTruthy();

    await act(async () => {
      removeBtn?.click();
    });

    expect(container.textContent).toContain('Servidor ou conexão indisponível');
    expect(container.textContent).toContain('Saiba mais');

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('exibe checklist certificado_409_sem_id quando cadastrarCertificadoEmissaoNf lança ApiClientError (US-MEI-FISC-03)', async () => {
    authState.role = 'admin';
    authState.mei = false;
    const apiMsg =
      'O certificado já está cadastrado no emissor fiscal, mas não foi possível obter o ID automaticamente.';
    uploadMeiCertificateMock.mockResolvedValueOnce({
      hasUserCertificate: true,
      hasEnvCertificate: false,
      documento: '12345678000190',
      certValidFrom: null,
      certValidTo: null
    });
    cadastrarCertificadoEmissaoNfMock.mockRejectedValueOnce(
      new ApiClientError(apiMsg, { plugnotasCode: 'certificado_409_sem_id' })
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

    expect(uploadMeiCertificateMock).toHaveBeenCalled();
    expect(cadastrarCertificadoEmissaoNfMock).toHaveBeenCalled();
    expect(container.textContent).not.toContain('Servidor ou conexão indisponível');
    expect(container.textContent).toContain('CNPJ no formulário');
    expect(container.textContent).toContain('provedor fiscal');
    expect(container.textContent).toContain('Saiba mais');
    expect(
      container.querySelector('a[href^="/guia-mei-certificado-409-sem-id.html#certificado-emissor-409-sem-id"]')
    ).toBeTruthy();

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('US-MEI-NFS-02 / QA: dados mínimos sem campo de IE e ordem de foco alinhada ao DOM', async () => {
    authState.role = 'usuario';
    authState.mei = true;
    fetchMeiCertificateStatusMock.mockImplementation(async () => defaultCertStatus());

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

    const heading = Array.from(container.querySelectorAll('p')).find((p) =>
      p.textContent?.includes('Dados mínimos para emissão de NFS-e')
    );
    expect(heading).toBeTruthy();
    const panel = heading?.closest('.rounded-xl');
    expect(panel).toBeTruthy();

    const placeholdersEstadual = panel!.querySelectorAll('input[placeholder*="estadual" i]');
    expect(placeholdersEstadual.length).toBe(0);
    expect(container.textContent).toContain('NFS-e Nacional é o padrão desta jornada');
    expect(panel!.textContent).not.toMatch(/Utilizador do portal|Senha do portal|Acesso ao portal municipal/i);

    const controls = Array.from(panel!.querySelectorAll('input, select'));
    for (const el of controls) {
      const ti = el.getAttribute('tabindex');
      if (ti != null && ti !== '') {
        expect(Number(ti)).toBeLessThanOrEqual(0);
      }
    }

    const sequence = controls.map((el) => {
      if (el instanceof HTMLSelectElement) return '__select__';
      if (el instanceof HTMLInputElement && el.type === 'checkbox') return '__checkbox__';
      return el.getAttribute('placeholder') || '';
    });

    const expectedSequence = [
      'Razão social *',
      'Nome fantasia (opcional)',
      'Email fiscal (opcional)',
      '__select__',
      'Inscrição municipal (opcional)',
      'CEP *',
      'Tipo logradouro',
      'Logradouro *',
      'Número *',
      'Complemento (opcional)',
      'Bairro *',
      'Código IBGE cidade *',
      'Cidade *',
      'UF *',
      '__checkbox__',
      '',
      '',
      'ex.: 1'
    ];

    expect(sequence).toEqual(expectedSequence);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
