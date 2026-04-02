// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

const { fetchAdminMock } = vi.hoisted(() => ({
  fetchAdminMock: vi.fn()
}));

vi.mock('../../services/adminUserDataService', () => ({
  fetchAdminMeiCatalogoClientes: (...args: unknown[]) => fetchAdminMock(...args)
}));

import { AdminMeiCatalogClienteCombobox } from './AdminMeiCatalogClienteCombobox';

const formatDocument = (digits: string) => {
  const d = digits.replace(/\D/g, '').slice(0, 14);
  return d;
};

describe('AdminMeiCatalogClienteCombobox', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    fetchAdminMock.mockResolvedValue([]);
  });

  it('não renderiza quando meiEnabled é false', () => {
    const onApply = vi.fn();
    const { container } = render(
      <AdminMeiCatalogClienteCombobox
        userId="user-1"
        meiEnabled={false}
        formatDocument={formatDocument}
        onApplyCliente={onApply}
      />
    );
    expect(container.firstChild).toBeNull();
    expect(onApply).not.toHaveBeenCalled();
  });

  it('monta e chama fetch com userId e limit 30 (sem q inicial)', async () => {
    render(
      <AdminMeiCatalogClienteCombobox
        userId="user-1"
        meiEnabled
        formatDocument={formatDocument}
        onApplyCliente={vi.fn()}
      />
    );

    await waitFor(() => expect(fetchAdminMock).toHaveBeenCalled());
    expect(fetchAdminMock).toHaveBeenCalledWith('user-1', { q: '', limit: 30 });
  });

  it('pesquisa envia q após debounce (~300 ms)', async () => {
    render(
      <AdminMeiCatalogClienteCombobox
        userId="user-1"
        meiEnabled
        formatDocument={formatDocument}
        onApplyCliente={vi.fn()}
      />
    );

    await waitFor(() => expect(fetchAdminMock).toHaveBeenCalled());
    const callsAfterLoad = fetchAdminMock.mock.calls.length;
    const combo = screen.getByRole('combobox');
    fireEvent.change(combo, { target: { value: 'acme' } });

    await waitFor(
      () => {
        expect(
          fetchAdminMock.mock.calls.some(
            (c) => (c[1] as { q?: string })?.q === 'acme'
          )
        ).toBe(true);
      },
      { timeout: 4000 }
    );
    expect(fetchAdminMock.mock.calls.length).toBeGreaterThanOrEqual(callsAfterLoad + 1);
  });

  it('erro de API exibe role=alert com mensagem canónica', async () => {
    fetchAdminMock.mockRejectedValue(new Error('network'));

    render(
      <AdminMeiCatalogClienteCombobox
        userId="user-1"
        meiEnabled
        formatDocument={formatDocument}
        onApplyCliente={vi.fn()}
      />
    );

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Não foi possível carregar o catálogo');
  });

  it('selecionar cliente chama onApplyCliente com documento, nome e e-mail', async () => {
    fetchAdminMock.mockResolvedValue([
      {
        id: 'c1',
        nome: 'ACME Ltda',
        documento: '12345678000199',
        email: 'tomador@exemplo.com'
      }
    ]);

    const onApply = vi.fn();
    render(
      <AdminMeiCatalogClienteCombobox
        userId="user-1"
        meiEnabled
        formatDocument={formatDocument}
        onApplyCliente={onApply}
      />
    );

    await waitFor(() => expect(fetchAdminMock).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: /Abrir lista de clientes/i }));

    const option = await screen.findByRole('option', { name: /ACME Ltda/ });
    fireEvent.mouseDown(option);

    await waitFor(() => expect(onApply).toHaveBeenCalledTimes(1));
    expect(onApply).toHaveBeenCalledWith({
      tomadorCpfCnpj: '12345678000199',
      tomadorRazaoSocial: 'ACME Ltda',
      tomadorEmail: 'tomador@exemplo.com'
    });
  });

  it('opção Preencher manualmente não chama onApplyCliente', async () => {
    fetchAdminMock.mockResolvedValue([
      {
        id: 'c1',
        nome: 'Só para lista',
        documento: '11111111000191',
        email: null
      }
    ]);

    const onApply = vi.fn();
    render(
      <AdminMeiCatalogClienteCombobox
        userId="user-1"
        meiEnabled
        formatDocument={formatDocument}
        onApplyCliente={onApply}
      />
    );

    await waitFor(() => expect(fetchAdminMock).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: /Abrir lista de clientes/i }));

    const manual = await screen.findByRole('option', { name: /Preencher manualmente/i });
    fireEvent.mouseDown(manual);

    await waitFor(() => {
      expect(screen.queryByRole('listbox')).toBeNull();
    });
    expect(onApply).not.toHaveBeenCalled();
  });

  it('catalogRefreshToken incrementado dispara novo fetch', async () => {
    const { rerender } = render(
      <AdminMeiCatalogClienteCombobox
        userId="user-1"
        meiEnabled
        formatDocument={formatDocument}
        onApplyCliente={vi.fn()}
        catalogRefreshToken={0}
      />
    );
    await waitFor(() => expect(fetchAdminMock).toHaveBeenCalled());
    const callsAfterMount = fetchAdminMock.mock.calls.length;

    rerender(
      <AdminMeiCatalogClienteCombobox
        userId="user-1"
        meiEnabled
        formatDocument={formatDocument}
        onApplyCliente={vi.fn()}
        catalogRefreshToken={1}
      />
    );
    await waitFor(() => expect(fetchAdminMock.mock.calls.length).toBeGreaterThan(callsAfterMount));
  });
});
