import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calendarDateTodayInSaoPaulo,
  isCalendarEventStillRelevant,
} from '../src/services/calendar-events.service.js';

test('isCalendarEventStillRelevant: reunião das 8h já passou hoje', () => {
  const today = calendarDateTodayInSaoPaulo();
  const noon = new Date(`${today}T12:00:00-03:00`);
  const morningMeeting = {
    date: today,
    time: '08:00:00',
    startAtIso: `${today}T08:00:00-03:00`,
    endAtIso: `${today}T09:00:00-03:00`,
    allDay: false,
    source: 'google',
  };
  assert.equal(isCalendarEventStillRelevant(morningMeeting, noon), false);
});

test('isCalendarEventStillRelevant: reunião das 15h ainda não passou ao meio-dia', () => {
  const today = calendarDateTodayInSaoPaulo();
  const noon = new Date(`${today}T12:00:00-03:00`);
  const afternoonMeeting = {
    date: today,
    time: '15:00:00',
    startAtIso: `${today}T15:00:00-03:00`,
    endAtIso: `${today}T16:00:00-03:00`,
    allDay: false,
    source: 'google',
  };
  assert.equal(isCalendarEventStillRelevant(afternoonMeeting, noon), true);
});
