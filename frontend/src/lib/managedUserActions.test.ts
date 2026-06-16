import { describe, expect, it } from 'vitest';
import { getManagedUserActions, shouldShowAdminMeiToggle } from './managedUserActions';
import type { ManagedUser } from '../services/usersService';

const baseUser = (overrides: Partial<ManagedUser>): ManagedUser => ({
  id: 'user-1',
  email: 'a@test.com',
  displayName: 'A',
  phone: null,
  role: 'admin',
  empresaId: 'emp-1',
  status: true,
  mei: false,
  ...overrides,
});

describe('getManagedUserActions', () => {
  it('permite admin editar e acessar a si mesmo', () => {
    const flags = getManagedUserActions('admin', baseUser({ id: 'self-1' }), 'self-1');
    expect(flags.canEdit).toBe(true);
    expect(flags.canImpersonate).toBe(true);
    expect(flags.canDelete).toBe(false);
    expect(flags.canBan).toBe(false);
  });

  it('admin continua sem editar outro admin', () => {
    const flags = getManagedUserActions('admin', baseUser({ id: 'other', role: 'admin' }), 'self-1');
    expect(flags.canEdit).toBe(false);
  });

  it('superadmin pode editar a si mesmo', () => {
    const flags = getManagedUserActions(
      'superadmin',
      baseUser({ id: 'self-1', role: 'superadmin' }),
      'self-1'
    );
    expect(flags.canEdit).toBe(true);
    expect(flags.canDelete).toBe(false);
  });
});

describe('shouldShowAdminMeiToggle', () => {
  it('mostra toggle quando usuário já tem MEI (para poder desligar)', () => {
    expect(
      shouldShowAdminMeiToggle([{ max_mei: 0 }], { meiActive: false, userHasMei: true })
    ).toBe(true);
  });

  it('oculta quando módulo desligado e conta sem MEI', () => {
    expect(
      shouldShowAdminMeiToggle([{ max_mei: 0 }], { meiActive: false, userHasMei: false })
    ).toBe(false);
  });
});
