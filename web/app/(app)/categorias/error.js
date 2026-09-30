'use client';

import { useEffect } from 'react';
import { Button, Card, EmptyState } from '@/components/ui';

export default function CategoriasError({ error, reset }) {
  useEffect(() => {
    console.error('[categorias]', error);
  }, [error]);

  return (
    <Card>
      <EmptyState
        icon="alert-circle"
        title="Não foi possível carregar as categorias"
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
