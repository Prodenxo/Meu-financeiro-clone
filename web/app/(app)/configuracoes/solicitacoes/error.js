'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button, Card, EmptyState } from '@/components/ui';

export default function SolicitacoesError({ error, reset }) {
  useEffect(() => {
    console.error('[solicitacoes]', error);
  }, [error]);

  return (
    <Card>
      <EmptyState
        icon="alert-circle"
        title="Não foi possível carregar as solicitações"
        text="Tente novamente em alguns instantes."
        action={(
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button variant="outline" icon="refresh-cw" onClick={() => reset()}>
              Tentar de novo
            </Button>
            <Link href="/configuracoes">
              <Button variant="ghost">Voltar para Configurações</Button>
            </Link>
          </div>
        )}
      />
    </Card>
  );
}
