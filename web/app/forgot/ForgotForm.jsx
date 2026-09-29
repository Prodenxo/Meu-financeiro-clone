'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { forgotPasswordAction } from '@/lib/auth/actions';
import { Alert, Button, Field, Input } from '@/components/ui';
import s from '@/components/auth/auth.module.css';

export function ForgotForm() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, null);
  const [email, setEmail] = useState('');

  return (
    <form action={formAction} className={s.form} noValidate>
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

      {state?.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state?.ok ? <Alert tone="success">{state.message}</Alert> : null}

      <Button type="submit" block disabled={pending} aria-busy={pending}>
        {pending ? 'Enviando…' : 'Enviar link de recuperação'}
      </Button>

      <p className={s.bottomText}>
        <Link href="/login" className={s.link}>
          Voltar ao login
        </Link>
      </p>
    </form>
  );
}
