import { env } from '../config/env.js';
import {
  buildAgendaReminderRunKey,
  isAgendaWhatsappRemindersEnabled,
  resolveAgendaReminderDateIso,
  runAgendaWhatsappReminders,
} from './agenda-reminders.service.js';
import { calendarDateTodayInSaoPaulo } from './calendar-events.service.js';

const SCHEDULER_INTERVAL_MS = 5 * 60 * 1000;
const SCHEDULER_TIMEZONE = 'America/Sao_Paulo';
const MANHA_HOUR = 7;
const NOITE_HOUR = 21;

/** @type {ReturnType<typeof setInterval> | null} */
let schedulerHandle = null;

/** runKey já disparado neste processo (ex.: agenda:manha:2026-05-27) */
const firedRunKeys = new Set();

/**
 * @param {Date} [date]
 * @returns {{ hour: number, minute: number, dateIso: string }}
 */
export const getAgendaSchedulerClockInSaoPaulo = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: SCHEDULER_TIMEZONE,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(date);

  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  const dateIso = calendarDateTodayInSaoPaulo();
  return { hour, minute, dateIso };
};

/**
 * Janela de 5 min no início da hora (alinhado ao tick do scheduler).
 * @param {number} hour
 * @param {number} minute
 * @param {number} targetHour
 */
export const isAgendaSchedulerWindow = (hour, minute, targetHour) =>
  hour === targetHour && minute < 5;

/**
 * @param {number} hour
 * @param {number} minute
 * @returns {'manha'|'noite'|null}
 */
export const resolveAgendaSlotForSchedulerTick = (hour, minute) => {
  if (isAgendaSchedulerWindow(hour, minute, MANHA_HOUR)) return 'manha';
  if (isAgendaSchedulerWindow(hour, minute, NOITE_HOUR)) return 'noite';
  return null;
};

export const isAgendaRemindersSchedulerEnabled = () => {
  const explicit = String(env.AGENDA_WHATSAPP_SCHEDULER_ENABLED || '').trim();
  if (explicit) {
    return explicit.toLowerCase() === 'true';
  }
  return isAgendaWhatsappRemindersEnabled();
};

const runSchedulerTick = async () => {
  if (!isAgendaRemindersSchedulerEnabled() || !isAgendaWhatsappRemindersEnabled()) {
    return;
  }

  const { hour, minute } = getAgendaSchedulerClockInSaoPaulo();
  const slot = resolveAgendaSlotForSchedulerTick(hour, minute);
  if (!slot) return;

  const dateIso = resolveAgendaReminderDateIso(slot);
  const runKey = buildAgendaReminderRunKey(slot, dateIso);
  if (firedRunKeys.has(runKey)) return;

  firedRunKeys.add(runKey);
  try {
    const summary = await runAgendaWhatsappReminders({ slot, dateIso });
    console.info('[agenda-reminders] scheduler', {
      slot,
      dateIso,
      sent: summary.sent,
      skipped: summary.skipped,
      total: summary.total,
    });
  } catch (err) {
    firedRunKeys.delete(runKey);
    console.warn(
      '[agenda-reminders] scheduler falhou',
      err instanceof Error ? err.message : err,
    );
  }
};

export const startAgendaRemindersScheduler = () => {
  if (schedulerHandle) return;
  if (!isAgendaRemindersSchedulerEnabled()) {
    console.info('[agenda-reminders] Scheduler interno desligado');
    return;
  }
  if (!isAgendaWhatsappRemindersEnabled()) {
    console.info(
      '[agenda-reminders] Scheduler ignorado (AGENDA_WHATSAPP_REMINDERS_ENABLED≠true)',
    );
    return;
  }

  console.info(
    `[agenda-reminders] Scheduler interno ativo (${MANHA_HOUR}h e ${NOITE_HOUR}h ${SCHEDULER_TIMEZONE})`,
  );
  schedulerHandle = setInterval(() => {
    void runSchedulerTick();
  }, SCHEDULER_INTERVAL_MS);
  void runSchedulerTick();
};
