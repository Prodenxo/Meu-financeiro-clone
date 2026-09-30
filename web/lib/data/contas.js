import 'server-only';
import { fetchContas, fetchTransactions } from '@/lib/data/dashboard';

/** Dados da tela Contas: mesmas consultas do app atual (`contaFinanceiraStore` + lançamentos). */
export async function loadContasData(supabase, userId) {
  const [transactions, contas] = await Promise.all([fetchTransactions(supabase, userId), fetchContas(supabase, userId)]);
  return { transactions, contas };
}
