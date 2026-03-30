// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within, cleanup } from '@testing-library/react';

const criarMock = vi.fn();
const atualizarMock = vi.fn();

vi.mock('../services/meiNotasService', () => ({
  criarCatalogoNfseProduto: (...args: unknown[]) => criarMock(...args),
  atualizarCatalogoNfseProduto: (...args: unknown[]) => atualizarMock(...args)
}));

import MeiCatalogoProdutoModal from './MeiCatalogoProdutoModal';

describe('MeiCatalogoProdutoModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    criarMock.mockReset();
    atualizarMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('validação: discriminação vazia não chama API', async () => {
    const onSaved = vi.fn();

    render(<MeiCatalogoProdutoModal open editing={null} onClose={vi.fn()} onSaved={onSaved} />);

    const dialog = screen.getAllByRole('dialog')[0]!;
    fireEvent.click(within(dialog).getByRole('button', { name: /^Guardar$/i }));

    expect(
      await within(dialog).findByText(/Informe a discriminação do serviço ou produto/i)
    ).toBeTruthy();
    expect(criarMock).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('criar com discriminação chama API e onSaved(\'create\')', async () => {
    criarMock.mockResolvedValue({ id: 'new-id', discriminacao: 'Serviço X' });
    const onSaved = vi.fn();

    render(<MeiCatalogoProdutoModal open editing={null} onClose={vi.fn()} onSaved={onSaved} />);

    const dialog = screen.getAllByRole('dialog')[0]!;
    fireEvent.change(within(dialog).getByLabelText(/^Discriminação/i), {
      target: { value: 'Serviço de teste' }
    });
    fireEvent.click(within(dialog).getByRole('button', { name: /^Guardar$/i }));

    await waitFor(() => {
      expect(criarMock).toHaveBeenCalledWith(
        expect.objectContaining({
          discriminacao: 'Serviço de teste',
          documentType: 'NFSE'
        })
      );
    });
    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledWith('create');
    });
  });

  it('erro de API exibe role=alert', async () => {
    criarMock.mockRejectedValue(new Error('Falha do servidor'));
    const onSaved = vi.fn();

    render(<MeiCatalogoProdutoModal open editing={null} onClose={vi.fn()} onSaved={onSaved} />);

    const dialog = screen.getAllByRole('dialog')[0]!;
    fireEvent.change(within(dialog).getByLabelText(/^Discriminação/i), {
      target: { value: 'Item' }
    });
    fireEvent.click(within(dialog).getByRole('button', { name: /^Guardar$/i }));

    const alert = await within(dialog).findByRole('alert');
    expect(alert.textContent).toContain('Falha do servidor');
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('edição chama PATCH com campos', async () => {
    atualizarMock.mockResolvedValue({ id: 'p1', discriminacao: 'Novo' });
    const onSaved = vi.fn();
    const editing = {
      id: 'p1',
      discriminacao: 'Antigo',
      codigo: 'C1',
      cnae: '6201500',
      aliquota: 5,
      valor_sugerido: 100
    };

    render(
      <MeiCatalogoProdutoModal open editing={editing} onClose={vi.fn()} onSaved={onSaved} />
    );

    const dialog = screen.getAllByRole('dialog')[0]!;
    fireEvent.change(within(dialog).getByLabelText(/^Discriminação/i), {
      target: { value: 'Atualizado' }
    });
    fireEvent.click(within(dialog).getByRole('button', { name: /^Guardar$/i }));

    await waitFor(() => {
      expect(atualizarMock).toHaveBeenCalledWith(
        'p1',
        expect.objectContaining({
          discriminacao: 'Atualizado',
          codigo: 'C1',
          cnae: '6201500'
        })
      );
    });
    expect(onSaved).toHaveBeenCalledWith('edit');
  });

  it('validação: alíquota inválida não chama API', async () => {
    const onSaved = vi.fn();

    render(<MeiCatalogoProdutoModal open editing={null} onClose={vi.fn()} onSaved={onSaved} />);

    const dialog = screen.getAllByRole('dialog')[0]!;
    fireEvent.change(within(dialog).getByLabelText(/^Discriminação/i), {
      target: { value: 'Serviço válido' }
    });
    fireEvent.change(within(dialog).getByLabelText(/^Alíquota/i), {
      target: { value: 'não-numérico' }
    });
    fireEvent.click(within(dialog).getByRole('button', { name: /^Guardar$/i }));

    expect(
      await within(dialog).findByText(/Alíquota inválida/i)
    ).toBeTruthy();
    expect(criarMock).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('edição: limpar valor sugerido envia valor_sugerido null no PATCH', async () => {
    atualizarMock.mockResolvedValue({ id: 'p1', discriminacao: 'X' });
    const onSaved = vi.fn();
    const editing = {
      id: 'p1',
      discriminacao: 'Serviço',
      codigo: '',
      cnae: '',
      aliquota: null as number | null,
      valor_sugerido: 99.9
    };

    render(
      <MeiCatalogoProdutoModal open editing={editing} onClose={vi.fn()} onSaved={onSaved} />
    );

    const dialog = screen.getAllByRole('dialog')[0]!;
    const valorInput = within(dialog).getByLabelText(/^Valor sugerido/i);
    fireEvent.change(valorInput, { target: { value: '' } });
    fireEvent.click(within(dialog).getByRole('button', { name: /^Guardar$/i }));

    await waitFor(() => {
      expect(atualizarMock).toHaveBeenCalledWith(
        'p1',
        expect.objectContaining({
          discriminacao: 'Serviço',
          valor_sugerido: null
        })
      );
    });
    expect(onSaved).toHaveBeenCalledWith('edit');
  });
});
