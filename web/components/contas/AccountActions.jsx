'use client';

import { Button, Card, CardHeader, Pill } from '@/components/ui';
import d from '@/components/dashboard/dashboard.module.css';
import s from './contas.module.css';

/**
 * Ações rápidas. "Conectar banco" e "Importar extrato" ainda não existem no produto
 * (nenhuma integração no app atual) — ficam visíveis como "Em breve", sem link falso.
 */
export function AccountActions({ onNew }) {
  return (
    <Card aria-labelledby="acc-actions-title">
      <CardHeader title="Ações rápidas" id="acc-actions-title" />
      <div className={d.actions}>
        <Button icon="plus" block onClick={onNew}>
          Nova conta
        </Button>
        <Button variant="outline" icon="landmark" block disabled title="Ainda não disponível">
          Conectar banco
          <Pill tone="neutral" className={s.soonPill}>
            Em breve
          </Pill>
        </Button>
        <Button variant="outline" icon="file-text" block disabled title="Ainda não disponível">
          Importar extrato
          <Pill tone="neutral" className={s.soonPill}>
            Em breve
          </Pill>
        </Button>
      </div>
    </Card>
  );
}
