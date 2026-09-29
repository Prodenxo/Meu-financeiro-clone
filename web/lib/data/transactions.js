import 'server-only';
import { fetchCategories, fetchContas, fetchTransactions } from '@/lib/data/dashboard';
import { normalizeRecorrenciaRow } from '@/lib/finance/recorrencias';

/** Mesma query do `recorrenciaStore.fetchRecorrencias`. */
async function fetchRecorrencias(supabase, userId) {
  const { data, error } = await supabase
    .from('recorrencias')
    .select('*')
    .eq('user_id', userId)
    .order('dia_do_mes', { ascending: true });
  if (error) {
    console.warn('[recorrencias] falha:', error.message);
    return [];
  }
  return (data || []).map(normalizeRecorrenciaRow);
}

/** Mesma query do `recorrenciaStore.fetchSkips`. */
async function fetchSkips(supabase, userId) {
  const { data, error } = await supabase
    .from('recorrencia_skips')
    .select('recorrencia_id, ano_mes')
    .eq('user_id', userId);
  if (error) {
    console.warn('[recorrencia_skips] falha:', error.message);
    return [];
  }
  return (data || []).map((s) => ({ recorrencia_id: String(s.recorrencia_id), ano_mes: String(s.ano_mes) }));
}

export async function loadTransactionsData(supabase, userId) {
  const [transactions, contas, categories, recorrencias, skips] = await Promise.all([
    fetchTransactions(supabase, userId),
    fetchContas(supabase, userId),
    fetchCategories(supabase, userId),
    fetchRecorrencias(supabase, userId),
    fetchSkips(supabase, userId),
  ]);
  return { transactions, contas, categories, recorrencias, skips };
}
