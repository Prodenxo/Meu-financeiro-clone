'use client';

import { ArrowLink, Card, CardHeader, EmptyState, Progress } from '@/components/ui';
import { budgetTone } from '@/lib/finance/dashboard';
import { formatBrl } from '@/lib/finance/format';
import s from './dashboard.module.css';

const TONE_COLOR = {
  success: 'var(--mf-success)',
  warning: 'var(--mf-warning)',
  orange: '#f97316',
  danger: 'var(--mf-danger)',
};

const LIMIT = 4;

export function BudgetsCard({ budgets, hideValues }) {
  const sorted = [...budgets].sort((a, b) => b.percentual - a.percentual).slice(0, LIMIT);

  return (
    <Card aria-labelledby="budgets-title">
      <CardHeader title="Seus orçamentos" id="budgets-title" action={<ArrowLink href="/orcamentos">Ver todos</ArrowLink>} />
      {sorted.length === 0 ? (
        <EmptyState icon="target" title="Nenhum orçamento neste mês" text="Defina limites por categoria na tela de Orçamentos." />
      ) : (
        <div className={s.list}>
          {sorted.map((b) => {
            const tone = budgetTone(b);
            return (
              <div key={b.categorias_id} className={s.budget}>
                <div className={s.budgetHead}>
                  <span className={s.budgetName} title={b.nome}>
                    {b.nome}
                  </span>
                  <span className={s.budgetPct} style={{ color: TONE_COLOR[tone] }}>
                    {Math.round(b.percentual)}%
                  </span>
                </div>
                <Progress value={b.percentual} color={TONE_COLOR[tone]} label={`${b.nome}: ${Math.round(b.percentual)}% do orçamento`} />
                <p className={s.budgetMeta}>
                  {hideValues ? 'R$ ••••' : formatBrl(b.realizado)} de {hideValues ? 'R$ ••••' : formatBrl(b.orcado)}
                  {b.tipo === 'entrada' ? ' · meta de entrada' : ''}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
