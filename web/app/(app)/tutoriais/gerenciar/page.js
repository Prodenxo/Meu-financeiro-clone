import { requireUser } from '@/lib/auth/session';
import { loadAllTutorials } from '@/lib/data/tutoriais';
import { canManageTutorials } from '@/lib/tutoriais/tutoriais';
import { AccessDenied } from '@/components/tutoriais/AccessDenied';
import { TutoriaisAdmin } from '@/components/tutoriais/TutoriaisAdmin';

export const metadata = { title: 'Gerenciar tutoriais' };
export const dynamic = 'force-dynamic';

export default async function GerenciarTutoriaisPage({ searchParams }) {
  const session = await requireUser();
  if (!canManageTutorials(session.role)) return <AccessDenied />;

  const params = await searchParams;
  const { tutorials, unavailable } = await loadAllTutorials(session.supabase);
  const notice = params?.aviso === 'salvo' ? 'Tutorial salvo.' : '';
  return <TutoriaisAdmin tutorials={tutorials} notice={notice} unavailable={unavailable} />;
}
