'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { signUpWithInviteAction } from '@/lib/auth/actions';
import { Alert, Button, Field, Input } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { PasswordInput, PhoneInput, RequiredMark, StrongPasswordRules } from '@/components/auth/fields';
import s from '@/components/auth/auth.module.css';

export function RegisterForm({ convite, empresaName }) {
  const [state, formAction, pending] = useActionState(signUpWithInviteAction, null);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');

  if (state?.needsEmailConfirmation) {
    return (
      <div className={s.success} role="status">
        <span className={s.successIcon}>
          <Icon name="check" size={34} strokeWidth={2.4} />
        </span>
        <h2 className={s.successTitle}>Conta criada!</h2>
        <p className={s.successText}>{state.message}</p>
        <Link href="/login" className={s.link}>
          Ir para o login
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className={s.form} noValidate>
      <input type="hidden" name="convite" value={convite} />

      {empresaName ? (
        <div className={s.banner}>
          <Icon name="check" size={18} strokeWidth={2.4} />
          <span>
            Você foi convidado pela empresa <strong>{empresaName}</strong> para o sistema.
          </span>
        </div>
      ) : null}

      <Field
        label={
          <>
            E-mail
            <RequiredMark />
          </>
        }
        htmlFor="rg-email"
      >
        <Input id="rg-email" name="email" type="email" autoComplete="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field
        label={
          <>
            Nome completo
            <RequiredMark />
          </>
        }
        htmlFor="rg-name"
      >
        <Input id="rg-name" name="displayName" autoComplete="name" placeholder="Seu nome completo" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      </Field>
      <Field
        label={
          <>
            Telefone
            <RequiredMark />
          </>
        }
        htmlFor="rg-phone"
      >
        <PhoneInput id="rg-phone" name="phone" />
      </Field>
      <div>
        <Field
          label={
            <>
              Senha
              <RequiredMark />
            </>
          }
          htmlFor="rg-pwd"
        >
          <PasswordInput
            id="rg-pwd"
            name="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-describedby="rg-pwd-rules"
          />
        </Field>
        <StrongPasswordRules password={password} id="rg-pwd-rules" />
      </div>

      {state?.error ? <Alert tone="error">{state.error}</Alert> : null}

      <Button type="submit" block disabled={pending} aria-busy={pending}>
        {pending ? 'Cadastrando…' : 'Cadastrar'}
      </Button>
      <p className={s.bottomText}>
        Já tem uma conta?{' '}
        <Link href="/login" className={s.link}>
          Faça login
        </Link>
      </p>
    </form>
  );
}
