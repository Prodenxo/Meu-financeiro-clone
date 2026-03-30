// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

import GuidesMei from './GuidesMei';
import { MEI_WORKSPACE_STORAGE_KEY } from './guidesMeiWorkspaceStorage';

const globalWithActFlag = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
globalWithActFlag.IS_REACT_ACT_ENVIRONMENT = true;

const catalogMocks = vi.hoisted(() => ({
  listarCatalogoNfseClientes: vi.fn(async () => []),
  listarCatalogoNfseProdutos: vi.fn(async () => [])
}));

const { useAuthStoreMock, authState } = vi.hoisted(() => {
  const state = {
    role: 'usuario' as const,
    mei: true
  };
  const hook = Object.assign(() => state, { getState: () => state });
  return { useAuthStoreMock: hook, authState: state };
});

vi.mock('../store/authStore', () => ({
  useAuthStore: useAuthStoreMock
}));

vi.mock('../services/guidesMeiService', () => ({
  downloadMeiGuide: vi.fn(async () => ({ blob: new Blob(), filename: 'guia-mei.pdf' })),
  fetchMeiCertificateStatus: vi.fn(async () => ({
    hasUserCertificate: false,
    hasEnvCertificate: false,
    documento: null
  })),
  fetchMeiPeriods: vi.fn(async () => []),
  fetchMeiPeriodsByCnpj: vi.fn(async () => []),
  removeMeiCertificate: vi.fn(async () => undefined),
  uploadMeiCertificate: vi.fn(async () => ({ documento: null })),
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
  cadastrarCertificadoEmissaoNf: vi.fn(async () => ({ id: 'cert-1', message: 'ok' })),
  cadastrarEmpresaEmissaoNf: vi.fn(async () => ({ cnpj: '12345678000190', message: 'ok' })),
  consultarEmpresaEmissaoNf: vi.fn(async () => ({ message: 'ok', data: {} })),
  cancelarNfse: vi.fn(async () => ({})),
  emitirNfse: vi.fn(async () => ({ id: 'nfse-1', protocol: 'P-1' })),
  listarCatalogoNfseClientes: catalogMocks.listarCatalogoNfseClientes,
  listarCatalogoNfseProdutos: catalogMocks.listarCatalogoNfseProdutos,
  listarNfse: vi.fn(async () => []),
  obterNfse: vi.fn(async () => ({}))
}));

describe('GuidesMei refetch catálogo NFS-e (CAT-MEI-05)', () => {
  beforeEach(() => {
    authState.role = 'usuario';
    authState.mei = true;
    localStorage.removeItem(MEI_WORKSPACE_STORAGE_KEY);
    catalogMocks.listarCatalogoNfseClientes.mockClear();
    catalogMocks.listarCatalogoNfseProdutos.mockClear();
  });

  it('volta a carregar catálogo ao abrir o separador NFS-e após outro workspace', async () => {
    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(<GuidesMei />);
    });

    await act(async () => {
      await Promise.resolve();
    });

    const initialClienteCalls = catalogMocks.listarCatalogoNfseClientes.mock.calls.length;
    expect(initialClienteCalls).toBeGreaterThanOrEqual(1);

    const dasTab = container.querySelector('#mei-tab-das');
    expect(dasTab).toBeTruthy();
    await act(async () => {
      dasTab!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const nfseTab = container.querySelector('#mei-tab-nfse');
    expect(nfseTab).toBeTruthy();
    await act(async () => {
      nfseTab!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(catalogMocks.listarCatalogoNfseClientes.mock.calls.length).toBeGreaterThan(initialClienteCalls);
    expect(catalogMocks.listarCatalogoNfseProdutos.mock.calls.length).toBeGreaterThanOrEqual(
      catalogMocks.listarCatalogoNfseClientes.mock.calls.length
    );

    await act(async () => {
      root.unmount();
    });
  });
});
