import { AuthShell } from '@/components/auth/AuthShell';
import { ForgotForm } from './ForgotForm';

export const metadata = { title: 'Recuperar senha' };

export default function ForgotPage() {
  return (
    <AuthShell eyebrow="Recuperação" title="Recuperar senha" subtitle="Digite seu e-mail para receber o link de recuperação.">
      <ForgotForm />
    </AuthShell>
  );
}
