import { Card, Skeleton } from '@/components/ui';
import d from '@/components/dashboard/dashboard.module.css';
import t from '@/components/transactions/transactions.module.css';
import s from './contas.module.css';

/** Esqueleto com a mesma malha da tela Contas. */
export function ContasSkeleton() {
  return (
    <div className={s.page} aria-busy="true" aria-live="polite">
      <header className={t.header}>
        <div style={{ display: 'grid', gap: 8 }}>
          <Skeleton width={120} height={12} />
          <Skeleton width={160} height={28} />
          <Skeleton width={380} height={14} />
        </div>
        <Skeleton width={140} height={40} radius={12} />
      </header>

      <div className={d.layout}>
        <div className={d.mainCol}>
          <div className={s.summary}>
            <Skeleton height={150} radius={16} />
            <Skeleton height={150} radius={16} />
          </div>
          <Card>
            <Skeleton width={140} height={16} />
            <Skeleton width={300} height={12} style={{ marginTop: 8 }} />
            <div className={s.accountsGrid}>
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} height={196} radius={16} />
              ))}
            </div>
          </Card>
          <Card>
            <Skeleton width={260} height={16} />
            <Skeleton height={240} radius={12} style={{ marginTop: 16 }} />
          </Card>
        </div>
        <aside className={d.asideCol}>
          {[0, 1, 2].map((i) => (
            <Card key={i}>
              <Skeleton width={160} height={16} />
              <Skeleton height={40} radius={12} style={{ marginTop: 14 }} />
              <Skeleton height={40} radius={12} style={{ marginTop: 8 }} />
              <Skeleton height={40} radius={12} style={{ marginTop: 8 }} />
            </Card>
          ))}
        </aside>
      </div>
    </div>
  );
}
