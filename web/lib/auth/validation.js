/**
 * Validações de autenticação — portas de `frontend/lib/authValidation.ts`,
 * `frontend/lib/passwordPolicy.ts` (sincronizada com `backend/src/utils/passwordPolicy.js`),
 * `frontend/lib/validateCnpj.ts`, `frontend/lib/authErrors.ts` e `utils/registerInviteQuery.ts`.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSignupEmail(email) {
  const t = String(email || '').trim();
  if (!t) return 'Informe seu e-mail.';
  if (!EMAIL_RE.test(t)) return 'Informe um e-mail válido.';
  return null;
}

export function validateOptionalDisplayName(name) {
  const t = String(name || '').trim();
  if (t.length > 120) return 'O nome deve ter no máximo 120 caracteres.';
  return null;
}

/* ---------- Senha forte (cadastro / solicitação de acesso) ---------- */

export const STRONG_PASSWORD_MIN_LENGTH = 8;
export const STRONG_PASSWORD_MAX_LENGTH = 128;
const STRONG_SPECIAL_RE = /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/;

export function validateStrongPassword(password) {
  const p = String(password ?? '').trim();
  if (!p) return { ok: false, message: 'Senha é obrigatória' };
  if (p.length < STRONG_PASSWORD_MIN_LENGTH) {
    return { ok: false, message: `A senha deve ter no mínimo ${STRONG_PASSWORD_MIN_LENGTH} caracteres` };
  }
  if (p.length > STRONG_PASSWORD_MAX_LENGTH) {
    return { ok: false, message: `A senha deve ter no máximo ${STRONG_PASSWORD_MAX_LENGTH} caracteres` };
  }
  if (!/[A-Z]/.test(p)) return { ok: false, message: 'Inclua pelo menos uma letra maiúscula (A-Z)' };
  if (!STRONG_SPECIAL_RE.test(p)) {
    return { ok: false, message: 'Inclua pelo menos um caractere especial (ex.: ! @ # $ % & * - _ = + )' };
  }
  return { ok: true };
}

/** Regras mostradas com ✓ em tempo real (mesmos critérios de `validateStrongPassword`). */
export function strongPasswordRules(password) {
  const p = String(password ?? '').trim();
  return [
    { key: 'len', label: `Pelo menos ${STRONG_PASSWORD_MIN_LENGTH} caracteres`, ok: p.length >= STRONG_PASSWORD_MIN_LENGTH },
    { key: 'upper', label: 'Pelo menos uma letra maiúscula (A-Z)', ok: /[A-Z]/.test(p) },
    { key: 'special', label: 'Pelo menos um caractere especial (! @ # $ % & * .)', ok: STRONG_SPECIAL_RE.test(p) },
  ];
}

/* ---------- Senha de recuperação (reset) ---------- */

const ANY_SPECIAL_RE = /[^A-Za-z0-9]/;

export function getPasswordStrength(password) {
  const value = String(password || '');
  const rules = [
    { key: 'minLength', label: 'Pelo menos 8 caracteres', ok: value.length >= 8 },
    { key: 'hasLetter', label: 'Pelo menos 1 letra', ok: /[A-Za-zÀ-ÿ]/.test(value) },
    { key: 'hasNumber', label: 'Pelo menos 1 número', ok: /\d/.test(value) },
    { key: 'hasUpper', label: 'Pelo menos 1 letra maiúscula', ok: /[A-ZÀ-Þ]/.test(value) },
    { key: 'hasSpecial', label: 'Pelo menos 1 caractere especial (!@#...)', ok: ANY_SPECIAL_RE.test(value) },
  ];
  const requiredOk = rules.slice(0, 3).every((r) => r.ok);
  const bonusOk = rules.slice(3).filter((r) => r.ok).length;
  const score = rules.slice(0, 3).filter((r) => r.ok).length + bonusOk;

  let level = 'empty';
  let label = '';
  if (!value) {
    level = 'empty';
  } else if (!requiredOk || score <= 2) {
    level = 'weak';
    label = 'Fraca';
  } else if (score <= 4) {
    level = 'medium';
    label = 'Média';
  } else {
    level = 'strong';
    label = 'Forte';
  }
  return { score, level, label, rules, isValid: requiredOk };
}

export function validateRecoveryPassword(password) {
  if (!password) return 'Informe uma senha.';
  if (!getPasswordStrength(password).isValid) {
    return 'A senha precisa ter no mínimo 8 caracteres, com letra e número.';
  }
  return null;
}

export function validatePasswordMatch(password, confirm) {
  if (!confirm) return 'Confirme a nova senha.';
  if (password !== confirm) return 'As senhas não coincidem.';
  return null;
}

/* ---------- CPF / CNPJ ---------- */

const allSameDigits = (d) => /^(\d)\1+$/.test(d);

export function isValidCpfDigits(digits) {
  if (digits.length !== 11 || allSameDigits(digits)) return false;
  const dv = (len, start) => {
    let sum = 0;
    for (let i = 0; i < len; i += 1) sum += Number(digits[i]) * (start - i);
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };
  return dv(9, 10) === Number(digits[9]) && dv(10, 11) === Number(digits[10]);
}

export function isValidCnpjDigits(digits) {
  if (digits.length !== 14 || allSameDigits(digits)) return false;
  const calc = (weights) => {
    let sum = 0;
    for (let i = 0; i < weights.length; i += 1) sum += Number(digits[i]) * weights[i];
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };
  return (
    calc([5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(digits[12]) &&
    calc([6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(digits[13])
  );
}

export function maskCnpj(value) {
  const d = String(value || '').replace(/\D/g, '').slice(0, 14);
  if (d.length > 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  if (d.length > 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  if (d.length > 5) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length > 2) return `${d.slice(0, 2)}.${d.slice(2)}`;
  return d;
}

export function maskCpf(value) {
  const d = String(value || '').replace(/\D/g, '').slice(0, 11);
  if (d.length > 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  if (d.length > 6) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  if (d.length > 3) return `${d.slice(0, 3)}.${d.slice(3)}`;
  return d;
}

/** Mesma regra de `cleanPhone` do Expo: só dígitos, com 55 na frente quando faltar. */
export function cleanPhone(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('55')) return digits;
  return `55${digits}`;
}

/* ---------- Mensagens ---------- */

export function authErrorMessage(error) {
  const raw = String(error?.message || error || '').trim();
  const lower = raw.toLowerCase();
  const code = String(error?.code || '');

  if (
    code === 'user_already_exists' ||
    lower.includes('already registered') ||
    lower.includes('email address is already registered')
  ) {
    return 'Este e-mail já está cadastrado. Tente fazer login.';
  }
  if (code === 'weak_password' || lower.includes('password')) {
    if (lower.includes('6') || lower.includes('least')) return 'A senha deve ter pelo menos 6 caracteres.';
    return 'A senha não atende aos requisitos. Use uma senha mais forte.';
  }
  if (code === 'email_not_confirmed' || lower.includes('email not confirmed')) {
    return 'Confirme seu e-mail antes de entrar. Verifique a caixa de entrada.';
  }
  if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
    return 'E-mail ou senha incorretos.';
  }
  if (lower.includes('invalid email') || code === 'invalid_credentials') {
    return 'Verifique o formato do e-mail e tente novamente.';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
  }
  if (lower.includes('email') && (lower.includes('send') || lower.includes('smtp'))) {
    return 'Não foi possível enviar o e-mail agora. Tente de novo em alguns minutos ou verifique o spam.';
  }
  if (lower.includes('signup') && lower.includes('disabled')) {
    return 'Novos cadastros estão temporariamente indisponíveis. Tente mais tarde.';
  }
  if (lower.includes('fetch failed') || lower.includes('network')) {
    return 'Sem conexão com o servidor. Verifique a internet.';
  }
  if (raw.length > 0 && raw.length < 200) return raw;
  return 'Não foi possível concluir a operação. Tente novamente.';
}

export function inviteStatusUserMessage(status) {
  switch (status) {
    case 'valid':
      return 'Convite válido. Complete o cadastro para entrar na empresa.';
    case 'expired':
      return 'Este convite expirou. Peça um novo link ao administrador.';
    case 'revoked':
      return 'Este convite foi cancelado.';
    case 'used':
      return 'Este convite já foi utilizado.';
    case 'invalid':
      return 'Link de convite inválido.';
    case 'network_error':
      return 'Não foi possível verificar o convite. Tente novamente.';
    default:
      return 'Não foi possível verificar o convite.';
  }
}
