import { Card, Skeleton } from '@/components/ui';
import t from '@/components/transactions/transactions.module.css';
import s from './configuracoes.module.css';

function CardSkeleton({ rows = 3 }) {
  return (
    <Card>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
        <Skeleton width={36} height={36} radius={999} />
        <div style={{ display: 'grid', gap: 6, flex: 1 }}>
          <Skeleton width={120} height={16} />
          <Skeleton width={200} height={12} />
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height={42} radius={12} style={{ marginTop: i ? 12 : 0 }} />
      ))}
    </Card>
  );
}

/** Esqueleto com a mesma malha 60/40 da tela Configurações. */
export function ConfiguracoesSkeleton() {
  return (
    <div className={s.page} aria-busy="true" aria-live="polite">
      <header className={t.header}>
        <div style={{ display: 'grid', gap: 8 }}>
          <Skeleton width={140} height={12} />
          <Skeleton width={200} height={28} />
          <Skeleton width={320} height={14} />
        </div>
      </header>
      <div className={s.layout}>
        <div className={s.col}>
          <CardSkeleton rows={3} />
          <CardSkeleton rows={2} />
          <CardSkeleton rows={1} />
        </div>
        <div className={s.col}>
          <CardSkeleton rows={3} />
          <CardSkeleton rows={2} />
          <CardSkeleton rows={1} />
        </div>
      </div>
    </div>
  );
}
