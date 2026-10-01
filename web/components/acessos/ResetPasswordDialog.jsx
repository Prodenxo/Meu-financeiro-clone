'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { resetUserPasswordAction } from '@/app/(app)/configuracoes/acessos/actions';
import { Alert, Button, Field, Input } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import m from '@/components/dashboard/modal.module.css';
import s from './acessos.module.css';
import { PasswordBox } from './shared';

/**
 * Redefinir senha — porta do painel "Senha" do app atual: senha opcional; em branco o servidor
 * gera uma forte. O resultado aparece aqui para copiar (não é enviado por e-mail).
 */
export function ResetPasswordDialog({ user, onClose }) {
  const ref = useRef(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState('');
  const [pending, start] = useTransition();

  useEffect(() => {
    const el = ref.current;
    if (el && !el.open) el.showModal();
  }, []);

  const close = () => {
    if (!pending) onClose(result ? { ok: true, password: result } : null);
  };

  const submit = (e) => {
    e.preventDefault();
    setError('');
    start(async () => {
      const res = await resetUserPasswordAction(user.id, password);
      if (!res?.ok) {
        setError(res?.error || 'Não foi possível redefinir a senha.');
        return;
      }
      setResult(res.password);
    });
  };

  const who = user.displayName || user.email;

  return (
    <dialog
      ref={ref}
      className={m.dialog}
      aria-labelledby="reset-title"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
    >
      <div className={m.body}>
        <header className={m.head}>
          <h2 className={m.title} id="reset-title">{result ? 'Senha redefinida' : 'Redefinir senha'}</h2>
          <button type="button" className={m.close} onClick={close} aria-label="Fechar" disabled={pending}>
            <Icon name="x" size={18} />
          </button>
        </header>

        {result ? (
          <div className={s.form}>
            <p className={s.hint}>
              Nova senha de <strong>{who}</strong>. Copie e envie ao usuário — ela não será mostrada de novo.
            </p>
            <PasswordBox password={result} />
            <footer className={m.foot}>
              <Button onClick={close}>Concluir</Button>
            </footer>
          </div>
        ) : (
          <form className={s.form} onSubmit={submit} noValidate>
            <p className={s.hint}>
              Defina uma nova senha para <strong>{who}</strong> ou deixe em branco para gerarmos uma senha forte.
            </p>
            <Field label="Nova senha (opcional)" htmlFor="reset-pass">
              <Input id="reset-pass" type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres, 1 maiúscula e 1 símbolo" autoComplete="new-password" />
            </Field>
            {error ? <Alert tone="error">{error}</Alert> : null}
            <footer className={m.foot}>
              <Button variant="outline" onClick={close} disabled={pending}>Cancelar</Button>
              <Button type="submit" disabled={pending} aria-busy={pending}>
                {pending ? 'Redefinindo…' : password.trim() ? 'Salvar senha' : 'Gerar senha'}
              </Button>
            </footer>
          </form>
        )}
      </div>
    </dialog>
  );
}
