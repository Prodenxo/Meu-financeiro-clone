import 'server-only';
import { backendFetch, getBackendApiBase } from '@/lib/auth/backendApi';
import { getSupabasePublicEnv } from '@/lib/supabase/env';
import { HISTORY_LIMIT, normalizeHistory, normalizePendingList } from '@/lib/acessos/solicitacoes';

/**
 * Mesmos caminhos do app atual (`frontend/lib/manage-access-requests.ts` e `access-request-report.ts`):
 * - pendentes / aprovar / negar → Edge Function `manage-access-requests` com o JWT do usuário; ela
 *   repassa ao backend interno, que confere se quem pede é superadmin e se o pedido ainda está pendente;
 * - histórico → `GET /api/admin/access-requests/report` (`requireSuperAdmin`), com a ação `report`
 *   da Edge como alternativa quando a API não tem a rota.
 * Só roda no servidor: o token nunca chega ao navegador.
 */

function manageFunctionUrl() {
  const { url } = getSupabasePublicEnv();
  return `${url.replace(/\/rest\/v1$/, '').replace(/\/$/, '')}/functions/v1/manage-access-requests`;
}

export async function invokeManageAccessRequests(token, body) {
  if (!token) throw new Error('Sessão expirada. Entre novamente.');
  const { anonKey } = getSupabasePublicEnv();

  const res = await fetch(manageFunctionUrl(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(anonKey ? { apikey: anonKey } : {}),
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || typeof data?.error === 'string') {
    throw new Error(data?.error || data?.message || `Falha na operação (${res.status}).`);
  }
  return data ?? {};
}

export async function fetchPendingAccessRequests(token) {
  const data = await invokeManageAccessRequests(token, { action: 'list' });
  return normalizePendingList(data.requests);
}

const isReportRouteMissing = (message) => /cannot get.*access-requests\/report/i.test(message) || /\b404\b/.test(message);

export async function fetchAccessRequestHistory(token, limit = HISTORY_LIMIT) {
  if (getBackendApiBase()) {
    try {
      const data = await backendFetch(`/admin/access-requests/report?limit=${limit}`, { token });
      return normalizeHistory(data?.entries);
    } catch (error) {
      if (!isReportRouteMissing(String(error?.message || ''))) throw error;
    }
  }
  const data = await invokeManageAccessRequests(token, { action: 'report', limit });
  return normalizeHistory(data.entries);
}
