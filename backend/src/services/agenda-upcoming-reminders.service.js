import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { env } from '../config/env.js';
import { resolveOpenclawWhatsappPhone } from './openclaw-bot.service.js';
import { listUsersWithWhatsappLink } from './agenda-reminders.service.js';
import {
  calendarDateTodayInSaoPaulo,
  eventStartsAtInstant,
  formatCalendarEventDisplayLine,
  listCalendarEventsForUser,
} from './calendar-events.service.js';
import {
  isWhatsappOutboundConfigured,
  sendWhatsappMessage,
} from './whatsapp-outbound.service.js';

const DEFAULT_MINUTES_BEFORE = 30;
const MIN_LEAD_MINUTES = 5;

export const isAgendaUpcomingWhatsappEnabled = () => {
  const explicit = String(env.AGENDA_UPCOMING_WHATSAPP_ENABLED || '').trim();
  if (explicit) return explicit.toLowerCase() === 'true';
  return String(env.AGENDA_WHATSAPP_REMINDERS_ENABLED || '').toLowerCase() === 'true';
};

export const getAgendaUpcomingMinutesBefore = () => {
  const n = Number.parseInt(env.AGENDA_UPCOMING_MINUTES_BEFORE || '', 10);
  if (Number.isFinite(n) && n >= MIN_LEAD_MINUTES && n <= 120) return n;
  return DEFAULT_MINUTES_BEFORE;
};

export const buildUpcomingReminderRunKey = (userId, eventKey, dateIso) =>
  `upcoming:${userId}:${dateIso}:${eventKey}`;

export const tryAcquireUpcomingReminderFile = (runKey) => {
  const safe = runKey.replace(/[^a-z0-9:_-]/gi, '_');
  const file = path.join(os.tmpdir(), `mf-agenda-upcoming-${safe}.lock`);
  try {
    fs.writeFileSync(file, `${new Date().toISOString()}\n`, { flag: 'wx', encoding: 'utf8' });
    return true;
  } catch (err) {
    if (err && typeof err === 'object' && err.code === 'EEXIST') return false;
    return true;
  }
};

/**
 * @param {object} event
 * @param {number} minutesBefore
 * @param {Date} [now]
 */
export const isEventInUpcomingReminderWindow = (event, minutesBefore, now = new Date()) => {
  if (event?.allDay || !event?.time) return false;
  const start = eventStartsAtInstant(event);
  if (!start) return false;
  const msUntil = start.getTime() - now.getTime();
  const maxMs = minutesBefore * 60_000;
  const minMs = MIN_LEAD_MINUTES * 60_000;
  return msUntil > 0 && msUntil <= maxMs;
};

export const formatUpcomingAgendaWhatsappMessage = (event, minutesBefore) => {
  const start = eventStartsAtInstant(event);
  const mins = start
    ? Math.max(1, Math.round((start.getTime() - Date.now()) / 60_000))
    : minutesBefore;
  const line = formatCalendarEventDisplayLine(event);
  let msg = `⏰ Em ~${mins} min\n${line}`;
  if (event.meetLink) msg += `\n🔗 ${event.meetLink}`;
  msg += '\n\n_Digite «concluí» ou o número do item quando terminar._';
  return msg;
};

/**
 * Lembretes X min antes de cada compromisso (tick a cada 5 min no scheduler).
 */
export const runAgendaUpcomingWhatsappReminders = async () => {
  if (!isAgendaUpcomingWhatsappEnabled()) {
    return { ok: true, skipped: 'disabled', sent: 0 };
  }
  if (!isWhatsappOutboundConfigured()) {
    return { ok: true, skipped: 'no_whatsapp', sent: 0 };
  }

  const minutesBefore = getAgendaUpcomingMinutesBefore();
  const now = new Date();
  const dateIso = calendarDateTodayInSaoPaulo();
  const users = await listUsersWithWhatsappLink();
  let sent = 0;

  for (const { userId, phone } of users) {
    try {
      const calendar = await listCalendarEventsForUser(userId, { date: dateIso });
      const upcoming = (calendar.events || []).filter((e) =>
        isEventInUpcomingReminderWindow(e, minutesBefore, now),
      );
      for (const event of upcoming) {
        const eventKey = event.id || `${event.title}|${event.time}`;
        const runKey = buildUpcomingReminderRunKey(userId, eventKey, dateIso);
        if (!tryAcquireUpcomingReminderFile(runKey)) continue;

        const message = formatUpcomingAgendaWhatsappMessage(event, minutesBefore);
        await sendWhatsappMessage({
          userId,
          phone,
          message,
          source: 'agenda_reminder_upcoming',
          date: dateIso,
          eventId: event.id,
        });
        sent += 1;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[agenda-upcoming] utilizador ignorado', { userId, msg });
    }
  }

  if (sent > 0) {
    console.info('[agenda-upcoming] lote', { dateIso, minutesBefore, sent });
  }

  return { ok: true, dateIso, minutesBefore, sent, users: users.length };
};
