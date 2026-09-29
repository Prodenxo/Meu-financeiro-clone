import { AuthShell } from '@/components/auth/AuthShell';
import { ResetPasswordForm } from './ResetPasswordForm';

export const metadata = { title: 'Redefinir senha' };

export default function ResetPasswordPage() {
  return (
    <AuthShell eyebrow="Recuperação" title="Redefinir senha" subtitle="Escolha uma senha forte para concluir a recuperação.">
      <ResetPasswordForm />
    </AuthShell>
  );
}
