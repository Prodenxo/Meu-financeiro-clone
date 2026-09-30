import 'server-only';
import { loadTransactionsData } from '@/lib/data/transactions';
import { checkGoogleAuth, listGoogleEvents } from '@/lib/data/googleCalendar';
import { monthTimeRange } from '@/lib/finance/agenda';
import { toMonthParam } from '@/lib/date';

/**
 * Eventos Google de um mês. Nunca lança: erro vira `error` para a tela mostrar
 * "Tentar novamente", como no app atual.
 */
export async function fetchGoogleMonth(supabase, month) {
  try {
    const events = await listGoogleEvents(supabase, monthTimeRange(month));
    return { mes: toMonthParam(month), events, error: null };
  } catch (error) {
    return { mes: toMonthParam(month), events: [], error: error.message || 'Erro ao carregar eventos do Google Agenda' };
  }
}

/**
 * Dados da tela Agenda: lançamentos/categorias/contas (mesmo loader de Transações) +
 * estado da ligação Google e eventos do mês inicial.
 */
export async function loadAgendaData(supabase, userId, month) {
  const [base, connected] = await Promise.all([loadTransactionsData(supabase, userId), checkGoogleAuth(supabase)]);
  const google = connected ? await fetchGoogleMonth(supabase, month) : { mes: toMonthParam(month), events: [], error: null };
  return { ...base, google: { connected, ...google } };
}
