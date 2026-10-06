import { createSupabaseClient } from '../config/supabase.js';
import { env } from '../config/env.js';
import { isPluggyConfigured } from './pluggy.service.js';
import { syncPluggyItemForUser } from './openFinancePluggy.service.js';
import { isOpenFinanceSyncPaused } from './open-finance-entitlement.service.js';

function minIntervalMs() {
  const min = Number(env.PLUGGY_CRON_MIN_INTERVAL_MINUTES);
  return (Number.isFinite(min) && min > 0 ? min : 15) * 60 * 1000;
}

/**
 * Sincroniza todas as conexões Pluggy salvas (servidor — site fechado ou aba em background).
 * Complementa webhook; respeita intervalo mínimo por item salvo em `last_synced_at`.
 */
export async function runOpenFinancePluggySyncJob(options = {}) {
  if (!isPluggyConfigured()) {
    return { skipped: true, reason: 'pluggy_nao_configurado', items: [] };
  }

  const force = Boolean(options.force);
  const importTransactions = options.importTransactions !== false;
  const syncOptions = { importTransactions };
  const auth = { useServiceRole: true };
  const intervalMs = minIntervalMs();
  const now = Date.now();

  const admin = createSupabaseClient({ useServiceRole: true });
  const { data: rows, error } = await admin
    .from('open_finance_connections')
    .select('user_id, item_id, last_synced_at')
    .eq('provider', 'pluggy');

  if (error && /relation.*does not exist/i.test(error.message || '')) {
    return { skipped: true, reason: 'tabela_conexoes_ausente', items: [] };
  }
  if (error) throw error;

  const seen = new Set();
  const targets = [];
  for (const row of rows || []) {
    const userId = String(row.user_id || '').trim();
    const itemId = String(row.item_id || '').trim();
    if (!userId || !itemId) continue;
    const key = `${userId}:${itemId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    targets.push({ userId, itemId, lastSyncedAt: row.last_synced_at });
  }

  const items = [];
  let synced = 0;
  let skippedRecent = 0;
  let failed = 0;

  const pausedByUser = new Map();
  let skippedPaused = 0;

  for (const { userId, itemId, lastSyncedAt } of targets) {
    if (!pausedByUser.has(userId)) {
      pausedByUser.set(userId, await isOpenFinanceSyncPaused(userId).catch(() => false));
    }
    if (pausedByUser.get(userId)) {
      skippedPaused += 1;
      items.push({ userId, itemId, skipped: true, reason: 'assinatura_em_aberto' });
      continue;
    }
    if (!force && lastSyncedAt) {
      const t = new Date(lastSyncedAt).getTime();
      if (Number.isFinite(t) && now - t < intervalMs) {
        skippedRecent += 1;
        items.push({ userId, itemId, skipped: true, reason: 'sync_recente' });
        continue;
      }
    }

    try {
      const result = await syncPluggyItemForUser(userId, itemId, auth, syncOptions);
      synced += 1;
      items.push({
        userId,
        itemId,
        ok: true,
        transactionsCreated: result.transactionsCreated ?? 0,
        updated: result.updated ?? 0,
        created: result.created ?? 0,
      });
    } catch (err) {
      failed += 1;
      items.push({
        userId,
        itemId,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return {
    total: targets.length,
    synced,
    skippedRecent,
    skippedPaused,
    failed,
    importTransactions,
    items,
  };
}
