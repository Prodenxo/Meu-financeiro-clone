'use client';

import { Icon } from '@/components/ui/Icon';
import { formatMonthLabel, MONTH_NAMES } from '@/lib/finance/format';
import { nextMonth, prevMonth } from '@/lib/finance/dashboard';
import { toMonthParam } from '@/lib/date';
import s from './dashboard.module.css';

const MONTHS_BACK = 24;

function monthOptions(currentMonth, selectedMonth) {
  const list = [];
  const seen = new Set();
  let cursor = nextMonth(currentMonth); // permite planejar o mês seguinte
  for (let i = 0; i < MONTHS_BACK + 2; i += 1) {
    const key = toMonthParam(cursor);
    seen.add(key);
    list.push({ key, ...cursor });
    cursor = prevMonth(cursor);
  }
  const selectedKey = toMonthParam(selectedMonth);
  if (!seen.has(selectedKey)) list.push({ key: selectedKey, ...selectedMonth });
  return list;
}

export function DashboardHeader({ greeting, userFirstName, selectedMonth, currentMonth, onChangeMonth, pending, legacyAppUrl }) {
  const options = monthOptions(currentMonth, selectedMonth);
  const selectedKey = toMonthParam(selectedMonth);

  const onSelect = (e) => {
    const [y, m] = e.target.value.split('-').map(Number);
    onChangeMonth({ year: y, month: m });
  };

  return (
    <header className={s.header}>
      <div>
        <p className={s.crumb}>Início / Visão geral</p>
        <h1 className={s.title}>
          {greeting}, {userFirstName}
        </h1>
        <p className={s.subtitle}>Veja como está seu dinheiro em {formatMonthLabel(selectedMonth).toLowerCase()}.</p>
      </div>

      <div className={s.headerActions}>
        <div className={s.monthPicker} role="group" aria-label="Mês de referência">
          <button
            type="button"
            className={s.monthNav}
            onClick={() => onChangeMonth(prevMonth(selectedMonth))}
            aria-label="Mês anterior"
            disabled={pending}
          >
            <Icon name="chevron-left" size={16} />
          </button>
          <select
            className={s.monthSelect}
            value={selectedKey}
            onChange={onSelect}
            aria-label="Escolher mês"
            disabled={pending}
          >
            {options.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {MONTH_NAMES[opt.month - 1].toLowerCase()} {opt.year}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={s.monthNav}
            onClick={() => onChangeMonth(nextMonth(selectedMonth))}
            aria-label="Próximo mês"
            disabled={pending}
          >
            <Icon name="chevron-right" size={16} />
          </button>
        </div>
        {legacyAppUrl ? (
          <a
            href={`${legacyAppUrl}/`}
            className={s.kpiFootLink}
            title="Visão BPO (matriz anual e gráficos) — abre no app atual"
            style={{ marginLeft: 8 }}
          >
            Visão BPO
            <Icon name="arrow-up-right" size={14} />
          </a>
        ) : null}
      </div>
    </header>
  );
}
