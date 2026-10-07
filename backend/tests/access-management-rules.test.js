import test from 'node:test';
import assert from 'node:assert/strict';
import { assertCanImpersonate, resolveAccessTarget } from '../src/services/access-target.service.js';
import { isUserVisibleToRequester } from '../src/services/users.service.js';
import { resolveCreatorNames } from '../src/services/empresa-invites.service.js';

const forbidden = (err) => err?.statusCode === 403 || err?.status === 403 || /permiss|acess|própria|superadmin|administradores/i.test(String(err?.message));

test('assertCanImpersonate — superadmin acessa admin/usuario/convidado, nunca outro superadmin', () => {
  const sa = { userId: 's1', role: 'superadmin', empresaId: null };
  assert.doesNotThrow(() => assertCanImpersonate(sa, 'u1', { role: 'usuario', empresaId: 'e1' }));
  assert.doesNotThrow(() => assertCanImpersonate(sa, 'u2', { role: 'admin', empresaId: 'e2' }));
  assert.doesNotThrow(() => assertCanImpersonate(sa, 'u3', { role: 'outsider', empresaId: 'e2' }));
  assert.throws(() => assertCanImpersonate(sa, 's2', { role: 'superadmin', empresaId: null }), forbidden);
  assert.throws(() => assertCanImpersonate(sa, 's1', { role: 'superadmin', empresaId: null }), forbidden);
});

test('assertCanImpersonate — admin só acessa usuario da própria empresa', () => {
  const admin = { userId: 'a1', role: 'admin', empresaId: 'e1' };
  assert.doesNotThrow(() => assertCanImpersonate(admin, 'u1', { role: 'usuario', empresaId: 'e1' }));
  assert.throws(() => assertCanImpersonate(admin, 'u2', { role: 'usuario', empresaId: 'e2' }), forbidden);
  assert.throws(() => assertCanImpersonate(admin, 'u3', { role: 'admin', empresaId: 'e1' }), forbidden);
  assert.throws(() => assertCanImpersonate(admin, 's1', { role: 'superadmin', empresaId: 'e1' }), forbidden);
  assert.throws(() => assertCanImpersonate({ ...admin, empresaId: null }, 'u1', { role: 'usuario', empresaId: null }), forbidden);
  assert.throws(() => assertCanImpersonate({ userId: 'x', role: 'usuario', empresaId: 'e1' }, 'u1', { role: 'usuario', empresaId: 'e1' }), forbidden);
});

const chain = (result) => {
  const q = {
    select: () => q,
    eq: () => q,
    in: () => q,
    order: () => q,
    limit: () => q,
    maybeSingle: async () => result,
    then: (resolve) => resolve(result),
  };
  return q;
};

test('resolveAccessTarget — lê o perfil do vínculo mais recente (não cai em "usuario" sem token)', async () => {
  const admin = {
    from: (table) => {
      if (table === 'role_x_user_x_empresa') return chain({ data: { empresas_id: 'e1', roles_id: 7 }, error: null });
      if (table === 'roles') return chain({ data: { roles: 'Superadmin' }, error: null });
      throw new Error(`tabela inesperada ${table}`);
    },
  };
  assert.deepEqual(await resolveAccessTarget(admin, 'u1'), { role: 'superadmin', empresaId: 'e1', hasLink: true });
});

test('resolveAccessTarget — sem vínculo usa profiles.role', async () => {
  const admin = {
    from: (table) => {
      if (table === 'role_x_user_x_empresa') return chain({ data: null, error: null });
      if (table === 'profiles') return chain({ data: { role: 'admin' }, error: null });
      throw new Error(`tabela inesperada ${table}`);
    },
  };
  assert.deepEqual(await resolveAccessTarget(admin, 'u1'), { role: 'admin', empresaId: null, hasLink: false });
});

test('isUserVisibleToRequester — admin não recebe superadmin nem convidado', () => {
  assert.equal(isUserVisibleToRequester('admin', { role: 'usuario' }), true);
  assert.equal(isUserVisibleToRequester('admin', { role: 'admin' }), true);
  assert.equal(isUserVisibleToRequester('admin', { role: 'superadmin' }), false);
  assert.equal(isUserVisibleToRequester('admin', { role: 'outsider' }), false);
  assert.equal(isUserVisibleToRequester('superadmin', { role: 'superadmin' }), true);
  assert.equal(isUserVisibleToRequester('superadmin', { role: 'outsider' }), true);
});

test('resolveCreatorNames — nome do perfil, senão e-mail; sem dado fica de fora', async () => {
  const admin = {
    from: () => chain({ data: [{ id: 'a', display_name: 'Ana Martins' }, { id: 'b', display_name: '  ' }], error: null }),
    auth: {
      admin: {
        getUserById: async (id) => {
          if (id === 'b') return { data: { user: { email: 'bruno@exemplo.com', user_metadata: {} } } };
          throw new Error('não encontrado');
        },
      },
    },
  };
  const names = await resolveCreatorNames(admin, ['a', 'b', 'c', 'a', null]);
  assert.equal(names.get('a'), 'Ana Martins');
  assert.equal(names.get('b'), 'bruno@exemplo.com');
  assert.equal(names.has('c'), false);
});
