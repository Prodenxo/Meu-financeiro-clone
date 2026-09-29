'use client';

import { useEffect } from 'react';
import { Button, Card, EmptyState } from '@/components/ui';

export default function TransacoesError({ error, reset }) {
  useEffect(() => {
    console.error('[transacoes]', error);
  }, [error]);

  return (
    <Card>
      <EmptyState
        icon="alert-circle"
        title="Não foi possível carregar as transações"
        text={error?.message || 'Tente novamente em alguns instantes.'}
        action={
          <Button variant="outline" icon="repeat" onClick={() => reset()}>
            Tentar de novo
          </Button>
        }
      />
    </Card>
  );
}
