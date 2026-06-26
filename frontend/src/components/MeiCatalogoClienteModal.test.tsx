// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within, cleanup } from '@testing-library/react';

const criarMock = vi.fn();
const atualizarMock = vi.fn();
const createAdminMock = vi.fn();
const updateAdminMock = vi.fn();
const lookupCepMock = vi.fn();

vi.mock('../services/meiNotasService', () => ({
  criarCatalogoNfseCliente: (...args: unknown[]) => criarMock(...args),
  atualizarCatalogoNfseCliente: (...args: unknown[]) => atualizarMock(...args),
  lookupNfseEnderecoPorCep: (...args: unknown[]) => lookupCepMock(...args),
}));

vi.mock('../services/adminUserDataService', () => ({
  createAdminMeiCatalogoCliente: (...args: unknown[]) => createAdminMock(...args),
  updateAdminMeiCatalogoCliente: (...args: unknown[]) => updateAdminMock(...args)
}));

import MeiCatalogoClienteModal from './MeiCatalogoClienteModal';

describe('MeiCatalogoClienteModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    criarMock.mockReset();
    atualizarMock.mockReset();
    createAdminMock.mockReset();
    updateAdminMock.mockReset();
    lookupCepMock.mockReset();
    lookupCepMock.mockResolvedValue({
      cep: '21220290',
      logradouro: 'Rua Merces',
      bairro: 'Vila da Penha',
      codigoCidade: '3304557',
      descricaoCidade: 'Rio de Janeiro',
      estado: 'RJ',
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('fecho: aria-label e classe ui-modal-icon-dismiss (STORY-VIS-THEME-01)', () => {
    render(<MeiCatalogoClienteModal open editing={null} onClose={vi.fn()} onSaved={vi.fn()} />);
    const dialog = screen.getAllByRole('dialog')[0]!;
    const closeBtn = within(dialog).getByRole('button', { name: /^Fechar$/i });
    expect(closeBtn.getAttribute('aria-label')).toBe('Fechar');
    expect(closeBtn.className).toMatch(/ui-modal-icon-dismiss/);
  });

  it('validação: documento inválido não chama API e mostra mensagem', async () => {
    const onClose = vi.fn();
    const onSaved = vi.fn();

    render(
      <MeiCatalogoClienteModal open editing={null} onClose={onClose} onSaved={onSaved} />
    );

    const dialog = screen.getAllByRole('dialog')[0]!;
    fireEvent.change(within(dialog).getByLabelText(/Nome ou razão social/i), {
      target: { value: 'Empresa Teste' }
    });
    fireEvent.change(within(dialog).getByLabelText(/CPF ou CNPJ/i), {
      target: { value: '123' }
    });
    fireEvent.change(within(dialog).getByLabelText(/^CEP/i), {
      target: { value: '21220290' }
    });
    fireEvent.click(within(dialog).getByRole('button', { name: /^Guardar$/i }));

    expect(await within(dialog).findByText(/11 dígitos|14 dígitos/i)).toBeTruthy();
    expect(criarMock).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
  });

  const fillValidClienteForm = (dialog: HTMLElement) => {
    fireEvent.change(within(dialog).getByLabelText(/Nome ou razão social/i), {
      target: { value: 'Acme' }
    });
    fireEvent.change(within(dialog).getByLabelText(/CPF ou CNPJ/i), {
      target: { value: '12.345.678/0001-99' }
    });
    fireEvent.change(within(dialog).getByLabelText(/^CEP/i), {
      target: { value: '21220-290' }
    });
    fireEvent.blur(within(dialog).getByLabelText(/^CEP/i));
  };

  it('criar com dados válidos chama API com metadata_json.endereco e onSaved(\'create\')', async () => {
    criarMock.mockResolvedValue({
      id: 'new-id',
      nome: 'Acme',
      documento: '12345678000199'
    });
    const onClose = vi.fn();
    const onSaved = vi.fn();

    render(
      <MeiCatalogoClienteModal open editing={null} onClose={onClose} onSaved={onSaved} />
    );

    const dialog = screen.getAllByRole('dialog')[0]!;
    fillValidClienteForm(dialog);
    await waitFor(() => {
      expect(lookupCepMock).toHaveBeenCalledWith('21220290');
    });
    fireEvent.click(within(dialog).getByRole('button', { name: /^Guardar$/i }));

    await waitFor(() => {
      expect(criarMock).toHaveBeenCalledWith(
        expect.objectContaining({
          nome: 'Acme',
          documentType: 'NFSE',
          metadata_json: expect.objectContaining({
            endereco: expect.objectContaining({
              cep: '21220290',
              codigoCidade: '3304557',
            }),
          }),
        })
      );
    });
    const call = criarMock.mock.calls[0][0] as { documento: string };
    expect(call.documento.replace(/\D/g, '')).toBe('12345678000199');
    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledWith('create');
    });
  });

  it('criar CPF sem endereço não exige CEP e chama API', async () => {
    criarMock.mockResolvedValue({
      id: 'pf-id',
      nome: 'Maria',
      documento: '12345678901',
    });
    const onSaved = vi.fn();

    render(
      <MeiCatalogoClienteModal open editing={null} onClose={vi.fn()} onSaved={onSaved} />
    );

    const dialog = screen.getAllByRole('dialog')[0]!;
    fireEvent.change(within(dialog).getByLabelText(/Nome ou razão social/i), {
      target: { value: 'Maria Silva' },
    });
    fireEvent.change(within(dialog).getByLabelText(/CPF ou CNPJ/i), {
      target: { value: '123.456.789-01' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: /^Guardar$/i }));

    await waitFor(() => {
      expect(criarMock).toHaveBeenCalledWith(
        expect.objectContaining({
          nome: 'Maria Silva',
          documentType: 'NFSE',
        }),
      );
    });
    const call = criarMock.mock.calls[0][0] as { metadata_json?: unknown };
    expect(call.metadata_json).toBeUndefined();
    expect(onSaved).toHaveBeenCalledWith('create');
  });

  it('erro de API exibe role=alert', async () => {
    criarMock.mockRejectedValue(new Error('Falha do servidor'));
    const onSaved = vi.fn();

    render(
      <MeiCatalogoClienteModal open editing={null} onClose={vi.fn()} onSaved={onSaved} />
    );

    const dialog = screen.getAllByRole('dialog')[0]!;
    fillValidClienteForm(dialog);
    await waitFor(() => {
      expect(lookupCepMock).toHaveBeenCalled();
    });
    fireEvent.click(within(dialog).getByRole('button', { name: /^Guardar$/i }));

    await waitFor(() => {
      const alerts = within(dialog).getAllByRole('alert');
      const text = alerts.map((a) => a.textContent ?? '').join('\n');
      expect(text).toMatch(/Falha do servidor|Não foi possível concluir o pedido|Algo inesperado/i);
    });
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('com catalogAdminUserId cria via API admin (não mei-notas)', async () => {
    createAdminMock.mockResolvedValue({
      id: 'new-id',
      nome: 'Acme',
      documento: '12345678000199'
    });
    const onSaved = vi.fn();

    render(
      <MeiCatalogoClienteModal
        open
        editing={null}
        onClose={vi.fn()}
        onSaved={onSaved}
        catalogAdminUserId="target-user-1"
      />
    );

    const dialog = screen.getAllByRole('dialog')[0]!;
    fillValidClienteForm(dialog);
    await waitFor(() => {
      expect(lookupCepMock).toHaveBeenCalled();
    });
    fireEvent.click(within(dialog).getByRole('button', { name: /^Guardar$/i }));

    await waitFor(() => {
      expect(createAdminMock).toHaveBeenCalledWith(
        'target-user-1',
        expect.objectContaining({
          nome: 'Acme',
          documentType: 'NFSE',
          metadata_json: expect.objectContaining({
            endereco: expect.objectContaining({ codigoCidade: '3304557' }),
          }),
        })
      );
    });
    expect(criarMock).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledWith('create');
    });
  });

  it('edição chama PATCH com nome, email e metadata_json.endereco', async () => {
    atualizarMock.mockResolvedValue({ id: 'u1', nome: 'Novo Nome' });
    const onSaved = vi.fn();
    const editing = {
      id: 'u1',
      nome: 'Antigo',
      documento: '12345678000199',
      email: 'a@b.co',
      metadata_json: {
        endereco: {
          cep: '21220290',
          logradouro: 'Rua Merces',
          numero: '10',
          bairro: 'Vila da Penha',
          codigoCidade: '3304557',
          descricaoCidade: 'Rio de Janeiro',
          estado: 'RJ',
        },
      },
    };

    render(
      <MeiCatalogoClienteModal
        open
        editing={editing}
        onClose={vi.fn()}
        onSaved={onSaved}
      />
    );

    const dialog = screen.getAllByRole('dialog')[0]!;
    fireEvent.change(within(dialog).getByLabelText(/Nome ou razão social/i), {
      target: { value: 'Novo Nome' }
    });
    fireEvent.click(within(dialog).getByRole('button', { name: /^Guardar$/i }));

    await waitFor(() => {
      expect(atualizarMock).toHaveBeenCalledWith('u1', {
        nome: 'Novo Nome',
        email: 'a@b.co',
        metadata_json: expect.objectContaining({
          endereco: expect.objectContaining({ codigoCidade: '3304557' }),
        }),
      });
    });
    expect(onSaved).toHaveBeenCalledWith('edit');
  });

  it('fluxo novo cliente não mostra zona perigosa de exclusão', () => {
    render(
      <MeiCatalogoClienteModal open editing={null} onClose={vi.fn()} onSaved={vi.fn()} />
    );
    const dialog = screen.getAllByRole('dialog')[0]!;
    expect(within(dialog).queryByText(/Eliminar do catálogo/i)).toBeNull();
  });

  it('edição com onRequestDelete: zona perigosa chama callback', () => {
    const onRequestDelete = vi.fn();
    const editing = {
      id: 'u1',
      nome: 'Loja',
      documento: '12345678000199',
      email: null as string | null
    };

    render(
      <MeiCatalogoClienteModal
        open
        editing={editing}
        onClose={vi.fn()}
        onSaved={vi.fn()}
        onRequestDelete={onRequestDelete}
      />
    );

    const dialog = screen.getAllByRole('dialog')[0]!;
    fireEvent.click(within(dialog).getByRole('button', { name: /Excluir do catálogo/i }));
    expect(onRequestDelete).toHaveBeenCalledTimes(1);
  });
});
