'use client';

import { useFormStatus } from 'react-dom';
import { signOutAction } from '@/lib/auth/actions';
import { Icon } from '@/components/ui/Icon';
import s from './configuracoes.module.css';
import { SettingsCard } from './SettingsCard';

function SignOutButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={s.signOutBtn} disabled={pending} aria-busy={pending}>
      <Icon name="log-out" size={18} />
      {pending ? 'Saindo…' : 'Sair da conta'}
    </button>
  );
}

/** Sessão — mesmo `signOutAction` da sidebar (Supabase `signOut` + redirect para /login). */
export function SessionCard() {
  return (
    <SettingsCard id="sessao" icon="log-out" iconTone="danger" title="Sessão" description="Encerre o acesso neste dispositivo.">
      <form action={signOutAction}>
        <SignOutButton />
      </form>
    </SettingsCard>
  );
}
