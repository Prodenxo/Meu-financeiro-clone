'use client';

import { cx } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import d from '@/components/dashboard/dashboard.module.css';
import s from './contas.module.css';

/**
 * Card de resumo da tela Contas — mesma estrutura do KpiCard da Visão geral
 * (cabeçalho → valor → descrição → rodapé) para manter altura e ritmo idênticos.
 */
export function AccountSummaryCard({ navy, label, icon, iconTone, value, hint, foot, extra }) {
  return (
    <article className={cx(d.kpi, navy && d.kpiNavy)} aria-label={label}>
      <div className={d.kpiHead}>
        <span className={d.kpiLabel}>{label}</span>
        <span className={cx(d.kpiIcon, iconTone === 'success' && d.kpiIconSuccess, iconTone === 'danger' && d.kpiIconDanger)}>
          <Icon name={icon} size={16} />
        </span>
      </div>
      <div className={d.kpiValueRow}>
        <span className={cx(d.kpiValue, s.kpiValueOverride)} title={typeof value === 'string' ? value : undefined}>
          {value}
        </span>
        {extra}
      </div>
      <p className={d.kpiHint} title={hint}>
        {hint}
      </p>
      <div className={d.kpiFoot}>{foot}</div>
    </article>
  );
}

/** Barras discretas com o saldo de cada conta (proporcional ao maior saldo). */
export function AccountsMiniBars({ cards }) {
  const values = cards.slice(0, 8).map((c) => Math.max(0, c.saldo));
  const max = Math.max(1, ...values);
  const maxIdx = values.indexOf(Math.max(...values));
  return (
    <div className={s.miniBars} aria-hidden="true">
      {values.map((v, i) => (
        <span key={cards[i].conta.id} className={cx(s.miniBar, i === maxIdx && s.miniBarStrong)} style={{ height: `${Math.max(12, (v / max) * 100)}%` }} />
      ))}
    </div>
  );
}
