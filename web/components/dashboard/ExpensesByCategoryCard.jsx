'use client';

import { useState } from 'react';
import { Card, CardHeader, EmptyState, IconBubble, Segmented } from '@/components/ui';
import { formatBrl } from '@/lib/finance/format';
import { getCategoryIconName } from '@/lib/finance/categoryIcons';
import s from './dashboard.module.css';

const LIMIT = 6;

/** Despesas por categoria no mês (pagos × a pagar) — mantido do app atual. */
export function ExpensesByCategoryCard({ data, hideValues }) {
  const [tab, setTab] = useState('pagos');
  const list = tab === 'pagos' ? data.pagos : data.aPagar;
  const total = tab === 'pagos' ? data.totalPagos : data.totalAPagar;
  const top = list.slice(0, LIMIT);
  const max = top.length ? top[0].total : 0;

  return (
    <Card aria-labelledby="bycat-title">
      <CardHeader
        title="Despesas por categoria"
        id="bycat-title"
        action={
          <Segmented
            ariaLabel="Situação das despesas"
            value={tab}
            onChange={setTab}
            options={[
              { value: 'pagos', label: 'Pagos' },
              { value: 'aPagar', label: 'A pagar' },
            ]}
          />
        }
      />
      {top.length === 0 ? (
        <EmptyState
          icon="tag"
          title={tab === 'pagos' ? 'Nenhuma despesa paga no mês' : 'Nenhuma despesa a pagar no mês'}
        />
      ) : (
        <>
          <div className={s.list} role="list">
            {top.map((c) => (
              <div key={c.key} className={s.catRow} role="listitem">
                <IconBubble name={getCategoryIconName(c.nome)} tone="outline" size={28} iconSize={13} />
                <span className={s.catName} title={c.nome}>
                  {c.nome}
                </span>
                <div className={s.catBar} aria-hidden="true">
                  <div className={s.catBarFill} style={{ width: `${max > 0 ? (c.total / max) * 100 : 0}%` }} />
                </div>
                <span className={s.catValue}>{hideValues ? 'R$ ••••' : formatBrl(c.total)}</span>
              </div>
            ))}
          </div>
          <p className={s.budgetMeta}>
            Total {tab === 'pagos' ? 'pago' : 'a pagar'}: <strong>{hideValues ? 'R$ ••••' : formatBrl(total)}</strong>
            {list.length > LIMIT ? ` · ${list.length - LIMIT} outra${list.length - LIMIT === 1 ? '' : 's'} categoria${list.length - LIMIT === 1 ? '' : 's'}` : ''}
          </p>
        </>
      )}
    </Card>
  );
}
