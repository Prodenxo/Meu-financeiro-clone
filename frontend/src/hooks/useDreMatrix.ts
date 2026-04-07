import { useCallback, useEffect, useState } from 'react';
import {
  fetchCategories,
  fetchCategoryBudgetsDreMatrix,
  type Category,
  type DreMatrixCell
} from '../services/categoryService';

export interface UseDreMatrixResult {
  categories: Category[];
  cells: DreMatrixCell[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * @param dataRevision Incrementar após mutações de orçamento (ex.: remover planejamento, gravar mês)
 * para refetch da matriz DRE sem mudar ano — evita células obsoletas ao alternar separadores.
 */
export function useDreMatrix(
  userId: string | null,
  year: number,
  dataRevision = 0
): UseDreMatrixResult {
  const [categories, setCategories] = useState<Category[]>([]);
  const [cells, setCells] = useState<DreMatrixCell[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const [cats, matrix] = await Promise.all([
        fetchCategories(userId),
        fetchCategoryBudgetsDreMatrix(userId, year)
      ]);
      setCategories(cats);
      setCells(matrix);
    } catch (err: unknown) {
      console.error('Erro ao carregar DRE:', err);
      setError(
        err instanceof Error && err.message
          ? err.message
          : 'Não foi possível carregar a visão DRE. Verifique a ligação e tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  }, [userId, year]);

  useEffect(() => {
    void refetch();
  }, [refetch, dataRevision]);

  return { categories, cells, loading, error, refetch };
}
