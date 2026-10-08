import { createSupabaseClient } from '../config/supabase.js';
import { badRequest, unauthorized } from '../utils/errors.js';
import { asaasRequest, isAsaasConfigured } from './asaas-api.service.js';
import { invalidateOpenFinanceEntitlement } from './open-finance-entitlement.service.js';
import { listUserPluggyItemIds } from './openFinancePluggy.service.js';
import { deletePluggyItem, isPluggyConfigured } from './pluggy.service.js';
import { getStripe } from './stripe-billing.service.js';
import { purgeUserData } from './users.service.js';

export const ACCOUNT_DELETE_CONFIRMATION = 'EXCLUIR';

/**
 * Tabelas com `user_id` fora do `purgeUserData`. Várias foram criadas à mão no SQL Editor
 * (sem migration), então não dá para contar com ON DELETE CASCADE.
 */
const EXTRA_USER_TABLES = [
  'recorrencia_skips',
  'recorrencias',
  'calendar_checklist_completions',
  'calendar_upcoming_reminder_sent',
  'contas_moeda_global',
  'open_finance_connections',
];
const MISSING_TABLE_CODES = new Set(['42P01', '42703', 'PGRST204', 'PGRST205']);

const purgeExtraUserTables = async (adminClient, userId) => {
  for (const table of EXTRA_USER_TABLES) {
    const { error } = await adminClient.from(table).delete().eq('user_id', userId);
    if (error && !MISSING_TABLE_CODES.has(error.code)) {
      throw badRequest(`Erro ao limpar ${table}: ${error.message}`);
    }
  }
};

const normalizeRole = (role) => {
  const value = String(role || '').trim().toLowerCase();
  return value === 'user' ? 'usuario' : value;
};

/**
 * Motivo que impede a pessoa de excluir a própria conta (ou `null`).
 * Superadmin não se exclui; admin só se não houver outros usuários ativos na empresa.
 */
export const findAccountDeletionBlocker = async (adminClient, userId) => {
  const { data: links, error } = await adminClient
    .from('role_x_user_x_empresa')
    .select('empresas_id, roles_id')
    .eq('user_id', userId);
  if (error) throw badRequest(error.message);

  const roleIds = [...new Set((links || []).map((l) => l.roles_id).filter(Boolean))];
  if (!roleIds.length) return null;

  const { data: roles, error: rolesError } = await adminClient
    .from('roles')
    .select('id, roles')
    .in('id', roleIds);
  if (rolesError) throw badRequest(rolesError.message);
  const roleById = new Map((roles || []).map((r) => [r.id, normalizeRole(r.roles)]));

  for (const link of links || []) {
    const role = roleById.get(link.roles_id);
    if (role === 'superadmin') {
      return {
        code: 'ACCOUNT_DELETE_SUPERADMIN',
        message: 'Conta de superadmin não pode ser excluída pelo app. Fale com o suporte.',
      };
    }
    if (role === 'admin' && link.empresas_id) {
      const { count, error: countError } = await adminClient
        .from('role_x_user_x_empresa')
        .select('id', { count: 'exact', head: true })
        .eq('empresas_id', link.empresas_id)
        .eq('status', true)
        .neq('user_id', userId);
      if (countError) throw badRequest(countError.message);
      if ((count || 0) > 0) {
        return {
          code: 'ACCOUNT_DELETE_ADMIN_HAS_MEMBERS',
          message:
            'Você é administrador de uma empresa com outros usuários. Passe a administração para outra pessoa ou remova os usuários antes de excluir sua conta.',
        };
      }
    }
  }
  return null;
};

/** Cancela as assinaturas da sincronização bancária (Asaas e Stripe) para não cobrar depois da exclusão. */
export const cancelOpenFinanceSubscriptions = async (userId) => {
  let canceled = 0;

  if (isAsaasConfigured()) {
    const customers = await asaasRequest(`/customers?externalReference=${encodeURIComponent(userId)}&limit=10`);
    for (const customer of customers?.data || []) {
      const subs = await asaasRequest(
        `/subscriptions?customer=${encodeURIComponent(customer.id)}&status=ACTIVE&limit=20`,
      );
      for (const sub of subs?.data || []) {
        if (sub.deleted || !String(sub.externalReference || '').startsWith('of:')) continue;
        await asaasRequest(`/subscriptions/${encodeURIComponent(sub.id)}`, { method: 'DELETE' });
        canceled += 1;
      }
    }
  }

  let stripe = null;
  try {
    stripe = getStripe();
  } catch {
    stripe = null;
  }
  if (stripe) {
    const result = await stripe.subscriptions.search({
      query: `metadata['user_id']:'${String(userId).replace(/'/g, '')}' AND metadata['product']:'open_finance' AND status:'active'`,
      limit: 20,
    });
    for (const sub of result?.data || []) {
      await stripe.subscriptions.cancel(sub.id);
      canceled += 1;
    }
  }

  return canceled;
};

/** Remove as conexões bancárias na Pluggy (consentimento). Falha em uma conexão não impede a exclusão. */
export const disconnectBankConnections = async (userId) => {
  if (!isPluggyConfigured()) return 0;
  const itemIds = await listUserPluggyItemIds(userId);
  let removed = 0;
  for (const itemId of itemIds) {
    try {
      await deletePluggyItem(itemId);
      removed += 1;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[account-deletion] pluggy item', itemId, err?.message || err);
    }
  }
  return removed;
};

const defaultGetUserId = async (accessToken) => {
  if (!accessToken) throw unauthorized();
  const userClient = createSupabaseClient({ accessToken });
  const { data, error } = await userClient.auth.getUser();
  if (error || !data?.user?.id) throw unauthorized();
  return data.user.id;
};

/**
 * Exclusão da própria conta (exigência da App Store e do Google Play).
 * Ordem: confirma → regras → cancela cobrança → desconecta bancos → convites criados → dados → login.
 * Se o cancelamento da cobrança falhar, nada é apagado.
 */
export const deleteOwnAccount = async (accessToken, body = {}, deps = {}) => {
  const confirmation = String(body?.confirmacao || '').trim().toUpperCase();
  if (confirmation !== ACCOUNT_DELETE_CONFIRMATION) {
    throw badRequest(`Digite ${ACCOUNT_DELETE_CONFIRMATION} para confirmar a exclusão.`, {
      code: 'ACCOUNT_DELETE_CONFIRMATION',
    });
  }

  const getUserId = deps.getUserId || defaultGetUserId;
  const adminClient = deps.adminClient || createSupabaseClient({ useServiceRole: true });
  const cancelSubscriptions = deps.cancelSubscriptions || cancelOpenFinanceSubscriptions;
  const disconnectBanks = deps.disconnectBanks || disconnectBankConnections;
  const purge = deps.purgeUserData || purgeUserData;

  const userId = await getUserId(accessToken);

  const blocker = await findAccountDeletionBlocker(adminClient, userId);
  if (blocker) throw badRequest(blocker.message, { code: blocker.code });

  try {
    await cancelSubscriptions(userId);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[account-deletion] cancelar assinatura', userId, err?.message || err);
    throw badRequest(
      'Não conseguimos cancelar sua assinatura da sincronização bancária. Nada foi apagado; tente de novo em alguns minutos.',
      { code: 'ACCOUNT_DELETE_BILLING_FAILED' },
    );
  }

  await disconnectBanks(userId);

  const { error: invitesError } = await adminClient.from('empresa_invites').delete().eq('created_by', userId);
  if (invitesError && invitesError.code !== '42P01') throw badRequest(invitesError.message);

  await purgeExtraUserTables(adminClient, userId);
  await purge(adminClient, userId);

  const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(userId);
  if (deleteAuthError) throw badRequest(deleteAuthError.message);

  invalidateOpenFinanceEntitlement(userId);
  return { userId };
};
