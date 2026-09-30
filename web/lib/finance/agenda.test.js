import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  addDays,
  buildAgendaItems,
  buildMonthGrid,
  dotsByDay,
  formToGooglePayload,
  formatDayFull,
  googleEventToForm,
  itemsOfWeek,
  monthSummary,
  periodLabel,
  startOfWeek,
  upcomingItems,
  validateGoogleForm,
  weekDays,
} from './agenda.js';

const month = { year: 2026, month: 9 };
const tx = (id, data, tipo, valor, classificacao, status = 'pago') => ({ id, data, tipo, valor, classificacao, status, obs: '' });
const gEvent = (id, start, end, summary, extra = {}) => ({ id, summary, start, end, ...extra });

describe('agenda — datas', () => {
  test('semana começa na segunda e grade tem 5 ou 6 semanas', () => {
    assert.equal(startOfWeek('2026-09-03'), '2026-08-31');
    assert.equal(startOfWeek('2026-09-06'), '2026-08-31'); // domingo
    assert.deepEqual(weekDays('2026-09-03').at(-1), '2026-09-06');
    const grid = buildMonthGrid(month);
    assert.equal(grid[0].key, '2026-08-31');
    assert.equal(grid[0].inMonth, false);
    assert.equal(grid.length, 35);
    assert.equal(grid.at(-1).key, '2026-10-04');
    assert.equal(addDays('2026-08-31', 1), '2026-09-01');
  });

  test('rótulos em português', () => {
    assert.equal(formatDayFull('2026-09-03'), 'Quinta-feira, 3 de setembro de 2026');
    assert.equal(periodLabel('month', month, '2026-09-03'), 'Setembro de 2026');
    assert.equal(periodLabel('week', month, '2026-09-03'), '31 ago – 6 set 2026');
  });
});

describe('agenda — itens', () => {
  const transactions = [
    tx('1', '2026-09-05', 'saída', 300, 'Energia elétrica', 'a_pagar'),
    tx('2', '2026-09-16', 'entrada', 500, 'PIX', 'recebido'),
    tx('3', '2026-08-30', 'saída', 99, 'Fora do mês'),
  ];
  const googleEvents = [
    gEvent('a', { dateTime: '2026-09-03T13:30:00Z' }, { dateTime: '2026-09-03T14:30:00Z' }, 'Reunião com Enzo', { colorId: '7' }),
    gEvent('b', { date: '2026-09-03' }, { date: '2026-09-04' }, 'Revisar orçamento'),
    gEvent('c', { dateTime: '2026-10-01T12:00:00Z' }, { dateTime: '2026-10-01T13:00:00Z' }, 'Outro mês'),
  ];
  const items = buildAgendaItems({ transactions, googleEvents, month });

  test('classifica por tipo, converte hora para o fuso do Brasil e ordena', () => {
    assert.deepEqual(
      items.map((i) => [i.dayKey, i.kind, i.time]),
      [
        ['2026-09-03', 'lembrete', null],
        ['2026-09-03', 'compromisso', '10:30'],
        ['2026-09-05', 'conta', null],
        ['2026-09-16', 'recebimento', null],
      ],
    );
    assert.equal(items[1].timeLabel, '10:30 – 11:30');
    assert.equal(items[1].color, '#039BE5');
    assert.equal(items[2].amount, 300);
    assert.equal(items[2].isDone, false);
  });

  test('pontinhos por dia, semana, próximos e resumo', () => {
    assert.deepEqual(dotsByDay(items)['2026-09-03'], ['compromisso', 'lembrete']);
    assert.equal(itemsOfWeek(items, '2026-09-01').length, 3);
    assert.deepEqual(upcomingItems(items, '2026-09-04', 2).map((i) => i.title), ['Energia elétrica', 'PIX']);
    // Mês passado: mostra os primeiros do mês.
    assert.equal(upcomingItems(items, '2026-10-20', 4).length, 4);
    const s = monthSummary(items);
    assert.equal(s.total, 4);
    assert.deepEqual(s.rows.map((r) => [r.id, r.count, Math.round(r.pct)]), [
      ['conta', 1, 25],
      ['compromisso', 1, 25],
      ['recebimento', 1, 25],
      ['lembrete', 1, 25],
    ]);
  });
});

describe('agenda — formulário do Google', () => {
  test('evento → formulário → payload (dia inteiro com fim exclusivo)', () => {
    const form = googleEventToForm(gEvent('b', { date: '2026-09-03' }, { date: '2026-09-04' }, 'Revisar orçamento', { reminders: { overrides: [{ minutes: 1440 }] } }));
    assert.equal(form.isAllDay, true);
    assert.equal(form.endDate, '2026-09-03');
    assert.equal(form.reminderMinutes, '1440');
    const payload = formToGooglePayload(form);
    assert.equal(payload.endDate, '2026-09-04');
    assert.equal(payload.reminderMinutes, 1440);
    assert.equal(payload.createMeetLink, false);
  });

  test('evento com hora e validação', () => {
    const form = googleEventToForm(gEvent('a', { dateTime: '2026-09-03T13:30:00Z' }, { dateTime: '2026-09-03T14:30:00Z' }, 'Reunião'));
    assert.equal(form.startTime, '10:30');
    assert.equal(form.endTime, '11:30');
    const payload = formToGooglePayload({ ...form, createMeetLink: true, reminderMinutes: '' });
    assert.equal(payload.startHour, 10);
    assert.equal(payload.endMinute, 30);
    assert.equal(payload.reminderMinutes, null);
    assert.equal(payload.createMeetLink, true);

    assert.deepEqual(Object.keys(validateGoogleForm({ ...form, title: '' })), ['title']);
    assert.deepEqual(Object.keys(validateGoogleForm({ ...form, endTime: '09:00' })), ['endTime']);
    assert.deepEqual(validateGoogleForm(form), {});
  });
});
