import { requireUser } from '@/lib/auth/session';
import { loadTransactionsData } from '@/lib/data/transactions';
import { nowInAppTimeZone, parseMonthParam } from '@/lib/date';
import { pad2 } from '@/lib/finance/normalize';
import { TransactionsView } from '@/components/transactions/TransactionsView';

export const metadata = { title: 'Transações' };
export const dynamic = 'force-dynamic';

export default async function TransacoesPage({ searchParams }) {
  const params = await searchParams;
  const session = await requireUser();

  const now = nowInAppTimeZone();
  const currentMonth = { year: now.year, month: now.month };
  const initialMonth = parseMonthParam(typeof params?.mes === 'string' ? params.mes : '', currentMonth);

  const data = await loadTransactionsData(session.supabase, session.userId);

  // `?conta=<id>` (vindo da tela Contas) pré-seleciona o filtro de conta, se ela for do usuário.
  const contaParam = typeof params?.conta === 'string' ? params.conta : '';
  const initialContaFilter = data.contas.some((c) => c.id === contaParam) ? contaParam : 'all';

  return (
    <TransactionsView
      data={data}
      initialMonth={initialMonth}
      initialContaFilter={initialContaFilter}
      currentMonth={currentMonth}
      todayKey={`${now.year}-${pad2(now.month)}-${pad2(now.day)}`}
    />
  );
}
