import 'server-only';
import { fetchCategories, fetchTransactions } from '@/lib/data/dashboard';
import { normalizeBudgetRow } from '@/lib/finance/orcamentos';

/**
 * Todas as linhas de `orçamentos` visíveis ao usuário (próprias + globais), como a
 * consulta do `fetchCategoryBudgetsSummary` do Expo, mas para todos os meses de uma vez —
 * a troca de mês na tela fica instantânea. Somente leitura.
 */
export async function fetchBudgetRows(supabase, userId) {
  const { data, error } = await supabase
    .from('orçamentos')
    .select('id, categorias_id, valor_orçado, user_id, date')
    .or(`user_id.eq.${userId},user_id.is.null`)
    .not('date', 'is', null);
  if (error) throw new Error(`Não foi possível carregar os orçamentos: ${error.message}`);
  return (data || []).map(normalizeBudgetRow);
}

export async function loadOrcamentosData(supabase, userId) {
  const [transactions, categories, budgetRows] = await Promise.all([
    fetchTransactions(supabase, userId),
    fetchCategories(supabase, userId),
    fetchBudgetRows(supabase, userId),
  ]);
  return { transactions, categories, budgetRows };
}
