// @vitest-environment jsdom
/**
 * LIM-MEI-03 / FR-LIM-08: refetch da lista após cancelar NFS-e (mitigação QA).
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
const cancelarNfseMock = vi.hoisted(() => vi.fn(async () => ({})));
const fetchLimiteFaturamentoMeiMock = vi.hoisted(() =>
  vi.fn(async () => ({
    anoCivil: new Date().getFullYear(),
    totalUtilizadoReais: 0,
    notasConsideradas: 0
  }))
);

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
  filterMeiPeriodsForDisplay: (periods: unknown[]) => periods,
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
  cadastrarEmpresaEmissaoNf: vi.fn(async () => ({ cnpj: '12345678000190', message: 'ok', raw: {} })),
  consultarEmpresaEmissaoNf: vi.fn(async () => ({ message: 'ok', data: {} })),
  cancelarNfse: cancelarNfseMock,
  emitirNfse: vi.fn(async () => ({ id: 'nfse-1', protocol: 'P-1' })),
  fetchLimiteFaturamentoMei: fetchLimiteFaturamentoMeiMock,
  listarCatalogoNfseClientes: vi.fn(async () => []),
  listarCatalogoNfseProdutos: vi.fn(async () => []),
  listarNfse: listarNfseMock,
  notaFiscalPodeSincronizarEstadoEmissor: () => true,
  obterNfse: vi.fn(async () => ({}))
}));

describe('GuidesMei limite MEI (FR-LIM-08)', () => {
  beforeEach(() => {
    authState.role = 'usuario';
    authState.mei = true;
    localStorage.removeItem(MEI_WORKSPACE_STORAGE_KEY);
    listarNfseMock.mockReset();
    listarNfseMock.mockImplementation(async () => []);
    fetchLimiteFaturamentoMeiMock.mockReset();
    fetchLimiteFaturamentoMeiMock.mockImplementation(async () => ({
      anoCivil: new Date().getFullYear(),
      totalUtilizadoReais: 0,
      notasConsideradas: 0
    }));
    cancelarNfseMock.mockReset();
    cancelarNfseMock.mockResolvedValue({});
  });

  it('FR-LIM-08: após cancelar NFS-e, listarNfse é chamado de novo (refetch do limite)', async () => {
    const year = new Date().getFullYear();
    const nfseRow = {
      id: 'nfse-limite-refetch-1',
      user_id: 'u1',
      document_type: 'NFSE',
      status: 'concluido',
      created_at: `${year}-03-01T10:00:00.000Z`,
      payload_json: { servico: [{ valor: { servico: 50 } }] }
    };
    listarNfseMock.mockImplementation(async () => [nfseRow]);

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('');

    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(<GuidesMei />);
    });
    await act(async () => {
      await Promise.resolve();
    });

    const callsAfterMount = listarNfseMock.mock.calls.length;
    expect(callsAfterMount).toBeGreaterThanOrEqual(1);

    const notasTab = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Emissão fiscal')
    );
    expect(notasTab).toBeTruthy();
    await act(async () => {
      notasTab!.click();
    });

    await waitFor(() => {
      expect(container.textContent).toContain('Cancelar nota');
    });

    const cancelBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Cancelar nota')
    );
    expect(cancelBtn).toBeTruthy();

    await act(async () => {
      cancelBtn!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await act(async () => {
      await Promise.resolve();
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(cancelarNfseMock).toHaveBeenCalledWith(
      'nfse-limite-refetch-1',
      expect.objectContaining({})
    );
    expect(listarNfseMock.mock.calls.length).toBeGreaterThan(callsAfterMount);
    expect(fetchLimiteFaturamentoMeiMock.mock.calls.length).toBeGreaterThanOrEqual(2);

    confirmSpy.mockRestore();
    promptSpy.mockRestore();

    await act(async () => {
      root.unmount();
    });
  });
});
