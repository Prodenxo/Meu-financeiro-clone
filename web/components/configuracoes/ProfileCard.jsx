'use client';

import { useState, useTransition } from 'react';
import { changeEmailAction, updateDisplayNameAction, updatePhoneAction } from '@/app/(app)/configuracoes/actions';
import { Input, cx } from '@/components/ui';
import { validateOptionalDisplayName, validateSignupEmail } from '@/lib/auth/validation';
import { getPhoneValidationError, normalizePhoneDigits, phonesMatch } from '@/lib/phone/phone';
import s from './configuracoes.module.css';
import { PhoneInput } from './PhoneInput';
import { SettingsCard } from './SettingsCard';

function initialsOf(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'MF';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Mensagem abaixo do campo (erro, sucesso ou dica). */
function FieldMessage({ msg }) {
  if (!msg) return null;
  const tone = msg.tone === 'error' ? s.fieldMsgError : msg.tone === 'success' ? s.fieldMsgSuccess : s.fieldMsgHint;
  return (
    <p className={cx(s.fieldMsg, tone)} role={msg.tone === 'error' ? 'alert' : 'status'}>
      {msg.text}
    </p>
  );
}

/**
 * Perfil — cada campo salva sozinho (mesma lógica da `SettingsScreen` do Expo):
 * nome em `user_metadata`, telefone pela API, e-mail por link de confirmação.
 */
export function ProfileCard({ profile, onToast }) {
  const [savedName, setSavedName] = useState(profile.rawDisplayName);
  const [name, setName] = useState(profile.rawDisplayName);
  const [nameMsg, setNameMsg] = useState(null);
  const [savingName, startName] = useTransition();

  const [savedPhone, setSavedPhone] = useState(profile.phone);
  const [phone, setPhone] = useState(profile.phone);
  const [phoneMsg, setPhoneMsg] = useState(null);
  const [savingPhone, startPhone] = useTransition();

  const [email, setEmail] = useState(profile.email);
  const [emailMsg, setEmailMsg] = useState(null);
  const [sendingEmail, startEmail] = useTransition();

  const currentEmail = String(profile.email || '').trim().toLowerCase();
  const displayName = savedName || profile.displayName;

  /* ---- nome ---- */
  const nameTrim = name.trim();
  const nameError = nameTrim ? validateOptionalDisplayName(nameTrim) : null;
  const nameDirty = nameTrim !== savedName.trim();
  const saveName = () => {
    if (!nameTrim) return setNameMsg({ tone: 'error', text: 'Por favor, insira um nome válido.' });
    setNameMsg(null);
    startName(async () => {
      const res = await updateDisplayNameAction(nameTrim);
      if (res?.ok) {
        setSavedName(res.displayName);
        setName(res.displayName);
        setNameMsg({ tone: 'success', text: 'Nome atualizado com sucesso!' });
        onToast?.({ tone: 'success', text: 'Nome atualizado com sucesso!' });
      } else {
        setNameMsg({ tone: 'error', text: res?.error || 'Erro ao salvar nome. Por favor, tente novamente.' });
      }
    });
  };

  /* ---- telefone ---- */
  const phoneDigits = normalizePhoneDigits(phone);
  const phoneHasNumber = phoneDigits.length > 3;
  const phoneError = phoneHasNumber ? getPhoneValidationError(phoneDigits) : null;
  const phoneDirty = !phonesMatch(phone, savedPhone);
  const savePhone = () => {
    const err = getPhoneValidationError(phoneDigits);
    if (err) return setPhoneMsg({ tone: 'error', text: err });
    setPhoneMsg(null);
    startPhone(async () => {
      const res = await updatePhoneAction(phoneDigits);
      if (res?.ok) {
        setSavedPhone(res.phone);
        setPhone(res.phone);
        setPhoneMsg({ tone: 'success', text: 'Telefone salvo com sucesso!' });
        onToast?.({ tone: 'success', text: 'Telefone salvo com sucesso!' });
      } else {
        setPhoneMsg({ tone: 'error', text: res?.error || 'Erro ao salvar telefone. Por favor, tente novamente.' });
      }
    });
  };

  /* ---- e-mail ---- */
  const emailTrim = email.trim();
  const emailNorm = emailTrim.toLowerCase();
  const emailDirty = emailTrim.length > 0 && emailNorm !== currentEmail;
  const emailInvalid = emailDirty && Boolean(validateSignupEmail(emailTrim));
  const emailHint = emailDirty && !emailInvalid && !emailMsg ? { tone: 'hint', text: `Ao salvar, enviaremos um link de confirmação para ${emailTrim}. O e-mail só passa a valer após você clicar no link.` } : null;
  const sendEmail = () => {
    setEmailMsg(null);
    startEmail(async () => {
      const res = await changeEmailAction(emailTrim);
      if (res?.ok) {
        setEmailMsg({ tone: 'success', text: res.message });
        onToast?.({ tone: 'success', text: 'Confirmação enviada. Verifique seu e-mail.' });
      } else {
        setEmailMsg({ tone: 'error', text: res?.error || 'Erro ao alterar e-mail. Por favor, tente novamente.' });
      }
    });
  };

  return (
    <SettingsCard id="perfil" icon="user" title="Perfil" description="Atualize seus dados de acesso.">
      <div className={s.identity}>
        <span className={s.avatar} aria-hidden="true">
          {initialsOf(displayName)}
        </span>
        <span className={s.identityName} title={displayName}>
          {displayName}
        </span>
      </div>

      <div className={s.fieldBlock}>
        <label className={s.fieldLabel} htmlFor="cfg-nome">
          Nome
        </label>
        <div className={s.fieldRow}>
          <Input
            id="cfg-nome"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setNameMsg(null);
            }}
            placeholder="Como quer ser chamado no app"
            autoComplete="name"
            maxLength={120}
            invalid={Boolean(nameError)}
            aria-describedby={nameMsg || nameError ? 'cfg-nome-msg' : undefined}
          />
          <button type="button" className={s.fieldBtn} onClick={saveName} disabled={savingName || !nameDirty || !nameTrim || Boolean(nameError)} aria-busy={savingName} aria-label={savingName ? 'Salvando nome' : 'Salvar nome'}>
            {savingName ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
        <div id="cfg-nome-msg">
          <FieldMessage msg={nameMsg || (nameError ? { tone: 'error', text: nameError } : null)} />
        </div>
      </div>

      <div className={s.fieldBlock}>
        <label className={s.fieldLabel} htmlFor="cfg-telefone">
          Telefone
        </label>
        <div className={s.fieldRow}>
          <PhoneInput
            id="cfg-telefone"
            value={phone}
            onChange={(v) => {
              setPhone(v);
              setPhoneMsg(null);
            }}
            invalid={Boolean(phoneError)}
            disabled={savingPhone}
          />
          <button type="button" className={s.fieldBtn} onClick={savePhone} disabled={savingPhone || !phoneDirty || !phoneHasNumber || Boolean(phoneError)} aria-busy={savingPhone} aria-label={savingPhone ? 'Salvando telefone' : 'Salvar telefone'}>
            {savingPhone ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
        <FieldMessage msg={phoneMsg || (phoneError ? { tone: 'error', text: phoneError } : null)} />
      </div>

      <div className={s.fieldBlock}>
        <label className={s.fieldLabel} htmlFor="cfg-email">
          E-mail
        </label>
        <div className={s.fieldRow}>
          <Input
            id="cfg-email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailMsg(null);
            }}
            placeholder="email@exemplo.com"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            invalid={emailInvalid}
          />
          <button type="button" className={s.fieldBtn} onClick={sendEmail} disabled={sendingEmail || !emailDirty || emailInvalid} aria-busy={sendingEmail}>
            {sendingEmail ? 'Enviando…' : 'Alterar e-mail'}
          </button>
        </div>
        <FieldMessage msg={emailMsg || (emailInvalid ? { tone: 'error', text: 'E-mail inválido.' } : emailHint)} />
      </div>
    </SettingsCard>
  );
}
