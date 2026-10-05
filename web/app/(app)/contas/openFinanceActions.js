'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/session';
import { backendFetch } from '@/lib/auth/backendApi';

async function getAccessToken(supabase) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token || null;
}

function revalidateFinancePaths() {
  revalidatePath('/contas');
  revalidatePath('/visao-geral');
  revalidatePath('/transacoes');
}

export async function pluggyStatusAction() {
  const session = await requireUser();
  const token = await getAccessToken(session.supabase);
  if (!token) return { configured: false, error: 'Sessão expirada.' };
  try {
    const data = await backendFetch('/open-finance/pluggy/status', { token });
    return { configured: Boolean(data?.configured) };
  } catch (e) {
    const msg = String(e.message || '');
    if (/fetch failed|ECONNREFUSED|Falha na API \(503\)|não configurada \(MEI_API_URL\)/i.test(msg)) {
      return {
        configured: false,
        error:
          'Não consegui falar com a API (porta 3333). Na raiz do projeto rode npm run dev:api ou npm run dev (backend/.env com PLUGGY_*).',
      };
    }
    if (/404|Cannot GET|Not Found/i.test(msg)) {
      return {
        configured: false,
        error:
          'A API está no ar, mas sem as rotas Open Finance. Atualize e reinicie backend/ (rota /api/open-finance/pluggy).',
      };
    }
    return { configured: false, error: msg || 'Erro ao consultar status Open Finance.' };
  }
}

export async function pluggyConnectTokenAction() {
  const session = await requireUser();
  const token = await getAccessToken(session.supabase);
  if (!token) return { ok: false, error: 'Sessão expirada. Entre novamente.' };
  try {
    const data = await backendFetch('/open-finance/pluggy/connect-token', {
      method: 'POST',
      body: {},
      token,
    });
    if (!data?.accessToken) return { ok: false, error: 'Resposta inválida da API.' };
    return { ok: true, accessToken: data.accessToken };
  } catch (e) {
    return { ok: false, error: e.message || 'Falha ao gerar token de conexão.' };
  }
}

export async function pluggySyncItemAction(itemId, { mode = 'full' } = {}) {
  const session = await requireUser();
  const token = await getAccessToken(session.supabase);
  if (!token) return { ok: false, error: 'Sessão expirada.' };
  try {
    const body = itemId ? { itemId: String(itemId), mode } : { mode };
    const data = await backendFetch('/open-finance/pluggy/sync', {
      method: 'POST',
      body,
      token,
    });
    revalidateFinancePaths();
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e.message || 'Falha ao sincronizar Open Finance.' };
  }
}

/** Reimporta extrato (90 dias) das conexões já salvas, sem abrir o widget de novo. */
export async function pluggyResyncExtratoAction(options = {}) {
  const { itemId = null, mode = 'full' } = options;
  return pluggySyncItemAction(itemId, { mode });
}

/** Poll leve: importa extrato já na Pluggy + saldo, sem pedir refresh no banco. */
export async function pluggyRefreshBalancesAction(itemId) {
  return pluggySyncItemAction(itemId || null, { mode: 'balance' });
}

export async function pluggyConnectionsAction() {
  const session = await requireUser();
  const token = await getAccessToken(session.supabase);
  if (!token) return { connected: false };
  try {
    const data = await backendFetch('/open-finance/pluggy/connections', { token });
    return { connected: Boolean(data?.connected), itemIds: data?.itemIds ?? [] };
  } catch {
    return { connected: false };
  }
}
