import { Card, Skeleton } from '@/components/ui';
import d from '@/components/dashboard/dashboard.module.css';
import t from '@/components/transactions/transactions.module.css';
import s from './agenda.module.css';

/** Esqueleto com a mesma malha da tela Agenda. */
export function AgendaSkeleton() {
  return (
    <div className={s.page} aria-busy="true" aria-live="polite">
      <header className={t.header}>
        <div style={{ display: 'grid', gap: 8 }}>
          <Skeleton width={120} height={12} />
          <Skeleton width={160} height={28} />
          <Skeleton width={360} height={14} />
        </div>
        <Skeleton width={300} height={40} radius={12} />
      </header>

      <div className={s.periodBar}>
        <Skeleton width={240} height={40} radius={12} />
      </div>
      <Skeleton height={44} radius={16} />

      <div className={d.layout}>
        <div className={d.mainCol}>
          <Card>
            <Skeleton width={140} height={16} />
            <Skeleton height={380} radius={12} style={{ marginTop: 16 }} />
          </Card>
        </div>
        <aside className={d.asideCol}>
          <Card>
            <Skeleton width={200} height={16} />
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height={92} radius={12} style={{ marginTop: 12 }} />
            ))}
          </Card>
          <Card>
            <Skeleton width={120} height={16} />
            <Skeleton height={40} radius={12} style={{ marginTop: 14 }} />
            <Skeleton height={40} radius={12} style={{ marginTop: 8 }} />
          </Card>
        </aside>
      </div>

      <div className={s.bottomGrid}>
        {[0, 1, 2].map((i) => (
          <Card key={i}>
            <Skeleton width={180} height={16} />
            <Skeleton height={200} radius={12} style={{ marginTop: 16 }} />
          </Card>
        ))}
      </div>
    </div>
  );
}
