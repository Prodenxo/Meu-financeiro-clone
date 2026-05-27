import test from 'node:test';
import assert from 'node:assert/strict';

import {
  assertOpenclawSuperadmin,
  formatPendingAccessRequestsForOpenclaw,
} from '../src/services/openclaw-access-requests.service.js';

test('assertOpenclawSuperadmin aceita hasSuperadminCapability', () => {
  assert.doesNotThrow(() => assertOpenclawSuperadmin({ hasSuperadminCapability: true }));
});

test('assertOpenclawSuperadmin rejeita usuario comum', () => {
  assert.throws(
    () => assertOpenclawSuperadmin({ profileRole: 'usuario', hasSuperadminCapability: false }),
    /superadmin/i,
  );
});

test('formatPendingAccessRequestsForOpenclaw lista emails', () => {
  const text = formatPendingAccessRequestsForOpenclaw([
    {
      userId: 'u1',
      email: 'a@b.com',
      fullName: 'Ana',
      phone: '5511999999999',
      empresa: { cnpj: '123', nome: 'Empresa X' },
    },
  ]);
  assert.ok(text.includes('a@b.com'));
  assert.ok(text.includes('approve_access_request'));
});
