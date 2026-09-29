'use client';

import { useEffect } from 'react';
import { Button, Card, EmptyState } from '@/components/ui';

export default function VisaoGeralError({ error, reset }) {
  useEffect(() => {
    console.error('[visao-geral]', error);
  }, [error]);

  return (
    <Card>
      <EmptyState
        icon="alert-circle"
        title="Não foi possível carregar a Visão geral"
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
