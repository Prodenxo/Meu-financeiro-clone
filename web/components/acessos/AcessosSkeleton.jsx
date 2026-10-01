import { Card, Skeleton } from '@/components/ui';
import t from '@/components/transactions/transactions.module.css';
import s from './acessos.module.css';

export function AcessosSkeleton() {
  return (
    <div className={s.page} aria-busy="true" aria-label="Carregando acessos">
      <header className={t.header}>
        <div>
          <Skeleton width={260} height={12} />
          <Skeleton width={220} height={28} style={{ marginTop: 10 }} />
          <Skeleton width={340} height={14} style={{ marginTop: 10 }} />
        </div>
        <Skeleton width={150} height={40} radius={12} />
      </header>
      <div className={s.kpis}>
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} height={92} radius={16} />
        ))}
      </div>
      <Skeleton width={320} height={44} radius={12} />
      <Card>
        <div className={s.toolbar}>
          <Skeleton height={40} radius={12} style={{ flex: '1 1 280px' }} />
          <Skeleton width={150} height={40} radius={12} />
          <Skeleton width={150} height={40} radius={12} />
          <Skeleton width={120} height={40} radius={12} />
        </div>
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} height={56} style={{ marginTop: 8 }} />
        ))}
      </Card>
    </div>
  );
}
