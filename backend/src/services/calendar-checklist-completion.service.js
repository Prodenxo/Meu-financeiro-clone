import { createSupabaseClient } from '../config/supabase.js';
import { badRequest } from '../utils/errors.js';

const todayIsoSaoPaulo = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());

/**
 * Chave estável para marcar conclusão (Google event id ou sintético).
 * @param {object} event
 */
export const buildCalendarEventKey = (event) => {
  const id = String(event?.id || '').trim();
  if (id) return `id:${id}`;
  const title = String(event?.title || 'Compromisso').trim().toLowerCase();
  const time = event?.allDay || !event?.time ? 'allday' : String(event.time).slice(0, 5);
  const date = String(event?.date || '');
  const source = String(event?.source || 'unknown');
  return `syn:${date}|${source}|${time}|${title}`;
};

/**
 * @param {string} userId
 * @param {string} dateIso YYYY-MM-DD
 */
export const loadManualCompletionKeys = async (userId, dateIso) => {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return new Set();
  const admin = createSupabaseClient({ useServiceRole: true });
  const { data, error } = await admin
    .from('calendar_checklist_completions')
    .select('event_key')
    .eq('user_id', userId)
    .eq('event_date', dateIso);
  if (error) {
    console.warn('[calendar-checklist] load completions:', error.message);
    return new Set();
  }
  return new Set((data || []).map((r) => String(r.event_key)));
};

/**
 * @param {string} userId
 * @param {object} event
 * @param {string} dateIso
 */
export const markCalendarEventCompleted = async (userId, event, dateIso) => {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw badRequest('Conclusão manual indisponível (SUPABASE_SERVICE_ROLE_KEY).');
  }
  const eventKey = buildCalendarEventKey(event);
  const admin = createSupabaseClient({ useServiceRole: true });
  const { error } = await admin.from('calendar_checklist_completions').upsert(
    {
      user_id: userId,
      event_date: dateIso,
      event_id: event.id ? String(event.id) : null,
      event_key: eventKey,
      title: String(event.title || 'Compromisso').trim(),
      completed_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,event_date,event_key' },
  );
  if (error) throw badRequest(error.message);
  return { eventKey, title: event.title };
};

const normalizeTitle = (s) =>
  String(s || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');

/**
 * @param {object[]} events sorted
 * @param {Record<string, unknown>} payload
 */
export const resolveCalendarEventFromPayload = (events, payload = {}) => {
  const index = Number(payload.index ?? payload.indice ?? payload.numero ?? payload.item);
  if (Number.isFinite(index) && index >= 1 && index <= events.length) {
    return { event: events[index - 1], matchedBy: 'index', index };
  }

  const eventId = String(payload.eventId ?? payload.id ?? '').trim();
  if (eventId) {
    const found = events.find((e) => String(e.id || '') === eventId);
    if (found) return { event: found, matchedBy: 'eventId' };
  }

  const titleNeedle = normalizeTitle(payload.title ?? payload.titulo ?? payload.nome);
  const timeHint = String(payload.time ?? payload.hora ?? '').slice(0, 5);
  if (titleNeedle) {
    const candidates = events.filter((e) => normalizeTitle(e.title).includes(titleNeedle));
    if (timeHint) {
      const withTime = candidates.filter(
        (e) => String(e.time || '').slice(0, 5) === timeHint,
      );
      if (withTime.length === 1) return { event: withTime[0], matchedBy: 'title_time' };
    }
    if (candidates.length === 1) return { event: candidates[0], matchedBy: 'title' };
    if (candidates.length > 1) {
      return {
        ambiguous: true,
        candidates: candidates.map((e, i) => ({
          index: events.indexOf(e) + 1,
          title: e.title,
          time: e.time,
        })),
      };
    }
  }

  return { notFound: true };
};

export const resolveCompletionDateIso = (payload = {}) => {
  const raw = payload.date ?? payload.data;
  if (!raw || String(raw).toLowerCase() === 'hoje') {
    return todayIsoSaoPaulo();
  }
  return String(raw).trim();
};
