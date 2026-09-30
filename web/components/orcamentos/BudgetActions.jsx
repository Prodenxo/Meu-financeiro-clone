'use client';

import { Button, Card, CardHeader } from '@/components/ui';
import d from '@/components/dashboard/dashboard.module.css';
import s from './orcamentos.module.css';

/**
 * Ações rápidas: novo orçamento, copiar limites do mês anterior (mesma função
 * "Duplicar mês" do app atual) e ajustar limites (vai para a lista completa, onde
 * cada limite pode ser editado).
 */
export function BudgetActions({ onNew, onCopy, onAdjust, busy }) {
  return (
    <Card aria-labelledby="budget-actions-title">
      <CardHeader title="Ações rápidas" id="budget-actions-title" />
      <div className={d.actions}>
        <Button icon="plus" block onClick={onNew} disabled={busy}>
          Novo orçamento
        </Button>
        <div className={s.quickRow}>
          <Button variant="outline" icon="copy" onClick={onCopy} disabled={busy} title="Copiar os limites do mês anterior para este mês">
            Copiar orçamento
          </Button>
          <Button variant="outline" icon="sliders-horizontal" onClick={onAdjust} title="Ir para a lista completa e editar os limites">
            Ajustar limites
          </Button>
        </div>
      </div>
    </Card>
  );
}
