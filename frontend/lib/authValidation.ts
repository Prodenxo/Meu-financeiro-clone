const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSignupEmail(email: string): string | null {
  const t = email.trim();
  if (!t) return 'Informe seu e-mail.';
  if (!EMAIL_RE.test(t)) return 'Informe um e-mail válido.';
  return null;
}

export type PasswordRuleKey =
  | 'minLength'
  | 'hasLetter'
  | 'hasNumber'
  | 'hasUpper'
  | 'hasSpecial';

export type PasswordRule = {
  key: PasswordRuleKey;
  label: string;
  ok: boolean;
};

export type PasswordStrengthLevel = 'empty' | 'weak' | 'medium' | 'strong';

export type PasswordStrength = {
  score: number;
  level: PasswordStrengthLevel;
  label: string;
  rules: PasswordRule[];
  isValid: boolean;
};

const SPECIAL_RE = /[^A-Za-z0-9]/;

/** Regras exibidas + usadas na validação de recuperação (mais rígidas que o mínimo antigo). */
export function getPasswordStrength(password: string): PasswordStrength {
  const value = String(password || '');
  const rules: PasswordRule[] = [
    {
      key: 'minLength',
      label: 'Pelo menos 8 caracteres',
      ok: value.length >= 8,
    },
    {
      key: 'hasLetter',
      label: 'Pelo menos 1 letra',
      ok: /[A-Za-zÀ-ÿ]/.test(value),
    },
    {
      key: 'hasNumber',
      label: 'Pelo menos 1 número',
      ok: /\d/.test(value),
    },
    {
      key: 'hasUpper',
      label: 'Pelo menos 1 letra maiúscula',
      ok: /[A-ZÀ-Ý]/.test(value),
    },
    {
      key: 'hasSpecial',
      label: 'Pelo menos 1 caractere especial (!@#...)',
      ok: SPECIAL_RE.test(value),
    },
  ];

  const requiredOk = rules
    .filter((r) => r.key === 'minLength' || r.key === 'hasLetter' || r.key === 'hasNumber')
    .every((r) => r.ok);
  const bonusOk = rules.filter((r) => r.key === 'hasUpper' || r.key === 'hasSpecial').filter((r) => r.ok).length;

  let score = 0;
  if (rules[0].ok) score += 1;
  if (rules[1].ok) score += 1;
  if (rules[2].ok) score += 1;
  score += bonusOk;

  let level: PasswordStrengthLevel = 'empty';
  let label = '';
  if (!value) {
    level = 'empty';
    label = '';
  } else if (!requiredOk || score <= 2) {
    level = 'weak';
    label = 'Fraca';
  } else if (score === 3 || score === 4) {
    level = 'medium';
    label = 'Média';
  } else {
    level = 'strong';
    label = 'Forte';
  }

  return {
    score,
    level,
    label,
    rules,
    isValid: requiredOk,
  };
}

/** Cadastro: mantém mínimo compatível com contas já existentes. */
export function validateSignupPassword(password: string): string | null {
  if (!password) return 'Informe uma senha.';
  if (password.length < 6) return 'A senha deve ter pelo menos 6 caracteres.';
  return null;
}

/** Recuperação / redefinição: exige senha mais segura. */
export function validateRecoveryPassword(password: string): string | null {
  if (!password) return 'Informe uma senha.';
  const strength = getPasswordStrength(password);
  if (!strength.isValid) {
    return 'A senha precisa ter no mínimo 8 caracteres, com letra e número.';
  }
  return null;
}

export function validatePasswordMatch(password: string, confirm: string): string | null {
  if (!confirm) return 'Confirme a nova senha.';
  if (password !== confirm) return 'As senhas não coincidem.';
  return null;
}

/** Opcional: nome para exibição (metadata). */
export function validateOptionalDisplayName(name: string): string | null {
  const t = name.trim();
  if (t.length > 120) return 'O nome deve ter no máximo 120 caracteres.';
  return null;
}
