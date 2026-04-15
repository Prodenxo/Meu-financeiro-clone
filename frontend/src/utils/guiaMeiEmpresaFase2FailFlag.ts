/**
 * Marcador sessionStorage: POST cadastro empresa (fase 2) falhou nesta sessão — alimenta SOL-L2 após reload.
 * Não persiste texto de erro (só timestamp). TTL 30 min → tratar como sem flag (SOL-L3).
 * @see docs/stories/story-fr-sol-p1-plugnotas-empresa-fase2-falha-session-l2.md
 */

const STORAGE_PREFIX = 'mei:empresaFase2Fail:v1:';

function digitsOnly(value: string): string {
  return String(value || '').replace(/\D/g, '');
}

/** Arquitetura §3 — expiração automática */
export const MEI_EMPRESA_FASE2_FAIL_FLAG_TTL_MS = 30 * 60 * 1000;

type FlagEnvelope = { t: number };

export function meiEmpresaFase2FailStorageKey(userId: string | null, cnpjDigits: string): string {
  const uid = userId?.trim() || 'anon';
  const digits = digitsOnly(cnpjDigits);
  return `${STORAGE_PREFIX}${uid}:${digits}`;
}

/**
 * Grava marcador (ou actualiza `t` = agora). Ignora CNPJ inválido.
 */
export function setGuiaMeiEmpresaFase2FailFlag(userId: string | null, cnpjDigits: string): void {
  const digits = digitsOnly(cnpjDigits);
  if (digits.length !== 14) return;
  try {
    const env: FlagEnvelope = { t: Date.now() };
    sessionStorage.setItem(meiEmpresaFase2FailStorageKey(userId, digits), JSON.stringify(env));
  } catch {
    /* quota / modo privado */
  }
}

export function clearGuiaMeiEmpresaFase2FailFlag(userId: string | null, cnpjDigits: string): void {
  const digits = digitsOnly(cnpjDigits);
  if (digits.length !== 14) return;
  try {
    sessionStorage.removeItem(meiEmpresaFase2FailStorageKey(userId, digits));
  } catch {
    /* quota */
  }
}

/**
 * `true` se existe entrada válida e não expirada; remove entrada expirada.
 */
export function isGuiaMeiEmpresaFase2FailFlagActive(userId: string | null, cnpjDigits: string): boolean {
  const digits = digitsOnly(cnpjDigits);
  if (digits.length !== 14) return false;
  try {
    const key = meiEmpresaFase2FailStorageKey(userId, digits);
    const raw = sessionStorage.getItem(key);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as FlagEnvelope;
    if (typeof parsed?.t !== 'number') {
      sessionStorage.removeItem(key);
      return false;
    }
    if (Date.now() - parsed.t > MEI_EMPRESA_FASE2_FAIL_FLAG_TTL_MS) {
      sessionStorage.removeItem(key);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
