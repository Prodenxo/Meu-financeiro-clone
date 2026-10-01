import Link from 'next/link';
import { requireUser } from '@/lib/auth/session';
import { canManageTutorials } from '@/lib/tutoriais/tutoriais';
import { AccessDenied } from '@/components/tutoriais/AccessDenied';
import { TutorialForm } from '@/components/tutoriais/TutorialForm';
import t from '@/components/transactions/transactions.module.css';
import s from '@/components/tutoriais/tutoriais.module.css';

export const metadata = { title: 'Novo tutorial' };
export const dynamic = 'force-dynamic';

export default async function NovoTutorialPage() {
  const session = await requireUser();
  if (!canManageTutorials(session.role)) return <AccessDenied />;

  return (
    <div className={s.page}>
      <header>
        <p className={t.crumb}>Meu espaço / Tutoriais</p>
        <h1 className={t.title}>Novo tutorial</h1>
        <p className={t.subtitle}>Salve como rascunho ou publique quando o conteúdo estiver pronto.</p>
      </header>
      <TutorialForm />
      <Link className={s.back} href="/tutoriais/gerenciar">Voltar</Link>
    </div>
  );
}
