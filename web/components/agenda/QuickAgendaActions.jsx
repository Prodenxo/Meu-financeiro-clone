'use client';

import { Button, Card, CardHeader } from '@/components/ui';
import s from './agenda.module.css';

/** Ações rápidas: novo compromisso, lembrete (evento de dia inteiro) e pagamento (lançamento). */
export function QuickAgendaActions({ onNew, onReminder, onPayment, busy }) {
  return (
    <Card aria-labelledby="agenda-actions-title">
      <CardHeader title="Ações rápidas" id="agenda-actions-title" />
      <div className={s.quickActions}>
        <Button icon="plus" block onClick={onNew} disabled={busy}>
          Novo compromisso
        </Button>
        <Button variant="outline" icon="bell" block onClick={onReminder} disabled={busy}>
          Criar lembrete
        </Button>
        <Button variant="outline" icon="receipt" block onClick={onPayment} disabled={busy}>
          Adicionar pagamento
        </Button>
      </div>
    </Card>
  );
}
