import Link from 'next/link';
import { AuthShell, LegalFooter } from '@/components/auth/AuthShell';
import { Alert } from '@/components/ui';
import { backendFetch } from '@/lib/auth/backendApi';
import { inviteStatusUserMessage } from '@/lib/auth/validation';
import { RegisterForm } from './RegisterForm';
import s from '@/components/auth/auth.module.css';

export const metadata = { title: 'Criar conta com convite' };

/** Valida o convite no servidor (`GET /api/invites/validate`, endpoint público). */
async function validateInvite(token) {
  try {
    const data = await backendFetch(`/invites/validate?token=${encodeURIComponent(token)}`);
    return { status: data?.status ?? 'invalid', empresaName: data?.empresaName ?? null };
  } catch (err) {
    console.warn('[register] validar convite falhou:', err?.message || err);
    return { status: 'network_error', empresaName: null };
  }
}

export default async function RegisterPage({ searchParams }) {
  const params = await searchParams;
  const convite = typeof params?.convite === 'string' ? params.convite.trim() : '';

  if (!convite) {
    return (
      <AuthShell eyebrow="Cadastro" title="Acesso restrito" subtitle="O cadastro direto é feito por convite da sua empresa.">
        <div className={s.form}>
          <Alert tone="error">Nenhum convite detectado.</Alert>
          <p className={s.bottomText}>
            Você precisa de um link de convite válido para criar a conta por aqui. Sem convite, faça a solicitação de
            acesso.
          </p>
          <p className={s.bottomText}>
            <Link href="/solicitar-acesso" className={s.link}>
              Cadastre-se
            </Link>{' '}
            ·{' '}
            <Link href="/login" className={s.link}>
              Voltar ao login
            </Link>
          </p>
        </div>
      </AuthShell>
    );
  }

  const invite = await validateInvite(convite);

  if (invite.status !== 'valid') {
    return (
      <AuthShell eyebrow="Convite" title="Criar conta com convite" subtitle="Use o link enviado pelo administrador da empresa.">
        <div className={s.form}>
          <Alert tone="error">{inviteStatusUserMessage(invite.status)}</Alert>
          <p className={s.bottomText}>
            Esta plataforma é exclusiva para convidados. Solicite um novo link ao administrador da sua empresa.
          </p>
          <p className={s.bottomText}>
            <Link href="/login" className={s.link}>
              Voltar ao login
            </Link>
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Convite"
      title="Criar conta com convite"
      subtitle="Use o link enviado pelo administrador da empresa."
      footer={<LegalFooter action="Cadastrar" />}
    >
      <RegisterForm convite={convite} empresaName={invite.empresaName} />
    </AuthShell>
  );
}
