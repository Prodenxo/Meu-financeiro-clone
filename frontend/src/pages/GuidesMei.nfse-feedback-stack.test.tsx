// @vitest-environment jsdom
/**
 * FR-NFSE-UX-P2 / QA: pilha de feedback §7 e erro de operação com lista vazia.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { waitFor } from '@testing-library/react';

import GuidesMei from './GuidesMei';
import { MEI_WORKSPACE_STORAGE_KEY } from './guidesMeiWorkspaceStorage';

const globalWithActFlag = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
globalWithActFlag.IS_REACT_ACT_ENVIRONMENT = true;

const listarNfseMock = vi.hoisted(() => vi.fn(async () => [] as { id: string }[]));

const { useAuthStoreMock, authState } = vi.hoisted(() => {
  const state = {
    role: 'superadmin' as const,
    mei: false
  };
  const hook = Object.assign(() => state, { getState: () => state });
  return { useAuthStoreMock: hook, authState: state };
});

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
  patchMeiCertificateEmitenteNfse: vi.fn(async () => ({})),
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
  listarCatalogoNfseClientes: vi.fn(async () => []),
  listarCatalogoNfseProdutos: vi.fn(async () => []),
  listarNfse: (...args: unknown[]) => listarNfseMock(...args),
  obterNfse: vi.fn(async () => ({}))
}));

function collectFeedbackTiers(region: Element): string[] {
  return Array.from(region.querySelectorAll('[data-nfse-feedback-tier]')).map(
    (el) => el.getAttribute('data-nfse-feedback-tier') || ''
  );
}

async function openNfseTab(container: HTMLElement) {
  const notasTab = Array.from(container.querySelectorAll('button')).find((b) =>
    b.textContent?.includes('Emissão fiscal')
  );
  expect(notasTab).toBeTruthy();
  await act(async () => {
    notasTab!.click();
  });
}

describe('GuidesMei pilha de feedback NFS-e (FR-NFSE-UX-P2 / QA)', () => {
  beforeEach(() => {
    authState.role = 'superadmin';
    authState.mei = false;
    localStorage.removeItem(MEI_WORKSPACE_STORAGE_KEY);
    listarNfseMock.mockImplementation(async () => []);
  });

  it('exibe provider-error na pilha B quando listarNfse falha e a lista está vazia', async () => {
    listarNfseMock.mockRejectedValueOnce(new Error('API indisponível'));

    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(<GuidesMei />);
    });

    await openNfseTab(container);

    await waitFor(() => {
      const region = container.querySelector('#mei-nfse-emit-feedback');
      expect(region?.querySelector('[data-nfse-feedback-tier="provider-error"]')).toBeTruthy();
    });

    await act(async () => {
      root.unmount();
    });
  });

  it('ordem dos data-nfse-feedback-tier na pilha segue critical → validation → provider-error (§7)', async () => {
    listarNfseMock.mockRejectedValueOnce(new Error('API indisponível'));

    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(<GuidesMei />);
    });

    await openNfseTab(container);

    await waitFor(() => {
      const region = container.querySelector('#mei-nfse-emit-feedback');
      expect(region).toBeTruthy();
      const tiers = collectFeedbackTiers(region!);
      expect(tiers).toEqual(['critical', 'validation', 'provider-error']);
    });

    await act(async () => {
      root.unmount();
    });
  });
});
