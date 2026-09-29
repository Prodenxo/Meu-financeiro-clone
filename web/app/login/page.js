import { redirect } from 'next/navigation';
import { getSupabasePublicEnv } from '@/lib/supabase/env';
import { AuthShell, LegalFooter } from '@/components/auth/AuthShell';
import { LoginForm } from './LoginForm';

export const metadata = { title: 'Entrar' };

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  const convite = typeof params?.convite === 'string' ? params.convite.trim() : '';
  // Link de convite que caiu no login vai direto para o cadastro (igual ao app).
  if (convite) redirect(`/register?convite=${encodeURIComponent(convite)}`);

  const next = typeof params?.next === 'string' ? params.next : '';
  const { configured } = getSupabasePublicEnv();

  return (
    <AuthShell eyebrow="Meu Financeiro" title="Bem-vindo de volta" subtitle="Faça login para acessar sua conta." footer={<LegalFooter />}>
      <LoginForm next={next} configured={configured} />
    </AuthShell>
  );
}
