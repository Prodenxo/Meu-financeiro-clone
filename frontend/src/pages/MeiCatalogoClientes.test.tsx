// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const listarMock = vi.fn();
const criarMock = vi.fn();
const eliminarMock = vi.fn();

vi.mock('../services/meiNotasService', () => ({
  listarCatalogoNfseClientes: (...args: unknown[]) => listarMock(...args),
  criarCatalogoNfseCliente: (...args: unknown[]) => criarMock(...args),
  atualizarCatalogoNfseCliente: vi.fn(),
  eliminarCatalogoNfseCliente: (...args: unknown[]) => eliminarMock(...args)
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock('../lib/toast', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
    info: vi.fn()
  }
}));

import MeiCatalogoClientes from './MeiCatalogoClientes';

describe('MeiCatalogoClientes', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    eliminarMock.mockResolvedValue(undefined);
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

    expect((await screen.findAllByText('Cliente Um')).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('um@exemplo.com').length).toBeGreaterThanOrEqual(1);
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

  it('exclusão: abre confirmação, Cancelar não chama API', async () => {
    listarMock.mockResolvedValue([
      {
        id: 'c-del-1',
        nome: 'Cliente Excluir',
        documento: '12345678000199',
        email: null
      }
    ]);

    render(
      <MemoryRouter>
        <MeiCatalogoClientes />
      </MemoryRouter>
    );

    expect((await screen.findAllByText('Cliente Excluir')).length).toBeGreaterThanOrEqual(1);
    const excluir = screen.getAllByRole('button', {
      name: /Excluir cliente Cliente Excluir do catálogo/i
    })[0]!;
    fireEvent.click(excluir);

    const confirmDlg = await screen.findByTestId('mei-delete-cliente-confirm');
    expect(within(confirmDlg).getByRole('heading', { name: /Excluir cliente do catálogo/i })).toBeTruthy();
    fireEvent.click(within(confirmDlg).getByRole('button', { name: /^Cancelar$/i }));

    await waitFor(() => {
      expect(screen.queryByTestId('mei-delete-cliente-confirm')).toBeNull();
    });
    expect(eliminarMock).not.toHaveBeenCalled();
  });

  it('exclusão: confirmar chama DELETE, toast e re-lista', async () => {
    listarMock.mockResolvedValue([
      {
        id: 'c-del-2',
        nome: 'Para Apagar',
        documento: '11111111000191',
        email: 'x@y.co'
      }
    ]);

    render(
      <MemoryRouter>
        <MeiCatalogoClientes />
      </MemoryRouter>
    );

    expect((await screen.findAllByText('Para Apagar')).length).toBeGreaterThanOrEqual(1);
    fireEvent.click(
      screen.getAllByRole('button', { name: /Excluir cliente Para Apagar do catálogo/i })[0]!
    );

    const confirmDlg = await screen.findByTestId('mei-delete-cliente-confirm');
    expect(within(confirmDlg).getByText(/Notas fiscais já emitidas não são anuladas/i)).toBeTruthy();

    fireEvent.click(within(confirmDlg).getByRole('button', { name: /^Excluir do catálogo$/ }));

    await waitFor(() => expect(eliminarMock).toHaveBeenCalledWith('c-del-2'));
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('Cliente removido do catálogo.'));
    await waitFor(() => expect(listarMock.mock.calls.length).toBeGreaterThanOrEqual(2));
  });

  it('exclusão: erro de API mostra mensagem e toast.error', async () => {
    eliminarMock.mockRejectedValueOnce(new Error('Registo não encontrado'));
    listarMock.mockResolvedValue([
      {
        id: 'c-404',
        nome: 'Fantasma',
        documento: '12345678000199',
        email: null
      }
    ]);

    render(
      <MemoryRouter>
        <MeiCatalogoClientes />
      </MemoryRouter>
    );

    expect((await screen.findAllByText('Fantasma')).length).toBeGreaterThanOrEqual(1);
    fireEvent.click(
      screen.getAllByRole('button', { name: /Excluir cliente Fantasma do catálogo/i })[0]!
    );
    const confirmDlg = await screen.findByTestId('mei-delete-cliente-confirm');
    fireEvent.click(within(confirmDlg).getByRole('button', { name: /^Excluir do catálogo$/ }));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalled();
      const msg = String(toastError.mock.calls[0]?.[0] ?? '');
      expect(msg).toMatch(/Registo não encontrado|Não foi possível|concluir/i);
    });
    await waitFor(() => {
      const alerts = within(confirmDlg).getAllByRole('alert');
      const text = alerts.map((a) => a.textContent ?? '').join('\n');
      expect(text).toMatch(/Registo não encontrado|Não foi possível|concluir/i);
    });
  });

  it('exclusão: zona perigosa no modal edição abre o mesmo diálogo e confirma DELETE (mitigação QA)', async () => {
    listarMock.mockResolvedValue([
      {
        id: 'c-modal-del',
        nome: 'Editar E Apagar',
        documento: '12345678000199',
        email: 'e@a.co'
      }
    ]);

    render(
      <MemoryRouter>
        <MeiCatalogoClientes />
      </MemoryRouter>
    );

    expect((await screen.findAllByText('Editar E Apagar')).length).toBeGreaterThanOrEqual(1);
    fireEvent.click(screen.getAllByRole('button', { name: /^Editar$/i })[0]!);

    const editDialog = (
      await screen.findAllByRole('dialog')
    ).find((d) => within(d).queryByRole('heading', { name: /Editar cliente/i }));
    expect(editDialog).toBeTruthy();

    fireEvent.click(
      within(editDialog!).getByRole('button', { name: /Excluir do catálogo/i })
    );

    const confirmDlg = await screen.findByTestId('mei-delete-cliente-confirm');
    expect(within(confirmDlg).getByText(/Cliente: Editar E Apagar/i)).toBeTruthy();

    fireEvent.click(within(confirmDlg).getByRole('button', { name: /^Excluir do catálogo$/ }));

    await waitFor(() => expect(eliminarMock).toHaveBeenCalledWith('c-modal-del'));
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('Cliente removido do catálogo.'));
    await waitFor(() => expect(screen.queryByTestId('mei-delete-cliente-confirm')).toBeNull());
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /Editar cliente/i })).toBeNull();
    });
    await waitFor(() => expect(listarMock.mock.calls.length).toBeGreaterThanOrEqual(2));
  });

  it('exclusão: Esc no diálogo cancela sem chamar API', async () => {
    listarMock.mockResolvedValue([
      {
        id: 'c-esc',
        nome: 'Cliente Esc',
        documento: '12345678000199',
        email: null
      }
    ]);

    render(
      <MemoryRouter>
        <MeiCatalogoClientes />
      </MemoryRouter>
    );

    expect((await screen.findAllByText('Cliente Esc')).length).toBeGreaterThanOrEqual(1);
    fireEvent.click(
      screen.getAllByRole('button', { name: /Excluir cliente Cliente Esc do catálogo/i })[0]!
    );

    const dlg = await screen.findByTestId('mei-delete-cliente-confirm');
    fireEvent.keyDown(dlg, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByTestId('mei-delete-cliente-confirm')).toBeNull();
    });
    expect(eliminarMock).not.toHaveBeenCalled();
  });
});
