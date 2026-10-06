'use client';

import { Suspense } from 'react';
import { Button, Card, CardHeader } from '@/components/ui';
import d from '@/components/dashboard/dashboard.module.css';
import { OpenFinanceShop } from './OpenFinanceShop';
import s from './contas.module.css';

/** Ações rápidas: nova conta manual e sincronização bancária automática. */
export function AccountActions({ onNew, onOpenFinanceSynced }) {
  return (
    <Card aria-labelledby="acc-actions-title">
      <CardHeader title="Ações rápidas" id="acc-actions-title" />
      <div className={d.actions}>
        <Button icon="plus" block onClick={onNew}>
          Nova conta (simulação)
        </Button>
        <p className={s.ofQuickHint}>Conta manual: você mesmo lança as movimentações.</p>
        <Suspense
          fallback={
            <Button variant="outline" icon="refresh-cw" block disabled>
              Conectar meu banco
            </Button>
          }
        >
          <OpenFinanceShop block onSynced={onOpenFinanceSynced} />
        </Suspense>
      </div>
    </Card>
  );
}
