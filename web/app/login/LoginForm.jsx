'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { signInAction } from '@/lib/auth/actions';
import { Alert, Button, Field, Input } from '@/components/ui';
import { PasswordInput } from '@/components/auth/fields';
import s from '@/components/auth/auth.module.css';

export function LoginForm({ next, configured }) {
  const [state, formAction, pending] = useActionState(signInAction, null);
  const [email, setEmail] = useState('');

  if (!configured) {
    return (
      <Alert tone="error">
        Supabase não configurado. Copie <code>web/.env.example</code> para <code>web/.env.local</code> e preencha{' '}
        <code>NEXT_PUBLIC_SUPABASE_URL</code> e <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
      </Alert>
    );
  }

  return (
    <form action={formAction} className={s.form} noValidate>
      <input type="hidden" name="next" value={next} />
      <Field label="E-mail" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>
      <Field label="Senha" htmlFor="password">
        <PasswordInput id="password" name="password" autoComplete="current-password" required placeholder="Sua senha" />
      </Field>
      <div className={s.rowBetween}>
        <Link href="/forgot" className={s.link}>
          Esqueci minha senha
        </Link>
      </div>

      {state?.error ? <Alert tone="error">{state.error}</Alert> : null}

      <Button type="submit" block disabled={pending} aria-busy={pending}>
        {pending ? 'Entrando…' : 'Entrar'}
      </Button>

      <div className={s.divider}>ou</div>

      <p className={s.bottomText}>
        Ainda não tem conta?{' '}
        <Link href="/solicitar-acesso" className={s.link}>
          Cadastre-se
        </Link>
      </p>
      <p className={s.bottomText}>
        Recebeu um convite da sua empresa? Abra o link do convite para criar a conta.
      </p>
    </form>
  );
}
