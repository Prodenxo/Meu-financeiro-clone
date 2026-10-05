import { createSupabaseClient } from '../config/supabase.js';
import { badRequest } from '../utils/errors.js';
import {
  buildContaRowFromPluggyAccount,
  contaMatchesPluggyInstitution,
  localContaMatchesPluggyFingerprint,
  mapPluggyAccountTipo,
  pickManualContaMergeCandidate,
  readPluggyAccountBalance,
  shouldImportPluggyAccount,
} from './pluggyAccountMapper.js';
import {
  deletePluggyItem,
  fetchPluggyAccount,
  fetchPluggyAccountsByItem,
  fetchPluggyItem,
  fetchPluggyTransactionsForAccount,
  requestPluggyItemRefresh,
} from './pluggy.service.js';
import { buildLancamentoFromPluggyTransaction } from './pluggyTransactionMapper.js';

async function upsertConnection(supabase, userId, item) {
  const now = new Date().toISOString();
  const row = {
    user_id: userId,
    provider: 'pluggy',
    item_id: String(item.id),
    connector_id: item.connector?.id ? String(item.connector.id) : item.connectorId ? String(item.connectorId) : null,
    status: item.status ? String(item.status) : 'UPDATED',
    last_synced_at: now,
    last_error: null,
    atualizado_em: now,
  };
  const { error } = await supabase.from('open_finance_connections').upsert(row, {
    onConflict: 'user_id,provider,item_id',
  });
  if (error && /relation.*does not exist/i.test(error.message || '')) {
    return { skippedConnection: true };
  }
  if (error) throw badRequest(error.message || 'Falha ao gravar conexão Open Finance.');
  return { skippedConnection: false };
}

async function findExistingOfConta(supabase, userId, externalId) {
  const { data, error } = await supabase
    .from('contas_financeiras')
    .select('id')
    .eq('user_id', userId)
    .eq('of_provider', 'pluggy')
    .eq('of_external_id', externalId)
    .maybeSingle();
  if (error) throw badRequest(error.message || 'Erro ao buscar conta importada.');
  return data;
}

/** Conta criada à mão (sem OF) que deve receber o vínculo Pluggy em vez de duplicar. */
async function findManualContaToLink(supabase, userId, pluggyAccount) {
  const tipo = mapPluggyAccountTipo(pluggyAccount);
  const { data, error } = await supabase
    .from('contas_financeiras')
    .select('id, nome, instituicao_id, tipo')
    .eq('user_id', userId)
    .eq('ativo', true)
    .eq('tipo', tipo)
    .is('of_external_id', null);
  if (error) throw badRequest(error.message || 'Erro ao buscar contas para vincular.');
  const eligible = (data || []).filter((row) => contaMatchesPluggyInstitution(row, pluggyAccount));
  const picked = pickManualContaMergeCandidate(eligible, pluggyAccount);
  return picked ? { id: picked.id } : null;
}

/** Mesma conta no banco, id Pluggy novo (reconexão) — reutiliza linha existente. */
async function findSiblingPluggyConta(supabase, userId, pluggyAccount, externalId) {
  const { data, error } = await supabase
    .from('contas_financeiras')
    .select('id, nome, instituicao_id, tipo, of_external_id')
    .eq('user_id', userId)
    .eq('of_provider', 'pluggy')
    .eq('ativo', true)
    .neq('of_external_id', externalId);
  if (error) throw badRequest(error.message || 'Erro ao buscar conta Pluggy irmã.');
  const matches = (data || []).filter((row) => localContaMatchesPluggyFingerprint(row, pluggyAccount));
  if (matches.length !== 1) return null;
  return { id: matches[0].id };
}

async function deactivateEmptyDuplicateConta(supabase, userId, keepContaId, pluggyAccount) {
  const { data, error } = await supabase
    .from('contas_financeiras')
    .select('id, nome, instituicao_id, tipo, of_external_id')
    .eq('user_id', userId)
    .eq('ativo', true)
    .neq('id', keepContaId);
  if (error || !data?.length) return;

  for (const row of data) {
    if (!localContaMatchesPluggyFingerprint(row, pluggyAccount)) continue;
    const { count, error: countErr } = await supabase
      .from('lancamentos_id')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('conta_id', row.id);
    if (countErr || (count ?? 0) > 0) continue;
    await supabase
      .from('contas_financeiras')
      .update({ ativo: false, atualizado_em: new Date().toISOString() })
      .eq('id', row.id)
      .eq('user_id', userId);
  }
}

async function resolveLocalContaForPluggyAccount(supabase, userId, pluggyAccount) {
  const externalId = String(pluggyAccount.id);
  let existing = await findExistingOfConta(supabase, userId, externalId);
  if (existing?.id) return { existing, externalId };

  existing = await findSiblingPluggyConta(supabase, userId, pluggyAccount, externalId);
  if (existing?.id) return { existing, externalId };

  existing = await findManualContaToLink(supabase, userId, pluggyAccount);
  return { existing, externalId };
}

async function findExistingOfLancamento(supabase, userId, externalId) {
  const { data, error } = await supabase
    .from('lancamentos_id')
    .select('id')
    .eq('user_id', userId)
    .eq('of_provider', 'pluggy')
    .eq('of_external_id', externalId)
    .maybeSingle();
  if (error && /column.*does not exist|of_provider/i.test(error.message || '')) {
    return null;
  }
  if (error) throw badRequest(error.message || 'Erro ao buscar lançamento importado.');
  return data;
}

function signedLancamentoDelta(tx) {
  const tipo = String(tx.tipo || '');
  const valor = Number(tx.valor);
  if (!Number.isFinite(valor)) return 0;
  if (tipo === 'entrada') return valor;
  return -valor;
}

/** Ajusta saldo_inicial para saldo Pluggy bater com a soma dos lançamentos no app. */
async function reconcileContaSaldoInicial(supabase, userId, contaId, targetBalance) {
  const { data: txs, error } = await supabase
    .from('lancamentos_id')
    .select('tipo, valor, status')
    .eq('user_id', userId)
    .eq('conta_id', contaId);
  if (error) return;

  let delta = 0;
  for (const tx of txs || []) {
    const st = String(tx.status || '').toLowerCase();
    if (st === 'a_pagar' || st === 'a_receber' || st === 'pendente') continue;
    delta += signedLancamentoDelta(tx);
  }

  const target = Number(targetBalance);
  if (!Number.isFinite(target)) return;
  const saldoInicial = Math.round((target - delta) * 100) / 100;

  const { error: updateError } = await supabase
    .from('contas_financeiras')
    .update({ saldo_inicial: saldoInicial, atualizado_em: new Date().toISOString(), of_last_synced_at: new Date().toISOString() })
    .eq('id', contaId)
    .eq('user_id', userId);
  if (updateError) {
    console.warn('[open-finance] falha ao ajustar saldo_inicial', { contaId, message: updateError.message });
  }
}

async function syncAccountTransactions(supabase, userId, pluggyAccount, localContaId) {
  const txs = await fetchPluggyTransactionsForAccount(pluggyAccount.id);
  let created = 0;
  let skipped = 0;

  for (const tx of txs) {
    if (!tx?.id) continue;
    const row = buildLancamentoFromPluggyTransaction(tx, { userId, contaId: localContaId });
    if (!row) continue;

    const existing = await findExistingOfLancamento(supabase, userId, row.of_external_id);
    if (existing?.id) {
      skipped += 1;
      continue;
    }

    const { error } = await supabase.from('lancamentos_id').insert(row);
    if (error && /unique|duplicate|idx_lancamentos_id_of_external/i.test(error.message || '')) {
      skipped += 1;
      continue;
    }
    if (error && /column.*does not exist|of_provider/i.test(error.message || '')) {
      throw badRequest(
        'Falta migration de Open Finance em lancamentos_id. Rode supabase/migrations/20261002180000_lancamentos_open_finance.sql no Supabase.',
      );
    }
    if (error) throw badRequest(error.message || 'Erro ao importar movimentação.');
    created += 1;
  }

  await reconcileContaSaldoInicial(supabase, userId, localContaId, readPluggyAccountBalance(pluggyAccount));

  return { created, skipped, fetched: txs.length };
}

export async function listUserPluggyItemIds(userId, accessToken) {
  const supabase = accessToken
    ? createSupabaseClient({ accessToken })
    : createSupabaseClient({ useServiceRole: true });
  const { data, error } = await supabase
    .from('open_finance_connections')
    .select('item_id')
    .eq('user_id', userId)
    .eq('provider', 'pluggy');
  if (error && /relation.*does not exist/i.test(error.message || '')) {
    return [];
  }
  if (error) throw badRequest(error.message || 'Erro ao listar conexões Open Finance.');
  return [...new Set((data || []).map((r) => String(r.item_id)).filter(Boolean))];
}

function resolveSupabaseForSync(auth) {
  if (auth && typeof auth === 'object' && auth.useServiceRole) {
    return createSupabaseClient({ useServiceRole: true });
  }
  const accessToken = typeof auth === 'string' ? auth : auth?.accessToken;
  if (!accessToken) throw badRequest('Sessão inválida para sincronizar.');
  return createSupabaseClient({ accessToken });
}

/**
 * @param {{ importTransactions?: boolean }} [options]
 *   - `importTransactions: false` (modo `balance`): não chama POST /items/update na Pluggy (poll leve),
 *     mas **sempre** importa extrato já disponível + alinha saldo da conta.
 */
export async function syncPluggyItemForUser(userId, itemId, auth, options = {}) {
  const requestItemRefresh = options.importTransactions !== false;
  const trimmed = String(itemId || '').trim();
  if (!trimmed) throw badRequest('itemId obrigatório.');

  /** POST /items/update consome cota Open Finance — só no sync completo (webhook, conectar, extrato). */
  if (requestItemRefresh) {
    await requestPluggyItemRefresh(trimmed);
  }
  const item = await fetchPluggyItem(trimmed);
  if (!item?.id) throw badRequest('Item Pluggy inválido.');

  const accounts = await fetchPluggyAccountsByItem(trimmed);
  const supabase = resolveSupabaseForSync(auth);

  const connectionMeta = await upsertConnection(supabase, userId, item);

  let created = 0;
  let updated = 0;
  const accountSummaries = [];
  let transactionsCreated = 0;
  let transactionsSkipped = 0;
  let transactionsFetched = 0;
  let accountsIgnored = 0;

  for (const account of accounts) {
    if (!account?.id) continue;
    const { existing, externalId } = await resolveLocalContaForPluggyAccount(supabase, userId, account);

    if (!shouldImportPluggyAccount(account)) {
      accountsIgnored += 1;
      if (existing?.id && mapPluggyAccountTipo(account) === 'cartao_credito') {
        await supabase
          .from('contas_financeiras')
          .update({ ativo: false, atualizado_em: new Date().toISOString() })
          .eq('id', existing.id)
          .eq('user_id', userId);
      }
      continue;
    }

    const payload = buildContaRowFromPluggyAccount(account, { isNew: !existing, pluggyItem: item });

    let localContaId = existing?.id;

    if (existing?.id) {
      const { error } = await supabase
        .from('contas_financeiras')
        .update(payload)
        .eq('id', existing.id)
        .eq('user_id', userId);
      if (error) throw badRequest(error.message || 'Erro ao atualizar conta importada.');
      updated += 1;
    } else {
      const { data, error } = await supabase
        .from('contas_financeiras')
        .insert({ ...payload, user_id: userId })
        .select('id')
        .single();
      if (error) throw badRequest(error.message || 'Erro ao criar conta importada.');
      created += 1;
      localContaId = data.id;
    }

    if (localContaId) {
      await reconcileContaSaldoInicial(
        supabase,
        userId,
        localContaId,
        readPluggyAccountBalance(account),
      );
      const txStats = await syncAccountTransactions(supabase, userId, account, localContaId);
      transactionsCreated += txStats.created;
      transactionsSkipped += txStats.skipped;
      transactionsFetched += txStats.fetched;
      await deactivateEmptyDuplicateConta(supabase, userId, localContaId, account);
    }

    accountSummaries.push({ id: localContaId, externalId, mode: existing?.id ? 'update' : 'create' });
  }

  return {
    itemId: String(item.id),
    itemStatus: item.status ?? null,
    accountsTotal: accounts.length,
    created,
    updated,
    accounts: accountSummaries,
    connectionTable: connectionMeta.skippedConnection ? 'missing' : 'ok',
    transactionsCreated,
    transactionsSkipped,
    transactionsFetched,
    accountsIgnored,
  };
}

const OF_UNLINK_FIELDS = {
  of_provider: null,
  of_external_id: null,
  of_last_synced_at: null,
  of_institution_logo_url: null,
};

async function assertUserOwnsPluggyItem(supabase, userId, itemId) {
  const { data, error } = await supabase
    .from('open_finance_connections')
    .select('item_id')
    .eq('user_id', userId)
    .eq('provider', 'pluggy')
    .eq('item_id', itemId)
    .maybeSingle();
  if (error && /relation.*does not exist/i.test(error.message || '')) {
    throw badRequest('Tabela de conexões Open Finance ausente. Rode a migration no Supabase.');
  }
  if (error) throw badRequest(error.message || 'Erro ao validar conexão.');
  if (!data?.item_id) throw badRequest('Conexão Open Finance não encontrada para este usuário.');
}

/** Item Pluggy a partir da conta local (of_external_id = account id na Pluggy). */
export async function resolvePluggyItemIdForConta(supabase, userId, contaId) {
  const { data: conta, error } = await supabase
    .from('contas_financeiras')
    .select('of_provider, of_external_id')
    .eq('id', contaId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw badRequest(error.message || 'Erro ao buscar conta.');
  if (conta?.of_provider !== 'pluggy' || !conta?.of_external_id) {
    throw badRequest('Esta conta não está vinculada ao Open Finance.');
  }
  const pluggyAccount = await fetchPluggyAccount(conta.of_external_id);
  const itemId = String(pluggyAccount?.itemId ?? pluggyAccount?.item?.id ?? '').trim();
  if (!itemId) throw badRequest('Não foi possível identificar a conexão do banco na Pluggy.');
  return itemId;
}

/** Encerra consentimento na Pluggy, remove conexão salva e desvincula contas locais (mantém lançamentos). */
export async function disconnectPluggyItemForUser(userId, itemId, auth) {
  const trimmed = String(itemId || '').trim();
  if (!trimmed) throw badRequest('itemId obrigatório.');

  const supabase = resolveSupabaseForSync(auth);
  await assertUserOwnsPluggyItem(supabase, userId, trimmed);

  let accountExternalIds = [];
  try {
    const accounts = await fetchPluggyAccountsByItem(trimmed);
    accountExternalIds = accounts.map((a) => String(a.id)).filter(Boolean);
  } catch {
    /* item pode já estar removido na Pluggy */
  }

  try {
    await deletePluggyItem(trimmed);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!/404|not found|não encontrado/i.test(msg)) {
      throw badRequest(msg || 'Falha ao desconectar na Pluggy.');
    }
  }

  const now = new Date().toISOString();
  if (accountExternalIds.length) {
    const { error: unlinkErr } = await supabase
      .from('contas_financeiras')
      .update({ ...OF_UNLINK_FIELDS, atualizado_em: now })
      .eq('user_id', userId)
      .eq('of_provider', 'pluggy')
      .in('of_external_id', accountExternalIds);
    if (unlinkErr) throw badRequest(unlinkErr.message || 'Erro ao desvincular contas.');
  }

  const { error: delConnErr } = await supabase
    .from('open_finance_connections')
    .delete()
    .eq('user_id', userId)
    .eq('provider', 'pluggy')
    .eq('item_id', trimmed);
  if (delConnErr && !/relation.*does not exist/i.test(delConnErr.message || '')) {
    throw badRequest(delConnErr.message || 'Erro ao remover conexão salva.');
  }

  return { itemId: trimmed, unlinkedAccounts: accountExternalIds.length };
}

export async function disconnectPluggyContaForUser(userId, contaId, auth) {
  const supabase = resolveSupabaseForSync(auth);
  const itemId = await resolvePluggyItemIdForConta(supabase, userId, contaId);
  return disconnectPluggyItemForUser(userId, itemId, auth);
}

export async function syncPluggyContaForUser(userId, contaId, auth, options = {}) {
  const supabase = resolveSupabaseForSync(auth);
  const itemId = await resolvePluggyItemIdForConta(supabase, userId, contaId);
  return syncPluggyItemForUser(userId, itemId, auth, options);
}

/** Re-sincroniza todos os itens Pluggy já conectados do usuário. */
export async function syncAllPluggyItemsForUser(userId, auth, options = {}) {
  const itemIds = await listUserPluggyItemIds(
    userId,
    typeof auth === 'string' ? auth : auth?.accessToken,
  );
  if (!itemIds.length) {
    throw badRequest('Nenhuma conexão Open Finance salva. Use Conectar banco primeiro.');
  }
  const items = [];
  for (const itemId of itemIds) {
    items.push(await syncPluggyItemForUser(userId, itemId, auth, options));
  }
  return { items, itemIds };
}
