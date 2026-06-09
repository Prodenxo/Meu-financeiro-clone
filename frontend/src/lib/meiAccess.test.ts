import { describe, it, expect } from 'vitest';
import { canAccessMeiArea, normalizeMeiFromSession } from './meiAccess';

describe('normalizeMeiFromSession', () => {
  it('null/undefined não viram true', () => {
    expect(normalizeMeiFromSession(null)).toBe(null);
    expect(normalizeMeiFromSession(undefined)).toBe(null);
  });

  it('preserva boolean explícito', () => {
    expect(normalizeMeiFromSession(true)).toBe(true);
    expect(normalizeMeiFromSession(false)).toBe(false);
  });
});

describe('canAccessMeiArea', () => {
  it('superadmin sempre tem acesso', () => {
    expect(canAccessMeiArea('superadmin', false)).toBe(true);
    expect(canAccessMeiArea('superadmin', null)).toBe(true);
  });

  it('admin exige mei=true', () => {
    expect(canAccessMeiArea('admin', true)).toBe(true);
    expect(canAccessMeiArea('admin', false)).toBe(false);
    expect(canAccessMeiArea('admin', null)).toBe(false);
  });

  it('usuario exige mei=true', () => {
    expect(canAccessMeiArea('usuario', true)).toBe(true);
    expect(canAccessMeiArea('usuario', false)).toBe(false);
    expect(canAccessMeiArea('usuario', null)).toBe(false);
  });
});
