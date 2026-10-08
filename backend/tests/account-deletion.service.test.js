import test from 'node:test';
import assert from 'node:assert/strict';

import { deleteOwnAccount, findAccountDeletionBlocker } from '../src/services/account-deletion.service.js';

const USER = 'user-1';
const EMPRESA = 'emp-1';
const ROLES = [
  { id: 'r-super', roles: 'Superadmin' },
  { id: 'r-admin', roles: 'Admin' },
  { id: 'r-user', roles: 'User' },
];

/** Supabase falso: cada consulta vira `{ table, op, filters }` e o resultado vem de `respond`. */
const makeAdminClient = ({ links = [], otherMembers = 0, deleteAuthError = null } = {}) => {
  const log = [];
  const respond = ({ table, op, filters, opts }) => {
    if (op === 'delete') return { error: null };
    if (table === 'role_x_user_x_empresa' && opts?.count === 'exact') return { count: otherMembers, error: null };
    if (table === 'role_x_user_x_empresa') return { data: links, error: null };
    if (table === 'roles') {
      const ids = filters.find((f) => f[0] === 'in')?.[2] || [];
      return { data: ROLES.filter((r) => ids.includes(r.id)), error: null };
    }
    return { data: [], error: null };
  };
  const builder = (table) => {
    const q = { table, op: 'select', filters: [], opts: null };
    const chain = {
      select(_cols, opts) { q.opts = opts || null; return chain; },
      delete() { q.op = 'delete'; return chain; },
      eq(col, val) { q.filters.push(['eq', col, val]); return chain; },
      neq(col, val) { q.filters.push(['neq', col, val]); return chain; },
      in(col, val) { q.filters.push(['in', col, val]); return chain; },
      then(resolve, reject) {
        if (q.op === 'delete') log.push(`delete:${table}`);
        return Promise.resolve(respond(q)).then(resolve, reject);
      },
    };
    return chain;
  };
  return {
    log,
    from: builder,
    auth: {
      admin: {
        deleteUser: async (id) => {
          log.push(`auth.deleteUser:${id}`);
          return { error: deleteAuthError };
        },
      },
    },
  };
};

const baseDeps = (adminClient, overrides = {}) => ({
  adminClient,
  getUserId: async () => USER,
  cancelSubscriptions: async () => { adminClient.log.push('cancelSubscriptions'); return 0; },
  disconnectBanks: async () => { adminClient.log.push('disconnectBanks'); return 0; },
  purgeUserData: async () => { adminClient.log.push('purgeUserData'); },
  ...overrides,
});

test('deleteOwnAccount — exige digitar EXCLUIR', async () => {
  const admin = makeAdminClient();
  await assert.rejects(
    deleteOwnAccount('tok', { confirmacao: 'sim' }, baseDeps(admin)),
    (err) => err.status === 400 && err.errors?.code === 'ACCOUNT_DELETE_CONFIRMATION',
  );
  assert.deepEqual(admin.log, []);
});

test('deleteOwnAccount — aceita "excluir" minúsculo e apaga na ordem certa', async () => {
  const admin = makeAdminClient({ links: [{ empresas_id: EMPRESA, roles_id: 'r-user' }] });
  const result = await deleteOwnAccount('tok', { confirmacao: ' excluir ' }, baseDeps(admin));
  assert.deepEqual(result, { userId: USER });
  assert.deepEqual(admin.log, [
    'cancelSubscriptions',
    'disconnectBanks',
    'delete:empresa_invites',
    'delete:recorrencia_skips',
    'delete:recorrencias',
    'delete:calendar_checklist_completions',
    'delete:calendar_upcoming_reminder_sent',
    'delete:contas_moeda_global',
    'delete:open_finance_connections',
    'purgeUserData',
    `auth.deleteUser:${USER}`,
  ]);
});

test('deleteOwnAccount — conta sem vínculo com empresa também pode ser excluída', async () => {
  const admin = makeAdminClient({ links: [] });
  await deleteOwnAccount('tok', { confirmacao: 'EXCLUIR' }, baseDeps(admin));
  assert.ok(admin.log.includes(`auth.deleteUser:${USER}`));
});

test('deleteOwnAccount — falha ao cancelar cobrança não apaga nada', async () => {
  const admin = makeAdminClient({ links: [{ empresas_id: EMPRESA, roles_id: 'r-user' }] });
  const deps = baseDeps(admin, {
    cancelSubscriptions: async () => { throw new Error('asaas fora do ar'); },
  });
  await assert.rejects(
    deleteOwnAccount('tok', { confirmacao: 'EXCLUIR' }, deps),
    (err) => err.errors?.code === 'ACCOUNT_DELETE_BILLING_FAILED',
  );
  assert.deepEqual(admin.log, []);
});

test('deleteOwnAccount — erro ao apagar o login é repassado', async () => {
  const admin = makeAdminClient({ deleteAuthError: { message: 'boom' } });
  await assert.rejects(
    deleteOwnAccount('tok', { confirmacao: 'EXCLUIR' }, baseDeps(admin)),
    (err) => err.status === 400 && /boom/.test(err.message),
  );
});

test('findAccountDeletionBlocker — superadmin bloqueado', async () => {
  const admin = makeAdminClient({ links: [{ empresas_id: null, roles_id: 'r-super' }] });
  const blocker = await findAccountDeletionBlocker(admin, USER);
  assert.equal(blocker?.code, 'ACCOUNT_DELETE_SUPERADMIN');
});

test('findAccountDeletionBlocker — admin com outros usuários ativos bloqueado', async () => {
  const admin = makeAdminClient({ links: [{ empresas_id: EMPRESA, roles_id: 'r-admin' }], otherMembers: 2 });
  const blocker = await findAccountDeletionBlocker(admin, USER);
  assert.equal(blocker?.code, 'ACCOUNT_DELETE_ADMIN_HAS_MEMBERS');
});

test('findAccountDeletionBlocker — admin sozinho na empresa pode excluir', async () => {
  const admin = makeAdminClient({ links: [{ empresas_id: EMPRESA, roles_id: 'r-admin' }], otherMembers: 0 });
  assert.equal(await findAccountDeletionBlocker(admin, USER), null);
});

test('deleteOwnAccount — bloqueio não chega a cancelar cobrança', async () => {
  const admin = makeAdminClient({ links: [{ empresas_id: EMPRESA, roles_id: 'r-admin' }], otherMembers: 1 });
  await assert.rejects(
    deleteOwnAccount('tok', { confirmacao: 'EXCLUIR' }, baseDeps(admin)),
    (err) => err.errors?.code === 'ACCOUNT_DELETE_ADMIN_HAS_MEMBERS',
  );
  assert.deepEqual(admin.log, []);
});
