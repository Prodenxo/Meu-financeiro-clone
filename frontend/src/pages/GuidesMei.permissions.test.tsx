// @vitest-environment jsdom
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
    expect(container.textContent).toContain('NFS-e');

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
    expect(container.textContent).toContain('NFS-e');

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
    expect(container.textContent).toContain('NFS-e');

    await act(async () => {
      root.unmount();
    });
  });

  it('workspace fiscal não expõe NF-e/NFC-e nem tipo de documento (US-MEI-NFS-03)', async () => {
    authState.role = 'superadmin';
    authState.mei = false;

    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(<GuidesMei />);
    });

    const notasTab = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('NFS-e')
    );
    expect(notasTab).toBeTruthy();
    await act(async () => {
      notasTab!.click();
    });

    expect(container.textContent).not.toContain('Tipo de documento');
    expect(container.querySelector('option[value="NFE"]')).toBeNull();
    expect(container.querySelector('option[value="NFCE"]')).toBeNull();
    expect(container.textContent).not.toContain('CNPJ do emitente');

    await act(async () => {
      root.unmount();
    });
  });
});
