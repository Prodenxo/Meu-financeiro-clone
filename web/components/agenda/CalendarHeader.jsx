'use client';

import { cx } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { VIEW_MODES } from '@/lib/finance/agenda';
import t from '@/components/transactions/transactions.module.css';
import s from './agenda.module.css';

/** Controle central de período (< Setembro de 2026 >) + seletor Mês / Semana / Dia. */
export function CalendarHeader({ label, view, onPrev, onNext, onView }) {
  return (
    <>
      <div className={s.periodBar}>
        <div className={t.monthPicker} role="group" aria-label="Período">
          <button type="button" className={t.monthNav} onClick={onPrev} aria-label="Período anterior">
            <Icon name="chevron-left" size={16} />
          </button>
          <span className={t.monthLabel} aria-live="polite">
            {label}
          </span>
          <button type="button" className={t.monthNav} onClick={onNext} aria-label="Próximo período">
            <Icon name="chevron-right" size={16} />
          </button>
        </div>
      </div>

      <div className={s.viewTabs} role="tablist" aria-label="Visualização">
        {VIEW_MODES.map((opt) => (
          <button key={opt.value} type="button" role="tab" aria-selected={view === opt.value} className={cx(s.viewTab)} onClick={() => onView(opt.value)}>
            {opt.label}
          </button>
        ))}
      </div>
    </>
  );
}
