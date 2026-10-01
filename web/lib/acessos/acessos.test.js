import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAcessosHref,
  buildEmpresasPage,
  buildUsersPage,
  canManageAccess,
  computeStats,
  describeRange,
  filterVisibleUsers,
  formatManageUserError,
  getManagedUserActions,
  initialsOf,
  matchManagedUserSearch,
  paginate,
  parseAcessosParams,
  sortUsers,
} from './acessos.js';

const users = [
  { id: 'u1', email: 'ana@x.com', displayName: 'Ana Souza', phone: '5511999990001', role: 'admin', empresaId: 'e1', empresaName: 'Padaria', status: true, mei: false },
  { id: 'u2', email: 'bruno@x.com', displayName: 'Bruno Lima', phone: null, role: 'usuario', empresaId: 'e1', empresaName: 'Padaria', status: false, mei: true },
  { id: 'u3', email: 'carla@y.com', displayName: null, phone: '5521988880002', role: 'superadmin', empresaId: 'e2', empresaName: 'Matriz', status: true, mei: null },
  { id: 'u4', email: 'dudu@y.com', displayName: 'Dudu', phone: null, role: 'outsider', empresaId: null, empresaName: null, status: true, mei: null },
];

test('canManageAccess: só admin e superadmin', () => {
  assert.equal(canManageAccess('superadmin'), true);
  assert.equal(canManageAccess('admin'), true);
  assert.equal(canManageAccess('usuario'), false);
  assert.equal(canManageAccess(null), false);
});

test('getManagedUserActions: superadmin não mexe em outro superadmin, mas gerencia o resto', () => {
  const other = getManagedUserActions('superadmin', users[2], 'u9');
  assert.equal(other.canEdit, false);
  assert.equal(other.canDelete, false);
  assert.equal(other.canResetPassword, true);

  const admin = getManagedUserActions('superadmin', users[0], 'u9');
  assert.equal(admin.canEdit, true);
  assert.equal(admin.canBan, true);
  assert.equal(admin.canImpersonate, true);
  assert.equal(admin.canViewCompanyMembers, true);
});

test('getManagedUserActions: admin só gerencia usuário comum e não bloqueia/exclui a própria conta', () => {
  const common = getManagedUserActions('admin', users[1], 'u1');
  assert.equal(common.canEdit, true);
  assert.equal(common.canBan, true);
  assert.equal(common.canDelete, true);
  assert.equal(common.canResetPassword, true);
  assert.equal(common.canViewCompanyMembers, false);

  const self = getManagedUserActions('admin', users[0], 'u1');
  assert.equal(self.isSelf, true);
  assert.equal(self.canEdit, true);
  assert.equal(self.canBan, false);
  assert.equal(self.canDelete, false);

  const superTarget = getManagedUserActions('admin', users[2], 'u1');
  assert.equal(superTarget.canEdit, false);
  assert.equal(superTarget.canResetPassword, false);
});

test('filterVisibleUsers: admin não vê superadmin nem convidado', () => {
  assert.deepEqual(filterVisibleUsers(users, 'admin').map((u) => u.id), ['u1', 'u2']);
  assert.equal(filterVisibleUsers(users, 'superadmin').length, 4);
});

test('computeStats: totais sobre o conjunto inteiro', () => {
  const stats = computeStats(users, [{ id: 'e1' }, { id: 'e2' }]);
  assert.deepEqual(stats, { usuarios: 4, empresas: 2, ativos: 3, bloqueados: 1, administradores: 2 });
  assert.equal(computeStats(users, null).empresas, null);
});

test('matchManagedUserSearch: nome, e-mail, telefone, empresa e perfil', () => {
  assert.equal(matchManagedUserSearch(users[0], 'ana'), true);
  assert.equal(matchManagedUserSearch(users[0], 'X.COM'), true);
  assert.equal(matchManagedUserSearch(users[0], '(11) 99999'), true);
  assert.equal(matchManagedUserSearch(users[1], 'padaria'), true);
  assert.equal(matchManagedUserSearch(users[2], 'super admin'), true);
  assert.equal(matchManagedUserSearch(users[1], 'zzz'), false);
  assert.equal(matchManagedUserSearch(users[1], ''), true);
});

test('sortUsers: ordena por nome/e-mail com desempate estável', () => {
  const asc = sortUsers(users, 'asc').map((u) => u.id);
  assert.deepEqual(asc, ['u1', 'u2', 'u3', 'u4']);
  const desc = sortUsers(users, 'desc').map((u) => u.id);
  assert.deepEqual(desc, ['u4', 'u3', 'u2', 'u1']);
});

test('parseAcessosParams: valores inválidos caem no padrão e aba Empresas exige superadmin', () => {
  const p = parseAcessosParams({ aba: 'empresas', status: 'x', perfil: 'admin', pagina: '-3', porPagina: '7', ordem: 'desc', q: '  joão ' }, { role: 'admin' });
  assert.equal(p.aba, 'usuarios');
  assert.equal(p.status, 'todos');
  assert.equal(p.perfil, 'admin');
  assert.equal(p.pagina, 1);
  assert.equal(p.porPagina, 25);
  assert.equal(p.ordem, 'desc');
  assert.equal(p.q, 'joão');

  const sup = parseAcessosParams({ aba: 'empresas', porPagina: '50' }, { role: 'superadmin' });
  assert.equal(sup.aba, 'empresas');
  assert.equal(sup.porPagina, 50);
});

test('buildAcessosHref: omite padrões e preserva o resto', () => {
  assert.equal(buildAcessosHref({ aba: 'usuarios', status: 'todos', pagina: 1 }), '/configuracoes/acessos');
  assert.equal(buildAcessosHref({ aba: 'convites' }), '/configuracoes/acessos?aba=convites');
  assert.equal(buildAcessosHref({ q: 'ana', status: 'bloqueados', pagina: 3 }), '/configuracoes/acessos?q=ana&status=bloqueados&pagina=3');
});

test('paginate: página fora do intervalo volta para a última', () => {
  const list = Array.from({ length: 60 }, (_, i) => ({ id: String(i) }));
  const page = paginate(list, 9, 25);
  assert.equal(page.page, 3);
  assert.equal(page.from, 51);
  assert.equal(page.to, 60);
  assert.equal(page.pageCount, 3);
  const empty = paginate([], 1, 25);
  assert.deepEqual([empty.from, empty.to, empty.total], [0, 0, 0]);
});

test('buildUsersPage: filtros agem antes da paginação', () => {
  const blocked = buildUsersPage(users, { q: '', status: 'bloqueados', perfil: 'todos', ordem: 'asc', pagina: 1, porPagina: 25, empresa: '' });
  assert.deepEqual(blocked.items.map((u) => u.id), ['u2']);
  assert.equal(blocked.hasFilters, true);

  const byEmpresa = buildUsersPage(users, { q: '', status: 'todos', perfil: 'todos', ordem: 'asc', pagina: 1, porPagina: 25, empresa: 'e1' });
  assert.equal(byEmpresa.total, 2);

  const admins = buildUsersPage(users, { q: 'x.com', status: 'ativos', perfil: 'admin', ordem: 'asc', pagina: 1, porPagina: 25, empresa: '' });
  assert.deepEqual(admins.items.map((u) => u.id), ['u1']);
});

test('buildEmpresasPage: filtro MEI e busca', () => {
  const empresas = [
    { id: 'e1', empresa: 'Padaria Ltda', nome_fantasia: 'Padaria', max_mei: 2 },
    { id: 'e2', empresa: 'Matriz', nome_fantasia: null, max_mei: 0 },
  ];
  const ativos = buildEmpresasPage(empresas, { q: '', mei: 'ativos', ordem: 'asc', pagina: 1, porPagina: 25 });
  assert.deepEqual(ativos.items.map((e) => e.id), ['e1']);
  const busca = buildEmpresasPage(empresas, { q: 'matriz', mei: 'todos', ordem: 'asc', pagina: 1, porPagina: 25 });
  assert.deepEqual(busca.items.map((e) => e.id), ['e2']);
});

test('describeRange e initialsOf', () => {
  assert.equal(describeRange({ from: 1, to: 25, total: 1125 }, 'usuário', 'usuários'), 'Mostrando 1–25 de 1.125 usuários');
  assert.equal(describeRange({ from: 0, to: 0, total: 0 }, 'usuário', 'usuários'), 'Nenhum usuário para mostrar');
  assert.equal(initialsOf('Ana Souza'), 'AS');
  assert.equal(initialsOf('', 'carla@y.com'), 'CA');
  assert.equal(initialsOf('', ''), '?');
});

test('formatManageUserError traduz limites e permissões', () => {
  assert.match(formatManageUserError('Limite de MEI atingido'), /vagas MEI/);
  assert.match(formatManageUserError('Forbidden'), /permissão/);
  assert.equal(formatManageUserError(''), 'Não foi possível concluir a operação.');
});
