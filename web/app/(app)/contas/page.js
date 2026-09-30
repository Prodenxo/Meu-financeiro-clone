import { requireUser } from '@/lib/auth/session';
import { loadContasData } from '@/lib/data/contas';
import { nowInAppTimeZone } from '@/lib/date';
import { pad2 } from '@/lib/finance/normalize';
import { ContasView } from '@/components/contas/ContasView';

export const metadata = { title: 'Contas' };
export const dynamic = 'force-dynamic';

export default async function ContasPage() {
  const session = await requireUser();
  const now = nowInAppTimeZone();
  const data = await loadContasData(session.supabase, session.userId);

  return <ContasView data={data} todayKey={`${now.year}-${pad2(now.month)}-${pad2(now.day)}`} />;
}
