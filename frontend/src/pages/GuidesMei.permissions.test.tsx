// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { waitFor } from '@testing-library/react';

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
  listarNfse: (...args: unknown[]) => listarNfseMock(...args),
  obterNfse: vi.fn(async () => ({}))
}));

describe('GuidesMei permissões NFSe', () => {
  beforeEach(() => {
    authState.role = 'usuario';
    authState.mei = true;
    localStorage.removeItem(MEI_WORKSPACE_STORAGE_KEY);
    listarNfseMock.mockImplementation(async () => []);
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

  it('workspace NFS-e (FR-NFSE-UX-P0): secções com id e lista vazia após carregar', async () => {
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

  it('workspace NFS-e (FR-NFSE-UX-P1): filtros com htmlFor e menu Mais ações na linha', async () => {
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
      (b) => b.textContent?.includes('NFS-e')
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
      expect(container.textContent).toContain('Mais ações');
    });

    const moreBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Mais ações'
    );
    expect(moreBtn).toBeTruthy();
    expect(moreBtn!.getAttribute('aria-haspopup')).toBe('menu');
    expect(moreBtn!.getAttribute('aria-expanded')).toBe('false');

    await act(async () => {
      moreBtn!.click();
    });

    expect(moreBtn!.getAttribute('aria-expanded')).toBe('true');
    expect(container.textContent).toContain('Baixar XML');

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
      (b) => b.textContent?.includes('NFS-e')
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
      (b) => b.textContent?.includes('NFS-e')
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

  it('workspace NFS-e (FR-NFSE-UX-P1 / QA): setas no menu Mais ações movem foco entre itens', async () => {
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
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<GuidesMei />);
    });

    const notasTab = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('NFS-e')
    );
    await act(async () => {
      notasTab!.click();
    });

    await waitFor(() => {
      expect(container.textContent).toContain('Mais ações');
    });

    const moreBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Mais ações'
    );
    await act(async () => {
      moreBtn!.click();
    });

    const menu = await waitFor(() =>
      container.querySelector('#nfse-more-actions-card-nfse-row-1')
    );
    expect(menu).toBeTruthy();

    const items = menu!.querySelectorAll('button[role="menuitem"]');
    expect(items.length).toBeGreaterThanOrEqual(2);

    // Evitar corrida com o rAF do componente que foca o 1.º menuitem ao abrir.
    await act(async () => {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
    });
    await waitFor(() => expect(document.activeElement).toBe(items[0]));

    await act(async () => {
      menu!.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })
      );
    });
    await waitFor(() => expect(document.activeElement).toBe(items[1]));

    await act(async () => {
      menu!.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true })
      );
    });
    await waitFor(() => expect(document.activeElement).toBe(items[0]));

    await act(async () => {
      menu!.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    });
    await waitFor(() => expect(document.activeElement).toBe(items[items.length - 1]));

    await act(async () => {
      menu!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    });
    await waitFor(() => expect(document.activeElement).toBe(items[0]));

    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(container);
  });

  it('workspace NFS-e (FR-NFSE-UX-P1 / QA): nota em processamento desativa PDF e XML no menu', async () => {
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
      (b) => b.textContent?.includes('NFS-e')
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

    const moreBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Mais ações'
    );
    await act(async () => {
      moreBtn!.click();
    });

    await waitFor(() => {
      const xmlBtn = container.querySelector(
        '#nfse-more-actions-card-nfse-proc button[role="menuitem"]'
      );
      expect(xmlBtn).toBeTruthy();
      expect((xmlBtn as HTMLButtonElement).disabled).toBe(true);
    });

    await act(async () => {
      root.unmount();
    });
  });

  it('workspace NFS-e (FR-NFSE-UX-P1 / QA): nota arquivada desativa revisão no menu', async () => {
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
      (b) => b.textContent?.includes('NFS-e')
    );
    await act(async () => {
      notasTab!.click();
    });

    await waitFor(() => {
      expect(container.textContent).toContain('Mais ações');
    });

    const moreBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Mais ações'
    );
    await act(async () => {
      moreBtn!.click();
    });

    await waitFor(() => {
      const menuItems = container.querySelectorAll(
        '#nfse-more-actions-card-nfse-arch button[role="menuitem"]'
      );
      expect(menuItems.length).toBeGreaterThanOrEqual(2);
      const reviewBtn = Array.from(menuItems).find((b) =>
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
