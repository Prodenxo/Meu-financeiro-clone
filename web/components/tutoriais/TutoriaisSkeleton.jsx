import { Skeleton } from '@/components/ui';
import s from './tutoriais.module.css';

export function TutoriaisSkeleton() {
  return (
    <div className={s.page} aria-busy="true" aria-live="polite">
      <div>
        <Skeleton width={180} height={14} />
        <Skeleton width={280} height={32} style={{ marginTop: 8 }} />
        <Skeleton width={360} height={16} style={{ marginTop: 8 }} />
      </div>
      <Skeleton height={140} radius={16} />
      <Skeleton height={48} radius={12} />
      <div className={s.grid}>
        <Skeleton height={220} radius={16} />
        <Skeleton height={220} radius={16} />
        <Skeleton height={220} radius={16} />
      </div>
    </div>
  );
}
