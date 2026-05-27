import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mapGoogleItemToCalendarEvent,
  computeGoogleEventDurationMinutes,
  formatDurationLabelPtBr,
  extractGoogleEventReminders,
  pickMeetUriFromGoogleEvent,
} from '../src/services/calendar-events.service.js';

test('mapGoogleItemToCalendarEvent inclui duração, Meet e lembretes', () => {
  const item = {
    id: 'evt1',
    summary: 'Reunião cliente',
    start: { dateTime: '2026-05-28T12:00:00-03:00' },
    end: { dateTime: '2026-05-28T13:30:00-03:00' },
    hangoutLink: 'https://meet.google.com/abc-defg-hij',
    reminders: {
      useDefault: false,
      overrides: [{ method: 'popup', minutes: 15 }],
    },
  };
  const mapped = mapGoogleItemToCalendarEvent(item, '2026-05-28');
  assert.equal(mapped.title, 'Reunião cliente');
  assert.equal(mapped.time, '12:00');
  assert.equal(mapped.endTime, '13:30');
  assert.equal(mapped.durationMinutes, 90);
  assert.equal(mapped.durationLabel, '1h30');
  assert.equal(mapped.meetLink, 'https://meet.google.com/abc-defg-hij');
  assert.match(mapped.reminderSummary || '', /15 min/);
});

test('pickMeetUriFromGoogleEvent lê conferenceData', () => {
  const uri = pickMeetUriFromGoogleEvent({
    conferenceData: {
      entryPoints: [{ uri: 'https://meet.google.com/xyz-uvw-rst' }],
    },
  });
  assert.equal(uri, 'https://meet.google.com/xyz-uvw-rst');
});

test('extractGoogleEventReminders useDefault', () => {
  const r = extractGoogleEventReminders({ reminders: { useDefault: true } });
  assert.equal(r.length, 1);
  assert.match(r[0].label, /Padrão/);
});

test('formatDurationLabelPtBr', () => {
  assert.equal(formatDurationLabelPtBr(60), '1h');
  assert.equal(formatDurationLabelPtBr(90), '1h30');
});

test('computeGoogleEventDurationMinutes ignora dia inteiro', () => {
  assert.equal(
    computeGoogleEventDurationMinutes({
      start: { date: '2026-05-28' },
      end: { date: '2026-05-29' },
    }),
    null,
  );
});
