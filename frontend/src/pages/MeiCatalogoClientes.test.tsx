// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const listarMock = vi.fn();
const criarMock = vi.fn();

vi.mock('../services/meiNotasService', () => ({
  listarCatalogoNfseClientes: (...args: unknown[]) => listarMock(...args),
  criarCatalogoNfseCliente: (...args: unknown[]) => criarMock(...args),
  atualizarCatalogoNfseCliente: vi.fn()
}));

const toastSuccess = vi.fn();

vi.mock('../lib/toast', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: vi.fn(),
    info: vi.fn()
  }
}));

import MeiCatalogoClientes from './MeiCatalogoClientes';

describe('MeiCatalogoClientes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listarMock.mockResolvedValue([]);
    criarMock.mockResolvedValue({
      id: 'n1',
      nome: 'Novo',
      documento: '12345678000199',
      email: null
    });
  });

  it('lista clientes e mostra linha na tabela', async () => {
    listarMock.mockResolvedValue([
      {
        id: 'c1',
        nome: 'Cliente Um',
        documento: '12345678000199',
        email: 'um@exemplo.com'
      }
    ]);

    render(
      <MemoryRouter>
        <MeiCatalogoClientes />
      </MemoryRouter>
    );

    expect(await screen.findByText('Cliente Um')).toBeTruthy();
    expect(screen.getByText('um@exemplo.com')).toBeTruthy();
    expect(listarMock).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 50, documentType: 'NFSE' })
    );
  });

  it('pesquisa envia q após debounce (300 ms)', async () => {
    render(
      <MemoryRouter>
        <MeiCatalogoClientes />
      </MemoryRouter>
    );

    await waitFor(() => expect(listarMock).toHaveBeenCalled());
    const input = await screen.findByLabelText('Pesquisar');
    const callsAfterLoad = listarMock.mock.calls.length;
    fireEvent.change(input, { target: { value: 'acme' } });

    await waitFor(
      () => {
        expect(
          listarMock.mock.calls.some(
            (c) => (c[0] as { q?: string })?.q === 'acme'
          )
        ).toBe(true);
      },
      { timeout: 3000 }
    );
    expect(listarMock.mock.calls.length).toBeGreaterThanOrEqual(callsAfterLoad + 1);
  });

  it('Novo cliente: submissão válida chama criar, toast e re-lista', async () => {
    listarMock.mockResolvedValue([
      {
        id: 'c1',
        nome: 'Existente',
        documento: '11111111000191',
        email: null
      }
    ]);

    render(
      <MemoryRouter>
        <MeiCatalogoClientes />
      </MemoryRouter>
    );

    await waitFor(() => expect(listarMock).toHaveBeenCalled());
    const botoesNovo = screen.getAllByRole('button', { name: /^Novo cliente$/i });
    fireEvent.click(botoesNovo[0]!);

    const dialog = (await screen.findAllByRole('dialog'))[0]!;
    expect(within(dialog).getByRole('heading', { name: /Novo cliente/i })).toBeTruthy();

    fireEvent.change(within(dialog).getByLabelText(/Nome ou razão social/i), {
      target: { value: 'Novo Cliente SA' }
    });
    fireEvent.change(within(dialog).getByLabelText(/CPF ou CNPJ/i), {
      target: { value: '12345678000199' }
    });
    fireEvent.click(within(dialog).getByRole('button', { name: /^Guardar$/i }));

    await waitFor(() => expect(criarMock).toHaveBeenCalled());
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('Cliente registado.'));
    await waitFor(() => expect(listarMock.mock.calls.length).toBeGreaterThanOrEqual(2));
  });
});
