'use client';

import { ArrowLink, Card, CardHeader, EmptyState, IconBubble, cx } from '@/components/ui';
import { formatBrl } from '@/lib/finance/format';
import { getCategoryIconName } from '@/lib/finance/categoryIcons';
import d from '@/components/dashboard/dashboard.module.css';
import s from './contas.module.css';

/** Últimas movimentações vinculadas a contas — mesma lista das telas Visão geral / Transações. */
export function RecentAccountMovements({ items }) {
  return (
    <Card aria-labelledby="recent-acc-title">
      <CardHeader title="Últimas movimentações" id="recent-acc-title" />
      {items.length === 0 ? (
        <EmptyState icon="receipt" title="Nenhuma movimentação nas contas" text="Lançamentos vinculados a uma conta aparecem aqui." />
      ) : (
        <>
          <div className={d.list} role="list">
          {items.map((it) => {
            const entrada = it.tipo === 'entrada';
            return (
              <div key={it.id} className={d.listItem} role="listitem">
                <IconBubble name={getCategoryIconName(it.title)} tone={entrada ? 'success' : 'danger'} size={32} iconSize={15} />
                <div className={d.listText}>
                  <span className={d.listTitle} title={it.title}>
                    {it.title}
                  </span>
                  <span className={d.listMeta}>
                    {it.dateLabel}
                    {it.contaNome ? ` · ${it.contaNome}` : ''}
                  </span>
                </div>
                <span className={cx(d.listValue, entrada ? d.trendUp : d.trendDown)}>
                  {entrada ? '+' : '-'}
                  {formatBrl(it.valor)}
                </span>
              </div>
            );
          })}
          </div>
          <div className={s.listFoot}>
            <ArrowLink href="/transacoes">Ver todas as transações</ArrowLink>
          </div>
        </>
      )}
    </Card>
  );
}
