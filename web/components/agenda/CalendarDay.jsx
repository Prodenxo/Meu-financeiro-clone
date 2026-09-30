'use client';

import { cx } from '@/components/ui';
import { AGENDA_KINDS, formatDayFull } from '@/lib/finance/agenda';
import s from './agenda.module.css';

/** Uma célula do calendário mensal: número do dia + pontinhos coloridos por tipo. */
export function CalendarDay({ cell, dots = [], isToday, isSelected, onSelect }) {
  const label = `${formatDayFull(cell.key)}${dots.length ? `, ${dots.map((k) => AGENDA_KINDS[k].label).join(', ')}` : ''}`;
  return (
    <button
      type="button"
      className={cx(s.dayCell, !cell.inMonth && s.dayOut, isToday && s.dayToday, isSelected && s.daySelected)}
      onClick={() => onSelect(cell.key)}
      aria-label={label}
      aria-pressed={isSelected}
      aria-current={isToday ? 'date' : undefined}
    >
      <span className={s.dayNum}>{cell.day}</span>
      <span className={s.dots} aria-hidden="true">
        {dots.map((k) => (
          <span key={k} className={s.dot} style={{ background: AGENDA_KINDS[k].color }} />
        ))}
      </span>
    </button>
  );
}
