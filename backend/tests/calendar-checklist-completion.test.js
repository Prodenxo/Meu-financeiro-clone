import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildCalendarEventKey,
  resolveCalendarEventFromPayload,
  resolveCompletionDateIso,
} from '../src/services/calendar-checklist-completion.service.js';

const events = [
  { id: 'evt-1', title: 'Stand-up', time: '09:00:00', date: '2099-06-16' },
  { id: 'evt-2', title: 'Reunião cliente', time: '14:00:00', date: '2099-06-16' },
  { id: 'evt-3', title: 'Reunião interna', time: '14:30:00', date: '2099-06-16' },
];

test('buildCalendarEventKey: id estável', () => {
  assert.equal(buildCalendarEventKey(events[0]), 'id:evt-1');
});

test('resolveCalendarEventFromPayload: por índice', () => {
  const r = resolveCalendarEventFromPayload(events, { index: 2 });
  assert.equal(r.event?.id, 'evt-2');
  assert.equal(r.matchedBy, 'index');
});

test('resolveCalendarEventFromPayload: título + hora', () => {
  const r = resolveCalendarEventFromPayload(events, { title: 'reunião', time: '14:00' });
  assert.equal(r.event?.id, 'evt-2');
  assert.equal(r.matchedBy, 'title_time');
});

test('resolveCalendarEventFromPayload: ambíguo', () => {
  const r = resolveCalendarEventFromPayload(events, { title: 'reunião' });
  assert.equal(r.ambiguous, true);
  assert.equal(r.candidates?.length, 2);
});

test('resolveCompletionDateIso: hoje ou omitido', () => {
  const iso = resolveCompletionDateIso({});
  assert.match(iso, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(resolveCompletionDateIso({ date: 'hoje' }), iso);
});

test('resolveCompletionDateIso: data explícita', () => {
  assert.equal(resolveCompletionDateIso({ date: '2099-12-25' }), '2099-12-25');
});
