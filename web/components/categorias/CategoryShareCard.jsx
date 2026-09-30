'use client';

import { Card, CardHeader, EmptyState, Progress, cx } from '@/components/ui';
import { formatBrl } from '@/lib/finance/format';
import t from '@/components/transactions/transactions.module.css';
import s from './categorias.module.css';

/** "Resumo por categoria": principais fatias do período + "Outras". */
export function CategoryShareCard({ distribution, viewTipo, onSeeAll }) {
  const valueClass = viewTipo === 'entrada' ? t.positive : t.negative;

  return (
    <Card aria-labelledby="cat-share-title">
      <CardHeader title="Resumo por categoria" icon="pie-chart" iconTone="primary" id="cat-share-title" />
      {distribution.length === 0 ? (
        <EmptyState icon="pie-chart" title="Sem movimentações" text="Nenhum lançamento neste mês para o tipo selecionado." />
      ) : (
        <>
          <div role="list">
            {distribution.map((slice) => (
              <div key={slice.id} className={s.shareRow} role="listitem">
                <div className={s.shareText}>
                  <span className={s.shareName} title={slice.nome}>
                    {slice.nome}
                  </span>
                  <Progress value={slice.pct} color={slice.color} label={`${slice.nome}: ${Math.round(slice.pct)}%`} />
                </div>
                <span className={s.sharePct}>{Math.round(slice.pct)}%</span>
                <span className={cx(s.shareValue, valueClass)}>{formatBrl(slice.valor)}</span>
              </div>
            ))}
          </div>
          <div className={s.listFoot}>
            <button type="button" className={t.linkButton} onClick={onSeeAll}>
              Ver todas
            </button>
          </div>
        </>
      )}
    </Card>
  );
}
