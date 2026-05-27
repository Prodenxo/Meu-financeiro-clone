import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildAgendaReminderRunKey,
  formatAgendaReminderWhatsappMessage,
  markAgendaReminderBatchDone,
  resolveAgendaReminderDateIso,
  tryAcquireAgendaReminderBatchMemory,
} from '../src/services/agenda-reminders.service.js';
import {
  calendarDateAddDaysInSaoPaulo,
  calendarDateTodayInSaoPaulo,
} from '../src/services/calendar-events.service.js';

test('formatAgendaReminderWhatsappMessage: null quando sem eventos', () => {
  assert.equal(
    formatAgendaReminderWhatsappMessage({ events: [], dateDisplay: '25/05/2026' }, 'manha'),
    null
  );
});

test('formatAgendaReminderWhatsappMessage: lista compromissos', () => {
  const msg = formatAgendaReminderWhatsappMessage(
    {
      dateDisplay: '25/05/2026',
      events: [
        { title: 'Reunião', time: '10:30:00', allDay: false },
        { title: 'Vencimento', allDay: true },
      ],
    },
    'noite'
  );
  assert.ok(msg?.includes('Boa noite'));
  assert.ok(msg?.includes('amanhã'));
  assert.ok(msg?.includes('25/05/2026'));
  assert.ok(msg?.includes('10:30'));
  assert.ok(msg?.includes('dia inteiro'));
});

test('resolveAgendaReminderDateIso: manhã hoje, noite amanhã', () => {
  assert.equal(resolveAgendaReminderDateIso('manha'), calendarDateTodayInSaoPaulo());
  assert.equal(resolveAgendaReminderDateIso('noite'), calendarDateAddDaysInSaoPaulo(1));
});

test('dedup em memória: segundo lote no mesmo slot/dia é bloqueado', () => {
  const runKey = buildAgendaReminderRunKey('manha', '2099-01-15');
  assert.equal(tryAcquireAgendaReminderBatchMemory(runKey, true), true);
  markAgendaReminderBatchDone(runKey);
  assert.equal(tryAcquireAgendaReminderBatchMemory(runKey, false), false);
  assert.equal(tryAcquireAgendaReminderBatchMemory(runKey, true), true);
});
