import { describe, it, expect } from 'vitest';
import { canAccessMeiArea } from './meiAccess';

describe('canAccessMeiArea', () => {
  it('superadmin e admin sempre têm acesso', () => {
    expect(canAccessMeiArea('superadmin', false)).toBe(true);
    expect(canAccessMeiArea('admin', false)).toBe(true);
  });

  it('usuario com mei=false não tem acesso', () => {
    expect(canAccessMeiArea('usuario', false)).toBe(false);
  });

  it('usuario com mei true ou null tem acesso', () => {
    expect(canAccessMeiArea('usuario', true)).toBe(true);
    expect(canAccessMeiArea('usuario', null)).toBe(true);
  });
});
