import { requireUser } from '@/lib/auth/session';
import { loadOrcamentosData } from '@/lib/data/orcamentos';
import { nowInAppTimeZone, parseMonthParam } from '@/lib/date';
import { pad2 } from '@/lib/finance/normalize';
import { OrcamentosView } from '@/components/orcamentos/OrcamentosView';

export const metadata = { title: 'Orçamentos' };
export const dynamic = 'force-dynamic';

export default async function OrcamentosPage({ searchParams }) {
  const params = await searchParams;
  const session = await requireUser();

  const now = nowInAppTimeZone();
  const currentMonth = { year: now.year, month: now.month };
  const initialMonth = parseMonthParam(typeof params?.mes === 'string' ? params.mes : '', currentMonth);

  const data = await loadOrcamentosData(session.supabase, session.userId);

  return (
    <OrcamentosView
      data={data}
      userId={session.userId}
      initialMonth={initialMonth}
      currentMonth={currentMonth}
      todayKey={`${now.year}-${pad2(now.month)}-${pad2(now.day)}`}
    />
  );
}
