'use client';

import { Button, Card, CardHeader } from '@/components/ui';
import s from './dashboard.module.css';

export function QuickActions({ onNew }) {
  return (
    <Card aria-labelledby="actions-title">
      <CardHeader title="Ações rápidas" id="actions-title" />
      <div className={s.actions}>
        <Button icon="plus" block onClick={() => onNew(null)}>
          Nova transação
        </Button>
        <div className={s.actionRow}>
          <Button variant="outline" icon="arrow-up-right" onClick={() => onNew('entrada')}>
            Receita
          </Button>
          <Button variant="outline" icon="arrow-down-right" onClick={() => onNew('saida')}>
            Despesa
          </Button>
        </div>
      </div>
    </Card>
  );
}
