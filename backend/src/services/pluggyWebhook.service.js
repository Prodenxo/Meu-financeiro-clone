import { createSupabaseClient } from '../config/supabase.js';
import { fetchPluggyItem } from './pluggy.service.js';
import { syncPluggyItemForUser } from './openFinancePluggy.service.js';
import { isOpenFinanceSyncPaused } from './open-finance-entitlement.service.js';

const SYNC_EVENTS = new Set([
  'item/created',
  'item/updated',
  'transactions/created',
  'transactions/updated',
]);

const recentEventIds = new Map();
const EVENT_DEDUPE_MS = 5 * 60 * 1000;

function shouldProcessEvent(eventId) {
  if (!eventId) return true;
  const now = Date.now();
  const prev = recentEventIds.get(eventId);
  if (prev && now - prev < EVENT_DEDUPE_MS) return false;
  recentEventIds.set(eventId, now);
  if (recentEventIds.size > 500) {
    for (const [k, t] of recentEventIds) {
      if (now - t > EVENT_DEDUPE_MS) recentEventIds.delete(k);
    }
  }
  return true;
}

function pluggyPayloadItemId(payload) {
  return String(payload?.itemId || payload?.id || '').trim();
}

export async function resolveUserIdForPluggyWebhook(payload) {
  const itemId = pluggyPayloadItemId(payload);
  if (!itemId) return null;

  if (payload?.clientUserId && /^[0-9a-f-]{36}$/i.test(String(payload.clientUserId))) {
    return String(payload.clientUserId);
  }

  const admin = createSupabaseClient({ useServiceRole: true });
  const { data, error } = await admin
    .from('open_finance_connections')
    .select('user_id')
    .eq('provider', 'pluggy')
    .eq('item_id', itemId)
    .maybeSingle();

  if (error && !/relation.*does not exist/i.test(error.message || '')) {
    console.warn('[pluggy-webhook] lookup connection', error.message);
  }
  if (data?.user_id) return String(data.user_id);

  /** `transactions/*` não traz clientUserId — tenta ler do Item na Pluggy. */
  try {
    const item = await fetchPluggyItem(itemId);
    const cuid = item?.clientUserId ?? item?.parameter?.clientUserId;
    if (cuid && /^[0-9a-f-]{36}$/i.test(String(cuid))) {
      return String(cuid);
    }
  } catch (err) {
    console.warn('[pluggy-webhook] fetch item p/ userId', err instanceof Error ? err.message : err);
  }
  return null;
}

/** Processa evento Pluggy (item/transactions) e importa contas + extrato. */
export async function processPluggyWebhookPayload(payload) {
  const event = String(payload?.event || '');
  const itemId = pluggyPayloadItemId(payload);
  const eventId = payload?.eventId ? String(payload.eventId) : null;

  if (!SYNC_EVENTS.has(event) || !itemId) {
    return { skipped: true, reason: 'evento_ignorado' };
  }
  if (!shouldProcessEvent(eventId)) {
    return { skipped: true, reason: 'evento_duplicado' };
  }

  const userId = await resolveUserIdForPluggyWebhook(payload);
  if (!userId) {
    return { skipped: true, reason: 'usuario_nao_encontrado', itemId };
  }
  if (await isOpenFinanceSyncPaused(userId)) {
    return { skipped: true, reason: 'assinatura_em_aberto', userId, itemId };
  }

  const result = await syncPluggyItemForUser(userId, itemId, { useServiceRole: true });
  return { ok: true, event, userId, itemId, result };
}
