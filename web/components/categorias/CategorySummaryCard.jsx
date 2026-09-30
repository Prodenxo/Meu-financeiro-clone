'use client';

import { IconBubble, cx } from '@/components/ui';
import t from '@/components/transactions/transactions.module.css';
import s from './categorias.module.css';

/** Card de resumo da tela Categorias — mesma anatomia dos KPIs de Transações/Orçamentos. */
export function CategorySummaryCard({ label, icon, iconTone, value, valueClass, hint, chart }) {
  return (
    <article className={t.kpi} aria-label={label}>
      <div className={t.kpiHead}>
        <IconBubble name={icon} tone={iconTone} size={32} iconSize={16} />
        <span className={t.kpiLabel}>{label}</span>
      </div>
      <div className={t.kpiBody}>
        <div className={t.kpiText}>
          <span className={cx(t.kpiValue, valueClass)} title={typeof value === 'string' ? value : undefined}>
            {value}
          </span>
          <span className={t.kpiHint} title={hint}>
            {hint}
          </span>
        </div>
        <div className={cx(t.kpiChart, s.kpiChart)}>{chart}</div>
      </div>
    </article>
  );
}
