// @vitest-environment jsdom
/**
 * FR-CAD-DOC (follow-up QA): fieldset «Documentos ativos», modal NFS-e, validação unificada no PATCH.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { waitFor } from '@testing-library/react';

import GuidesMei from './GuidesMei';
import { MEI_WORKSPACE_STORAGE_KEY } from './guidesMeiWorkspaceStorage';
import { MSG_DOCUMENTOS_ATIVOS_MIN_ONE } from '../utils/plugnotasEmpresaDocumentosAtivos';

const globalWithActFlag = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
globalWithActFlag.IS_REACT_ACT_ENVIRONMENT = true;

const { useAuthStoreMock, authState } = vi.hoisted(() => {
  const state = {
    role: 'admin' as 'superadmin' | 'admin' | 'usuario' | 'outsider',
    mei: false
  };
  const hook = Object.assign(() => state, { getState: () => state });
  return { useAuthStoreMock: hook, authState: state };
});

const { atualizarEmpresaEmissaoNfMock, fetchNfsePrestadorPrefillMock } = vi.hoisted(() => ({
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
}));

vi.mock('../store/authStore', () => ({
  useAuthStore: useAuthStoreMock
}));

vi.mock('../services/guidesMeiService', () => ({
  downloadMeiGuide: vi.fn(async () => ({ blob: new Blob(), filename: 'guia-mei.pdf' })),
  downloadParcelamentoPdf: vi.fn(async () => ({ blob: new Blob(), filename: 'p.pdf' })),
  fetchMeiCertificateStatus: vi.fn(async () => ({
    hasUserCertificate: false,
    hasEnvCertificate: false,
    documento: null
  })),
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
  consultarEmpresaEmissaoNf: vi.fn(async () => ({ message: 'ok', data: {} })),
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
    localStorage.removeItem(MEI_WORKSPACE_STORAGE_KEY);
    atualizarEmpresaEmissaoNfMock.mockClear();
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
});
