'use client';

import { ArrowLink, Card, CardHeader, EmptyState, IconBubble, cx } from '@/components/ui';
import { formatBrl } from '@/lib/finance/format';
import { getCategoryIconName } from '@/lib/finance/categoryIcons';
import d from '@/components/dashboard/dashboard.module.css';
import s from './categorias.module.css';

/** Últimos lançamentos do mês (entradas e saídas) — mesmo padrão de Transações/Contas. */
export function RecentCategoryMovements({ items }) {
  return (
    <Card aria-labelledby="cat-recent-title">
      <CardHeader title="Últimas movimentações" icon="clock" iconTone="primary" id="cat-recent-title" />
      {items.length === 0 ? (
        <EmptyState icon="receipt" title="Sem movimentações" text="Nenhum lançamento neste mês." />
      ) : (
        <>
          <ul className={d.list}>
          {items.map((it) => {
            const up = it.tipo === 'entrada';
            return (
              <li key={it.id} className={d.listItem}>
                <IconBubble name={getCategoryIconName(it.title)} tone={up ? 'success' : 'danger'} size={34} iconSize={16} />
                <div className={d.listText}>
                  <span className={d.listTitle} title={it.title}>
                    {it.title}
                  </span>
                  <span className={d.listMeta}>{it.dateLabel}</span>
                </div>
                <span className={cx(d.listValue, up ? d.trendUp : d.trendDown)}>
                  {up ? '+' : '-'}
                  {formatBrl(it.valor)}
                </span>
              </li>
            );
          })}
          </ul>
          <div className={s.listFoot}>
            <ArrowLink href="/transacoes">Ver todas</ArrowLink>
          </div>
        </>
      )}
    </Card>
  );
}
