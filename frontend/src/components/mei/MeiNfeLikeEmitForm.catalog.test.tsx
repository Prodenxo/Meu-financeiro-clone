// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const listarCatalogoNfseProdutos = vi.fn();

vi.mock('../../services/meiNotasService', () => ({
  listarCatalogoNfseProdutos: (...args: unknown[]) => listarCatalogoNfseProdutos(...args)
}));

import { MeiNfeLikeEmitForm } from './MeiNfeLikeEmitForm';
import { createEmptyMeiNfeLikeFormState } from '../../utils/meiNfeLikeFormState';

describe('MeiNfeLikeEmitForm — catálogo (FR-GUIA-FISC-12)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listarCatalogoNfseProdutos.mockResolvedValue([
      {
        id: 'p1',
        discriminacao: 'Produto teste',
        codigo: 'SKU-1',
        valor_sugerido: 25.5,
        metadata_json: { ncm: '12345678', cfop: '5102' }
      }
    ]);
  });

  afterEach(() => {
    cleanup();
  });

  it('abre o selector e acrescenta linha ao seleccionar produto', async () => {
    const onChange = vi.fn();
    render(
      <MemoryRouter>
        <MeiNfeLikeEmitForm
          documentLabel="NF-e"
          value={createEmptyMeiNfeLikeFormState()}
          onChange={onChange}
          errors={{}}
          nfLikeCatalogDocumentType="NFE"
        />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /Adicionar do catálogo/i }));

    await waitFor(() => {
      expect(listarCatalogoNfseProdutos).toHaveBeenCalledWith(
        expect.objectContaining({ documentType: 'NFE', limit: 50 })
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('mei-nfe-like-catalog-picker')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /SKU-1 — Produto teste/i }));

    await waitFor(() => {
      expect(onChange).toHaveBeenCalled();
    });

    const last = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(last.itens).toHaveLength(1);
    expect(last.itens[0].codigo).toBe('SKU-1');
    expect(last.itens[0].descricao).toBe('Produto teste');
    expect(last.itens[0].ncm).toBe('12345678');
    expect(last.itens[0].cfop).toBe('5102');
  });

  it('sem nfLikeCatalogDocumentType não mostra Adicionar do catálogo', () => {
    render(
      <MemoryRouter>
        <MeiNfeLikeEmitForm
          documentLabel="NF-e"
          value={createEmptyMeiNfeLikeFormState()}
          onChange={vi.fn()}
          errors={{}}
        />
      </MemoryRouter>
    );
    expect(screen.queryByRole('button', { name: /Adicionar do catálogo/i })).toBeNull();
  });

  it('NFC-e: lista com documentType NFCE', async () => {
    render(
      <MemoryRouter>
        <MeiNfeLikeEmitForm
          documentLabel="NFC-e"
          value={createEmptyMeiNfeLikeFormState()}
          onChange={vi.fn()}
          errors={{}}
          nfLikeCatalogDocumentType="NFCE"
        />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /Adicionar do catálogo/i }));

    await waitFor(() => {
      expect(listarCatalogoNfseProdutos).toHaveBeenCalledWith(
        expect.objectContaining({ documentType: 'NFCE', limit: 50 })
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('mei-nfe-like-catalog-picker')).toBeTruthy();
    });
    expect(screen.getByRole('heading', { name: /Adicionar do catálogo — NFC-e/i })).toBeTruthy();
  });

  it('empty state: mensagem e link Ir ao catálogo', async () => {
    listarCatalogoNfseProdutos.mockReset();
    listarCatalogoNfseProdutos.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <MeiNfeLikeEmitForm
          documentLabel="NF-e"
          value={createEmptyMeiNfeLikeFormState()}
          onChange={vi.fn()}
          errors={{}}
          nfLikeCatalogDocumentType="NFE"
        />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /Adicionar do catálogo/i }));

    await waitFor(() => {
      expect(screen.getByText(/Não há produtos compatíveis com NF-e no catálogo/i)).toBeTruthy();
    });
    const link = screen.getByRole('link', { name: /Ir ao catálogo/i });
    expect(link.getAttribute('href')).toBe('/mei-catalogo/servicos-produtos');
  });

  it('erro de carga: Tentar novamente volta a carregar e permite seleccionar', async () => {
    const produto = {
      id: 'p1',
      discriminacao: 'Após retry',
      codigo: 'R1',
      valor_sugerido: 10,
      metadata_json: { ncm: '12345678', cfop: '5102' }
    };
    listarCatalogoNfseProdutos.mockReset();
    listarCatalogoNfseProdutos
      .mockRejectedValueOnce(new Error('falha rede'))
      .mockResolvedValueOnce([produto]);

    const onChange = vi.fn();
    render(
      <MemoryRouter>
        <MeiNfeLikeEmitForm
          documentLabel="NF-e"
          value={createEmptyMeiNfeLikeFormState()}
          onChange={onChange}
          errors={{}}
          nfLikeCatalogDocumentType="NFE"
        />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /Adicionar do catálogo/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Tentar novamente/i })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /Tentar novamente/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /R1 — Após retry/i })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /R1 — Após retry/i }));

    await waitFor(() => {
      expect(onChange).toHaveBeenCalled();
    });
    const last = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(last.itens[0].codigo).toBe('R1');
  });
});
