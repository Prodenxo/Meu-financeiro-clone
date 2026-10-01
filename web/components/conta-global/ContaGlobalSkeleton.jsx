import { Card, Skeleton } from '@/components/ui';
import d from '@/components/dashboard/dashboard.module.css';
import t from '@/components/transactions/transactions.module.css';
import s from './contaGlobal.module.css';

/** Esqueleto com a mesma malha da tela Conta global. */
export function ContaGlobalSkeleton() {
  return (
    <div className={s.page} aria-busy="true" aria-live="polite">
      <header className={t.header}>
        <div style={{ display: 'grid', gap: 8 }}>
          <Skeleton width={140} height={12} />
          <Skeleton width={180} height={28} />
          <Skeleton width={360} height={14} />
        </div>
        <Skeleton width={170} height={40} radius={12} />
      </header>

      <div className={s.kpis}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height={150} radius={16} />
        ))}
      </div>
      <Skeleton height={40} radius={12} />

      <div className={d.layout}>
        <div className={d.mainCol}>
          <Card>
            <div className={s.moedasHead}>
              <Skeleton width={140} height={18} />
              <Skeleton width={200} height={36} radius={10} />
            </div>
            <div className={s.moedasGrid}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} height={150} radius={16} />
              ))}
            </div>
          </Card>
        </div>
        <aside className={d.asideCol}>
          {[0, 1].map((i) => (
            <Card key={i}>
              <Skeleton width={180} height={16} />
              <Skeleton height={36} radius={10} style={{ marginTop: 14 }} />
              <Skeleton height={36} radius={10} style={{ marginTop: 8 }} />
              <Skeleton height={36} radius={10} style={{ marginTop: 8 }} />
            </Card>
          ))}
        </aside>
      </div>
    </div>
  );
}
