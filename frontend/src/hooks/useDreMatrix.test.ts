// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDreMatrix } from './useDreMatrix';

const fetchCategories = vi.fn();
const fetchCategoryBudgetsDreMatrix = vi.fn();

vi.mock('../services/categoryService', () => ({
  fetchCategories: (...args: unknown[]) => fetchCategories(...args),
  fetchCategoryBudgetsDreMatrix: (...args: unknown[]) =>
    fetchCategoryBudgetsDreMatrix(...args)
}));

describe('useDreMatrix — regressão fetch (QA: um pedido por ano, sem N por mês)', () => {
  beforeEach(() => {
    fetchCategories.mockResolvedValue([]);
    fetchCategoryBudgetsDreMatrix.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('com o mesmo userId e ano, carrega matriz uma vez (Promise.all categorias + dre-matrix)', async () => {
    const { rerender } = renderHook(
      ({ userId, year }: { userId: string; year: number }) => useDreMatrix(userId, year),
      { initialProps: { userId: 'user-1', year: 2026 } }
    );

    await waitFor(() => {
      expect(fetchCategoryBudgetsDreMatrix).toHaveBeenCalledTimes(1);
    });
    expect(fetchCategoryBudgetsDreMatrix).toHaveBeenCalledWith('user-1', 2026);
    expect(fetchCategories).toHaveBeenCalledTimes(1);
    expect(fetchCategories).toHaveBeenCalledWith('user-1');

    rerender({ userId: 'user-1', year: 2026 });
    await waitFor(() => {
      expect(fetchCategoryBudgetsDreMatrix).toHaveBeenCalledTimes(1);
    });
  });

  it('novo ano dispara novo fetch', async () => {
    const { rerender } = renderHook(
      ({ year }: { year: number }) => useDreMatrix('user-1', year),
      { initialProps: { year: 2025 } }
    );

    await waitFor(() => {
      expect(fetchCategoryBudgetsDreMatrix).toHaveBeenCalledWith('user-1', 2025);
    });

    rerender({ year: 2026 });
    await waitFor(() => {
      expect(fetchCategoryBudgetsDreMatrix).toHaveBeenCalledTimes(2);
    });
    expect(fetchCategoryBudgetsDreMatrix).toHaveBeenLastCalledWith('user-1', 2026);
  });

  it('incrementar dataRevision dispara novo fetch com o mesmo userId e ano (paridade DRE pós-mutação)', async () => {
    const { rerender } = renderHook(
      ({ rev }: { rev: number }) => useDreMatrix('user-1', 2026, rev),
      { initialProps: { rev: 0 } }
    );

    await waitFor(() => {
      expect(fetchCategoryBudgetsDreMatrix).toHaveBeenCalledTimes(1);
    });

    rerender({ rev: 1 });
    await waitFor(() => {
      expect(fetchCategoryBudgetsDreMatrix).toHaveBeenCalledTimes(2);
    });
    expect(fetchCategoryBudgetsDreMatrix).toHaveBeenLastCalledWith('user-1', 2026);
  });
});
