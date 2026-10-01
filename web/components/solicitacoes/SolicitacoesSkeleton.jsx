import { Card, Skeleton } from '@/components/ui';
import a from '@/components/acessos/acessos.module.css';
import t from '@/components/transactions/transactions.module.css';
import c from './solicitacoes.module.css';

/** Carregamento (inclui a verificação de permissão no servidor): nada de contador nem lista ainda. */
export function SolicitacoesSkeleton() {
  return (
    <div className={a.page} aria-busy="true" aria-label="Carregando solicitações de acesso">
      <header className={t.header}>
        <div>
          <Skeleton width={300} height={12} />
          <Skeleton width={260} height={28} style={{ marginTop: 10 }} />
          <Skeleton width={300} height={14} style={{ marginTop: 10 }} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Skeleton width={180} height={36} radius={999} />
          <Skeleton width={110} height={40} radius={12} />
        </div>
      </header>
      <Card className={c.panel}>
        <div className={c.tabs} style={{ alignItems: 'center', height: 52 }}>
          <Skeleton width={110} height={16} />
          <Skeleton width={90} height={16} />
        </div>
        <div className={c.content}>
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} height={96} radius={12} style={{ marginTop: i ? 12 : 0 }} />
          ))}
        </div>
      </Card>
    </div>
  );
}
