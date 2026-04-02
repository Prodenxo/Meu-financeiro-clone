// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';

const { fetchProdutosMock } = vi.hoisted(() => ({
  fetchProdutosMock: vi.fn()
}));

vi.mock('../../services/adminUserDataService', () => ({
  fetchAdminMeiCatalogoProdutos: (...args: unknown[]) => fetchProdutosMock(...args)
}));

import { AdminMeiCatalogProdutoCombobox } from './AdminMeiCatalogProdutoCombobox';

describe('AdminMeiCatalogProdutoCombobox', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    fetchProdutosMock.mockResolvedValue([]);
  });

  it('não renderiza quando meiEnabled é false', () => {
    const onApply = vi.fn();
    const { container } = render(
      <AdminMeiCatalogProdutoCombobox userId="user-1" meiEnabled={false} onApplyServico={onApply} />
    );
    expect(container.firstChild).toBeNull();
    expect(onApply).not.toHaveBeenCalled();
  });

  it('monta e chama fetch com userId, limit 30 e documentType NFSE', async () => {
    render(
      <AdminMeiCatalogProdutoCombobox userId="user-1" meiEnabled onApplyServico={vi.fn()} />
    );

    await waitFor(() => expect(fetchProdutosMock).toHaveBeenCalled());
    expect(fetchProdutosMock).toHaveBeenCalledWith('user-1', { q: '', limit: 30, documentType: 'NFSE' });
  });

  it('erro de API exibe role=alert com mensagem canónica', async () => {
    fetchProdutosMock.mockRejectedValue(new Error('network'));

    render(<AdminMeiCatalogProdutoCombobox userId="user-1" meiEnabled onApplyServico={vi.fn()} />);

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Não foi possível carregar o catálogo de serviços');
  });
});
