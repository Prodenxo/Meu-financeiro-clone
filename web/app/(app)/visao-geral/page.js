import { requireUser } from '@/lib/auth/session';
import { loadDashboardData } from '@/lib/data/dashboard';
import { greetingForHour, nowInAppTimeZone, parseMonthParam, toMonthParam } from '@/lib/date';
import { firstName } from '@/lib/auth/roles';
import { getLegacyAppUrl } from '@/lib/nav';
import { pad2 } from '@/lib/finance/normalize';
import { DashboardView } from '@/components/dashboard/DashboardView';

export const metadata = { title: 'Visão geral' };
export const dynamic = 'force-dynamic';

export default async function VisaoGeralPage({ searchParams }) {
  const params = await searchParams;
  const session = await requireUser();

  const now = nowInAppTimeZone();
  const currentMonth = { year: now.year, month: now.month };
  const selectedMonth = parseMonthParam(typeof params?.mes === 'string' ? params.mes : '', currentMonth);

  const data = await loadDashboardData(session.supabase, session.userId, selectedMonth);

  return (
    <DashboardView
      key={toMonthParam(selectedMonth)}
      data={data}
      selectedMonth={selectedMonth}
      currentMonth={currentMonth}
      todayKey={`${now.year}-${pad2(now.month)}-${pad2(now.day)}`}
      greeting={greetingForHour(now.hour)}
      userFirstName={firstName(session.displayName)}
      role={session.role}
      legacyAppUrl={getLegacyAppUrl()}
    />
  );
}
