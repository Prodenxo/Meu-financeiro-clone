import { describe, it, expect } from 'vitest';
import { canAccessMeiArea } from './meiAccess';

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
