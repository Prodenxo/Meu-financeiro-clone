import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClientError } from './apiClientError';
import {
  consumeLoginReasonFlag,
  flagLoginPageForLoginReason,
  isAccessExpiredAuthError,
  isProfileBlockedAuthError,
  LOGIN_REASON_STORAGE_KEY
} from './authAccessExpired';

describe('isAccessExpiredAuthError', () => {
  it('retorna true para código ACCESS_EXPIRED', () => {
    const err = new ApiClientError('Seu acesso expirou', {
      apiErrorCode: 'ACCESS_EXPIRED',
      payload: { message: 'Seu acesso expirou', errors: { code: 'ACCESS_EXPIRED' } }
    });
    expect(isAccessExpiredAuthError(err)).toBe(true);
  });

  it('retorna true quando a mensagem contém o texto do backend', () => {
    expect(isAccessExpiredAuthError(new Error('Seu acesso expirou'))).toBe(true);
  });

  it('retorna false para outros erros', () => {
    expect(isAccessExpiredAuthError(new Error('Credenciais inválidas'))).toBe(false);
  });
});

describe('isProfileBlockedAuthError', () => {
  it('retorna true para código PROFILE_BLOCKED', () => {
    const err = new ApiClientError('Seu perfil está bloqueado', {
      apiErrorCode: 'PROFILE_BLOCKED',
      payload: { message: 'Seu perfil está bloqueado', errors: { code: 'PROFILE_BLOCKED' } }
    });
    expect(isProfileBlockedAuthError(err)).toBe(true);
  });

  it('retorna true quando a mensagem contém o texto do backend', () => {
    expect(isProfileBlockedAuthError(new Error('Seu perfil está bloqueado'))).toBe(true);
  });

  it('retorna false para outros erros', () => {
    expect(isProfileBlockedAuthError(new Error('Credenciais inválidas'))).toBe(false);
  });
});

describe('consumeLoginReasonFlag', () => {
  const mem: Record<string, string> = {};

  beforeEach(() => {
    Object.keys(mem).forEach((k) => {
      delete mem[k];
    });
    vi.stubGlobal('sessionStorage', {
      getItem: (k: string) => (Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null),
      setItem: (k: string, v: string) => {
        mem[k] = v;
      },
      removeItem: (k: string) => {
        delete mem[k];
      }
    } as Storage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('consome access_expired', () => {
    flagLoginPageForLoginReason('access_expired');
    expect(consumeLoginReasonFlag()).toBe('access_expired');
    expect(consumeLoginReasonFlag()).toBe(null);
  });

  it('consome profile_blocked', () => {
    flagLoginPageForLoginReason('profile_blocked');
    expect(consumeLoginReasonFlag()).toBe('profile_blocked');
    expect(mem[LOGIN_REASON_STORAGE_KEY]).toBeUndefined();
  });
});
