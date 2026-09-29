import { Card, Skeleton } from '@/components/ui';
import s from './dashboard.module.css';

/** Esqueleto com a mesma malha da tela (evita "pulo" de layout ao carregar). */
export function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <header className={s.header}>
        <div style={{ display: 'grid', gap: 8 }}>
          <Skeleton width={120} height={12} />
          <Skeleton width={260} height={28} />
          <Skeleton width={220} height={14} />
        </div>
        <Skeleton width={230} height={38} radius={12} />
      </header>

      <div className={s.layout}>
        <div className={s.mainCol}>
          <div className={s.kpis}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height={156} radius={16} />
            ))}
          </div>
          <Card>
            <Skeleton width={160} height={16} />
            <Skeleton width={260} height={12} style={{ marginTop: 6 }} />
            <Skeleton height={240} radius={12} style={{ marginTop: 16 }} />
          </Card>
          <div className={s.indicators}>
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} height={62} radius={16} />
            ))}
          </div>
          <Card>
            <Skeleton width={200} height={16} />
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} height={44} style={{ marginTop: 12 }} />
            ))}
          </Card>
        </div>
        <aside className={s.asideCol}>
          {[0, 1, 2, 3].map((i) => (
            <Card key={i}>
              <Skeleton width={140} height={16} />
              <Skeleton height={80} style={{ marginTop: 12 }} radius={12} />
            </Card>
          ))}
        </aside>
      </div>
    </div>
  );
}
