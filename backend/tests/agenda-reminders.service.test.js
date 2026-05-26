import test from 'node:test';
import assert from 'node:assert/strict';

import {
  formatAgendaReminderWhatsappMessage,
} from '../src/services/agenda-reminders.service.js';

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
  assert.ok(msg?.includes('25/05/2026'));
  assert.ok(msg?.includes('10:30'));
  assert.ok(msg?.includes('dia inteiro'));
});
