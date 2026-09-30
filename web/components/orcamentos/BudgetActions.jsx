'use client';

import { Button, Card, CardHeader } from '@/components/ui';
import d from '@/components/dashboard/dashboard.module.css';
import s from './orcamentos.module.css';

/**
 * Ações rápidas: novo orçamento, copiar os limites deste mês (e colar em outro)
 * e ajustar limites (vai para a lista completa, onde cada limite pode ser editado).
 */
export function BudgetActions({ onNew, onCopy, onPaste, onAdjust, canPaste, canCopy, busy }) {
  return (
    <Card aria-labelledby="budget-actions-title">
      <CardHeader title="Ações rápidas" id="budget-actions-title" />
      <div className={d.actions}>
        <Button icon="plus" block onClick={onNew} disabled={busy}>
          Novo orçamento
        </Button>
        <div className={s.quickRow}>
          {canPaste ? (
            <Button variant="outline" icon="clipboard-paste" onClick={onPaste} disabled={busy} title="Colar os limites copiados neste mês">
              Colar orçamento
            </Button>
          ) : (
            <Button variant="outline" icon="copy" onClick={onCopy} disabled={busy || !canCopy} title={canCopy ? 'Copiar os limites deste mês para colar em outro' : 'Este mês não tem orçamentos para copiar'}>
              Copiar orçamento
            </Button>
          )}
          <Button variant="outline" icon="sliders-horizontal" onClick={onAdjust} title="Ir para a lista completa e editar os limites">
            Ajustar limites
          </Button>
        </div>
      </div>
    </Card>
  );
}
