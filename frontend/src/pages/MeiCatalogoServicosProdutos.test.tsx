// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const listarMock = vi.fn();
const criarMock = vi.fn();
const eliminarMock = vi.fn();

vi.mock('../services/meiNotasService', () => ({
  listarCatalogoNfseProdutos: (...args: unknown[]) => listarMock(...args),
  criarCatalogoNfseProduto: (...args: unknown[]) => criarMock(...args),
  atualizarCatalogoNfseProduto: vi.fn(),
  eliminarCatalogoNfseProduto: (...args: unknown[]) => eliminarMock(...args),
  listarCodigosServicosReferencia: vi.fn().mockResolvedValue([])
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

import MeiCatalogoServicosProdutos from './MeiCatalogoServicosProdutos';

describe('MeiCatalogoServicosProdutos', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    eliminarMock.mockResolvedValue(undefined);
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
      expect.objectContaining({ limit: 50 })
    );
    expect((listarMock.mock.calls[0][0] as { documentType?: string }).documentType).toBeUndefined();
  });

  it('filtro NF-e envia documentType na listagem', async () => {
    render(
      <MemoryRouter>
        <MeiCatalogoServicosProdutos />
      </MemoryRouter>
    );

    await waitFor(() => expect(listarMock).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('radio', { name: 'NF-e' }));

    await waitFor(() =>
      expect(listarMock).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 50, documentType: 'NFE' })
      )
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

  it('exclusão: abre confirmação, Cancelar não chama API', async () => {
    listarMock.mockResolvedValue([
      {
        id: 'p-del-1',
        discriminacao: 'Item a excluir',
        codigo: 'X1',
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

    expect((await screen.findAllByText(/Item a excluir/i)).length).toBeGreaterThan(0);
    const excluir = screen.getAllByRole('button', {
      name: /Excluir item Item a excluir do catálogo/i
    })[0]!;
    fireEvent.click(excluir);

    const confirmDlg = await screen.findByTestId('mei-delete-produto-confirm');
    expect(within(confirmDlg).getByRole('heading', { name: /Excluir item do catálogo/i })).toBeTruthy();
    fireEvent.click(within(confirmDlg).getByRole('button', { name: /^Cancelar$/i }));

    await waitFor(() => {
      expect(screen.queryByTestId('mei-delete-produto-confirm')).toBeNull();
    });
    expect(eliminarMock).not.toHaveBeenCalled();
  });

  it('exclusão: confirmar chama DELETE, toast e re-lista', async () => {
    listarMock.mockResolvedValue([
      {
        id: 'p-del-2',
        discriminacao: 'Para apagar serviço',
        codigo: 'Z9',
        cnae: '6201500',
        aliquota: 2,
        valor_sugerido: 10
      }
    ]);

    render(
      <MemoryRouter>
        <MeiCatalogoServicosProdutos />
      </MemoryRouter>
    );

    expect((await screen.findAllByText(/Para apagar serviço/i)).length).toBeGreaterThan(0);
    fireEvent.click(
      screen.getAllByRole('button', { name: /Excluir item Para apagar serviço do catálogo/i })[0]!
    );

    const confirmDlg = await screen.findByTestId('mei-delete-produto-confirm');
    expect(within(confirmDlg).getByText(/Notas fiscais já emitidas não são anuladas/i)).toBeTruthy();
    expect(within(confirmDlg).getByText(/Código: Z9/i)).toBeTruthy();

    fireEvent.click(within(confirmDlg).getByRole('button', { name: /^Excluir do catálogo$/ }));

    await waitFor(() => expect(eliminarMock).toHaveBeenCalledWith('p-del-2'));
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('Item removido do catálogo.'));
    await waitFor(() => expect(listarMock.mock.calls.length).toBeGreaterThanOrEqual(2));
  });

  it('exclusão: UX §12.2 — diálogo com heading ligado por aria-labelledby e botões rotulados (mitigação QA)', async () => {
    listarMock.mockResolvedValue([
      {
        id: 'p-a11y',
        discriminacao: 'Item A11y',
        codigo: 'A1',
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

    expect((await screen.findAllByText(/Item A11y/i)).length).toBeGreaterThan(0);
    fireEvent.click(
      screen.getAllByRole('button', { name: /Excluir item Item A11y do catálogo/i })[0]!
    );

    const confirmDlg = await screen.findByTestId('mei-delete-produto-confirm');
    expect(confirmDlg.getAttribute('aria-modal')).toBe('true');
    expect(confirmDlg.getAttribute('aria-labelledby')).toBe('mei-del-prod-title');
    const title = within(confirmDlg).getByRole('heading', { name: /Excluir item do catálogo/i });
    expect(title.getAttribute('id')).toBe('mei-del-prod-title');
    expect(within(confirmDlg).getByRole('button', { name: /^Excluir do catálogo$/ })).toBeTruthy();
    expect(within(confirmDlg).getByRole('button', { name: /^Cancelar$/ })).toBeTruthy();
  });

  it('exclusão: UX §12.3 — dois cliques rápidos em confirmar chamam DELETE uma vez (mitigação QA)', async () => {
    let resolveDel: (() => void) | undefined;
    const delPromise = new Promise<void>((r) => {
      resolveDel = r;
    });
    eliminarMock.mockImplementation(() => delPromise);

    listarMock.mockResolvedValue([
      {
        id: 'p-dbl',
        discriminacao: 'Duplo clique',
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

    expect((await screen.findAllByText(/Duplo clique/i)).length).toBeGreaterThan(0);
    fireEvent.click(
      screen.getAllByRole('button', { name: /Excluir item Duplo clique do catálogo/i })[0]!
    );

    const confirmDlg = await screen.findByTestId('mei-delete-produto-confirm');
    const btn = within(confirmDlg).getByRole('button', { name: /^Excluir do catálogo$/ });
    fireEvent.click(btn);
    fireEvent.click(btn);

    expect(eliminarMock).toHaveBeenCalledTimes(1);
    resolveDel?.();
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('Item removido do catálogo.'));
  });

  it('exclusão: erro de API mostra mensagem e toast.error', async () => {
    eliminarMock.mockRejectedValueOnce(new Error('Registo não encontrado'));
    listarMock.mockResolvedValue([
      {
        id: 'p-404',
        discriminacao: 'Fantasma',
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

    expect((await screen.findAllByText(/Fantasma/i)).length).toBeGreaterThan(0);
    fireEvent.click(
      screen.getAllByRole('button', { name: /Excluir item Fantasma do catálogo/i })[0]!
    );
    const confirmDlg = await screen.findByTestId('mei-delete-produto-confirm');
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

  it('exclusão: zona perigosa no modal edição abre o mesmo diálogo e confirma DELETE', async () => {
    listarMock.mockResolvedValue([
      {
        id: 'p-modal-del',
        discriminacao: 'Editar e apagar item',
        codigo: 'M1',
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

    expect((await screen.findAllByText(/Editar e apagar item/i)).length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByRole('button', { name: /^Editar$/i })[0]!);

    const editDialog = (
      await screen.findAllByRole('dialog')
    ).find((d) => within(d).queryByRole('heading', { name: /Editar serviço ou produto/i }));
    expect(editDialog).toBeTruthy();

    fireEvent.click(
      within(editDialog!).getByRole('button', { name: /Excluir do catálogo/i })
    );

    const confirmDlg = await screen.findByTestId('mei-delete-produto-confirm');
    expect(within(confirmDlg).getByText(/Código: M1/i)).toBeTruthy();

    fireEvent.click(within(confirmDlg).getByRole('button', { name: /^Excluir do catálogo$/ }));

    await waitFor(() => expect(eliminarMock).toHaveBeenCalledWith('p-modal-del'));
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('Item removido do catálogo.'));
    await waitFor(() => expect(screen.queryByTestId('mei-delete-produto-confirm')).toBeNull());
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /Editar serviço ou produto/i })).toBeNull();
    });
    await waitFor(() => expect(listarMock.mock.calls.length).toBeGreaterThanOrEqual(2));
  });

  it('exclusão: Esc no diálogo cancela sem chamar API', async () => {
    listarMock.mockResolvedValue([
      {
        id: 'p-esc',
        discriminacao: 'Item Esc',
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

    expect((await screen.findAllByText(/Item Esc/i)).length).toBeGreaterThan(0);
    fireEvent.click(
      screen.getAllByRole('button', { name: /Excluir item Item Esc do catálogo/i })[0]!
    );

    const dlg = await screen.findByTestId('mei-delete-produto-confirm');
    fireEvent.keyDown(dlg, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByTestId('mei-delete-produto-confirm')).toBeNull();
    });
    expect(eliminarMock).not.toHaveBeenCalled();
  });
});
