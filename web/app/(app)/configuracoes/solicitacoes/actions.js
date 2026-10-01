'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/session';
import { getAccessToken } from '@/lib/data/acessos';
import { invokeManageAccessRequests } from '@/lib/data/solicitacoes';
import { canReviewAccessRequests, formatAccessRequestError, isStaleRequestError } from '@/lib/acessos/solicitacoes';

const PATH = '/configuracoes/solicitacoes';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Primeiro portão (papel resolvido no servidor). A Edge Function e o backend conferem de novo
 * que quem pede é superadmin e que o pedido continua pendente antes de mudar qualquer dado.
 */
async function decide(action, userId) {
  const session = await requireUser();
  if (!canReviewAccessRequests(session.role)) {
    return { ok: false, error: 'Só o superadmin pode analisar solicitações de acesso.' };
  }
  if (!UUID_RE.test(String(userId || ''))) return { ok: false, error: 'Solicitação inválida.' };

  const token = await getAccessToken(session.supabase);
  try {
    await invokeManageAccessRequests(token, { action, userId });
  } catch (error) {
    const message = String(error?.message || '');
    console.error(`Error in solicitacoes/${action}:`, message);
    const stale = isStaleRequestError(message);
    if (stale) revalidatePath(PATH);
    return { ok: false, stale, error: formatAccessRequestError(message) };
  }

  revalidatePath(PATH);
  return { ok: true };
}

/** Aprovar: vínculo vira Admin ativo da empresa, empresa fica ativa (regra do backend). */
export async function approveAccessRequestAction(userId) {
  const res = await decide('approve', userId);
  return res.ok ? { ok: true, message: 'Solicitação aprovada. O acesso foi liberado.' } : res;
}

/** Negar: o backend remove o vínculo pendente, a empresa pendente e o usuário. */
export async function rejectAccessRequestAction(userId) {
  const res = await decide('reject', userId);
  return res.ok ? { ok: true, message: 'Solicitação negada. O cadastro foi removido.' } : res;
}
