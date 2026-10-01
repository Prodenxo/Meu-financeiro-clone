import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth/session';
import { loadTutorialById } from '@/lib/data/tutoriais';
import { canManageTutorials } from '@/lib/tutoriais/tutoriais';
import { AccessDenied } from '@/components/tutoriais/AccessDenied';
import { TutorialForm } from '@/components/tutoriais/TutorialForm';
import { Alert } from '@/components/ui';
import t from '@/components/transactions/transactions.module.css';
import s from '@/components/tutoriais/tutoriais.module.css';

export const dynamic = 'force-dynamic';

export default async function EditarTutorialPage({ params }) {
  const session = await requireUser();
  if (!canManageTutorials(session.role)) return <AccessDenied />;

  const { id } = await params;
  const { tutorial, unavailable } = await loadTutorialById(session.supabase, id);
  if (unavailable) {
    return (
      <div className={s.page}>
        <Alert tone="info">A central de tutoriais ainda não está disponível neste ambiente.</Alert>
      </div>
    );
  }
  if (!tutorial) notFound();

  return (
    <div className={s.page}>
      <header>
        <p className={t.crumb}>Meu espaço / Tutoriais</p>
        <h1 className={t.title}>Editar tutorial</h1>
        <p className={t.subtitle}>{tutorial.publicado ? 'Publicado' : 'Rascunho'}</p>
      </header>
      <TutorialForm tutorial={tutorial} />
    </div>
  );
}
