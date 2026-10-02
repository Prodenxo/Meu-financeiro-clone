import { requireUser } from '@/lib/auth/session';
import { loadDashboardData } from '@/lib/data/dashboard';
import { loadBpoMatrix } from '@/lib/data/bpo';
import { greetingForHour, nowInAppTimeZone, parseMonthParam, toMonthParam } from '@/lib/date';
import { firstName } from '@/lib/auth/roles';
import { pad2 } from '@/lib/finance/normalize';
import { parseBpoYear } from '@/lib/finance/bpo';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { BpoView } from '@/components/dashboard/BpoView';

export const metadata = { title: 'Visão geral' };
export const dynamic = 'force-dynamic';

export default async function VisaoGeralPage({ searchParams }) {
  const params = await searchParams;
  const session = await requireUser();

  const now = nowInAppTimeZone();
  const currentMonth = { year: now.year, month: now.month };
  const selectedMonth = parseMonthParam(typeof params?.mes === 'string' ? params.mes : '', currentMonth);

  if (params?.vista === 'bpo') {
    const year = parseBpoYear(params.ano, now.year);
    let categories = [];
    let cells = [];
    let error = null;
    try {
      const matrix = await loadBpoMatrix(session.supabase, session.userId, year);
      categories = matrix.categories;
      cells = matrix.cells;
    } catch (err) {
      console.error('Error in visao-geral/bpo:', err);
      error = 'Não foi possível carregar o planejamento deste ano.';
    }
    return (
      <BpoView
        key={year}
        year={year}
        currentYear={now.year}
        currentMonth={currentMonth}
        categories={categories}
        cells={cells}
        error={error}
      />
    );
  }

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
    />
  );
}
