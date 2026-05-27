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
  return calendarDateAddDaysInSaoPaulo(0);
};

/**
 * Soma dias ao “hoje” em America/Sao_Paulo (YYYY-MM-DD).
 * @param {number} days
 * @returns {string}
 */
export const calendarDateAddDaysInSaoPaulo = (days) => {
  const offset = Number(days) || 0;
  const anchor = new Date();
  if (offset !== 0) {
    anchor.setTime(anchor.getTime() + offset * 24 * 60 * 60 * 1000);
  }
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: SAO_PAULO_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(anchor);
};

/**
 * Normaliza data de consulta do calendário.
 * Aceita `YYYY-MM-DD` ou `DD/MM/YYYY`.
 * @param {string} raw
 * @returns {{ iso: string, display: string } | null}
 */
const normalizeCalendarDateWords = (raw) => {
  const s = String(raw ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
  if (!s) return s;
  if (s === 'hoje') return calendarDateTodayInSaoPaulo();
  if (s === 'amanha' || s === 'amanhã') return calendarDateAddDaysInSaoPaulo(1);
  if (s === 'depois de amanha' || s === 'depois de amanhã') {
    return calendarDateAddDaysInSaoPaulo(2);
  }
  return String(raw ?? '').trim();
};

export const parseCalendarQueryDate = (raw) => {
  const normalized = normalizeCalendarDateWords(raw);
  const s = String(normalized ?? '').trim();
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
  calendarUrl.searchParams.set(
    'fields',
    'items(id,summary,description,location,start,end,hangoutLink,conferenceData,reminders,htmlLink,status),nextPageToken',
  );

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

export const mapGoogleItemToCalendarEvent = (item, dateIso) => {
  const allDay = !!item.start?.date && !item.start?.dateTime;
  const time = !allDay && item.start?.dateTime
    ? formatGoogleDateTimeLocalPtBr(item.start.dateTime)
    : null;
  const endTime = !allDay && item.end?.dateTime
    ? formatGoogleDateTimeLocalPtBr(item.end.dateTime)
    : null;
  const durationMinutes = computeGoogleEventDurationMinutes(item);
  const durationLabel = formatDurationLabelPtBr(durationMinutes);
  const meetLink = pickMeetUriFromGoogleEvent(item);
  const reminders = extractGoogleEventReminders(item);
  const reminderLabels = reminders.map((r) => r.label).filter(Boolean);

  return {
    id: item.id || null,
    title: (item.summary || 'Evento do Google').trim(),
    date: dateIso,
    time,
    endTime,
    durationMinutes,
    durationLabel,
    allDay,
    source: 'google',
    description: item.description || null,
    status: item.status || null,
    location: item.location ? String(item.location).trim() : null,
    meetLink,
    hangoutLink: meetLink,
    reminders,
    reminderSummary: reminderLabels.length ? reminderLabels.join('; ') : null,
    htmlLink: item.htmlLink ? String(item.htmlLink).trim() : null,
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

/**
 * @param {string} raw HH:MM ou HH:MM:SS
 * @returns {{ hour: number, minute: number } | null}
 */
export const parseCalendarEventTimeHm = (raw) => {
  const s = String(raw ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
  if (!s) return null;

  if (
    s === 'meio dia'
    || s === 'meio-dia'
    || s === 'meiodia'
    || s === 'ao meio dia'
    || s === 'ao meio-dia'
    || s === '12h'
    || s === '12h00'
  ) {
    return { hour: 12, minute: 0 };
  }

  const hOnly = /^(\d{1,2})h$/.exec(s);
  if (hOnly) {
    const hour = Number(hOnly[1]);
    if (hour >= 0 && hour <= 23) return { hour, minute: 0 };
  }

  const hMin = /^(\d{1,2})h(\d{2})$/.exec(s);
  if (hMin) {
    const hour = Number(hMin[1]);
    const minute = Number(hMin[2]);
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return { hour, minute };
    }
  }

  const m = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(s);
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
};

const pad2 = (n) => String(n).padStart(2, '0');

export const pickMeetUriFromGoogleEvent = (eventData) => {
  const hangout = typeof eventData?.hangoutLink === 'string' ? eventData.hangoutLink.trim() : '';
  if (hangout.includes('meet.google')) return hangout;
  const entryPoints = eventData?.conferenceData?.entryPoints || [];
  for (const ep of entryPoints) {
    const uri = String(ep?.uri || '').trim();
    if (uri.includes('meet.google')) return uri;
  }
  return null;
};

/**
 * @param {string} dateTimeIso
 * @returns {string | null} HH:MM
 */
export const formatGoogleDateTimeLocalPtBr = (dateTimeIso) => {
  if (!dateTimeIso || !String(dateTimeIso).includes('T')) return null;
  const d = new Date(dateTimeIso);
  if (!Number.isFinite(d.getTime())) return null;
  return d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: SAO_PAULO_TZ,
  });
};

/**
 * @param {object} item Evento Google Calendar API
 * @returns {number | null}
 */
export const computeGoogleEventDurationMinutes = (item) => {
  const allDay = !!item?.start?.date && !item?.start?.dateTime;
  if (allDay) return null;
  const startRaw = item?.start?.dateTime;
  const endRaw = item?.end?.dateTime;
  if (!startRaw || !endRaw) return null;
  const start = new Date(startRaw);
  const end = new Date(endRaw);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) return null;
  const mins = Math.round((end.getTime() - start.getTime()) / 60_000);
  return mins > 0 ? mins : null;
};

/**
 * @param {number | null} minutes
 * @returns {string | null}
 */
export const formatDurationLabelPtBr = (minutes) => {
  if (minutes == null || !Number.isFinite(minutes) || minutes < 1) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h${String(m).padStart(2, '0')}`;
  if (h > 0) return `${h}h`;
  return `${m} min`;
};

/**
 * @param {object} item
 * @returns {Array<{ method: string, minutes: number | null, label: string }>}
 */
export const extractGoogleEventReminders = (item) => {
  const reminders = item?.reminders;
  if (!reminders || typeof reminders !== 'object') return [];

  if (reminders.useDefault === true) {
    return [{
      method: 'default',
      minutes: null,
      label: 'Padrão do Google Calendar',
    }];
  }

  const overrides = Array.isArray(reminders.overrides) ? reminders.overrides : [];
  return overrides.map((o) => {
    const method = String(o?.method || 'popup');
    const minutes = o?.minutes != null ? Number(o.minutes) : null;
    const label = Number.isFinite(minutes)
      ? `${minutes} min antes (${method})`
      : `Lembrete (${method})`;
    return { method, minutes: Number.isFinite(minutes) ? minutes : null, label };
  });
};

/**
 * @param {Record<string, unknown>} payload
 */
export const parseCreateMeetLinkFlag = (payload = {}) => {
  const raw = payload.createMeetLink
    ?? payload.createMeet
    ?? payload.meet
    ?? payload.meeting
    ?? payload.comMeet
    ?? payload.com_meet
    ?? payload.videoCall
    ?? payload.linkMeet
    ?? payload.comVideo;
  if (raw === true) return true;
  const s = String(raw ?? '').trim().toLowerCase();
  if (!s) return false;
  return ['true', '1', 'yes', 'sim', 'on'].includes(s);
};

const fetchGoogleCalendarEventById = async (accessToken, eventId) => {
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}?conferenceDataVersion=1`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) return null;
  return res.json();
};

/**
 * Cria compromisso no Google Calendar (primary) do utilizador.
 * @param {string} userId
 * @param {Record<string, unknown>} payload
 */
export const createCalendarEventForUser = async (userId, payload = {}) => {
  const title = String(
    payload.title ?? payload.titulo ?? payload.summary ?? payload.nome ?? '',
  ).trim();
  if (!title) {
    throw badRequest('Informe payload.title (título do compromisso).');
  }

  const rawDate = payload.date ?? payload.data;
  const parsed = rawDate
    ? parseCalendarQueryDate(rawDate)
    : parseCalendarQueryDate(calendarDateTodayInSaoPaulo());
  if (!parsed) {
    throw badRequest(
      'data inválida; use YYYY-MM-DD ou DD/MM/YYYY (ex.: 2026-05-28 ou 28/05/2026).',
    );
  }

  const hasExplicitTime = payload.time != null
    || payload.hora != null
    || payload.startHour != null
    || payload.startMinute != null;
  const allDay = payload.allDay === true
    || payload.diaInteiro === true
    || String(payload.allDay || payload.diaInteiro || '').toLowerCase() === 'true'
    || (!hasExplicitTime && payload.allDay !== false && payload.diaInteiro !== false);

  let startHour = Number(payload.startHour);
  let startMinute = Number(payload.startMinute);
  if (!Number.isFinite(startHour)) startHour = 9;
  if (!Number.isFinite(startMinute)) startMinute = 0;

  const timeRaw = payload.time ?? payload.hora;
  if (timeRaw != null && String(timeRaw).trim() !== '') {
    const tm = parseCalendarEventTimeHm(timeRaw);
    if (!tm) throw badRequest('hora inválida; use HH:MM (ex.: 14:30).');
    startHour = tm.hour;
    startMinute = tm.minute;
  }

  let endHour = Number(payload.endHour);
  let endMinute = Number(payload.endMinute);
  if (!Number.isFinite(endHour)) endHour = startHour + 1;
  if (!Number.isFinite(endMinute)) endMinute = startMinute;
  if (endHour >= 24) {
    endHour = 23;
    endMinute = 59;
  }

  const endDateParsed = payload.endDate ?? payload.dataFim
    ? parseCalendarQueryDate(String(payload.endDate ?? payload.dataFim))
    : null;
  const endDateIso = endDateParsed?.iso ?? parsed.iso;

  let description = String(
    payload.description ?? payload.descricao ?? payload.obs ?? '',
  ).trim();

  const wantsMeet = parseCreateMeetLinkFlag(payload);
  if (wantsMeet && allDay) {
    throw badRequest(
      'Google Meet exige horário definido. Informe payload.time (ex.: 15:00) ou allDay: false.',
    );
  }

  const tokenResult = await getGoogleCalendarAccessTokenForUser(userId);
  if (tokenResult.error) {
    return {
      ok: false,
      notLinked: !!tokenResult.notLinked,
      message: tokenResult.error,
      date: parsed.iso,
      dateDisplay: parsed.display,
    };
  }

  if (wantsMeet) {
    description = description ? `${description}\n[MF_MEET]` : '[MF_MEET]';
  }

  const eventBody = {
    summary: title,
    ...(description ? { description } : {}),
  };

  if (wantsMeet) {
    eventBody.conferenceData = {
      createRequest: {
        requestId: `meet-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    };
    eventBody.extendedProperties = { private: { mfMeet: '1' } };
  }

  const reminderRaw = payload.reminderMinutes
    ?? payload.lembreteMinutos
    ?? payload.reminder
    ?? null;
  const reminderMins = reminderRaw != null ? Number(reminderRaw) : NaN;
  if (Number.isFinite(reminderMins) && reminderMins >= 0) {
    eventBody.reminders = {
      useDefault: false,
      overrides: [{ method: 'popup', minutes: reminderMins }],
    };
  }

  if (allDay) {
    eventBody.start = { date: parsed.iso };
    eventBody.end = { date: endDateIso };
  } else {
    eventBody.start = {
      dateTime: `${parsed.iso}T${pad2(startHour)}:${pad2(startMinute)}:00`,
      timeZone: SAO_PAULO_TZ,
    };
    eventBody.end = {
      dateTime: `${endDateIso}T${pad2(endHour)}:${pad2(endMinute)}:00`,
      timeZone: SAO_PAULO_TZ,
    };
  }

  const calendarQuery = wantsMeet ? '?conferenceDataVersion=1' : '';
  const calendarResponse = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events${calendarQuery}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenResult.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventBody),
    },
  );

  if (!calendarResponse.ok) {
    const errText = await calendarResponse.text();
    return {
      ok: false,
      message: `Erro ao criar evento no Google Calendar: ${errText.slice(0, 200)}`,
      date: parsed.iso,
      dateDisplay: parsed.display,
    };
  }

  let eventData = await calendarResponse.json();
  let meetUri = pickMeetUriFromGoogleEvent(eventData);

  if (wantsMeet && eventData.id && !meetUri) {
    const refreshed = await fetchGoogleCalendarEventById(
      tokenResult.accessToken,
      eventData.id,
    );
    if (refreshed) {
      eventData = refreshed;
      meetUri = pickMeetUriFromGoogleEvent(eventData);
    }
  }

  const timeLabel = allDay
    ? 'dia inteiro'
    : `${pad2(startHour)}:${pad2(startMinute)}`;

  let message = `Compromisso criado: ${title} em ${parsed.display} (${timeLabel}).`;
  if (wantsMeet) {
    message += meetUri
      ? ` Link Google Meet: ${meetUri}`
      : ' Meet solicitado; o link pode demorar alguns segundos a aparecer no Google Calendar.';
  }

  const durationMinutes = computeGoogleEventDurationMinutes(eventData);
  const reminders = extractGoogleEventReminders(eventData);

  return {
    ok: true,
    message,
    eventId: eventData.id || null,
    hangoutLink: meetUri,
    meetLink: meetUri,
    createMeetLink: wantsMeet,
    date: parsed.iso,
    dateDisplay: parsed.display,
    title,
    allDay,
    time: allDay ? null : timeLabel,
    endTime: allDay ? null : formatGoogleDateTimeLocalPtBr(eventData.end?.dateTime),
    durationMinutes,
    durationLabel: formatDurationLabelPtBr(durationMinutes),
    reminders,
    reminderSummary: reminders.map((r) => r.label).join('; ') || null,
    source: 'google',
  };
};
