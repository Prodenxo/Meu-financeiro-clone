import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

import GuidesMei from './GuidesMei';

const globalWithActFlag = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
globalWithActFlag.IS_REACT_ACT_ENVIRONMENT = true;

const { useAuthStoreMock, authState } = vi.hoisted(() => {
  const state = {
    role: 'usuario' as 'superadmin' | 'admin' | 'usuario' | 'outsider',
    mei: true
  };

  const hook = Object.assign(
    () => state,
    {
      getState: () => state
    }
  );

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
  baixarNfsePdf: vi.fn(async () => ({ blob: new Blob(), filename: 'nota.pdf' })),
  baixarNfseXml: vi.fn(async () => ({ blob: new Blob(), filename: 'nota.xml' })),
  cadastrarPlugNotasCertificado: vi.fn(async () => ({ id: 'cert-1', message: 'ok' })),
  cadastrarPlugNotasEmpresa: vi.fn(async () => ({ cnpj: '12345678000190', message: 'ok' })),
  cancelarNfse: vi.fn(async () => ({})),
  emitirNfce: vi.fn(async () => ({ id: 'nfce-1', protocol: 'P-2' })),
  emitirNfe: vi.fn(async () => ({ id: 'nfe-1', protocol: 'P-3' })),
  emitirNfse: vi.fn(async () => ({ id: 'nfse-1', protocol: 'P-1' })),
  listarCatalogoNfseClientes: vi.fn(async () => []),
  listarCatalogoNfseProdutos: vi.fn(async () => []),
  listarNfse: vi.fn(async () => []),
  obterNfse: vi.fn(async () => ({}))
}));

describe('GuidesMei permissões NFSe', () => {
  beforeEach(() => {
    authState.role = 'usuario';
    authState.mei = true;
  });

  it('oculta elementos de NFSe para usuário com mei=false', async () => {
    authState.role = 'usuario';
    authState.mei = false;

    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(<GuidesMei />);
    });

    expect(container.textContent).not.toContain('Notas exibidas');
    expect(container.textContent).not.toContain('Emitir NFSe');

    await act(async () => {
      root.unmount();
    });
  });

  it('exibe elementos de NFSe para superadmin', async () => {
    authState.role = 'superadmin';
    authState.mei = false;

    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(<GuidesMei />);
    });

    expect(container.textContent).toContain('Notas exibidas');
    expect(container.textContent).toContain('Notas fiscais');

    await act(async () => {
      root.unmount();
    });
  });

  it('exibe elementos de NFSe para admin mesmo com mei=false', async () => {
    authState.role = 'admin';
    authState.mei = false;

    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(<GuidesMei />);
    });

    expect(container.textContent).toContain('Notas exibidas');
    expect(container.textContent).toContain('Notas fiscais');

    await act(async () => {
      root.unmount();
    });
  });

  it('exibe elementos de NFSe para usuário com mei=true', async () => {
    authState.role = 'usuario';
    authState.mei = true;

    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(<GuidesMei />);
    });

    expect(container.textContent).toContain('Notas exibidas');
    expect(container.textContent).toContain('Notas fiscais');

    await act(async () => {
      root.unmount();
    });
  });
});
