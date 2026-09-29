import { requireUser } from '@/lib/auth/session';
import { AppShell } from '@/components/shell/AppShell';
import { PendingApproval } from '@/components/shell/PendingApproval';

export default async function AppLayout({ children }) {
  const session = await requireUser();

  // Cadastro ainda aguardando aprovação do superadmin (paridade com `PendingApprovalScreen`).
  if (session.accessPending || session.accessError) {
    return <PendingApproval reason={session.accessError} />;
  }

  return <AppShell session={session}>{children}</AppShell>;
}
