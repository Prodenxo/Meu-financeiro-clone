import 'server-only';
import { fetchCategories, fetchTransactions } from '@/lib/data/dashboard';

/**
 * Dados da tela Categorias: categorias do usuário (API garante a cópia das globais)
 * e todos os lançamentos — o mês e o tipo em exibição são calculados no cliente.
 */
export async function loadCategoriasData(supabase, userId) {
  const [transactions, categories] = await Promise.all([fetchTransactions(supabase, userId), fetchCategories(supabase, userId)]);
  return { transactions, categories: categories.list.map((c) => ({ ...c, user_id: userId })) };
}
