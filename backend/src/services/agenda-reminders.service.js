import { env } from '../config/env.js';
import { createSupabaseClient } from '../config/supabase.js';
import { resolveOpenclawWhatsappPhone } from './openclaw-bot.service.js';
import {
  calendarDateAddDaysInSaoPaulo,
  calendarDateTodayInSaoPaulo,
  listCalendarEventsForUser,
} from './calendar-events.service.js';
import {
  isWhatsappOutboundConfigured,
  sendWhatsappMessage,
} from './whatsapp-outbound.service.js';

const VALID_SLOTS = new Set(['manha', 'noite']);

/**
 * Data consultada na agenda: manhã = hoje; noite = amanhã (fuso São Paulo).
 * @param {'manha'|'noite'} slot
 * @param {string} [explicitDateIso] override YYYY-MM-DD (query `date`)
 */
export const resolveAgendaReminderDateIso = (slot, explicitDateIso) => {
  const override = String(explicitDateIso || '').trim();
  if (override) return override;
  if (slot === 'noite') return calendarDateAddDaysInSaoPaulo(1);
  return calendarDateTodayInSaoPaulo();
};

export const isAgendaWhatsappRemindersEnabled = () =>
  String(env.AGENDA_WHATSAPP_REMINDERS_ENABLED || '').toLowerCase() === 'true';

const listUsersWithWhatsappLink = async () => {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada');
  }
  const admin = createSupabaseClient({ useServiceRole: true });
  const { data, error } = await admin
    .from('n8n_link')
    .select('user_id, user_number')
    .not('user_id', 'is', null)
    .not('user_number', 'is', null);
  if (error) throw new Error(error.message);
  const seen = new Set();
  const out = [];
  for (const row of data || []) {
    const userId = String(row.user_id || '').trim();
    if (!userId || seen.has(userId)) continue;
    const phone = resolveOpenclawWhatsappPhone(row.user_number, row.user_number);
    if (!phone) continue;
    seen.add(userId);
    out.push({ userId, phone });
  }
  return out;
};

/**
 * Mensagem WhatsApp só quando há compromissos; caso contrário `null` (não enviar).
 * @param {{ events?: Array<{ title?: string, time?: string|null, allDay?: boolean }>, dateDisplay?: string }} calendar
 * @param {'manha'|'noite'} slot
 */
export const formatAgendaReminderWhatsappMessage = (calendar, slot = 'manha') => {
  const events = calendar?.events || [];
  if (!events.length) return null;
  const greeting = slot === 'noite' ? 'Boa noite' : 'Bom dia';
  const dateLabel = calendar.dateDisplay || (slot === 'noite' ? 'amanhã' : 'hoje');
  const dayWord = slot === 'noite' ? 'amanhã' : 'hoje';
  const lines = events.map((e) => {
    const title = String(e.title || 'Compromisso').trim();
    if (e.allDay || !e.time) return `• ${title} (dia inteiro)`;
    const time = String(e.time).slice(0, 5);
    return `• ${time} — ${title}`;
  });
  return `${greeting}! Compromissos de ${dayWord} (${dateLabel}):\n${lines.join('\n')}`;
};

const trySendAgendaReminder = async ({ userId, phone, message, slot, dateIso }) => {
  if (!isWhatsappOutboundConfigured()) return 'skipped_no_whatsapp';
  if (!phone || !message) return 'skipped_no_message';

  const payload = {
    userId,
    phone,
    message,
    source: slot === 'noite' ? 'agenda_reminder_noite' : 'agenda_reminder_manha',
    date: dateIso,
  };
  try {
    await sendWhatsappMessage(payload);
    return 'sent';
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[agenda-reminders] falha WhatsApp', { userId, message: msg });
    return 'failed';
  }
};

/**
 * Percorre utilizadores com telefone em `n8n_link`; envia WhatsApp só quem tiver eventos no dia alvo.
 * Manhã = hoje; noite = amanhã (America/Sao_Paulo).
 * @param {{ slot?: 'manha'|'noite', dateIso?: string }} [options]
 */
export const runAgendaWhatsappReminders = async (options = {}) => {
  const slot = VALID_SLOTS.has(options.slot) ? options.slot : 'manha';
  const dateIso = resolveAgendaReminderDateIso(slot, options.dateIso);
  const startedAt = new Date().toISOString();

  if (!isAgendaWhatsappRemindersEnabled()) {
    return {
      ok: true,
      skipped: 'disabled',
      slot,
      dateIso,
      startedAt,
      finishedAt: new Date().toISOString(),
      message:
        'Lembretes de agenda desligados (AGENDA_WHATSAPP_REMINDERS_ENABLED≠true).',
    };
  }

  const users = await listUsersWithWhatsappLink();
  const results = [];

  for (const { userId, phone } of users) {
    try {
      const calendar = await listCalendarEventsForUser(userId, { date: dateIso });
      if (calendar.empty || !calendar.events?.length) {
        results.push({
          userId,
          status: 'skipped_empty',
          count: 0,
        });
        continue;
      }

      const message = formatAgendaReminderWhatsappMessage(calendar, slot);
      if (!message) {
        results.push({
          userId,
          status: 'skipped_empty',
          count: 0,
        });
        continue;
      }

      const whatsappStatus = await trySendAgendaReminder({
        userId,
        phone,
        message,
        slot,
        dateIso,
      });
      results.push({
        userId,
        status: whatsappStatus === 'sent' ? 'sent' : whatsappStatus,
        count: calendar.count,
        whatsappStatus,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[agenda-reminders] utilizador ignorado', { userId, msg });
      results.push({
        userId,
        status: 'error',
        message: msg,
      });
    }
  }

  const sent = results.filter((r) => r.status === 'sent').length;
  const skippedEmpty = results.filter((r) => r.status === 'skipped_empty').length;
  const finishedAt = new Date().toISOString();

  console.info('[agenda-reminders] lote concluído', {
    slot,
    dateIso,
    total: users.length,
    sent,
    skippedEmpty,
    startedAt,
    finishedAt,
  });

  return {
    ok: true,
    slot,
    dateIso,
    startedAt,
    finishedAt,
    total: users.length,
    sent,
    skippedEmpty,
    failed: results.filter((r) => r.status === 'failed').length,
    errors: results.filter((r) => r.status === 'error').length,
    results,
  };
};
