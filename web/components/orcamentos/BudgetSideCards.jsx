'use client';

import { Card, CardHeader, EmptyState, IconBubble, cx } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { formatBrl } from '@/lib/finance/format';
import d from '@/components/dashboard/dashboard.module.css';
import t from '@/components/transactions/transactions.module.css';
import { CategoryIcon } from './BudgetCategoryCard';
import s from './orcamentos.module.css';

/** Categorias com maior uso do limite; clicar abre a edição. */
export function BudgetAttentionCard({ items, onSelect, onSeeAll }) {
  return (
    <Card aria-labelledby="budget-attention-title">
      <CardHeader title="Categorias em atenção" id="budget-attention-title" />
      {items.length === 0 ? (
        <EmptyState icon="target" title="Nenhuma categoria acompanhada" text="Crie um orçamento para acompanhar o uso do limite." />
      ) : (
        <>
          <div className={d.list} role="list">
            {items.map((item) => {
              const over = item.status.key === 'over';
              return (
                <button key={item.categorias_id} type="button" className={s.attentionRow} role="listitem" onClick={() => onSelect(item)} aria-label={`Editar orçamento de ${item.nome}`}>
                  <CategoryIcon item={item} className={s.tableCatIcon} size={14} />
                  <div className={d.listText}>
                    <span className={d.listTitle} title={item.nome}>
                      {item.nome}
                    </span>
                    <span className={d.listMeta}>{Math.round(item.percentual)}% do limite</span>
                  </div>
                  <span className={cx(d.listValue, over ? t.negative : undefined)}>{formatBrl(item.realizado)}</span>
                  <Icon name="chevron-right" size={16} className={s.attentionArrow} />
                </button>
              );
            })}
          </div>
          <div className={s.listFoot}>
            <button type="button" className={d.kpiFootLink} onClick={onSeeAll}>
              Ver todas <Icon name="arrow-right" size={13} />
            </button>
          </div>
        </>
      )}
    </Card>
  );
}

/** Totais do mês: orçado, realizado, diferença e percentual. */
export function BudgetMonthlySummary({ totals }) {
  const over = totals.diferenca < 0;
  const rows = [
    { icon: 'target', tone: 'primary', label: 'Total orçado', value: formatBrl(totals.orcado) },
    { icon: 'arrow-up-right', tone: 'success', label: 'Total realizado', value: formatBrl(totals.realizado) },
    { icon: 'alert-circle', tone: over ? 'danger' : 'success', label: 'Diferença', value: `${over ? '- ' : ''}${formatBrl(Math.abs(totals.diferenca))}`, className: over ? t.negative : t.positive },
    { icon: 'percent', tone: over ? 'danger' : 'primary', label: 'Percentual utilizado', value: `${Math.round(totals.percentual)}%`, className: over ? t.negative : undefined },
  ];
  return (
    <Card aria-labelledby="budget-summary-title">
      <CardHeader title="Resumo mensal" id="budget-summary-title" />
      <div className={d.list}>
        {rows.map((r) => (
          <div key={r.label} className={s.summaryRow}>
            <IconBubble name={r.icon} tone={r.tone} size={28} iconSize={14} />
            <span className={s.summaryLabel}>{r.label}</span>
            <span className={cx(s.summaryValue, r.className)}>{r.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
