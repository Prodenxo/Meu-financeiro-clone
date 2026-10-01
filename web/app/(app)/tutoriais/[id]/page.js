import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth/session';
import { loadTutorialById } from '@/lib/data/tutoriais';
import { canManageTutorials, canReadTutorial } from '@/lib/tutoriais/tutoriais';
import { TutorialDetail } from '@/components/tutoriais/TutorialDetail';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const session = await requireUser();
  const { tutorial, unavailable } = await loadTutorialById(session.supabase, id);
  if (unavailable || !canReadTutorial(tutorial, session.role)) return { title: 'Tutorial' };
  return { title: tutorial.titulo };
}

export default async function TutorialPage({ params }) {
  const { id } = await params;
  const session = await requireUser();
  const { tutorial, unavailable } = await loadTutorialById(session.supabase, id);
  if (unavailable) {
    return <TutorialDetail tutorial={null} unavailable canManage={false} />;
  }
  if (!canReadTutorial(tutorial, session.role)) notFound();
  return <TutorialDetail tutorial={tutorial} canManage={canManageTutorials(session.role)} />;
}
