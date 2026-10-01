import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/session';
import { fetchEmpresas, fetchManagedUsers, fetchPendingInvites, getAccessToken } from '@/lib/data/acessos';
import {
  buildEmpresasPage,
  buildUsersPage,
  canManageAccess,
  canSeeEmpresasTab,
  computeStats,
  empresaDisplayName,
  isEmpresaMeiActive,
  parseAcessosParams,
} from '@/lib/acessos/acessos';
import { AcessosView } from '@/components/acessos/AcessosView';
import { AccessDeniedCard } from '@/components/acessos/AccessDeniedCard';

export const metadata = { title: 'Gerenciar acessos' };
export const dynamic = 'force-dynamic';

/**
 * Gerenciar acessos — a API Express devolve só o que o usuário logado pode ver (admin: a própria
 * empresa; superadmin: tudo). Filtro, ordenação e paginação acontecem aqui no servidor sobre esse
 * conjunto completo, e o navegador recebe apenas a página atual + totais.
 */
export default async function AcessosPage({ searchParams }) {
  const sp = await searchParams;
  const session = await requireUser();
  if (!canManageAccess(session.role)) return <AccessDeniedCard />;

  const params = parseAcessosParams(sp, { role: session.role });
  const token = await getAccessToken(session.supabase);
  if (!token) redirect('/login');

  // Usuários e empresas são a base dos KPIs e das abas; sem eles a tela não faz sentido → error.js.
  const [users, empresas] = await Promise.all([
    fetchManagedUsers(token, { role: session.role, search: params.aba === 'usuarios' ? params.q : '' }),
    fetchEmpresas(token),
  ]);

  // Convites são secundários: falha vira aviso com "Tentar novamente" na aba.
  let invites = null;
  let invitesError = null;
  try {
    invites = await fetchPendingInvites(token);
  } catch (error) {
    console.error('Error in acessos/fetchPendingInvites:', error);
    invitesError = 'Não foi possível carregar os convites.';
  }

  const usersPage = buildUsersPage(users, params);
  const showEmpresas = canSeeEmpresasTab(session.role);
  const empresasPage = showEmpresas ? buildEmpresasPage(empresas, params) : null;
  const empresaFilter = params.empresa ? empresas.find((e) => e.id === params.empresa) : null;

  const data = {
    params,
    role: session.role,
    userId: session.userId,
    stats: computeStats(users, empresas),
    counts: {
      usuarios: users.length,
      convites: Array.isArray(invites) ? invites.length : null,
      empresas: showEmpresas ? empresas.length : null,
    },
    usersPage,
    empresasPage,
    empresas: empresas.map((e) => ({ id: e.id, empresa: e.empresa, nome_fantasia: e.nome_fantasia, max_mei: e.max_mei, max_usuarios_nao_mei: e.max_usuarios_nao_mei })),
    invites,
    invitesError,
    empresaFilterName: empresaFilter ? empresaDisplayName(empresaFilter) : params.empresa ? users.find((u) => u.empresaId === params.empresa)?.empresaName || null : null,
    meiActiveCount: showEmpresas ? empresas.filter(isEmpresaMeiActive).length : null,
  };

  return <AcessosView data={data} />;
}
