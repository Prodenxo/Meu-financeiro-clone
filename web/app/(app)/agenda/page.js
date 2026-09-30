import { requireUser } from '@/lib/auth/session';
import { loadAgendaData } from '@/lib/data/agenda';
import { nowInAppTimeZone } from '@/lib/date';
import { pad2 } from '@/lib/finance/normalize';
import { isDayKey, monthOfKey } from '@/lib/finance/agenda';
import { AgendaView } from '@/components/agenda/AgendaView';

export const metadata = { title: 'Agenda' };
export const dynamic = 'force-dynamic';

const VIEWS = new Set(['month', 'week', 'day']);

export default async function AgendaPage({ searchParams }) {
  const params = await searchParams;
  const session = await requireUser();

  const now = nowInAppTimeZone();
  const todayKey = `${now.year}-${pad2(now.month)}-${pad2(now.day)}`;
  const diaParam = typeof params?.dia === 'string' ? params.dia : '';
  const initialDay = isDayKey(diaParam) ? diaParam : todayKey;
  const initialView = VIEWS.has(params?.vista) ? params.vista : 'month';
  const oauthStatus = params?.googleCalendar === 'connected' || params?.googleCalendar === 'error' ? params.googleCalendar : null;

  const data = await loadAgendaData(session.supabase, session.userId, monthOfKey(initialDay));

  return (
    <AgendaView
      data={data}
      userEmail={session.user.email || ''}
      todayKey={todayKey}
      initialDay={initialDay}
      initialView={initialView}
      oauthStatus={oauthStatus}
    />
  );
}
