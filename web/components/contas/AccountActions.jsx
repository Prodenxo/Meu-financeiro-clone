'use client';

import { Suspense } from 'react';
import { Button, Card, CardHeader } from '@/components/ui';
import d from '@/components/dashboard/dashboard.module.css';
import { OpenFinanceShop } from './OpenFinanceShop';

/** Ações rápidas: nova conta manual e loja Open Finance (Stripe). */
export function AccountActions({ onNew, onOpenFinanceSynced }) {
  return (
    <Card aria-labelledby="acc-actions-title">
      <CardHeader title="Ações rápidas" id="acc-actions-title" />
      <div className={d.actions}>
        <Button icon="plus" block onClick={onNew}>
          Nova conta
        </Button>
        <Suspense
          fallback={
            <Button variant="outline" icon="shopping-cart" block disabled>
              Open Finance
            </Button>
          }
        >
          <OpenFinanceShop block onSynced={onOpenFinanceSynced} />
        </Suspense>
      </div>
    </Card>
  );
}
