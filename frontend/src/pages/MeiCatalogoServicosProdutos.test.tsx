// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const listarMock = vi.fn();
const criarMock = vi.fn();

vi.mock('../services/meiNotasService', () => ({
  listarCatalogoNfseProdutos: (...args: unknown[]) => listarMock(...args),
  criarCatalogoNfseProduto: (...args: unknown[]) => criarMock(...args),
  atualizarCatalogoNfseProduto: vi.fn()
}));

const toastSuccess = vi.fn();

vi.mock('../lib/toast', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: vi.fn(),
    info: vi.fn()
  }
}));

import MeiCatalogoServicosProdutos from './MeiCatalogoServicosProdutos';

describe('MeiCatalogoServicosProdutos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listarMock.mockResolvedValue([]);
    criarMock.mockResolvedValue({
      id: 'n1',
      discriminacao: 'Novo',
      codigo: null,
      cnae: null,
      aliquota: null,
      valor_sugerido: null
    });
  });

  it('lista itens e mostra linha na tabela (desktop)', async () => {
    listarMock.mockResolvedValue([
      {
        id: 'p1',
        discriminacao: 'Consultoria técnica',
        codigo: 'S1',
        cnae: '6201500',
        aliquota: 5,
        valor_sugerido: 250
      }
    ]);

    render(
      <MemoryRouter>
        <MeiCatalogoServicosProdutos />
      </MemoryRouter>
    );

    expect((await screen.findAllByText(/Consultoria técnica/i)).length).toBeGreaterThan(0);
    expect(listarMock).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 50, documentType: 'NFSE' })
    );
  });

  it('pesquisa envia q após debounce (300 ms)', async () => {
    render(
      <MemoryRouter>
        <MeiCatalogoServicosProdutos />
      </MemoryRouter>
    );

    await waitFor(() => expect(listarMock).toHaveBeenCalled());
    const input = await screen.findByLabelText('Pesquisar');
    const callsAfterLoad = listarMock.mock.calls.length;
    fireEvent.change(input, { target: { value: 'cnae' } });

    await waitFor(
      () => {
        expect(
          listarMock.mock.calls.some((c) => (c[0] as { q?: string })?.q === 'cnae')
        ).toBe(true);
      },
      { timeout: 3000 }
    );
    expect(listarMock.mock.calls.length).toBeGreaterThanOrEqual(callsAfterLoad + 1);
  });

  it('Novo item: submissão válida chama criar, toast e re-lista', async () => {
    listarMock.mockResolvedValue([
      {
        id: 'p1',
        discriminacao: 'Existente',
        codigo: null,
        cnae: null,
        aliquota: null,
        valor_sugerido: null
      }
    ]);

    render(
      <MemoryRouter>
        <MeiCatalogoServicosProdutos />
      </MemoryRouter>
    );

    await waitFor(() => expect(listarMock).toHaveBeenCalled());
    const botoesNovo = screen.getAllByRole('button', { name: /^Novo item$/i });
    fireEvent.click(botoesNovo[0]!);

    const dialog = (await screen.findAllByRole('dialog'))[0]!;
    expect(within(dialog).getByRole('heading', { name: /Novo serviço ou produto/i })).toBeTruthy();

    fireEvent.change(within(dialog).getByLabelText(/^Discriminação/i), {
      target: { value: 'Serviço novo' }
    });
    fireEvent.click(within(dialog).getByRole('button', { name: /^Guardar$/i }));

    await waitFor(() => expect(criarMock).toHaveBeenCalled());
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('Item registado no catálogo.'));
    await waitFor(() => expect(listarMock.mock.calls.length).toBeGreaterThanOrEqual(2));
  });
});
