// @vitest-environment jsdom
/**
 * FR-CAD-DOC (follow-up QA): fieldset «Documentos ativos», modal NFS-e, validação unificada no PATCH.
 * FR-UPD-DOC QA: remount + cache GET empresa (chave anon se `userId` ausente).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { waitFor } from '@testing-library/react';

import GuidesMei from './GuidesMei';
import { MEI_WORKSPACE_STORAGE_KEY } from './guidesMeiWorkspaceStorage';
import { MSG_DOCUMENTOS_ATIVOS_MIN_ONE } from '../utils/plugnotasEmpresaDocumentosAtivos';
import {
  CTA_ATUALIZAR_VISTA_DOCUMENTOS_ATIVOS,
  CTA_SINCRONIZAR_EMISSOR_DOCUMENTOS_ATIVOS,
  MSG_BANNER_DIVERGENCIA_DOCUMENTOS_ATIVOS
} from '../utils/guiaMeiCadastroDocumentosAtivos';

const globalWithActFlag = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
globalWithActFlag.IS_REACT_ACT_ENVIRONMENT = true;

const defaultCertStatus = () => ({
  hasUserCertificate: false,
  hasEnvCertificate: false,
  documento: null as string | null,
  documentosAtivos: null as { nfse: boolean; nfe: boolean; nfce: boolean } | null
});

const {
  useAuthStoreMock,
  authState,
  fetchMeiCertificateStatusMock,
  cadastrarEmpresaEmissaoNfMock,
  consultarEmpresaEmissaoNfMock,
  atualizarEmpresaEmissaoNfMock,
  fetchNfsePrestadorPrefillMock
} = vi.hoisted(() => {
  const state = {
    role: 'admin' as 'superadmin' | 'admin' | 'usuario' | 'outsider',
    mei: false,
    userId: 'test-user-id' as string | null
  };
  const hook = Object.assign(() => state, { getState: () => state });
  const fetchMeiCertificateStatusMock = vi.fn(async () => defaultCertStatus());
  const cadastrarEmpresaEmissaoNfMock = vi.fn(async () => ({
    cnpj: '12345678000190',
    message: 'ok',
    raw: {}
  }));
  const consultarEmpresaEmissaoNfMock = vi.fn(async () => ({ message: 'ok', data: {} }));
  const atualizarEmpresaEmissaoNfMock = vi.fn(async () => ({
    cnpj: '12345678000190',
    message: 'ok',
    raw: {}
  }));
  const fetchNfsePrestadorPrefillMock = vi.fn(async () => ({
    prestadorCpfCnpj: null,
    prestadorRazaoSocial: null,
    prestadorEmail: null,
    prestadorInscricaoMunicipal: null,
    prestadorEndereco: null,
    sourceRowId: null
  }));
  return {
    useAuthStoreMock: hook,
    authState: state,
    fetchMeiCertificateStatusMock,
    cadastrarEmpresaEmissaoNfMock,
    consultarEmpresaEmissaoNfMock,
    atualizarEmpresaEmissaoNfMock,
    fetchNfsePrestadorPrefillMock
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
  cadastrarEmpresaEmissaoNf: (...args: unknown[]) => cadastrarEmpresaEmissaoNfMock(...args),
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

function setFileInputFiles(input: HTMLInputElement, file: File) {
  const list = {
    length: 1,
    0: file,
    item: (i: number) => (i === 0 ? file : null)
  };
  Object.defineProperty(input, 'files', { value: list, configurable: true });
  input.dispatchEvent(new Event('change', { bubbles: true }));
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

function findDocumentosAtivosFieldset(container: HTMLElement): HTMLFieldSetElement | null {
  const legend = Array.from(container.querySelectorAll('legend')).find((l) =>
    l.textContent?.includes('Documentos ativos')
  );
  const fs = legend?.closest('fieldset');
  return fs instanceof HTMLFieldSetElement ? fs : null;
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

describe('GuidesMei — Documentos ativos (QA FR-CAD-DOC)', () => {
  beforeEach(() => {
    authState.role = 'admin';
    authState.mei = false;
    authState.userId = 'test-user-id';
    sessionStorage.clear();
    localStorage.removeItem(MEI_WORKSPACE_STORAGE_KEY);
    cadastrarEmpresaEmissaoNfMock.mockReset();
    cadastrarEmpresaEmissaoNfMock.mockImplementation(async () => ({
      cnpj: '12345678000190',
      message: 'ok',
      raw: {}
    }));
    atualizarEmpresaEmissaoNfMock.mockClear();
    consultarEmpresaEmissaoNfMock.mockClear();
    fetchMeiCertificateStatusMock.mockReset();
    fetchMeiCertificateStatusMock.mockImplementation(async () => defaultCertStatus());
    consultarEmpresaEmissaoNfMock.mockImplementation(async () => ({ message: 'ok', data: {} }));
    fetchNfsePrestadorPrefillMock.mockImplementation(async () => ({
      prestadorCpfCnpj: null,
      prestadorRazaoSocial: null,
      prestadorEmail: null,
      prestadorInscricaoMunicipal: null,
      prestadorEndereco: null,
      sourceRowId: null
    }));
  });

  it('desmarcar NFS-e abre alertdialog com título «Desativar NFS-e?» (UX §6.3)', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await openCertificadoDas(container, root);

    const fieldset = findDocumentosAtivosFieldset(container);
    expect(fieldset).toBeTruthy();
    const nfseCb = fieldset?.querySelector('input[type=checkbox]') as HTMLInputElement | null;
    expect(nfseCb?.checked).toBe(true);

    await act(async () => {
      nfseCb?.click();
    });

    await waitFor(() => {
      expect(container.querySelector('[role=alertdialog]')).toBeTruthy();
    });
    expect(container.textContent).toContain('Desativar NFS-e?');
    expect(container.textContent).toContain('Manter NFS-e');

    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .find((b) => b.textContent?.includes('Manter NFS-e'))
        ?.click();
    });

    await waitFor(() => {
      expect(container.querySelector('[role=alertdialog]')).toBeNull();
    });
    expect((fieldset?.querySelector('input[type=checkbox]') as HTMLInputElement)?.checked).toBe(true);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('Atualizar cadastro com zero tipos ativos não chama atualizarEmpresaEmissaoNf e mostra erro no fieldset', async () => {
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
      fillNfEmissionCompanyMinimum(container);
    });

    const fieldset = findDocumentosAtivosFieldset(container);
    const nfseCb = fieldset?.querySelector('input[type=checkbox]') as HTMLInputElement | null;
    await act(async () => {
      nfseCb?.click();
    });
    await waitFor(() => {
      expect(container.querySelector('[role=alertdialog]')).toBeTruthy();
    });
    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .find((b) => b.textContent?.includes('Desativar mesmo assim'))
        ?.click();
    });
    await waitFor(() => {
      expect(container.querySelector('[role=alertdialog]')).toBeNull();
    });
    expect(nfseCb?.checked).toBe(false);

    atualizarEmpresaEmissaoNfMock.mockClear();

    const patchBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Atualizar cadastro (sem novo certificado)')
    );
    expect(patchBtn).toBeTruthy();
    await act(async () => {
      patchBtn?.click();
    });

    await waitFor(() => {
      expect(container.querySelector('#mei-doc-ativos-erro')).toBeTruthy();
    });
    expect(container.textContent).toContain(MSG_DOCUMENTOS_ATIVOS_MIN_ONE);
    expect(atualizarEmpresaEmissaoNfMock).not.toHaveBeenCalled();

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('FR-CAD-DOC follow-up: POST empresa envia blocos ativos coerentes com os checkboxes do site', async () => {
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
      fillNfEmissionCompanyMinimum(container);
    });

    const fieldset = findDocumentosAtivosFieldset(container);
    expect(fieldset).toBeTruthy();
    const checkboxes = Array.from(
      fieldset!.querySelectorAll('input[type=checkbox]')
    ) as HTMLInputElement[];
    expect(checkboxes).toHaveLength(3);

    await act(async () => {
      checkboxes[0]?.click();
    });
    await waitFor(() => {
      expect(container.querySelector('[role=alertdialog]')).toBeTruthy();
    });
    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .find((b) => b.textContent?.includes('Desativar mesmo assim'))
        ?.click();
    });
    await waitFor(() => {
      expect(container.querySelector('[role=alertdialog]')).toBeNull();
    });
    await act(async () => {
      checkboxes[1]?.click();
    });

    const fileInput = container.querySelector('input[type=file]') as HTMLInputElement | null;
    const passwordInput = container.querySelector('input[type=password]') as HTMLInputElement | null;
    const submitBtn = Array.from(container.querySelectorAll('button')).find((b) => {
      const text = b.textContent ?? '';
      return text.includes('Enviar certificado') || text.includes('Concluir configuração fiscal');
    });
    expect(fileInput && passwordInput && submitBtn).toBeTruthy();

    await act(async () => {
      setFileInputFiles(fileInput!, new File(['x'], 'test.p12'));
      setTextInputValue(passwordInput!, 'secret');
    });

    await act(async () => {
      submitBtn?.click();
    });

    await waitFor(() => {
      expect(cadastrarEmpresaEmissaoNfMock).toHaveBeenCalledTimes(1);
    });

    const payload = cadastrarEmpresaEmissaoNfMock.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload.documentosAtivos).toEqual({ nfse: false, nfe: true, nfce: false });
    expect((payload.nfse as Record<string, unknown>).ativo).toBe(false);
    expect((payload.nfe as Record<string, unknown>).ativo).toBe(true);
    expect((payload.nfce as Record<string, unknown>).ativo).toBe(false);
    expect('config' in (payload.nfse as Record<string, unknown>)).toBe(false);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('FR-UPD-DOC QA: remount não duplica chamadas HTTP a consultarEmpresa (cache sessionStorage)', async () => {
    fetchMeiCertificateStatusMock.mockImplementation(async () => ({
      hasUserCertificate: true,
      hasEnvCertificate: false,
      documento: '12345678000190',
      documentosAtivos: { nfse: true, nfe: false, nfce: false }
    }));
    consultarEmpresaEmissaoNfMock.mockImplementation(async () => ({
      message: 'ok',
      data: {
        nfse: { ativo: true, tipoContrato: 0 },
        nfe: { ativo: false, tipoContrato: 0 },
        nfce: { ativo: false, tipoContrato: 0 }
      }
    }));

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await openCertificadoDas(container, root);

    await waitFor(() => {
      expect(consultarEmpresaEmissaoNfMock.mock.calls.length).toBeGreaterThanOrEqual(1);
    });
    const callsAfterFirstMount = consultarEmpresaEmissaoNfMock.mock.calls.length;

    await act(async () => {
      root.unmount();
    });

    const root2 = createRoot(container);
    await act(async () => {
      root2.render(<GuidesMei />);
    });
    const goDas = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Certificado e DAS')
    );
    await act(async () => {
      goDas?.click();
    });

    await waitFor(() => {
      expect(consultarEmpresaEmissaoNfMock.mock.calls.length).toBe(callsAfterFirstMount);
    });

    await act(async () => {
      root2.unmount();
    });
    container.remove();
  });

  it('FR-UPD-DOC-08 QA: espelho ≠ remoto mostra banner de deriva, região e CTAs', async () => {
    fetchMeiCertificateStatusMock.mockImplementation(async () => ({
      hasUserCertificate: true,
      hasEnvCertificate: false,
      documento: '12345678000190',
      documentosAtivos: { nfse: false, nfe: true, nfce: false }
    }));
    consultarEmpresaEmissaoNfMock.mockImplementation(async () => ({
      message: 'ok',
      data: {
        nfse: { ativo: true, tipoContrato: 0 },
        nfe: { ativo: false, tipoContrato: 0 },
        nfce: { ativo: false, tipoContrato: 0 }
      }
    }));

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await openCertificadoDas(container, root);

    await waitFor(() => {
      expect(container.textContent).toContain(MSG_BANNER_DIVERGENCIA_DOCUMENTOS_ATIVOS);
    });

    const regiao = Array.from(container.querySelectorAll('[role="region"]')).find((el) =>
      el.getAttribute('aria-label')?.includes('diferença')
    );
    expect(regiao).toBeTruthy();

    expect(
      Array.from(container.querySelectorAll('button')).some((b) =>
        b.textContent?.includes(CTA_ATUALIZAR_VISTA_DOCUMENTOS_ATIVOS)
      )
    ).toBe(true);
    expect(
      Array.from(container.querySelectorAll('button')).some((b) =>
        b.textContent?.includes(CTA_SINCRONIZAR_EMISSOR_DOCUMENTOS_ATIVOS)
      )
    ).toBe(true);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('FR-UPD-DOC QA: com userId ausente ainda hidrata GET empresa (chave cache anon)', async () => {
    authState.userId = null;
    sessionStorage.clear();
    fetchMeiCertificateStatusMock.mockImplementation(async () => ({
      hasUserCertificate: true,
      hasEnvCertificate: false,
      documento: '12345678000190',
      documentosAtivos: { nfse: true, nfe: false, nfce: false }
    }));
    consultarEmpresaEmissaoNfMock.mockImplementation(async () => ({
      message: 'ok',
      data: {
        nfse: { ativo: true, tipoContrato: 0 },
        nfe: { ativo: false, tipoContrato: 0 },
        nfce: { ativo: false, tipoContrato: 0 }
      }
    }));

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await openCertificadoDas(container, root);

    await waitFor(() => {
      expect(consultarEmpresaEmissaoNfMock).toHaveBeenCalled();
    });

    await act(async () => {
      root.unmount();
    });
    container.remove();
    authState.userId = 'test-user-id';
  });
});
