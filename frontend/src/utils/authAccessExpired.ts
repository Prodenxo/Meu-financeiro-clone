import { getApiErrorCodeFromUnknownError } from './apiClientError'

/** Motivo para mostrar callout na página de login após 403 ou sessão recusada. */
export type LoginReasonFlag = 'access_expired' | 'profile_blocked'

export const LOGIN_REASON_STORAGE_KEY = 'mf:loginReason'

export function isAccessExpiredAuthError(err: unknown): boolean {
  if (getApiErrorCodeFromUnknownError(err) === 'ACCESS_EXPIRED') return true
  const msg = err instanceof Error ? err.message : String(err ?? '')
  return msg.includes('Seu acesso expirou')
}

export function isProfileBlockedAuthError(err: unknown): boolean {
  if (getApiErrorCodeFromUnknownError(err) === 'PROFILE_BLOCKED') return true
  const msg = err instanceof Error ? err.message : String(err ?? '')
  return msg.includes('Seu perfil está bloqueado')
}

export function flagLoginPageForLoginReason(reason: LoginReasonFlag): void {
  try {
    sessionStorage.setItem(LOGIN_REASON_STORAGE_KEY, reason)
  } catch {
    /* quota / private mode */
  }
}

/** @deprecated use flagLoginPageForLoginReason('access_expired') */
export function flagLoginPageForAccessExpired(): void {
  flagLoginPageForLoginReason('access_expired')
}

export function consumeLoginReasonFlag(): LoginReasonFlag | null {
  try {
    const v = sessionStorage.getItem(LOGIN_REASON_STORAGE_KEY)
    if (v === 'access_expired' || v === 'profile_blocked') {
      sessionStorage.removeItem(LOGIN_REASON_STORAGE_KEY)
      return v
    }
  } catch {
    /* ignore */
  }
  return null
}

/** @deprecated use consumeLoginReasonFlag() */
export function consumeLoginAccessExpiredFlag(): boolean {
  return consumeLoginReasonFlag() === 'access_expired'
}
