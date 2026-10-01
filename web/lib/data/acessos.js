import 'server-only';
import { backendFetch } from '@/lib/auth/backendApi';
import { filterVisibleUsers } from '@/lib/acessos/acessos';

/**
 * Leitura da tela "Gerenciar acessos" — mesmas rotas da API Express que o app atual usa
 * (`GET /users`, `GET /users/empresas`, `GET /invites`). O backend aplica o escopo
 * (admin só vê a própria empresa) e as regras de papel; aqui só montamos a lista.
 */

export async function getAccessToken(supabase) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token || null;
}

/**
 * Lista completa autorizada. Com termo de busca, também pede a busca ao servidor
 * (para o superadmin ela traz contas sem vínculo — "SEM VÍNCULO"), unindo por id.
 */
export async function fetchManagedUsers(token, { role, search = '' } = {}) {
  const base = await backendFetch('/users', { token });
  const list = Array.isArray(base?.users) ? base.users : [];
  const byId = new Map(list.map((u) => [u.id, u]));

  const term = String(search || '').trim();
  if (term) {
    try {
      const found = await backendFetch(`/users?search=${encodeURIComponent(term)}`, { token });
      for (const u of Array.isArray(found?.users) ? found.users : []) {
        if (!byId.has(u.id)) byId.set(u.id, u);
      }
    } catch (error) {
      console.warn('[Acessos] busca no servidor falhou; usando lista local:', error?.message || error);
    }
  }

  return filterVisibleUsers(Array.from(byId.values()), role);
}

export async function fetchEmpresas(token) {
  const data = await backendFetch('/users/empresas', { token });
  return Array.isArray(data?.empresas) ? data.empresas : [];
}

export async function fetchEmpresaById(token, empresaId) {
  const data = await backendFetch(`/users/empresas/${encodeURIComponent(empresaId)}`, { token });
  return data?.empresa || null;
}

export async function fetchPendingInvites(token) {
  const data = await backendFetch('/invites', { token });
  return Array.isArray(data?.invites) ? data.invites : [];
}
