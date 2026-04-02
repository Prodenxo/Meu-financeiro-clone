// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

import GuidesMei from './GuidesMei';
import { ApiClientError } from '../utils/apiClientError';
import { GUIMEI_CONNECTIVITY_CERTIFICATE_MESSAGE } from '../utils/guiaMeiConnectivityUserMessage';

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
    removeMeiCertificateMock: vi.fn(async () => undefined),
    fetchMeiCertificateStatusMock: vi.fn(async () => defaultCertStatus())
  };
});

vi.mock('../store/authStore', () => ({
  useAuthStore: useAuthStoreMock
}));

vi.mock('../services/guidesMeiService', () => ({
  downloadMeiGuide: vi.fn(async () => ({ blob: new Blob(), filename: 'guia-mei.pdf' })),
  fetchMeiCertificateStatus: fetchMeiCertificateStatusMock,
  fetchMeiPeriods: vi.fn(async () => []),
  fetchMeiPeriodsByCnpj: vi.fn(async () => []),
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
  atualizarEmpresaEmissaoNf: vi.fn(async () => ({ cnpj: '12345678000190', message: 'ok', raw: {} })),
  baixarNfsePdf: vi.fn(async () => ({ blob: new Blob(), filename: 'nota.pdf' })),
  baixarNfseXml: vi.fn(async () => ({ blob: new Blob(), filename: 'nota.xml' })),
  cadastrarCertificadoEmissaoNf: cadastrarCertificadoEmissaoNfMock,
  cadastrarEmpresaEmissaoNf: cadastrarEmpresaEmissaoNfMock,
  consultarEmpresaEmissaoNf: vi.fn(async () => ({ message: 'ok', data: {} })),
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

describe('GuidesMei certificado — conectividade (US-CONN-MEI-03 + US-MEI-FISC-01)', () => {
  beforeEach(() => {
    authState.role = 'usuario';
    authState.mei = false;
    uploadMeiCertificateMock.mockReset();
    cadastrarCertificadoEmissaoNfMock.mockImplementation(async () => ({ id: 'cert-1', message: 'ok' }));
    cadastrarEmpresaEmissaoNfMock.mockImplementation(async () => ({ cnpj: '12345678000190', message: 'ok' }));
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
    const submitBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Enviar certificado')
    );

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
      'Quando a mensagem citar validação de JSON, campos fiscais, integração fiscal ou o nome Plugnotas'
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
    const submitBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Enviar certificado')
    );

    await act(async () => {
      setFileInputFiles(fileInput, new File(['x'], 'test.p12'));
      setTextInputValue(passInput, 'secret');
    });

    await act(async () => {
      submitBtn?.click();
    });

    expect(container.textContent).not.toContain('Servidor ou conexão indisponível');
    expect(container.textContent).toMatch(/Operação fiscal/i);
    expect(container.textContent).toContain('provedor de emissão fiscal');
    const fiscalText = container.textContent ?? '';
    // UI pode mapear o Error para cópia genérica ou expor a mensagem técnica — aceitar ambos (mitigação QA P0)
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
    const submitBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Enviar certificado')
    );

    await act(async () => {
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

  it('exibe alerta de conectividade quando cadastro da empresa fiscal falha por rede após certificado Plugnotas (US-MEI-FISC-01)', async () => {
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
    const submitBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Enviar certificado')
    );

    await act(async () => {
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
    const submitBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Enviar certificado')
    );

    await act(async () => {
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
      'O certificado já está cadastrado no Plugnotas, mas não foi possível obter o ID automaticamente.';
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
    const submitBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Enviar certificado')
    );

    await act(async () => {
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
    expect(container.querySelector('a[href="/guia-mei-certificado-409-sem-id.html"]')).toBeTruthy();

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

    expect(sequence).toEqual([
      'Razão social *',
      'Nome fantasia (opcional)',
      'Email fiscal (opcional)',
      'Inscrição municipal (se exigida pelo município)',
      '__select__',
      'CEP *',
      'Tipo logradouro',
      'Logradouro *',
      'Número *',
      'Complemento (opcional)',
      'Bairro *',
      'Código IBGE cidade *',
      'Cidade *',
      'UF *',
      '__checkbox__'
    ]);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
