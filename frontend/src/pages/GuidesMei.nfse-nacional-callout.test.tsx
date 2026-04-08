// @vitest-environment jsdom
/**
 * FR-NAT-UX-02 (follow-up QA): callout «NFS-e em ambiente nacional» no painel DAS quando canViewNfse.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { waitFor, within } from '@testing-library/react';

import GuidesMei from './GuidesMei';
import { MEI_WORKSPACE_STORAGE_KEY } from './guidesMeiWorkspaceStorage';

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
  consultarEmpresaEmissaoNfMock,
  fetchNfsePrestadorPrefillMock
} = vi.hoisted(() => {
  const state = {
    role: 'admin' as 'superadmin' | 'admin' | 'usuario' | 'outsider',
    mei: false,
    userId: 'test-user-id' as string | null
  };
  const hook = Object.assign(() => state, { getState: () => state });
  return {
    useAuthStoreMock: hook,
    authState: state,
    fetchMeiCertificateStatusMock: vi.fn(async () => defaultCertStatus()),
    consultarEmpresaEmissaoNfMock: vi.fn(async () => ({ message: 'ok', data: {} })),
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
  atualizarEmpresaEmissaoNf: vi.fn(async () => ({ cnpj: '12345678000190', message: 'ok', raw: {} })),
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

async function renderGuidesMei(container: HTMLElement, root: ReturnType<typeof createRoot>) {
  await act(async () => {
    root.render(<GuidesMei />);
  });
}

describe('GuidesMei — callout NFS-e Nacional (FR-NAT-UX-02)', () => {
  beforeEach(() => {
    authState.role = 'admin';
    authState.mei = false;
    authState.userId = 'test-user-id';
    localStorage.removeItem(MEI_WORKSPACE_STORAGE_KEY);
    fetchMeiCertificateStatusMock.mockReset();
    fetchMeiCertificateStatusMock.mockImplementation(async () => defaultCertStatus());
    consultarEmpresaEmissaoNfMock.mockImplementation(async () => ({ message: 'ok', data: {} }));
  });

  it('mostra callout com região, título e data-testid quando canViewNfse e workspace DAS', async () => {
    localStorage.setItem(MEI_WORKSPACE_STORAGE_KEY, 'das');

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await renderGuidesMei(container, root);
    const view = within(container);

    await waitFor(() => {
      expect(view.getByRole('heading', { name: 'Certificado digital' })).toBeTruthy();
    });

    const region = await waitFor(() => view.getByTestId('mei-nfse-nacional-mode-callout'));
    expect(region.getAttribute('role')).toBe('region');
    expect(region.getAttribute('aria-labelledby')).toBe('mei-nfse-nacional-callout-heading');

    const heading = view.getByRole('heading', { name: 'NFS-e em ambiente nacional' });
    expect(heading.getAttribute('id')).toBe('mei-nfse-nacional-callout-heading');
    expect(region.textContent).toContain('NFS-e Nacional');
    expect(region.textContent).toContain('inscrição municipal');

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('não mostra callout quando canViewNfse é falso (outsider no painel DAS)', async () => {
    authState.role = 'outsider';
    authState.mei = false;
    localStorage.setItem(MEI_WORKSPACE_STORAGE_KEY, 'das');

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await renderGuidesMei(container, root);
    const view = within(container);

    await waitFor(() => {
      expect(view.getByRole('heading', { name: 'Certificado digital' })).toBeTruthy();
    });

    expect(view.queryByTestId('mei-nfse-nacional-mode-callout')).toBeNull();

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
