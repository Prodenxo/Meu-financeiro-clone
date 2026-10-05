'use client';

import { Button, Card, CardHeader } from '@/components/ui';
import d from '@/components/dashboard/dashboard.module.css';
import { OpenFinanceConnect } from './OpenFinanceConnect';
/** Ações rápidas: nova conta e conectar banco (extrato entra automático via webhook/polling). */
export function AccountActions({ onNew, onOpenFinanceSynced }) {
  return (
    <Card aria-labelledby="acc-actions-title">
      <CardHeader title="Ações rápidas" id="acc-actions-title" />
      <div className={d.actions}>
        <Button icon="plus" block onClick={onNew}>
          Nova conta
        </Button>
        <OpenFinanceConnect block onSynced={onOpenFinanceSynced} />
      </div>
    </Card>
  );
}
