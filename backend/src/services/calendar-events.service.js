import { createSupabaseClient } from '../config/supabase.js';
import { env } from '../config/env.js';
import { badRequest } from '../utils/errors.js';
import * as transactionsService from './transactions.service.js';
import { getCertificateValidity } from './mei-certificate-store.js';

const SAO_PAULO_TZ = 'America/Sao_Paulo';
const CERT_EXPIRATION_TITLE = 'Vencimento do certificado digital';

/**
 * Data de hoje no fuso America/Sao_Paulo (YYYY-MM-DD).
 * @returns {string}
 */
export const calendarDateTodayInSaoPaulo = () => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: SAO_PAULO_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
};

/**
 * Normaliza data de consulta do calendário.
 * Aceita `YYYY-MM-DD` ou `DD/MM/YYYY`.
 * @param {string} raw
 * @returns {{ iso: string, display: string } | null}
 */
export const parseCalendarQueryDate = (raw) => {
  const s = String(raw ?? '').trim();
  if (!s) return null;

  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    if (!isValidYmd(year, month, day)) return null;
    const iso = `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    return { iso, display: `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}` };
  }

  const brMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (brMatch) {
    const day = Number(brMatch[1]);
    const month = Number(brMatch[2]);
    const year = Number(brMatch[3]);
    if (!isValidYmd(year, month, day)) return null;
    const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return { iso, display: `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}` };
  }

  return null;
};

/**
 * @param {string} iso YYYY-MM-DD
 * @returns {string} DD/MM/YYYY
 */
export const formatCalendarDateDisplayPtBr = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || '').trim());
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
};

const isValidYmd = (year, month, day) => {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const d = new Date(Date.UTC(year, month - 1, day));
  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  );
};

const isoDatePart = (value) => {
  if (!value) return null;
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (!Number.isFinite(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
};

const transactionStatusLabel = (status) => {
  switch (status) {
    case 'recebido':
      return 'Recebido';
    case 'pago':
      return 'Pago';
    case 'a_receber':
      return 'A Receber';
    case 'a_pagar':
      return 'A Pagar';
    default:
      return status || 'Lançamento';
  }
};

/**
 * @param {string} dateIso YYYY-MM-DD
 * @returns {{ timeMin: string, timeMax: string }}
 */
export const dayBoundsIsoInSaoPaulo = (dateIso) => {
  return {
    timeMin: `${dateIso}T00:00:00-03:00`,
    timeMax: `${dateIso}T23:59:59.999-03:00`,
  };
};

/**
 * Verifica se um evento Google intersecta o dia civil em São Paulo.
 * @param {object} item
 * @param {string} dateIso
 */
export const googleEventOverlapsDate = (item, dateIso) => {
  const startRaw = item?.start?.dateTime || item?.start?.date;
  if (!startRaw) return false;
  const endRaw = item?.end?.dateTime || item?.end?.date || startRaw;

  const start = new Date(startRaw.includes('T') ? startRaw : `${startRaw}T00:00:00`);
  let end = new Date(endRaw.includes('T') ? endRaw : `${endRaw}T00:00:00`);

  const allDay = !!item?.start?.date && !item?.start?.dateTime;
  if (allDay && item?.end?.date) {
    end = new Date(`${item.end.date}T00:00:00`);
    end.setDate(end.getDate() - 1);
  }

  const { timeMin, timeMax } = dayBoundsIsoInSaoPaulo(dateIso);
  const dayStart = new Date(timeMin);
  const dayEnd = new Date(timeMax);
  return start <= dayEnd && end >= dayStart;
};

/**
 * Obtém access token Google Calendar (com refresh se necessário).
 * @param {string} userId
 * @returns {Promise<{ accessToken: string } | { error: string, notLinked?: boolean }>}
 */
export const getGoogleCalendarAccessTokenForUser = async (userId) => {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return { error: 'Integração Google Calendar não configurada no servidor.' };
  }

  const admin = createSupabaseClient({ useServiceRole: true });
  const { data: tokenData, error: tokenError } = await admin
    .from('google_tokens_id')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (tokenError) return { error: tokenError.message };
  if (!tokenData?.access_token) {
    return {
      error: 'Google Calendar não conectado. Autorize em Configurações na app.',
      notLinked: true,
    };
  }

  let accessToken = tokenData.access_token;
  const expired =
    tokenData.expires_at && new Date(tokenData.expires_at) <= new Date();

  if (!expired) return { accessToken };

  if (!tokenData.refresh_token) {
    return {
      error: 'Token Google expirado. Reconecte o Google Calendar nas Configurações.',
      notLinked: true,
    };
  }

  const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: tokenData.refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  if (!refreshResponse.ok) {
    return { error: 'Não foi possível renovar o token do Google Calendar.' };
  }

  const refreshed = await refreshResponse.json();
  accessToken = refreshed.access_token;
  const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
  await admin
    .from('google_tokens_id')
    .update({ access_token: accessToken, expires_at: newExpiresAt })
    .eq('user_id', userId);

  return { accessToken };
};

/**
 * Lista eventos brutos do Google Calendar num intervalo.
 * @param {string} userId
 * @param {{ timeMin: string, timeMax: string }} range
 */
export const fetchGoogleCalendarItems = async (userId, range) => {
  const tokenResult = await getGoogleCalendarAccessTokenForUser(userId);
  if (tokenResult.error) {
    return {
      items: [],
      error: tokenResult.error,
      notLinked: !!tokenResult.notLinked,
    };
  }

  const calendarUrl = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
  calendarUrl.searchParams.set('singleEvents', 'true');
  calendarUrl.searchParams.set('orderBy', 'startTime');
  calendarUrl.searchParams.set('timeMin', range.timeMin);
  calendarUrl.searchParams.set('timeMax', range.timeMax);

  const calendarResponse = await fetch(calendarUrl.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${tokenResult.accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!calendarResponse.ok) {
    const errText = await calendarResponse.text();
    return {
      items: [],
      error: `Erro ao listar eventos do Google: ${errText.slice(0, 200)}`,
    };
  }

  const data = await calendarResponse.json();
  return { items: data.items || [], error: null, notLinked: false };
};

const mapGoogleItemToCalendarEvent = (item, dateIso) => {
  const startRaw = item.start?.dateTime || item.start?.date;
  const endRaw = item.end?.dateTime || item.end?.date || startRaw;
  const allDay = !!item.start?.date && !item.start?.dateTime;
  let time = null;
  if (!allDay && item.start?.dateTime) {
    const d = new Date(item.start.dateTime);
    if (Number.isFinite(d.getTime())) {
      time = d.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: SAO_PAULO_TZ,
      });
    }
  }

  return {
    id: item.id || null,
    title: (item.summary || 'Evento do Google').trim(),
    date: dateIso,
    time,
    allDay,
    source: 'google',
    description: item.description || null,
    status: item.status || null,
  };
};

const mapTransactionToCalendarEvent = (t, dateIso) => {
  const statusLabel = transactionStatusLabel(t.status);
  return {
    id: t.id || null,
    title: `${statusLabel}: ${t.classificacao} - R$ ${Number(t.valor).toFixed(2)}`,
    date: dateIso,
    time: null,
    allDay: true,
    source: 'transaction',
    tipo: t.tipo,
    status: t.status,
    valor: Number(t.valor),
    classificacao: t.classificacao,
  };
};

/**
 * Compromissos do utilizador numa data (lançamentos, Google Calendar, certificado MEI).
 * @param {string} userId
 * @param {{ date?: string, data?: string }} [options] — `YYYY-MM-DD` ou `DD/MM/YYYY`; omitir = hoje (SP)
 */
export const listCalendarEventsForUser = async (userId, options = {}) => {
  const rawDate = options.date ?? options.data;
  const parsed = rawDate
    ? parseCalendarQueryDate(rawDate)
    : parseCalendarQueryDate(calendarDateTodayInSaoPaulo());

  if (!parsed) {
    throw badRequest(
      'data inválida; use YYYY-MM-DD (ex.: 2026-05-16) ou DD/MM/YYYY (ex.: 16/05/2026)',
    );
  }

  const { iso: dateIso, display: dateDisplay } = parsed;
  const events = [];

  const transactions = await transactionsService.listTransactions(userId);
  const dayTransactions = (transactions || []).filter((t) => t.data === dateIso);
  for (const t of dayTransactions) {
    events.push(mapTransactionToCalendarEvent(t, dateIso));
  }

  try {
    const validity = await getCertificateValidity(userId);
    const certDay = isoDatePart(validity?.certValidTo);
    if (certDay === dateIso) {
      events.push({
        id: null,
        title: CERT_EXPIRATION_TITLE,
        date: dateIso,
        time: null,
        allDay: true,
        source: 'certificate',
      });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[calendar-events] certificado ignorado:', msg);
  }

  let googleCalendarLinked = false;
  let googleCalendarNote = null;

  const range = dayBoundsIsoInSaoPaulo(dateIso);
  const googleResult = await fetchGoogleCalendarItems(userId, range);

  if (googleResult.notLinked) {
    googleCalendarNote = googleResult.error;
  } else if (googleResult.error) {
    googleCalendarNote = googleResult.error;
  } else {
    googleCalendarLinked = true;
    for (const item of googleResult.items) {
      if (!googleEventOverlapsDate(item, dateIso)) continue;
      events.push(mapGoogleItemToCalendarEvent(item, dateIso));
    }
  }

  events.sort((a, b) => {
    if (a.allDay && !b.allDay) return -1;
    if (!a.allDay && b.allDay) return 1;
    if (a.time && b.time) return a.time.localeCompare(b.time);
    if (a.time) return -1;
    if (b.time) return 1;
    return a.title.localeCompare(b.title, 'pt-BR');
  });

  const sources = {
    transactions: events.filter((e) => e.source === 'transaction').length,
    google: events.filter((e) => e.source === 'google').length,
    certificate: events.filter((e) => e.source === 'certificate').length,
  };

  const count = events.length;
  const message =
    count === 0
      ? `Nenhum compromisso ou atividade programada para ${dateDisplay}.`
      : `${count} compromisso(s) em ${dateDisplay}.`;

  return {
    date: dateIso,
    dateDisplay,
    events,
    count,
    sources,
    googleCalendarLinked,
    googleCalendarNote,
    message,
    empty: count === 0,
  };
};
