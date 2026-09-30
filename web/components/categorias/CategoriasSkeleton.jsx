import { Card, Skeleton } from '@/components/ui';
import d from '@/components/dashboard/dashboard.module.css';
import t from '@/components/transactions/transactions.module.css';
import s from './categorias.module.css';

/** Esqueleto com a mesma malha da tela Categorias. */
export function CategoriasSkeleton() {
  return (
    <div className={s.page} aria-busy="true" aria-live="polite">
      <header className={t.header}>
        <div style={{ display: 'grid', gap: 8 }}>
          <Skeleton width={120} height={12} />
          <Skeleton width={180} height={28} />
          <Skeleton width={420} height={14} />
        </div>
        <Skeleton width={160} height={40} radius={12} />
      </header>

      <div className={t.kpis}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height={150} radius={16} />
        ))}
      </div>

      <Card>
        <Skeleton height={36} radius={10} />
        <Skeleton height={38} radius={10} style={{ marginTop: 12 }} />
      </Card>

      <div className={d.layout}>
        <div className={d.mainCol}>
          <Card>
            <Skeleton width={200} height={16} />
            <Skeleton width={360} height={12} style={{ marginTop: 8 }} />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} height={52} style={{ marginTop: 12 }} />
            ))}
          </Card>
        </div>
        <aside className={d.asideCol}>
          {[0, 1, 2].map((i) => (
            <Card key={i}>
              <Skeleton width={160} height={16} />
              <Skeleton height={40} radius={12} style={{ marginTop: 14 }} />
              <Skeleton height={40} radius={12} style={{ marginTop: 8 }} />
            </Card>
          ))}
        </aside>
      </div>

      <Card>
        <Skeleton width={280} height={16} />
        <Skeleton height={220} radius={12} style={{ marginTop: 16 }} />
      </Card>
    </div>
  );
}
