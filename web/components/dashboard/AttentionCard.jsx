'use client';

import { Card, CardHeader, EmptyState, IconBubble, Pill } from '@/components/ui';
import { formatBrl } from '@/lib/finance/format';
import s from './dashboard.module.css';

const LIMIT = 4;

/** Saídas do mês ainda não pagas (`status === 'a_pagar'`), mais antigas primeiro. */
export function AttentionCard({ pending, hideValues }) {
  const items = pending.items.slice(0, LIMIT);
  const rest = pending.items.length - items.length;

  return (
    <Card aria-labelledby="attention-title">
      <CardHeader
        title="Precisa de atenção"
        id="attention-title"
        action={
          pending.items.length > 0 ? (
            <Pill tone="warning">
              {pending.items.length} pendente{pending.items.length === 1 ? '' : 's'}
            </Pill>
          ) : null
        }
      />
      {items.length === 0 ? (
        <EmptyState icon="check" title="Tudo em dia" text="Nenhuma conta a pagar neste mês." />
      ) : (
        <>
          <ul className={s.list}>
            {items.map((item) => (
              <li key={item.id} className={s.listItem}>
                <IconBubble name="alert-circle" tone="warning" size={32} iconSize={15} />
                <div className={s.listText}>
                  <span className={s.listTitle} title={item.title}>
                    {item.title}
                  </span>
                  <span className={s.listMeta}>Vence em {item.dateLabel}</span>
                </div>
                <span className={s.listValue}>{hideValues ? 'R$ ••••' : formatBrl(item.valor)}</span>
              </li>
            ))}
          </ul>
          <p className={s.budgetMeta}>
            Total a pagar: <strong>{hideValues ? 'R$ ••••' : formatBrl(pending.total)}</strong>
            {rest > 0 ? ` · +${rest} outra${rest === 1 ? '' : 's'}` : ''}
          </p>
        </>
      )}
    </Card>
  );
}
