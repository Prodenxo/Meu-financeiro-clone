'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button, Card, EmptyState } from '@/components/ui';

export default function AcessosError({ error, reset }) {
  useEffect(() => {
    console.error('[acessos]', error);
  }, [error]);

  const denied = /permiss|forbidden|403/i.test(String(error?.message || ''));

  return (
    <Card>
      <EmptyState
        icon={denied ? 'shield-check' : 'alert-circle'}
        title={denied ? 'Acesso restrito' : 'Não foi possível carregar os acessos'}
        text={error?.message || 'Tente novamente em alguns instantes.'}
        action={(
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button variant="outline" icon="repeat" onClick={() => reset()}>
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
