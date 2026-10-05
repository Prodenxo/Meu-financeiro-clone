'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { createUserAction, updateUserAction } from '@/app/(app)/configuracoes/acessos/actions';
import { Alert, Button, Field, Input, Select, cx } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import {
  ROLE_DESCRIPTION,
  ROLE_LABEL,
  ROLE_OPTIONS_SUPERADMIN,
  empresaDisplayName,
  formatPhoneDisplay,
  toDateInputValue,
} from '@/lib/acessos/acessos';
import m from '@/components/dashboard/modal.module.css';
import s from './acessos.module.css';
import { PasswordBox } from './shared';

function initialForm(user) {
  if (!user) {
    return { email: '', password: '', displayName: '', phone: '', role: 'usuario', empresaId: '', mei: false, expiresAt: '' };
  }
  return {
    email: user.email || '',
    password: '',
    displayName: user.displayName || '',
    phone: formatPhoneDisplay(user.phone) || '',
    role: user.role === 'superadmin' ? 'superadmin' : user.role || 'usuario',
    empresaId: user.empresaId || '',
    mei: user.mei === true,
    expiresAt: toDateInputValue(user.expiresAt),
  };
}

/**
 * Cadastro e edição de usuário — mesmos campos e regras dos painéis do app atual:
 * admin cria sempre "Usuário" na própria empresa; superadmin escolhe perfil e empresa;
 * ninguém altera o próprio perfil/empresa por aqui (o servidor também bloqueia).
 */
export function UserFormDialog({ user = null, actorRole, actorUserId, empresas = [], onClose }) {
  const dialogRef = useRef(null);
  const isEdit = Boolean(user?.id);
  const isSelf = isEdit && user.id === actorUserId;
  const isSuperadmin = actorRole === 'superadmin';
  const [form, setForm] = useState(() => initialForm(user));
  const [error, setError] = useState('');
  const [result, setResult] = useState(null); // { generatedPassword, email }
  const [pending, start] = useTransition();

  useEffect(() => {
    const el = dialogRef.current;
    if (el && !el.open) el.showModal();
  }, []);

  const patch = (p) => setForm((f) => ({ ...f, ...p }));
  const titleId = 'user-form-title';

  const roleOptions = isEdit && user.role === 'superadmin' ? ['superadmin'] : ROLE_OPTIONS_SUPERADMIN;
  const roleLocked = isSelf || (!isSuperadmin && isEdit) || (isEdit && user.role === 'superadmin');
  const showRole = isSuperadmin || isEdit;
  const showEmpresa = isSuperadmin && !isSelf;
  const showExpiry = isEdit && form.role === 'usuario';

  const submit = (event) => {
    event.preventDefault();
    setError('');
    if (!isEdit && !form.email.trim()) {
      setError('Informe o e-mail do usuário.');
      return;
    }
    if (showEmpresa && !form.empresaId) {
      setError('Escolha a empresa.');
      return;
    }
    start(async () => {
      if (!isEdit) {
        const res = await createUserAction({
          email: form.email,
          password: form.password,
          displayName: form.displayName,
          phone: form.phone,
          role: isSuperadmin ? form.role : 'usuario',
          empresaId: isSuperadmin ? form.empresaId : undefined,
        });
        if (!res?.ok) {
          setError(res?.error || 'Não foi possível criar o usuário.');
          return;
        }
        if (res.generatedPassword) setResult({ generatedPassword: res.generatedPassword, email: res.email });
        else onClose({ ok: true, message: `Usuário ${res.email} criado.` });
        return;
      }

      const input = {
        displayName: form.displayName,
        phone: form.phone,
        mei: form.mei,
      };
      const nextEmail = form.email.trim().toLowerCase();
      if (nextEmail && nextEmail !== String(user.email || '').toLowerCase()) input.email = nextEmail;
      if (showExpiry) input.expiresAt = form.expiresAt || '';
      if (!isSelf) {
        input.role = isSuperadmin ? form.role : 'usuario';
        if (isSuperadmin) input.empresaId = form.empresaId;
      }
      const res = await updateUserAction(user.id, input);
      if (!res?.ok) {
        setError(res?.error || 'Não foi possível salvar.');
        return;
      }
      onClose({
        ok: true,
        message: res.emailChanged
          ? 'Dados salvos. O e-mail de login foi atualizado; o usuário entra com o novo endereço na próxima sessão.'
          : 'Dados do usuário salvos.',
      });
    });
  };

  const close = () => {
    if (pending) return;
    onClose(result ? { ok: true, message: `Usuário ${result.email} criado.` } : null);
  };

  return (
    <dialog
      ref={dialogRef}
      className={m.dialog}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) close();
      }}
    >
      <div className={m.body}>
        <header className={m.head}>
          <h2 className={m.title} id={titleId}>
            {result ? 'Usuário criado' : isEdit ? 'Editar dados' : 'Novo usuário'}
          </h2>
          <button type="button" className={m.close} onClick={close} aria-label="Fechar" disabled={pending}>
            <Icon name="x" size={18} />
          </button>
        </header>

        {result ? (
          <div className={s.form}>
            <p className={s.hint}>
              A conta <strong>{result.email}</strong> foi criada com uma senha gerada automaticamente. Copie e envie ao usuário — ela não será mostrada de novo.
            </p>
            <PasswordBox password={result.generatedPassword} />
            <footer className={m.foot}>
              <Button onClick={close}>Concluir</Button>
            </footer>
          </div>
        ) : (
          <form className={s.form} onSubmit={submit} noValidate>
            {isEdit ? (
              <>
                <Field label="Nome de exibição" htmlFor="uf-name">
                  <Input id="uf-name" value={form.displayName} onChange={(e) => patch({ displayName: e.target.value })} placeholder="Como aparece no app" maxLength={120} />
                </Field>
                <div className={s.formRow}>
                  <Field label="Telefone" htmlFor="uf-phone">
                    <Input id="uf-phone" type="tel" value={form.phone} onChange={(e) => patch({ phone: e.target.value })} placeholder="(11) 99999-9999" inputMode="tel" />
                  </Field>
                  <Field label="E-mail de login" htmlFor="uf-email">
                    <Input id="uf-email" type="email" value={form.email} onChange={(e) => patch({ email: e.target.value })} placeholder="nome@empresa.com" autoComplete="off" />
                  </Field>
                </div>
                <p className={s.hint}>
                  Ao trocar o e-mail, o login passa a ser o novo endereço (desde que ele não esteja em outra conta).
                </p>
              </>
            ) : (
              <>
                <Field label="E-mail" htmlFor="uf-email">
                  <Input id="uf-email" type="email" required value={form.email} onChange={(e) => patch({ email: e.target.value })} placeholder="nome@empresa.com" autoComplete="off" />
                </Field>
                <Field label="Senha (opcional)" htmlFor="uf-pass">
                  <Input id="uf-pass" type="text" value={form.password} onChange={(e) => patch({ password: e.target.value })} placeholder="Deixe em branco para gerar uma senha forte" autoComplete="new-password" />
                </Field>
                <div className={s.formRow}>
                  <Field label="Nome de exibição" htmlFor="uf-name">
                    <Input id="uf-name" value={form.displayName} onChange={(e) => patch({ displayName: e.target.value })} placeholder="Opcional" maxLength={120} />
                  </Field>
                  <Field label="Telefone" htmlFor="uf-phone">
                    <Input id="uf-phone" type="tel" value={form.phone} onChange={(e) => patch({ phone: e.target.value })} placeholder="(11) 99999-9999" inputMode="tel" />
                  </Field>
                </div>
              </>
            )}

            {showRole ? (
              <Field label="Perfil de acesso">
                <div className={s.roleChips} role="radiogroup" aria-label="Perfil de acesso">
                  {roleOptions.map((option) => {
                    const disabled = roleLocked || (!isSuperadmin && option !== 'usuario');
                    return (
                      <button
                        key={option}
                        type="button"
                        role="radio"
                        aria-checked={form.role === option}
                        className={cx(s.roleChip, form.role === option && s.roleChipActive)}
                        disabled={disabled && form.role !== option}
                        onClick={() => (roleLocked ? null : patch({ role: option }))}
                      >
                        {ROLE_LABEL[option]}
                      </button>
                    );
                  })}
                </div>
                <p className={s.hint}>
                  {isSelf
                    ? 'Não é possível alterar o seu próprio perfil de acesso.'
                    : ROLE_DESCRIPTION[form.role] || 'Perfil com acesso total à plataforma.'}
                </p>
              </Field>
            ) : null}

            {showEmpresa ? (
              <Field label="Empresa" htmlFor="uf-empresa">
                <Select id="uf-empresa" value={form.empresaId} onChange={(e) => patch({ empresaId: e.target.value })} required>
                  <option value="">Selecione a empresa…</option>
                  {empresas.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {empresaDisplayName(emp)}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : null}

            {isEdit ? (
              <label className={s.switchRow}>
                <span className={s.switchText}>
                  <span>Habilitar MEI</span>
                  <span className={s.switchHint}>Ocupa uma vaga MEI da empresa; desligado conta como PF / Outros.</span>
                </span>
                <input type="checkbox" checked={form.mei} onChange={(e) => patch({ mei: e.target.checked })} />
              </label>
            ) : null}

            {showExpiry ? (
              <Field label="Acesso válido até (opcional)" htmlFor="uf-exp">
                <Input id="uf-exp" type="date" value={form.expiresAt} onChange={(e) => patch({ expiresAt: e.target.value })} />
              </Field>
            ) : null}

            {error ? <Alert tone="error">{error}</Alert> : null}

            <footer className={m.foot}>
              <Button variant="outline" onClick={close} disabled={pending}>Cancelar</Button>
              <Button type="submit" disabled={pending} aria-busy={pending}>
                {pending ? 'Salvando…' : isEdit ? 'Salvar' : 'Criar usuário'}
              </Button>
            </footer>
          </form>
        )}
      </div>
    </dialog>
  );
}
