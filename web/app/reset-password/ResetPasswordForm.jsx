'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Alert, Button, Field } from '@/components/ui';
import { PasswordInput, RecoveryPasswordStrength, RequiredMark } from '@/components/auth/fields';
import {
  authErrorMessage,
  getPasswordStrength,
  validatePasswordMatch,
  validateRecoveryPassword,
} from '@/lib/auth/validation';
import s from '@/components/auth/auth.module.css';

const INVALID_LINK = 'Link inválido. Volte ao login e solicite nova recuperação de senha.';

/** Tokens podem vir na query (`token_hash`) e/ou no hash (`#access_token=…&type=recovery`). */
function parseRecoveryUrl() {
  const params = new URLSearchParams(window.location.search);
  new URLSearchParams(window.location.hash.replace(/^#/, '')).forEach((v, k) => params.set(k, v));
  if (params.get('type') !== 'recovery') return null;
  const tokenHash = params.get('token_hash') || '';
  if (tokenHash) return { tokenHash };
  const accessToken = params.get('access_token') || '';
  const refreshToken = params.get('refresh_token') || '';
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

function recoveryError(error) {
  const lower = authErrorMessage(error).toLowerCase();
  if (['network', 'fetch', 'internet', 'conex'].some((k) => lower.includes(k))) {
    return {
      status: 'network_error',
      message: 'Não foi possível comunicar com o servidor. Verifique sua internet e tente novamente.',
    };
  }
  if (['expired', 'invalid', 'jwt', 'token', 'expirou', 'inválid'].some((k) => lower.includes(k))) {
    return {
      status: 'expired_or_invalid_token',
      message: 'O link de recuperação está inválido ou expirou. Solicite um novo link na tela de login.',
    };
  }
  return {
    status: 'expired_or_invalid_token',
    message: 'Não foi possível validar o link de recuperação. Solicite um novo link e tente novamente.',
  };
}

let recoveryAttempt = null;

/**
 * O link só pode ser consumido uma vez (verifyOtp invalida o token e a URL é limpa),
 * então a tentativa fica em cache para sobreviver ao efeito duplo do StrictMode.
 */
function bootstrapRecovery() {
  const payload = parseRecoveryUrl();
  if (!payload && recoveryAttempt) return recoveryAttempt;
  try {
    window.history.replaceState({}, document.title, window.location.pathname);
  } catch {
    /* ignore */
  }
  recoveryAttempt = (async () => {
    if (!payload) return { status: 'invalid_link', message: INVALID_LINK };
    const supabase = getSupabaseBrowserClient();
    const { error } = payload.tokenHash
      ? await supabase.auth.verifyOtp({ token_hash: payload.tokenHash, type: 'recovery' })
      : await supabase.auth.setSession({ access_token: payload.accessToken, refresh_token: payload.refreshToken });
    if (error) return recoveryError(error);
    return { status: 'ready', message: 'Crie uma senha forte para proteger sua conta.' };
  })().catch((error) => recoveryError(error));
  return recoveryAttempt;
}

/** Mesmo fluxo de `frontend/screens/auth/ResetPasswordScreen.tsx` (verifyOtp/setSession → updateUser → signOut). */
export function ResetPasswordForm() {
  const [view, setView] = useState({ status: 'validating_link', message: 'Validando link de recuperação…' });
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    bootstrapRecovery().then((next) => {
      if (!cancelled) setView(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const strength = getPasswordStrength(password);
  const matches = confirm.length > 0 && password === confirm;
  const canSubmit = view.status === 'ready' && strength.isValid && matches && !loading;

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const err = validateRecoveryPassword(password) || validatePasswordMatch(password, confirm);
    if (err) {
      setFormError(err);
      return;
    }
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      await supabase.auth.signOut();
      recoveryAttempt = null;
      setView({ status: 'updated', message: 'Senha atualizada com sucesso. Entre novamente com a nova senha.' });
    } catch (error) {
      const parsed = recoveryError(error);
      if (parsed.status === 'network_error') setView(parsed);
      else setFormError(authErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  if (view.status === 'validating_link') {
    return (
      <div className={s.center} role="status" aria-live="polite">
        <span className={s.spinner} aria-hidden="true" />
        <p className={s.bottomText}>{view.message}</p>
      </div>
    );
  }

  if (view.status === 'updated') {
    return (
      <div className={s.form}>
        <Alert tone="success">
          <strong>Senha atualizada.</strong> {view.message}
        </Alert>
        <Link href="/login" className={s.linkButton}>
          Ir para o login
        </Link>
      </div>
    );
  }

  if (view.status !== 'ready') {
    return (
      <div className={s.form}>
        <Alert tone="error">
          <strong>Não foi possível continuar.</strong> {view.message}
        </Alert>
        <Link href="/login" className={s.linkButton}>
          Voltar ao login
        </Link>
        <p className={s.bottomText}>
          <Link href="/forgot" className={s.link}>
            Solicitar novo link
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className={s.form} noValidate>
      <Alert tone="success">
        <strong>Link verificado.</strong> Defina uma senha forte. Não compartilhe este link com ninguém.
      </Alert>
      <div>
        <Field
          label={
            <>
              Nova senha
              <RequiredMark />
            </>
          }
          htmlFor="rp-pwd"
        >
          <PasswordInput
            id="rp-pwd"
            name="password"
            autoComplete="new-password"
            placeholder="Crie uma senha segura"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (formError) setFormError('');
            }}
          />
        </Field>
        <RecoveryPasswordStrength password={password} />
      </div>
      <Field
        label={
          <>
            Confirmar nova senha
            <RequiredMark />
          </>
        }
        htmlFor="rp-pwd2"
      >
        <PasswordInput
          id="rp-pwd2"
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="Repita a senha"
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value);
            if (formError) setFormError('');
          }}
        />
      </Field>
      {confirm.length > 0 ? (
        <Alert tone={matches ? 'success' : 'error'}>{matches ? 'As senhas coincidem.' : 'As senhas ainda não coincidem.'}</Alert>
      ) : null}
      {formError ? <Alert tone="error">{formError}</Alert> : null}
      <Button type="submit" block disabled={!canSubmit} aria-busy={loading}>
        {loading ? 'Atualizando…' : 'Atualizar senha'}
      </Button>
      <p className={s.bottomText}>
        <Link href="/login" className={s.link}>
          Voltar ao login
        </Link>
      </p>
    </form>
  );
}
