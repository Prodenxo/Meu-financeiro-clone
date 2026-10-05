/**
 * Regras puras da tela "Gerenciar acessos" — porta de `frontend/screens/ManageUsersScreen.tsx`,
 * `frontend/lib/managedUserActions.ts` e `frontend/lib/matchManagedUserSearch.ts`.
 * Sem acesso a rede ou banco: só cálculo sobre listas já autorizadas pelo backend.
 */

export const ROLE_LABEL = {
  superadmin: 'Super admin',
  admin: 'Admin',
  usuario: 'Usuário',
  outsider: 'Convidado',
};

export const ROLE_DESCRIPTION = {
  admin: 'Acesso total ao painel administrativo da empresa.',
  usuario: 'Acesso padrão ao app financeiro.',
  outsider: 'Acesso temporário ou externo, com escopo restrito.',
};

/** Perfis que o superadmin pode atribuir ao criar/editar (igual ao app atual). */
export const ROLE_OPTIONS_SUPERADMIN = ['admin', 'usuario', 'outsider'];

export const TABS = ['usuarios', 'convites', 'empresas'];
export const STATUS_FILTERS = ['todos', 'ativos', 'bloqueados'];
export const PERFIL_FILTERS = ['todos', 'superadmin', 'admin', 'usuario', 'outsider'];
export const MEI_FILTERS = ['todos', 'ativos', 'inativos'];
export const PAGE_SIZES = [25, 50, 100];
export const DEFAULT_PAGE_SIZE = 25;

/** Mesma regra do app atual: `hasRole(role, ['admin'])` → admin ou superadmin. */
export function canManageAccess(role) {
  return role === 'admin' || role === 'superadmin';
}

export function canSeeEmpresasTab(role) {
  return role === 'superadmin';
}

export function roleLabel(role) {
  return ROLE_LABEL[role] || String(role || '—');
}

/**
 * Ações permitidas sobre um usuário (porta fiel de `getManagedUserActions`).
 * O backend valida tudo de novo; isto só decide o que mostrar.
 */
export function getManagedUserActions(actorRole, target, actorUserId) {
  const isSelf = Boolean(actorUserId) && target?.id === actorUserId;
  const isSuperadmin = actorRole === 'superadmin';
  const isAdmin = actorRole === 'admin';
  const targetRole = target?.role;

  let canManageTarget;
  if (isSelf && (isAdmin || isSuperadmin)) canManageTarget = true;
  else if (isSuperadmin) canManageTarget = targetRole !== 'superadmin';
  else canManageTarget = isAdmin && targetRole === 'usuario';

  const canResetPassword = isSuperadmin ? true : isAdmin && (isSelf || targetRole === 'usuario');
  const canViewCompanyMembers = isSuperadmin && targetRole === 'admin' && Boolean(target?.empresaId);

  return {
    isSelf,
    canEdit: canManageTarget,
    canImpersonate: canManageTarget,
    canDelete: canManageTarget && !isSelf,
    canBan: canManageTarget && !isSelf,
    canResetPassword,
    canViewCompanyMembers,
  };
}

/** Admin não vê superadmins nem convidados na lista (mesma regra do app atual). */
export function filterVisibleUsers(users, actorRole) {
  const list = Array.isArray(users) ? users : [];
  if (actorRole === 'superadmin') return list;
  return list.filter((u) => u.role !== 'superadmin' && u.role !== 'outsider');
}

export function isUserActive(user) {
  return user?.status !== false;
}

/** Totais dos cards — sempre sobre o conjunto autorizado completo, não só a página. */
export function computeStats(users, empresas) {
  const list = Array.isArray(users) ? users : [];
  return {
    usuarios: list.length,
    empresas: Array.isArray(empresas) ? empresas.length : null,
    ativos: list.filter(isUserActive).length,
    bloqueados: list.filter((u) => !isUserActive(u)).length,
    administradores: list.filter((u) => u.role === 'admin' || u.role === 'superadmin').length,
  };
}

/** Busca por nome, e-mail, telefone, empresa, perfil ou id (porta de `matchManagedUserSearch`). */
export function matchManagedUserSearch(user, rawTerm) {
  const term = String(rawTerm || '').trim();
  if (!term) return true;
  const lower = term.toLowerCase();
  const digits = term.replace(/\D/g, '');
  const fields = [user?.displayName, user?.email, user?.empresaName, user?.role, roleLabel(user?.role), user?.phone, user?.id];

  if (fields.some((f) => String(f || '').toLowerCase().includes(lower))) return true;
  if (digits.length >= 2) {
    const phoneDigits = String(user?.phone || '').replace(/\D/g, '');
    if (phoneDigits.includes(digits)) return true;
    return fields.some((f) => String(f || '').replace(/\D/g, '').includes(digits));
  }
  return false;
}

export function userSortKey(user) {
  return String(user?.displayName || user?.email || '').trim();
}

const collator = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true });

/** Ordena A–Z / Z–A pelo nome (ou e-mail) com desempate estável por e-mail e id. */
export function sortUsers(users, ordem = 'asc') {
  const dir = ordem === 'desc' ? -1 : 1;
  return [...users].sort((a, b) => {
    const byName = collator.compare(userSortKey(a), userSortKey(b));
    if (byName !== 0) return byName * dir;
    const byEmail = collator.compare(String(a.email || ''), String(b.email || ''));
    if (byEmail !== 0) return byEmail;
    return String(a.id || '').localeCompare(String(b.id || ''));
  });
}

function pickOne(value, allowed, fallback) {
  const v = Array.isArray(value) ? value[0] : value;
  return allowed.includes(v) ? v : fallback;
}

function pickInt(value, fallback, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
  const v = Array.isArray(value) ? value[0] : value;
  const n = Number.parseInt(String(v ?? ''), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function pickText(value, max = 120) {
  const v = Array.isArray(value) ? value[0] : value;
  return String(v ?? '').trim().slice(0, max);
}

/** Normaliza os `searchParams` da URL. Valores inválidos caem no padrão. */
export function parseAcessosParams(searchParams = {}, { role } = {}) {
  let aba = pickOne(searchParams.aba, TABS, 'usuarios');
  if (aba === 'empresas' && !canSeeEmpresasTab(role)) aba = 'usuarios';
  return {
    aba,
    q: pickText(searchParams.q),
    status: pickOne(searchParams.status, STATUS_FILTERS, 'todos'),
    perfil: pickOne(searchParams.perfil, PERFIL_FILTERS, 'todos'),
    mei: pickOne(searchParams.mei, MEI_FILTERS, 'todos'),
    ordem: pickOne(searchParams.ordem, ['asc', 'desc'], 'asc'),
    pagina: pickInt(searchParams.pagina, 1),
    porPagina: PAGE_SIZES.includes(pickInt(searchParams.porPagina, DEFAULT_PAGE_SIZE)) ? pickInt(searchParams.porPagina, DEFAULT_PAGE_SIZE) : DEFAULT_PAGE_SIZE,
    empresa: pickText(searchParams.empresa, 64),
  };
}

const PARAM_DEFAULTS = {
  aba: 'usuarios',
  q: '',
  status: 'todos',
  perfil: 'todos',
  mei: 'todos',
  ordem: 'asc',
  pagina: 1,
  porPagina: DEFAULT_PAGE_SIZE,
  empresa: '',
};

/** Monta a URL da tela a partir dos parâmetros, omitindo os que estão no padrão. */
export function buildAcessosHref(params, basePath = '/configuracoes/acessos') {
  const sp = new URLSearchParams();
  for (const key of Object.keys(PARAM_DEFAULTS)) {
    const value = params?.[key];
    if (value === undefined || value === null || value === '' || String(value) === String(PARAM_DEFAULTS[key])) continue;
    sp.set(key, String(value));
  }
  const qs = sp.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

/** Fatia uma lista já filtrada/ordenada. Página fora do intervalo volta para a última. */
export function paginate(items, pagina, porPagina) {
  const total = items.length;
  const size = porPagina > 0 ? porPagina : DEFAULT_PAGE_SIZE;
  const pageCount = Math.max(1, Math.ceil(total / size));
  const page = Math.min(Math.max(1, pagina || 1), pageCount);
  const start = (page - 1) * size;
  const slice = items.slice(start, start + size);
  return {
    items: slice,
    total,
    page,
    pageCount,
    from: total === 0 ? 0 : start + 1,
    to: total === 0 ? 0 : start + slice.length,
  };
}

/** Filtra + ordena + pagina usuários conforme os parâmetros da URL. */
export function buildUsersPage(users, params) {
  const { q, status, perfil, ordem, pagina, porPagina, empresa } = params;
  let list = Array.isArray(users) ? users : [];
  if (empresa) list = list.filter((u) => u.empresaId === empresa);
  if (q) list = list.filter((u) => matchManagedUserSearch(u, q));
  if (status === 'ativos') list = list.filter(isUserActive);
  if (status === 'bloqueados') list = list.filter((u) => !isUserActive(u));
  if (perfil !== 'todos') list = list.filter((u) => u.role === perfil);
  const sorted = sortUsers(list, ordem);
  return { ...paginate(sorted, pagina, porPagina), hasFilters: Boolean(q || empresa || status !== 'todos' || perfil !== 'todos') };
}

export function empresaDisplayName(empresa) {
  return String(empresa?.nome_fantasia || empresa?.empresa || '').trim() || 'Empresa sem nome';
}

export function isEmpresaMeiActive(empresa) {
  return Number(empresa?.max_mei || 0) > 0;
}

export function matchEmpresaSearch(empresa, rawTerm) {
  const term = String(rawTerm || '').trim().toLowerCase();
  if (!term) return true;
  return [empresa?.empresa, empresa?.nome_fantasia, empresa?.id].some((f) => String(f || '').toLowerCase().includes(term));
}

/** Filtra + ordena (nome) + pagina empresas. */
export function buildEmpresasPage(empresas, params) {
  const { q, mei, ordem, pagina, porPagina } = params;
  let list = Array.isArray(empresas) ? empresas : [];
  if (q) list = list.filter((e) => matchEmpresaSearch(e, q));
  if (mei === 'ativos') list = list.filter(isEmpresaMeiActive);
  if (mei === 'inativos') list = list.filter((e) => !isEmpresaMeiActive(e));
  const dir = ordem === 'desc' ? -1 : 1;
  const sorted = [...list].sort((a, b) => {
    const c = collator.compare(empresaDisplayName(a), empresaDisplayName(b));
    return c !== 0 ? c * dir : String(a.id || '').localeCompare(String(b.id || ''));
  });
  return { ...paginate(sorted, pagina, porPagina), hasFilters: Boolean(q || mei !== 'todos') };
}

/** Ex.: "Mostrando 1–25 de 1.125 usuários". */
export function describeRange({ from, to, total }, singular, plural) {
  const noun = total === 1 ? singular : plural;
  const fmt = (n) => Number(n || 0).toLocaleString('pt-BR');
  if (total === 0) return `Nenhum ${singular} para mostrar`;
  return `Mostrando ${fmt(from)}–${fmt(to)} de ${fmt(total)} ${noun}`;
}

export function initialsOf(name, email) {
  const base = String(name || '').trim() || String(email || '').split('@')[0] || '';
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Matiz estável (0–359) a partir do id/e-mail, para o avatar. */
export function avatarHue(seed) {
  const str = String(seed || '');
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) % 360;
  return h;
}

export function formatPtDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatPtDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** Converte ISO para `YYYY-MM-DD` (input type=date). */
export function toDateInputValue(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Telefone BR para exibição: (11) 99999-9999. Outros formatos voltam como vieram. */
export function formatPhoneDisplay(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  const national = digits.startsWith('55') && digits.length >= 12 ? digits.slice(2) : digits;
  if (national.length === 11) return `(${national.slice(0, 2)}) ${national.slice(2, 7)}-${national.slice(7)}`;
  if (national.length === 10) return `(${national.slice(0, 2)}) ${national.slice(2, 6)}-${national.slice(6)}`;
  return String(phone);
}

/** Link de convite aberto no novo site: `/register?convite=<token>` (mesma rota do backend). */
export function buildInviteUrl(origin, rawToken) {
  const base = String(origin || '').trim().replace(/\/$/, '');
  if (!rawToken) return '';
  return `${base}/register?convite=${encodeURIComponent(rawToken)}`;
}

/** Mesmas traduções de erro do app atual (`formatManageUserError`). */
export function formatManageUserError(message) {
  const text = String(message || '').trim();
  if (text.includes('Limite de MEI atingido')) {
    return 'Esta empresa já atingiu o limite de vagas MEI. Desative o MEI de outro usuário ou aumente o limite da empresa.';
  }
  if (text.includes('Limite de usuarios nao MEI') || text.includes('Limite de usuários não MEI')) {
    return 'Esta empresa já atingiu o limite de usuários PF / Outros.';
  }
  if (/forbidden|sem permiss/i.test(text)) return 'Você não tem permissão para esta operação.';
  if (/fetch failed|ECONNREFUSED|network/i.test(text)) {
    return 'Não foi possível falar com a API do Meu Financeiro. Verifique se o backend está no ar e tente de novo.';
  }
  if (/Error updating user/i.test(text)) {
    return 'Não foi possível salvar os dados de login. Confira e-mail e telefone (telefone não pode repetir em outra conta).';
  }
  if (/already been registered|email.*already|e-mail já está/i.test(text)) {
    return 'Este e-mail já está em uso em outra conta.';
  }
  return text || 'Não foi possível concluir a operação.';
}

/** Limites da empresa para o card (igual ao `EmpresaCard` do app atual). */
export function describeEmpresaLimits(empresa) {
  const parts = [];
  const maxMei = Number(empresa?.max_mei || 0);
  parts.push(maxMei > 0 ? `MEI: ${maxMei} ${maxMei === 1 ? 'vaga' : 'vagas'}` : 'MEI desativado');
  const naoMei = empresa?.max_usuarios_nao_mei;
  parts.push(naoMei === null || naoMei === undefined || Number(naoMei) === 0 ? 'Clientes: ilimitado' : `Clientes: até ${Number(naoMei)}`);
  return parts;
}
