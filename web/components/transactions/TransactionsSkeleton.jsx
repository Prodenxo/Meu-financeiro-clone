import { Card, Skeleton } from '@/components/ui';
import s from './transactions.module.css';

/** Esqueleto com a mesma malha da tela (evita "pulo" de layout ao carregar). */
export function TransactionsSkeleton() {
  return (
    <div className={s.page} aria-busy="true" aria-live="polite">
      <header className={s.header}>
        <div style={{ display: 'grid', gap: 8 }}>
          <Skeleton width={120} height={12} />
          <Skeleton width={200} height={28} />
          <Skeleton width={360} height={14} />
        </div>
        <Skeleton width={480} height={40} radius={12} />
      </header>

      <div className={s.kpis}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height={150} radius={16} />
        ))}
      </div>

      <Card>
        <Skeleton width={100} height={16} />
        <Skeleton height={36} radius={12} style={{ marginTop: 16 }} />
        <Skeleton height={36} radius={12} style={{ marginTop: 16 }} />
      </Card>

      <Card>
        <Skeleton width={240} height={16} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} height={44} style={{ marginTop: 12 }} />
        ))}
      </Card>
    </div>
  );
}
