import { APP_TIME_ZONE } from '../date.js';
import { normalizarTipo, normalizarValor, parseTransactionDate, toDayKey, pad2 } from './normalize.js';
import { MONTH_SHORT } from './format.js';

/**
 * Regras da tela "Agenda" do app atual (`AgendaScreen` + `AgendaEventRow`), em JS puro.
 * Junta lançamentos do mês com eventos do Google Agenda num só tipo de item.
 */

/** Paleta oficial de cores de eventos do Google Calendar (colorId 1–11). */
export const GOOGLE_CALENDAR_COLORS = [
  { id: '1', name: 'Lavanda', hex: '#7986CB' },
  { id: '2', name: 'Sálvia', hex: '#33B679' },
  { id: '3', name: 'Uva', hex: '#8E24AA' },
  { id: '4', name: 'Flamingo', hex: '#E67C73' },
  { id: '5', name: 'Banana', hex: '#F6BF26' },
  { id: '6', name: 'Tangerina', hex: '#F4511E' },
  { id: '7', name: 'Pavão', hex: '#039BE5' },
  { id: '8', name: 'Grafite', hex: '#616161' },
  { id: '9', name: 'Mirtilo', hex: '#3F51B5' },
  { id: '10', name: 'Manjericão', hex: '#0B8043' },
  { id: '11', name: 'Tomate', hex: '#D50000' },
];

export function getGoogleEventColorHex(colorId, fallback) {
  if (!colorId) return fallback;
  return GOOGLE_CALENDAR_COLORS.find((c) => c.id === String(colorId))?.hex ?? fallback;
}

/**
 * Tipos de item na agenda (legenda). Lançamentos de saída são "Contas e boletos", de entrada
 * "Recebimentos"; eventos do Google com horário são "Compromissos" e de dia inteiro "Lembretes".
 */
export const AGENDA_KINDS = {
  conta: { id: 'conta', label: 'Contas e boletos', color: 'var(--mf-danger)', hex: '#ef4444', icon: 'receipt', tone: 'danger' },
  compromisso: { id: 'compromisso', label: 'Compromissos', color: 'var(--mf-info)', hex: '#2563eb', icon: 'calendar-days', tone: 'info' },
  recebimento: { id: 'recebimento', label: 'Recebimentos', color: 'var(--mf-success)', hex: '#16a34a', icon: 'trending-up', tone: 'success' },
  lembrete: { id: 'lembrete', label: 'Lembretes', color: 'var(--mf-warning)', hex: '#f59e0b', icon: 'bell', tone: 'warning' },
};

export const KIND_ORDER = ['conta', 'compromisso', 'recebimento', 'lembrete'];

export const VIEW_MODES = [
  { value: 'month', label: 'Mês' },
  { value: 'week', label: 'Semana' },
  { value: 'day', label: 'Dia' },
];

export const RECURRENCE_OPTIONS = [
  { label: 'Não se repete', value: '' },
  { label: 'Diariamente', value: 'RRULE:FREQ=DAILY' },
  { label: 'Semanalmente', value: 'RRULE:FREQ=WEEKLY' },
  { label: 'Mensalmente', value: 'RRULE:FREQ=MONTHLY' },
  { label: 'Anualmente', value: 'RRULE:FREQ=YEARLY' },
];

export const REMINDER_OPTIONS = [
  { label: 'Sem lembrete', value: '' },
  { label: 'Na hora do evento', value: '0' },
  { label: '10 minutos antes', value: '10' },
  { label: '30 minutos antes', value: '30' },
  { label: '1 hora antes', value: '60' },
  { label: '1 dia antes', value: '1440' },
];

const WEEKDAY_SHORT = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
const WEEKDAY_LONG = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const MONTH_LONG = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

/* ===== Datas (chaves YYYY-MM-DD, sem depender do fuso do servidor) ===== */

export function parseDayKey(key) {
  const [y, m, d] = String(key || '').split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12);
}

export function isDayKey(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')) && !Number.isNaN(parseDayKey(value).getTime());
}

export function addDays(key, days) {
  const d = parseDayKey(key);
  d.setDate(d.getDate() + days);
  return toDayKey(d);
}

export function monthOfKey(key) {
  const [y, m] = String(key).split('-').map(Number);
  return { year: y, month: m };
}

export function monthBounds({ year, month }) {
  const last = new Date(year, month, 0).getDate();
  return { startKey: `${year}-${pad2(month)}-01`, endKey: `${year}-${pad2(month)}-${pad2(last)}`, days: last };
}

/** Intervalo ISO (fuso do Brasil) para pedir eventos ao Google no mês. */
export function monthTimeRange(month) {
  const { startKey, endKey } = monthBounds(month);
  return { timeMin: `${startKey}T00:00:00-03:00`, timeMax: `${endKey}T23:59:59-03:00` };
}

/** Segunda-feira da semana que contém o dia (como o app atual). */
export function startOfWeek(key) {
  const d = parseDayKey(key);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toDayKey(d);
}

export function weekDays(key) {
  const start = startOfWeek(key);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** Grade mensal (segunda a domingo), 6 semanas, com dias vizinhos marcados `inMonth: false`. */
export function buildMonthGrid(month) {
  const { startKey } = monthBounds(month);
  const first = startOfWeek(startKey);
  const cells = [];
  for (let i = 0; i < 42; i += 1) {
    const key = addDays(first, i);
    const { year, month: m } = monthOfKey(key);
    cells.push({ key, day: Number(key.slice(8, 10)), inMonth: year === month.year && m === month.month });
  }
  // Remove a última semana se ficou inteira fora do mês.
  const lastWeek = cells.slice(35);
  return lastWeek.every((c) => !c.inMonth) ? cells.slice(0, 35) : cells;
}

export const WEEKDAY_HEADERS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/** "Quinta-feira, 3 de setembro de 2026" */
export function formatDayFull(key) {
  const d = parseDayKey(key);
  return `${capitalize(WEEKDAY_LONG[d.getDay()])}, ${d.getDate()} de ${MONTH_LONG[d.getMonth()]} de ${d.getFullYear()}`;
}

/** "Quinta-feira" */
export function formatWeekday(key) {
  return capitalize(WEEKDAY_LONG[parseDayKey(key).getDay()]);
}

export function weekdayShort(key) {
  return WEEKDAY_SHORT[parseDayKey(key).getDay()];
}

/** Rótulo do controle de período, conforme a vista. */
export function periodLabel(view, month, selectedDay) {
  if (view === 'week') {
    const days = weekDays(selectedDay);
    const a = parseDayKey(days[0]);
    const b = parseDayKey(days[6]);
    const left = `${a.getDate()} ${MONTH_SHORT[a.getMonth()]}`;
    const right = `${b.getDate()} ${MONTH_SHORT[b.getMonth()]}${a.getFullYear() !== b.getFullYear() ? ` ${b.getFullYear()}` : ''}`;
    return `${left} – ${right} ${b.getFullYear()}`;
  }
  if (view === 'day') return formatDayFull(selectedDay);
  return `${capitalize(MONTH_LONG[month.month - 1])} de ${month.year}`;
}

/* ===== Google: data/hora no fuso do produto ===== */

function zonedParts(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const get = (t) => parts.find((p) => p.type === t)?.value;
  return { key: `${get('year')}-${get('month')}-${get('day')}`, time: `${String(Number(get('hour')) % 24).padStart(2, '0')}:${get('minute')}` };
}

/** Dia (YYYY-MM-DD) e horário (HH:MM ou null) de um evento do Google. */
export function googleEventDay(event) {
  if (event?.start?.date) return { key: String(event.start.date).slice(0, 10), time: null, endTime: null };
  const start = event?.start?.dateTime ? zonedParts(event.start.dateTime) : null;
  if (!start) return null;
  const end = event?.end?.dateTime ? zonedParts(event.end.dateTime) : null;
  return { key: start.key, time: start.time, endTime: end && end.key === start.key ? end.time : null };
}

const MEET_MARKER = '[MF_MEET]';

export function stripMeetMarker(desc) {
  if (!desc) return '';
  return String(desc).replace(/\n?\[MF_MEET\]\s*/g, '').trim();
}

export function extractMeetLink(event) {
  const isMeet = (u) => {
    try {
      const host = new URL(String(u || '').trim()).hostname.toLowerCase();
      return host === 'meet.google.com' || host.endsWith('.meet.google.com');
    } catch {
      return false;
    }
  };
  if (isMeet(event?.hangoutLink)) return event.hangoutLink.trim();
  for (const ep of event?.conferenceData?.entryPoints || []) {
    if (isMeet(ep?.uri)) return ep.uri.trim();
  }
  return null;
}

export function eventHasAppMeet(event) {
  return event?.extendedProperties?.private?.mfMeet === '1' || String(event?.description || '').includes(MEET_MARKER);
}

/* ===== Itens unificados ===== */

function transactionItem(t) {
  const tipo = normalizarTipo(t.tipo);
  const isIncome = tipo === 'entrada';
  const kind = isIncome ? 'recebimento' : 'conta';
  const status = String(t.status || '');
  return {
    id: `tx-${t.id}`,
    sourceId: String(t.id),
    source: 'transaction',
    kind,
    dayKey: toDayKey(parseTransactionDate(t)),
    time: null,
    timeLabel: null,
    title: String(t.classificacao || '').trim() || 'Sem descrição',
    subtitle: String(t.obs || '').trim(),
    amount: normalizarValor(t.valor),
    isIncome,
    status,
    isDone: status === 'pago' || status === 'recebido',
    color: AGENDA_KINDS[kind].hex,
    raw: t,
  };
}

function googleItem(event) {
  const when = googleEventDay(event);
  if (!when) return null;
  const isAllDay = !event.start?.dateTime;
  const kind = isAllDay ? 'lembrete' : 'compromisso';
  const meetLink = eventHasAppMeet(event) ? extractMeetLink(event) : null;
  return {
    id: `g-${event.id}`,
    sourceId: String(event.id),
    source: 'google',
    kind,
    dayKey: when.key,
    time: when.time,
    timeLabel: when.time ? (when.endTime ? `${when.time} – ${when.endTime}` : when.time) : 'Dia inteiro',
    title: String(event.summary || '').trim() || 'Evento Google',
    subtitle: stripMeetMarker(event.description),
    location: String(event.location || '').trim(),
    isAllDay,
    color: getGoogleEventColorHex(event.colorId, AGENDA_KINDS[kind].hex),
    htmlLink: event.htmlLink || null,
    meetLink,
    raw: event,
  };
}

function compareItems(a, b) {
  if (a.dayKey !== b.dayKey) return a.dayKey < b.dayKey ? -1 : 1;
  if (a.time && b.time) return a.time < b.time ? -1 : a.time > b.time ? 1 : 0;
  if (a.time) return 1;
  if (b.time) return -1;
  return a.title.localeCompare(b.title, 'pt-BR');
}

/** Lançamentos do mês (qualquer status) + eventos Google, ordenados por dia e hora. */
export function buildAgendaItems({ transactions = [], googleEvents = [], month }) {
  const { startKey, endKey } = monthBounds(month);
  const items = [];
  for (const t of transactions) {
    const it = transactionItem(t);
    if (it.dayKey >= startKey && it.dayKey <= endKey) items.push(it);
  }
  for (const ev of googleEvents) {
    const it = googleItem(ev);
    if (it && it.dayKey >= startKey && it.dayKey <= endKey) items.push(it);
  }
  return items.sort(compareItems);
}

/** Cores dos pontinhos por dia (um por tipo, na ordem da legenda). */
export function dotsByDay(items) {
  const map = new Map();
  for (const it of items) {
    if (!map.has(it.dayKey)) map.set(it.dayKey, new Set());
    map.get(it.dayKey).add(it.kind);
  }
  const out = {};
  for (const [key, kinds] of map) out[key] = KIND_ORDER.filter((k) => kinds.has(k));
  return out;
}

export function itemsOfDay(items, dayKey) {
  return items.filter((it) => it.dayKey === dayKey);
}

export function itemsOfWeek(items, dayKey) {
  const days = weekDays(dayKey);
  return items.filter((it) => it.dayKey >= days[0] && it.dayKey <= days[6]);
}

/**
 * Próximos compromissos: a partir de hoje quando o mês exibido contém hoje ou é futuro;
 * num mês passado, mostra os primeiros do mês.
 */
export function upcomingItems(items, todayKey, limit = 4) {
  const from = items.length && items[0].dayKey.slice(0, 7) < todayKey.slice(0, 7) ? '' : todayKey;
  return items.filter((it) => it.dayKey >= from).slice(0, limit);
}

/** Contagem por tipo + percentual, na ordem da legenda. */
export function monthSummary(items) {
  const total = items.length;
  const rows = KIND_ORDER.map((k) => {
    const count = items.filter((it) => it.kind === k).length;
    return { ...AGENDA_KINDS[k], count, pct: total ? (count / total) * 100 : 0 };
  });
  return { total, rows };
}

/** Preenche o formulário do modal a partir de um evento Google (como `parseGoogleEventForForm`). */
export function googleEventToForm(event) {
  const isAllDay = Boolean(event?.start?.date);
  let startDate = '';
  let endDate = '';
  let startTime = '09:00';
  let endTime = '10:00';
  if (isAllDay) {
    startDate = event.start.date;
    // No Google, o `end.date` de dia inteiro é exclusivo (dia seguinte).
    endDate = event.end?.date ? addDays(event.end.date, -1) : startDate;
    if (endDate < startDate) endDate = startDate;
  } else if (event?.start?.dateTime) {
    const s = zonedParts(event.start.dateTime);
    const e = event.end?.dateTime ? zonedParts(event.end.dateTime) : s;
    startDate = s.key;
    endDate = e.key;
    startTime = s.time;
    endTime = e.time;
  }
  const reminder = event?.reminders?.overrides?.[0]?.minutes;
  return {
    title: event?.summary || '',
    description: stripMeetMarker(event?.description),
    location: event?.location || '',
    isAllDay,
    startDate,
    endDate,
    startTime,
    endTime,
    colorId: event?.colorId ? String(event.colorId) : '',
    recurrence: event?.recurrence?.[0] || '',
    reminderMinutes: reminder !== undefined && reminder !== null ? String(reminder) : '',
    createMeetLink: eventHasAppMeet(event),
  };
}

/** Converte o formulário (strings) no payload que a edge function `google-calendar` espera. */
export function formToGooglePayload(form) {
  const [sh, sm] = String(form.startTime || '09:00').split(':').map(Number);
  const [eh, em] = String(form.endTime || '10:00').split(':').map(Number);
  const isAllDay = Boolean(form.isAllDay);
  const endDate = form.endDate && form.endDate >= form.startDate ? form.endDate : form.startDate;
  const reminder = form.reminderMinutes === '' || form.reminderMinutes == null ? null : Number(form.reminderMinutes);
  return {
    title: String(form.title || '').trim(),
    isAllDay,
    startDate: form.startDate,
    // Dia inteiro no Google: fim exclusivo → dia seguinte ao último dia.
    endDate: isAllDay ? addDays(endDate, 1) : endDate,
    startHour: sh || 0,
    startMinute: sm || 0,
    endHour: eh || 0,
    endMinute: em || 0,
    recurrence: form.recurrence || null,
    location: String(form.location || '').trim() || undefined,
    description: String(form.description || '').trim() || undefined,
    colorId: form.colorId || undefined,
    reminderMinutes: Number.isFinite(reminder) ? reminder : null,
    createMeetLink: Boolean(form.createMeetLink) && !isAllDay,
  };
}

/** Validação do formulário de compromisso (mesmas regras do modal do app atual). */
export function validateGoogleForm(form) {
  const errors = {};
  if (!String(form.title || '').trim()) errors.title = 'Informe a descrição do compromisso.';
  if (!isDayKey(form.startDate)) errors.startDate = 'Informe a data de início.';
  if (form.endDate && isDayKey(form.endDate) && form.endDate < form.startDate) errors.endDate = 'O término não pode ser antes do início.';
  if (!form.isAllDay && form.startDate === (form.endDate || form.startDate) && form.endTime && form.startTime && form.endTime <= form.startTime) {
    errors.endTime = 'A hora de término deve ser depois da de início.';
  }
  return errors;
}

/** Link para abrir o dia no Google Agenda (quando o evento não traz `htmlLink`). */
export function googleCalendarDayUrl(dayKey) {
  const [y, m, d] = dayKey.split('-').map(Number);
  return `https://calendar.google.com/calendar/r/day/${y}/${m}/${d}`;
}
