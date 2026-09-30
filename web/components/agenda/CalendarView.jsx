'use client';

import { Card, CardHeader, EmptyState, cx } from '@/components/ui';
import { formatBrl } from '@/lib/finance/format';
import { AGENDA_KINDS, KIND_ORDER, WEEKDAY_HEADERS, buildMonthGrid, dotsByDay, itemsOfDay, weekDays, weekdayShort } from '@/lib/finance/agenda';
import { CalendarDay } from './CalendarDay';
import s from './agenda.module.css';

function chipMeta(item) {
  if (item.source === 'transaction') return `${item.isIncome ? '+' : '−'} ${formatBrl(item.amount)}`;
  return item.timeLabel;
}

/** Pílula compacta de evento (semana, dia, lista mobile). */
export function EventChip({ item, onOpen }) {
  return (
    <button type="button" className={s.chip} style={{ borderLeftColor: item.color, background: `${item.color}14` }} onClick={() => onOpen(item)} title={item.title}>
      <span className={s.chipTitle}>{item.title}</span>
      <span className={s.chipMeta}>{chipMeta(item)}</span>
    </button>
  );
}

function Legend() {
  return (
    <div className={s.legend} aria-label="Legenda">
      {KIND_ORDER.map((k) => (
        <span key={k} className={s.legendItem}>
          <span className={s.legendDot} style={{ background: AGENDA_KINDS[k].color }} aria-hidden="true" />
          {AGENDA_KINDS[k].label}
        </span>
      ))}
    </div>
  );
}

function MonthGrid({ month, items, selectedDay, todayKey, onSelect, onOpen }) {
  const cells = buildMonthGrid(month);
  const dots = dotsByDay(items);
  const daysWithItems = [...new Set(items.map((i) => i.dayKey))];

  return (
    <>
      <div className={s.calHead} aria-hidden="true">
        {WEEKDAY_HEADERS.map((w) => (
          <span key={w} className={s.calHeadCell}>
            {w}
          </span>
        ))}
      </div>
      <div className={s.calGrid} role="grid" aria-label="Calendário do mês">
        {cells.map((cell) => (
          <CalendarDay key={cell.key} cell={cell} dots={dots[cell.key] || []} isToday={cell.key === todayKey} isSelected={cell.key === selectedDay} onSelect={onSelect} />
        ))}
      </div>
      <Legend />

      {/* Mobile: o mês vira uma lista diária. */}
      <div className={s.mobileDays}>
        {daysWithItems.length === 0 ? (
          <EmptyState icon="calendar-days" title="Nenhum compromisso neste mês" text="Selecione outro mês ou crie um novo compromisso." />
        ) : (
          daysWithItems.map((key) => (
            <div key={key} className={s.mobileDay}>
              <button type="button" className={cx(s.dateBadge)} onClick={() => onSelect(key)} aria-label={`Selecionar ${key}`}>
                <span className={s.dateBadgeDay}>{Number(key.slice(8, 10))}</span>
                <span className={s.dateBadgeMon}>{weekdayShort(key)}</span>
              </button>
              <div className={s.mobileDayChips}>
                {itemsOfDay(items, key).map((item) => (
                  <EventChip key={item.id} item={item} onOpen={onOpen} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

function WeekGrid({ items, selectedDay, todayKey, onSelect, onOpen }) {
  const days = weekDays(selectedDay);
  return (
    <>
      <div className={s.weekGrid} role="list" aria-label="Semana">
        {days.map((key) => {
          const dayItems = itemsOfDay(items, key);
          const shown = dayItems.slice(0, 4);
          return (
            <div key={key} className={cx(s.weekCol, key === selectedDay && s.weekColSelected)} role="listitem">
              <button type="button" className={cx(s.weekColHead, key === todayKey && s.dayToday, key === selectedDay && s.daySelected)} onClick={() => onSelect(key)} aria-pressed={key === selectedDay}>
                <span className={s.weekDayName}>{weekdayShort(key)}</span>
                <span className={s.dayNum}>{Number(key.slice(8, 10))}</span>
              </button>
              {shown.map((item) => (
                <EventChip key={item.id} item={item} onOpen={onOpen} />
              ))}
              {dayItems.length > shown.length ? <span className={s.more}>+{dayItems.length - shown.length}</span> : null}
            </div>
          );
        })}
      </div>
      <Legend />
    </>
  );
}

function DayTimeline({ items, selectedDay, onOpen }) {
  const dayItems = itemsOfDay(items, selectedDay);
  if (dayItems.length === 0) {
    return <EmptyState icon="calendar-days" title="Nenhum compromisso neste dia" text="Selecione outro dia ou crie um novo compromisso." />;
  }
  const allDay = dayItems.filter((i) => !i.time);
  const timed = dayItems.filter((i) => i.time);
  return (
    <div className={s.dayTimeline}>
      {allDay.length ? (
        <div className={s.timeRow}>
          <span className={s.timeLabel}>Dia inteiro</span>
          <div className={s.mobileDayChips}>
            {allDay.map((item) => (
              <EventChip key={item.id} item={item} onOpen={onOpen} />
            ))}
          </div>
        </div>
      ) : null}
      {timed.map((item) => (
        <div key={item.id} className={s.timeRow}>
          <span className={s.timeLabel}>{item.time}</span>
          <div className={s.mobileDayChips}>
            <EventChip item={item} onOpen={onOpen} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Card "Calendário" com as três vistas (mês / semana / dia). */
export function CalendarView({ view, month, items, selectedDay, todayKey, onSelect, onOpen }) {
  return (
    <Card aria-labelledby="agenda-cal-title">
      <CardHeader title="Calendário" icon="calendar-days" iconTone="primary" id="agenda-cal-title" />
      {view === 'week' ? (
        <WeekGrid items={items} selectedDay={selectedDay} todayKey={todayKey} onSelect={onSelect} onOpen={onOpen} />
      ) : view === 'day' ? (
        <DayTimeline items={items} selectedDay={selectedDay} onOpen={onOpen} />
      ) : (
        <MonthGrid month={month} items={items} selectedDay={selectedDay} todayKey={todayKey} onSelect={onSelect} onOpen={onOpen} />
      )}
    </Card>
  );
}
