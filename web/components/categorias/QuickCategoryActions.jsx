'use client';

import { Button, Card, CardHeader, Pill } from '@/components/ui';
import d from '@/components/dashboard/dashboard.module.css';
import c from '@/components/contas/contas.module.css';

/**
 * Ações rápidas. "Importar categorias" e "Gerenciar grupos" ainda não existem no produto
 * (app atual e API só separam categorias em entradas/saídas) — ficam como "Em breve", sem link falso.
 */
export function QuickCategoryActions({ onNew, busy }) {
  return (
    <Card aria-labelledby="cat-actions-title">
      <CardHeader title="Ações rápidas" id="cat-actions-title" />
      <div className={d.actions}>
        <Button icon="plus" block onClick={onNew} disabled={busy}>
          Nova categoria
        </Button>
        <Button variant="outline" icon="upload" block disabled title="Ainda não disponível">
          Importar categorias
          <Pill tone="neutral" className={c.soonPill}>
            Em breve
          </Pill>
        </Button>
        <Button variant="outline" icon="layers" block disabled title="Ainda não disponível">
          Gerenciar grupos
          <Pill tone="neutral" className={c.soonPill}>
            Em breve
          </Pill>
        </Button>
      </div>
    </Card>
  );
}
