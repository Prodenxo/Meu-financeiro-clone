'use client';

import { Pill, Progress } from '@/components/ui';
import s from './orcamentos.module.css';

const TONE_COLOR = {
  danger: 'var(--mf-danger)',
  success: 'var(--mf-success)',
  warning: 'var(--mf-warning)',
  neutral: 'var(--mf-primary)',
};

export function budgetBarColor(item) {
  if (item.status.key === 'over') return TONE_COLOR.danger;
  if (item.tipo === 'entrada') return item.status.key === 'ok' ? TONE_COLOR.success : TONE_COLOR.neutral;
  return item.color;
}

export function BudgetStatusPill({ item }) {
  const icon = item.status.key === 'over' ? 'alert-circle' : item.status.key === 'ok' ? 'check' : 'clock';
  return (
    <Pill tone={item.status.tone} icon={icon}>
      {item.status.label}
    </Pill>
  );
}

/** Barra de uso do orçamento com percentual e situação (limite estourado em vermelho). */
export function BudgetProgress({ item, showStatus = true }) {
  const pct = Math.round(item.percentual);
  return (
    <div className={s.progressCol}>
      <div className={s.progressRow}>
        <Progress value={item.barPct} color={budgetBarColor(item)} label={`${item.nome}: ${pct}% do orçamento`} />
        <span className={s.progressPct}>{pct}%</span>
      </div>
      {showStatus ? (
        <div>
          <BudgetStatusPill item={item} />
        </div>
      ) : null}
    </div>
  );
}
