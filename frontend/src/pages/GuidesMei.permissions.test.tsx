// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { fireEvent, waitFor } from '@testing-library/react';

import GuidesMei from './GuidesMei';
import { MEI_WORKSPACE_STORAGE_KEY } from './guidesMeiWorkspaceStorage';

const globalWithActFlag = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
globalWithActFlag.IS_REACT_ACT_ENVIRONMENT = true;

const listarNfseMock = vi.hoisted(() => vi.fn(async () => [] as {
  id: string;
  user_id: string;
  status?: string | null;
  created_at?: string;
  archived_at?: string | null;
}[]));

const emitirNfeMock = vi.hoisted(() => vi.fn(async () => ({ id: 'nfe-1', protocol: 'P-NFE' })));
const emitirNfceMock = vi.hoisted(() => vi.fn(async () => ({ id: 'nfce-1', protocol: 'P-NFC' })));
const consultarEmpresaEmissaoNfMock = vi.hoisted(() => vi.fn(async () => ({ message: 'ok', data: {} })));

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
  filterMeiPeriodsForDisplay: (periods: unknown[]) => periods,
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
  consultarEmpresaEmissaoNf: (...args: unknown[]) => consultarEmpresaEmissaoNfMock(...args),
  cancelarNfse: vi.fn(async () => ({})),
  emitirNfse: vi.fn(async () => ({ id: 'nfse-1', protocol: 'P-1' })),
  emitirNfe: (...args: unknown[]) => emitirNfeMock(...args),
  emitirNfce: (...args: unknown[]) => emitirNfceMock(...args),
  listarCatalogoNfseClientes: vi.fn(async () => []),
  listarCatalogoNfseProdutos: vi.fn(async () => []),
  listarNfse: (...args: unknown[]) => listarNfseMock(...args),
  notaFiscalPodeSincronizarEstadoEmissor: () => true,
  obterNfse: vi.fn(async () => ({}))
}));

describe('GuidesMei permissões NFSe', () => {
  beforeEach(() => {
    authState.role = 'usuario';
    authState.mei = true;
    localStorage.removeItem(MEI_WORKSPACE_STORAGE_KEY);
    listarNfseMock.mockImplementation(async () => []);
    emitirNfeMock.mockClear();
    emitirNfceMock.mockClear();
    consultarEmpresaEmissaoNfMock.mockImplementation(async () => ({ message: 'ok', data: {} }));
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

  it('oculta elementos de NFSe para admin com mei=false', async () => {
    authState.role = 'admin';
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

  it('workspace fiscal: filtro da lista inclui NFS-e, NF-e e NFC-e (FR-GUIA-FISC-05); emissão sem formulário NF-e dedicado', async () => {
    authState.role = 'superadmin';
    authState.mei = false;

    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(<GuidesMei />);
    });

    const notasTab = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('Emissão fiscal')
    );
    expect(notasTab).toBeTruthy();
    await act(async () => {
      notasTab!.click();
    });

    expect(container.querySelector('#nfse-filter-lista-tipo')).toBeTruthy();
    expect(container.querySelector('option[value="NFSE"]')).toBeTruthy();
    expect(container.querySelector('option[value="NFE"]')).toBeTruthy();
    expect(container.querySelector('option[value="NFCE"]')).toBeTruthy();
    expect(container.textContent).toContain('Tipo de nota');
    expect(container.textContent).not.toContain('CNPJ do emitente');

    await act(async () => {
      root.unmount();
    });
  });

  it('FR-GUIA-FISC-05 / QA: ao mudar o filtro Tipo de nota, listarNfse é chamado com documentType NFE e NFCE', async () => {
    listarNfseMock.mockClear();
    listarNfseMock.mockImplementation(async () => []);

    authState.role = 'superadmin';
    authState.mei = false;

    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(<GuidesMei />);
    });

    const notasTab = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('Emissão fiscal')
    );
    expect(notasTab).toBeTruthy();
    await act(async () => {
      notasTab!.click();
    });

    await waitFor(() => {
      expect(container.querySelector('#nfse-filter-lista-tipo')).toBeTruthy();
    });

    const tipoSelect = container.querySelector('#nfse-filter-lista-tipo') as HTMLSelectElement;
    expect(tipoSelect).toBeTruthy();

    await act(async () => {
      fireEvent.change(tipoSelect, { target: { value: 'NFE' } });
    });

    await waitFor(() => {
      expect(listarNfseMock).toHaveBeenCalledWith(
        expect.objectContaining({ documentType: 'NFE', limit: 1000 })
      );
    });

    await act(async () => {
      fireEvent.change(tipoSelect, { target: { value: 'NFCE' } });
    });

    await waitFor(() => {
      expect(listarNfseMock).toHaveBeenCalledWith(
        expect.objectContaining({ documentType: 'NFCE', limit: 1000 })
      );
    });

    await act(async () => {
      root.unmount();
    });
  });

  it('Guia MEI (QA): NFS-e suja → troca para NF-e abre modal §5.3', async () => {
    authState.role = 'superadmin';
    authState.mei = false;

    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(<GuidesMei />);
    });

    const notasTab = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Emissão fiscal')
    );
    expect(notasTab).toBeTruthy();
    await act(async () => {
      notasTab!.click();
    });

    await waitFor(() => {
      expect(container.querySelector('#nfse-tomador-doc')).toBeTruthy();
    });

    const tomador = container.querySelector('#nfse-tomador-doc') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(tomador, { target: { value: '1' } });
    });

    const nfeRadio = container.querySelector('#mei-fiscal-emission-type-NFE') as HTMLInputElement;
    expect(nfeRadio).toBeTruthy();
    await act(async () => {
      fireEvent.click(nfeRadio);
    });

    await waitFor(() => {
      expect(container.textContent).toContain('Alterar tipo de nota');
    });

    await act(async () => {
      root.unmount();
    });
  });

  it('Guia MEI (QA): submit NF-e válido chama emitirNfe', async () => {
    emitirNfeMock.mockClear();
    authState.role = 'superadmin';
    authState.mei = false;

    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(<GuidesMei />);
    });

    const notasTab = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Emissão fiscal')
    );
    await act(async () => {
      notasTab!.click();
    });

    await waitFor(() => {
      expect(container.querySelector('#mei-fiscal-emission-type-NFE')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.click(container.querySelector('#mei-fiscal-emission-type-NFE')!);
    });

    await waitFor(() => {
      expect(container.querySelector('#mei-nfe-emitente-cnpj')).toBeTruthy();
    });

    const addItem = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Adicionar item')
    );
    expect(addItem).toBeTruthy();
    await act(async () => {
      fireEvent.click(addItem!);
    });

    await act(async () => {
      fireEvent.change(container.querySelector('#mei-nfe-emitente-cnpj')!, {
        target: { value: '11.222.333/0001-81' }
      });
      fireEvent.change(container.querySelector('#mei-nfe-emitente-razao')!, {
        target: { value: 'Emitente Teste' }
      });
      fireEvent.change(container.querySelector('#mei-nfe-dest-doc')!, {
        target: { value: '529.982.247-25' }
      });
      fireEvent.change(container.querySelector('#mei-nfe-dest-razao')!, {
        target: { value: 'Cliente Teste' }
      });
      fireEvent.change(container.querySelector('#mei-nfe-item-0-codigo')!, { target: { value: 'SKU1' } });
      fireEvent.change(container.querySelector('#mei-nfe-item-0-descricao')!, { target: { value: 'Produto' } });
      fireEvent.change(container.querySelector('#mei-nfe-item-0-ncm')!, { target: { value: '12345678' } });
      fireEvent.change(container.querySelector('#mei-nfe-item-0-cfop')!, { target: { value: '5102' } });
      fireEvent.change(container.querySelector('#mei-nfe-item-0-qtd')!, { target: { value: '2' } });
      fireEvent.change(container.querySelector('#mei-nfe-item-0-vu')!, { target: { value: '10,50' } });
    });

    const emitBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Emitir NF-e')
    );
    expect(emitBtn).toBeTruthy();
    await act(async () => {
      fireEvent.click(emitBtn!);
    });

    await waitFor(() => {
      expect(emitirNfeMock).toHaveBeenCalled();
    });

    await act(async () => {
      root.unmount();
    });
  });

  it('FR-GUIA-FISC-07: NF-e inactiva no emissor bloqueia submit (callout + botão desactivado)', async () => {
    consultarEmpresaEmissaoNfMock.mockImplementation(async () => ({
      message: 'OK',
      data: {
        nfe: { ativo: false, tipoContrato: 0 },
        nfce: { ativo: false, tipoContrato: 0 }
      }
    }));
    emitirNfeMock.mockClear();
    authState.role = 'superadmin';
    authState.mei = false;

    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(<GuidesMei />);
    });

    const notasTab = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Emissão fiscal')
    );
    await act(async () => {
      notasTab!.click();
    });

    await waitFor(() => {
      expect(container.querySelector('#mei-fiscal-emission-type-NFE')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.click(container.querySelector('#mei-fiscal-emission-type-NFE')!);
    });

    await waitFor(() => {
      expect(container.querySelector('#mei-nfe-emitente-cnpj')).toBeTruthy();
    });

    const addItem = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Adicionar item')
    );
    expect(addItem).toBeTruthy();
    await act(async () => {
      fireEvent.click(addItem!);
    });

    await act(async () => {
      fireEvent.change(container.querySelector('#mei-nfe-emitente-razao')!, {
        target: { value: 'Emitente Teste' }
      });
      fireEvent.change(container.querySelector('#mei-nfe-dest-doc')!, {
        target: { value: '529.982.247-25' }
      });
      fireEvent.change(container.querySelector('#mei-nfe-dest-razao')!, {
        target: { value: 'Cliente Teste' }
      });
      fireEvent.change(container.querySelector('#mei-nfe-item-0-codigo')!, { target: { value: 'SKU1' } });
      fireEvent.change(container.querySelector('#mei-nfe-item-0-descricao')!, { target: { value: 'Produto' } });
      fireEvent.change(container.querySelector('#mei-nfe-item-0-ncm')!, { target: { value: '12345678' } });
      fireEvent.change(container.querySelector('#mei-nfe-item-0-cfop')!, { target: { value: '5102' } });
      fireEvent.change(container.querySelector('#mei-nfe-item-0-qtd')!, { target: { value: '2' } });
      fireEvent.change(container.querySelector('#mei-nfe-item-0-vu')!, { target: { value: '10,50' } });
      fireEvent.change(container.querySelector('#mei-nfe-emitente-cnpj')!, {
        target: { value: '11.222.333/0001-81' }
      });
    });

    await waitFor(() => {
      expect(container.querySelector('[data-mei-fiscal-capability="blocked"]')).toBeTruthy();
    });

    const emitBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Emitir NF-e')
    );
    expect(emitBtn).toBeTruthy();
    expect((emitBtn as HTMLButtonElement).disabled).toBe(true);
    await act(async () => {
      fireEvent.click(emitBtn!);
    });
    expect(emitirNfeMock).not.toHaveBeenCalled();

    await act(async () => {
      root.unmount();
    });
  });

  it('FR-GUIA-FISC-07 (QA): NFC-e inactiva com NF-e activa bloqueia só NFC-e; emitirNfce não é chamado', async () => {
    consultarEmpresaEmissaoNfMock.mockImplementation(async () => ({
      message: 'OK',
      data: {
        nfe: { ativo: true, tipoContrato: 0 },
        nfce: { ativo: false, tipoContrato: 0 }
      }
    }));
    emitirNfceMock.mockClear();
    authState.role = 'superadmin';
    authState.mei = false;

    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(<GuidesMei />);
    });

    const notasTab = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Emissão fiscal')
    );
    await act(async () => {
      notasTab!.click();
    });

    await waitFor(() => {
      expect(container.querySelector('#mei-fiscal-emission-type-NFCE')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.click(container.querySelector('#mei-fiscal-emission-type-NFCE')!);
    });

    await waitFor(() => {
      expect(container.querySelector('#mei-nfe-emitente-cnpj')).toBeTruthy();
    });

    const addItem = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Adicionar item')
    );
    expect(addItem).toBeTruthy();
    await act(async () => {
      fireEvent.click(addItem!);
    });

    await act(async () => {
      fireEvent.change(container.querySelector('#mei-nfe-emitente-razao')!, {
        target: { value: 'Emitente Teste' }
      });
      fireEvent.change(container.querySelector('#mei-nfe-dest-doc')!, {
        target: { value: '529.982.247-25' }
      });
      fireEvent.change(container.querySelector('#mei-nfe-dest-razao')!, {
        target: { value: 'Cliente Teste' }
      });
      fireEvent.change(container.querySelector('#mei-nfe-item-0-codigo')!, { target: { value: 'SKU1' } });
      fireEvent.change(container.querySelector('#mei-nfe-item-0-descricao')!, { target: { value: 'Produto' } });
      fireEvent.change(container.querySelector('#mei-nfe-item-0-ncm')!, { target: { value: '12345678' } });
      fireEvent.change(container.querySelector('#mei-nfe-item-0-cfop')!, { target: { value: '5102' } });
      fireEvent.change(container.querySelector('#mei-nfe-item-0-qtd')!, { target: { value: '2' } });
      fireEvent.change(container.querySelector('#mei-nfe-item-0-vu')!, { target: { value: '10,50' } });
      fireEvent.change(container.querySelector('#mei-nfe-emitente-cnpj')!, {
        target: { value: '11.222.333/0001-81' }
      });
    });

    await waitFor(() => {
      expect(container.querySelector('[data-mei-fiscal-capability="blocked"]')).toBeTruthy();
    });
    expect(container.textContent).toContain('Emissão de NFC-e não disponível');

    const emitBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Emitir NFC-e')
    );
    expect(emitBtn).toBeTruthy();
    expect((emitBtn as HTMLButtonElement).disabled).toBe(true);
    await act(async () => {
      fireEvent.click(emitBtn!);
    });
    expect(emitirNfceMock).not.toHaveBeenCalled();

    await act(async () => {
      root.unmount();
    });
  });

  it('FR-GUIA-FISC-07 (QA): NF-e activa com NFC-e inactiva não bloqueia submit NF-e', async () => {
    consultarEmpresaEmissaoNfMock.mockImplementation(async () => ({
      message: 'OK',
      data: {
        nfe: { ativo: true, tipoContrato: 0 },
        nfce: { ativo: false, tipoContrato: 0 }
      }
    }));
    emitirNfeMock.mockClear();
    authState.role = 'superadmin';
    authState.mei = false;

    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(<GuidesMei />);
    });

    const notasTab = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Emissão fiscal')
    );
    await act(async () => {
      notasTab!.click();
    });

    await waitFor(() => {
      expect(container.querySelector('#mei-fiscal-emission-type-NFE')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.click(container.querySelector('#mei-fiscal-emission-type-NFE')!);
    });

    await waitFor(() => {
      expect(container.querySelector('#mei-nfe-emitente-cnpj')).toBeTruthy();
    });

    const addItem = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Adicionar item')
    );
    expect(addItem).toBeTruthy();
    await act(async () => {
      fireEvent.click(addItem!);
    });

    await act(async () => {
      fireEvent.change(container.querySelector('#mei-nfe-emitente-cnpj')!, {
        target: { value: '11.222.333/0001-81' }
      });
      fireEvent.change(container.querySelector('#mei-nfe-emitente-razao')!, {
        target: { value: 'Emitente Teste' }
      });
      fireEvent.change(container.querySelector('#mei-nfe-dest-doc')!, {
        target: { value: '529.982.247-25' }
      });
      fireEvent.change(container.querySelector('#mei-nfe-dest-razao')!, {
        target: { value: 'Cliente Teste' }
      });
      fireEvent.change(container.querySelector('#mei-nfe-item-0-codigo')!, { target: { value: 'SKU1' } });
      fireEvent.change(container.querySelector('#mei-nfe-item-0-descricao')!, { target: { value: 'Produto' } });
      fireEvent.change(container.querySelector('#mei-nfe-item-0-ncm')!, { target: { value: '12345678' } });
      fireEvent.change(container.querySelector('#mei-nfe-item-0-cfop')!, { target: { value: '5102' } });
      fireEvent.change(container.querySelector('#mei-nfe-item-0-qtd')!, { target: { value: '2' } });
      fireEvent.change(container.querySelector('#mei-nfe-item-0-vu')!, { target: { value: '10,50' } });
    });

    await waitFor(() => {
      expect(consultarEmpresaEmissaoNfMock).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(container.querySelector('[data-mei-fiscal-capability="blocked"]')).toBeNull();
    });

    const emitBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Emitir NF-e')
    );
    expect(emitBtn).toBeTruthy();
    expect((emitBtn as HTMLButtonElement).disabled).toBe(false);

    await act(async () => {
      fireEvent.click(emitBtn!);
    });

    await waitFor(() => {
      expect(emitirNfeMock).toHaveBeenCalled();
    });

    await act(async () => {
      root.unmount();
    });
  });

  it('workspace NFS-e (FR-NFSE-UX-P0): secções com id e lista vazia após carregar', async () => {
    authState.role = 'superadmin';
    authState.mei = false;

    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(<GuidesMei />);
    });

    const notasTab = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('Emissão fiscal')
    );
    expect(notasTab).toBeTruthy();
    await act(async () => {
      notasTab!.click();
    });

    await waitFor(() => {
      expect(container.querySelector('#mei-nfse-pre')).toBeTruthy();
      expect(container.querySelector('#mei-nfse-emit')).toBeTruthy();
      expect(container.querySelector('#mei-nfse-list')).toBeTruthy();
    });

    expect(container.textContent).toContain('Antes de emitir');

    await waitFor(() => {
      expect(container.textContent).toContain('Ainda não há notas emitidas');
    });

    await act(async () => {
      root.unmount();
    });
  });

  it('workspace NFS-e (FR-NFSE-UX-P1): filtros com htmlFor e ações nomeadas na linha', async () => {
    listarNfseMock.mockResolvedValueOnce([
      {
        id: 'nfse-row-1',
        user_id: 'user-1',
        status: 'concluido',
        created_at: '2026-01-15T12:00:00.000Z'
      }
    ]);

    authState.role = 'superadmin';
    authState.mei = false;

    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(<GuidesMei />);
    });

    const notasTab = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('Emissão fiscal')
    );
    expect(notasTab).toBeTruthy();
    await act(async () => {
      notasTab!.click();
    });

    await waitFor(() => {
      expect(container.querySelector('#nfse-filter-lista-tipo')).toBeTruthy();
      expect(container.querySelector('#nfse-filter-status')).toBeTruthy();
      expect(container.querySelector('#nfse-filter-periodo')).toBeTruthy();
      expect(container.querySelector('#nfse-filter-arquivadas')).toBeTruthy();
    });

    await waitFor(() => {
      expect(container.textContent).toContain('O que fazer com esta nota');
      expect(container.textContent).toContain('Baixar PDF');
      expect(container.textContent).toContain('Baixar XML');
      expect(container.textContent).toContain('Cancelar nota');
    });

    await act(async () => {
      root.unmount();
    });
  });

  it('workspace NFS-e (FR-NFSE-UX-P1 / QA): ordem DOM dos filtros alinha tab tipo→status→período→arquivadas→atualizar', async () => {
    authState.role = 'superadmin';
    authState.mei = false;

    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(<GuidesMei />);
    });

    const notasTab = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('Emissão fiscal')
    );
    await act(async () => {
      notasTab!.click();
    });

    await waitFor(() => {
      expect(container.querySelector('#nfse-filter-lista-tipo')).toBeTruthy();
    });

    const following = Node.DOCUMENT_POSITION_FOLLOWING;
    const tipo = container.querySelector('#nfse-filter-lista-tipo')!;
    const status = container.querySelector('#nfse-filter-status')!;
    const periodo = container.querySelector('#nfse-filter-periodo')!;
    const arquivadas = container.querySelector('#nfse-filter-arquivadas')!;
    const atualizar = container.querySelector('#nfse-list-atualizar')!;

    expect(tipo.compareDocumentPosition(status) & following).toBeTruthy();
    expect(status.compareDocumentPosition(periodo) & following).toBeTruthy();
    expect(periodo.compareDocumentPosition(arquivadas) & following).toBeTruthy();
    expect(arquivadas.compareDocumentPosition(atualizar) & following).toBeTruthy();

    await act(async () => {
      root.unmount();
    });
  });

  it('workspace NFS-e (FR-NFSE-UX-P1 / QA): emitir com erro reexpande secção Prestador se estava colapsada', async () => {
    authState.role = 'superadmin';
    authState.mei = false;

    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(<GuidesMei />);
    });

    const notasTab = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('Emissão fiscal')
    );
    await act(async () => {
      notasTab!.click();
    });

    await waitFor(() => {
      expect(container.querySelector('#mei-nfse-emit-heading-prestador')).toBeTruthy();
    });

    const prestadorToggle = container.querySelector('#mei-nfse-emit-heading-prestador')!;
    expect(prestadorToggle.getAttribute('aria-expanded')).toBe('true');

    await act(async () => {
      prestadorToggle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(prestadorToggle.getAttribute('aria-expanded')).toBe('false');

    const emitBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      /Emitir\s+NFSe/i.test(b.textContent?.trim() || '')
    );
    expect(emitBtn).toBeTruthy();

    await act(async () => {
      emitBtn!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(prestadorToggle.getAttribute('aria-expanded')).toBe('true');

    await act(async () => {
      root.unmount();
    });
  });

  it('workspace NFS-e (FR-NFSE-UX-P1 / QA): ações da nota aparecem com rótulo visível', async () => {
    listarNfseMock.mockResolvedValueOnce([
      {
        id: 'nfse-row-1',
        user_id: 'user-1',
        status: 'concluido',
        plugnotas_id: 'plug-1',
        created_at: '2026-01-15T12:00:00.000Z'
      }
    ]);

    authState.role = 'superadmin';
    authState.mei = false;

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<GuidesMei />);
    });

    const notasTab = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('Emissão fiscal')
    );
    await act(async () => {
      notasTab!.click();
    });

    await waitFor(() => {
      expect(container.textContent).toContain('O que fazer com esta nota');
      expect(container.textContent).toContain('Atualizar status');
      expect(container.textContent).toContain('Baixar PDF');
      expect(container.textContent).toContain('Cancelar nota');
    });

    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(container);
  });

  it('workspace NFS-e (FR-NFSE-UX-P1 / QA): nota em processamento desativa PDF e XML', async () => {
    listarNfseMock.mockResolvedValueOnce([
      {
        id: 'nfse-proc',
        user_id: 'user-1',
        status: 'processando',
        created_at: '2026-01-15T12:00:00.000Z'
      }
    ]);

    authState.role = 'superadmin';
    authState.mei = false;

    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(<GuidesMei />);
    });

    const notasTab = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('Emissão fiscal')
    );
    await act(async () => {
      notasTab!.click();
    });

    await waitFor(() => {
      expect(container.textContent).toContain('Baixar PDF');
    });

    const pdfBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Baixar PDF')
    );
    expect(pdfBtn).toBeTruthy();
    expect((pdfBtn as HTMLButtonElement).disabled).toBe(true);

    const xmlBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Baixar XML')
    );
    expect(xmlBtn).toBeTruthy();
    expect((xmlBtn as HTMLButtonElement).disabled).toBe(true);

    await act(async () => {
      root.unmount();
    });
  });

  it('workspace NFS-e (FR-NFSE-UX-P1 / QA): nota arquivada desativa revisão', async () => {
    listarNfseMock.mockResolvedValueOnce([
      {
        id: 'nfse-arch',
        user_id: 'user-1',
        status: 'concluido',
        archived_at: '2026-01-16T12:00:00.000Z',
        created_at: '2026-01-15T12:00:00.000Z'
      }
    ]);

    authState.role = 'superadmin';
    authState.mei = false;

    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(<GuidesMei />);
    });

    const notasTab = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('Emissão fiscal')
    );
    await act(async () => {
      notasTab!.click();
    });

    await waitFor(() => {
      const reviewBtn = Array.from(container.querySelectorAll('button')).find((b) =>
        /Marcar revisão|Remover revisão/.test(b.textContent || '')
      );
      expect(reviewBtn).toBeTruthy();
      expect((reviewBtn as HTMLButtonElement).disabled).toBe(true);
    });

    await act(async () => {
      root.unmount();
    });
  });

  describe('workspace localStorage (FR-UX-MEI-P2)', () => {
    it('restaura Certificado e DAS quando a chave guarda das', async () => {
      localStorage.setItem(MEI_WORKSPACE_STORAGE_KEY, 'das');

      const container = document.createElement('div');
      const root = createRoot(container);

      await act(async () => {
        root.render(<GuidesMei />);
      });

      expect(container.querySelector('#mei-tab-das')?.getAttribute('aria-selected')).toBe('true');

      await act(async () => {
        root.unmount();
      });
    });

    it('com nfse guardado e sem permissão NFS-e, ativa Visão geral', async () => {
      localStorage.setItem(MEI_WORKSPACE_STORAGE_KEY, 'nfse');
      authState.role = 'usuario';
      authState.mei = false;

      const container = document.createElement('div');
      const root = createRoot(container);

      await act(async () => {
        root.render(<GuidesMei />);
      });

      expect(container.querySelector('#mei-tab-overview')?.getAttribute('aria-selected')).toBe('true');

      await act(async () => {
        root.unmount();
      });
    });

    it('persiste das ao clicar no tab DAS', async () => {
      const container = document.createElement('div');
      const root = createRoot(container);

      await act(async () => {
        root.render(<GuidesMei />);
      });

      const dasTab = container.querySelector('#mei-tab-das');
      expect(dasTab).toBeTruthy();

      await act(async () => {
        dasTab!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });

      expect(localStorage.getItem(MEI_WORKSPACE_STORAGE_KEY)).toBe('das');

      await act(async () => {
        root.unmount();
      });
    });
  });
});
