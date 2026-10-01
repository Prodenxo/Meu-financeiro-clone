import { requireUser } from '@/lib/auth/session';
import { loadPublishedTutorials } from '@/lib/data/tutoriais';
import { canManageTutorials } from '@/lib/tutoriais/tutoriais';
import { TutoriaisView } from '@/components/tutoriais/TutoriaisView';

export const metadata = { title: 'Tutoriais' };
export const dynamic = 'force-dynamic';

export default async function TutoriaisPage() {
  const session = await requireUser();
  const { tutorials, unavailable } = await loadPublishedTutorials(session.supabase);
  return <TutoriaisView tutorials={tutorials} canManage={canManageTutorials(session.role)} unavailable={unavailable} />;
}
