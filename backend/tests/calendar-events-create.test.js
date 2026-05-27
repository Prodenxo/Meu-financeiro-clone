import test from 'node:test';
import assert from 'node:assert/strict';

import {
  parseCalendarEventTimeHm,
  parseCalendarQueryDate,
} from '../src/services/calendar-events.service.js';
import { buildAccessRequestApprovedApplicantMessage } from '../src/services/access-request-whatsapp.service.js';

test('parseCalendarEventTimeHm aceita HH:MM', () => {
  assert.deepEqual(parseCalendarEventTimeHm('9:05'), { hour: 9, minute: 5 });
  assert.deepEqual(parseCalendarEventTimeHm('14:30:00'), { hour: 14, minute: 30 });
  assert.equal(parseCalendarEventTimeHm('25:00'), null);
});

test('parseCalendarQueryDate para create_calendar_event', () => {
  const br = parseCalendarQueryDate('28/05/2026');
  assert.equal(br?.iso, '2026-05-28');
  const iso = parseCalendarQueryDate('2026-05-28');
  assert.equal(iso?.display, '28/05/2026');
});

test('mensagem aprovacao inclui link grupo suporte', () => {
  const msg = buildAccessRequestApprovedApplicantMessage({
    fullName: 'Ana',
    email: 'ana@test.com',
  });
  assert.match(msg, /G0F3SaEFfvNI066k5MYKDT/);
});
