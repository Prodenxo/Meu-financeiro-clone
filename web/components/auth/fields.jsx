'use client';

import { useState } from 'react';
import { Input, Select } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { getPasswordStrength, strongPasswordRules } from '@/lib/auth/validation';
import s from './auth.module.css';

export function RequiredMark() {
  return (
    <span className={s.required} aria-hidden="true">
      {' '}
      *
    </span>
  );
}

export function PasswordInput({ id, ...rest }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className={s.pwdWrap}>
      <Input id={id} type={visible ? 'text' : 'password'} {...rest} />
      <button
        type="button"
        className={s.eyeBtn}
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        aria-pressed={visible}
        aria-controls={id}
      >
        <Icon name={visible ? 'eye-off' : 'eye'} size={16} />
      </button>
    </div>
  );
}

/** Checklist da senha forte (cadastro), marcando ✓ conforme digita. */
export function StrongPasswordRules({ password, id }) {
  return (
    <ul className={s.rules} id={id} aria-live="polite">
      {strongPasswordRules(password).map((r) => (
        <li key={r.key} className={`${s.rule} ${r.ok ? s.ruleOk : ''}`}>
          <Icon name={r.ok ? 'check' : 'minus'} size={13} strokeWidth={2.4} />
          {r.label}
          <span className="sr-only">{r.ok ? ' — ok' : ' — pendente'}</span>
        </li>
      ))}
    </ul>
  );
}

const STRENGTH_COLOR = { weak: 'var(--mf-danger)', medium: 'var(--mf-warning)', strong: 'var(--mf-success)' };
const STRENGTH_BARS = { empty: 0, weak: 1, medium: 2, strong: 3 };

/** Força da senha na redefinição (mesma régua de `getPasswordStrength` do app). */
export function RecoveryPasswordStrength({ password }) {
  const st = getPasswordStrength(password);
  return (
    <>
      {st.level !== 'empty' ? (
        <div className={s.strength} aria-live="polite">
          <div className={s.strengthBars} aria-hidden="true">
            {[1, 2, 3].map((i) => (
              <span
                key={i}
                className={s.strengthBar}
                style={i <= STRENGTH_BARS[st.level] ? { background: STRENGTH_COLOR[st.level] } : undefined}
              />
            ))}
          </div>
          <span>Força: {st.label}</span>
        </div>
      ) : null}
      <ul className={s.rules}>
        {st.rules.map((r) => (
          <li key={r.key} className={`${s.rule} ${r.ok ? s.ruleOk : ''}`}>
            <Icon name={r.ok ? 'check' : 'minus'} size={13} strokeWidth={2.4} />
            {r.label}
          </li>
        ))}
      </ul>
    </>
  );
}

const COUNTRIES = [
  { code: 'br', dial: '55', label: '🇧🇷 +55' },
  { code: 'pt', dial: '351', label: '🇵🇹 +351' },
  { code: 'us', dial: '1', label: '🇺🇸 +1' },
  { code: 'ar', dial: '54', label: '🇦🇷 +54' },
  { code: 'py', dial: '595', label: '🇵🇾 +595' },
  { code: 'uy', dial: '598', label: '🇺🇾 +598' },
  { code: 'es', dial: '34', label: '🇪🇸 +34' },
];

function maskBrPhone(digits) {
  const d = digits.slice(0, 11);
  if (d.length > 10) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length > 6) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  if (d.length > 2) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return d;
}

/**
 * Telefone com país. Envia só dígitos com DDI (ex.: 5511999999999) no campo `name`,
 * o mesmo formato que o app grava hoje.
 */
export function PhoneInput({ id, name, invalid }) {
  const [dial, setDial] = useState('55');
  const [local, setLocal] = useState('');
  const digits = local.replace(/\D/g, '');
  const display = dial === '55' ? maskBrPhone(digits) : digits.slice(0, 15);

  return (
    <div className={s.phone}>
      <Select aria-label="País (DDI)" value={dial} onChange={(e) => setDial(e.target.value)}>
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.dial}>
            {c.label}
          </option>
        ))}
      </Select>
      <Input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        placeholder={dial === '55' ? '(11) 99999-9999' : 'Número'}
        value={display}
        onChange={(e) => setLocal(e.target.value)}
        invalid={invalid}
      />
      <input type="hidden" name={name} value={digits ? `${dial}${digits}` : ''} />
    </div>
  );
}
