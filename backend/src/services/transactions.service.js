import { createSupabaseClient } from '../config/supabase.js';
import { badRequest } from '../utils/errors.js';
import { resolveContaIdFromPayload } from './conta-financeira-default.js';

const normalizeTipo = (tipo) => {
  if (!tipo) return tipo;
  return tipo === 'saída' ? 'saida' : tipo;
};

/** Entrada realizada → recebido; saída realizada → pago (alinha app + saldo geral). */
export const normalizeTransactionStatus = (tipo, status) => {
  const tipoNorm = normalizeTipo(tipo);
  const raw = String(status || '').trim().toLowerCase();
  if (tipoNorm === 'entrada') {
    if (raw === 'a_receber' || raw === 'pendente') return raw;
    if (!raw || raw === 'pago' || raw === 'recebido') return 'recebido';
    return raw;
  }
  if (raw === 'a_pagar' || raw === 'pendente') return raw;
  if (!raw || raw === 'recebido') return 'pago';
  return raw || 'pago';
};

export { listContasFinanceiras as listActiveContasFinanceiras } from './contas-financeiras.service.js';

const resolveContaIdForUser = async (dbClient, userId, contaPayload = {}) => {
  const { data, error } = await dbClient
    .from('contas_financeiras')
    .select('id, nome, tipo, ativo, criado_em')
    .eq('user_id', userId)
    .eq('ativo', true)
    .order('criado_em', { ascending: true });
  if (error) throw badRequest(error.message);
  return resolveContaIdFromPayload(data || [], contaPayload);
};

const shouldRetryTipo = (errorMessage, tipoValue) => {
  if (tipoValue !== 'saída') return false;
  const msg = (errorMessage || '').toLowerCase();
  return msg.includes('invalid input value for enum') ||
    msg.includes('check constraint') ||
    msg.includes('violates check constraint');
};

const ANO_MES_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const PATCH_BLOCKED_KEYS = ['id', 'user_id', 'criado_em', 'recorrencia_id', 'recorrencia_ano_mes'];
export const DELETE_SCOPES = ['este', 'futuros', 'todos'];

/** Remove do patch campos que o cliente não pode alterar (dono, id, vínculo de recorrência). */
export const sanitizeTransactionPatch = (updates = {}) => {
  const patch = { ...updates };
  for (const key of PATCH_BLOCKED_KEYS) delete patch[key];
  return patch;
};

/** `escopo` da exclusão: ausente = 'este' (comportamento original). */
export const parseDeleteScope = (raw) => {
  if (raw == null || raw === '') return 'este';
  const scope = String(raw).trim().toLowerCase();
  if (!DELETE_SCOPES.includes(scope)) {
    throw badRequest('escopo deve ser "este", "futuros" ou "todos"');
  }
  return scope;
};

/**
 * Vínculo com a recorrência (lançar projeção ou primeiro lançamento de uma recorrência nova).
 * Só aceita recorrência do próprio usuário; herda `categoria` dela, como o site.
 */
const resolveRecorrenciaLink = async (dbClient, userId, payload = {}) => {
  const recorrenciaId = String(payload?.recorrencia_id || '').trim();
  if (!recorrenciaId) return null;
  const anoMes = String(payload?.recorrencia_ano_mes || '').trim();
  if (!ANO_MES_RE.test(anoMes)) {
    throw badRequest('recorrencia_ano_mes deve estar no formato AAAA-MM');
  }
  const { data: rec, error } = await dbClient
    .from('recorrencias')
    .select('id, categoria')
    .eq('id', recorrenciaId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw badRequest(error.message);
  if (!rec) throw badRequest('Recorrência não encontrada');
  const link = { recorrencia_id: rec.id, recorrencia_ano_mes: anoMes };
  if (rec.categoria != null) link.categoria = rec.categoria;
  return link;
};

const assertContaBelongsToUser = async (dbClient, userId, contaId) => {
  if (contaId == null || contaId === '') return;
  const { data, error } = await dbClient
    .from('contas_financeiras')
    .select('id')
    .eq('id', contaId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw badRequest(error.message);
  if (!data) throw badRequest('Conta não encontrada');
};

export const listTransactions = async (userId) => {
  const dbClient = createSupabaseClient({ useServiceRole: true });
  const { data, error } = await dbClient
    .from('lancamentos_id')
    .select('*')
    .eq('user_id', userId)
    .order('criado_em', { ascending: false });

  if (error) throw badRequest(error.message);
  return data || [];
};

export const createTransaction = async (userId, payload) => {
  const { tipo, valor, classificacao, data, status, obs, conta_id: contaIdRaw } = payload || {};
  const tipoNormalizado = normalizeTipo(tipo);

  if (!tipoNormalizado || !valor || !classificacao || !data) {
    throw badRequest('Campos obrigatórios: tipo, valor, classificacao, data');
  }

  const statusNormalizado = normalizeTransactionStatus(tipoNormalizado, status || 'recebido');
  const dbClient = createSupabaseClient({ useServiceRole: true });
  const contaId = payload?.sem_conta === true
    ? null
    : await resolveContaIdForUser(dbClient, userId, {
      conta_id: contaIdRaw,
      conta: payload?.conta,
      conta_nome: payload?.conta_nome,
      contaNome: payload?.contaNome,
      carteira: payload?.carteira,
      wallet: payload?.wallet,
    });
  const recorrenciaLink = await resolveRecorrenciaLink(dbClient, userId, payload);

  const tryInsert = async (tipoToUse) => {
    const row = {
      tipo: tipoToUse,
      valor,
      classificacao,
      data,
      status: statusNormalizado,
      obs: obs || null,
      user_id: userId,
    };
    if (contaId) row.conta_id = contaId;
    if (recorrenciaLink) Object.assign(row, recorrenciaLink);
    return await dbClient
      .from('lancamentos_id')
      .insert([row])
      .select()
      .single();
  };

  let { data: newTransaction, error } = await tryInsert(String(tipoNormalizado));
  if (error && shouldRetryTipo(error.message, String(tipo))) {
    const retry = await tryInsert('saida');
    newTransaction = retry.data;
    error = retry.error;
  }

  if (error) throw badRequest(error.message);
  return newTransaction;
};

export const updateTransaction = async (userId, payload) => {
  const { id } = payload || {};
  if (!id) throw badRequest('ID da transação é obrigatório');
  const updates = sanitizeTransactionPatch(payload);

  const dbClient = createSupabaseClient({ useServiceRole: true });
  if (updates.conta_id !== undefined) {
    await assertContaBelongsToUser(dbClient, userId, updates.conta_id);
  }

  let tipoForStatus = updates.tipo ? normalizeTipo(updates.tipo) : null;
  if (!tipoForStatus && updates.status != null) {
    const { data: existing, error: loadErr } = await dbClient
      .from('lancamentos_id')
      .select('tipo')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();
    if (loadErr) throw badRequest(loadErr.message);
    tipoForStatus = existing?.tipo ? normalizeTipo(existing.tipo) : null;
  }

  const patch = {
    ...updates,
    ...(updates.tipo ? { tipo: normalizeTipo(updates.tipo) } : {}),
  };
  if (updates.status != null && tipoForStatus) {
    patch.status = normalizeTransactionStatus(tipoForStatus, updates.status);
  }

  const { data, error } = await dbClient
    .from('lancamentos_id')
    .update(patch)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw badRequest(error.message);
  return data;
};

export const deleteTransaction = async (userId, body, query) => {
  const idFromQuery = query?.id ?? null;
  const idFromBody = body?.id ?? null;
  const id = idFromQuery || idFromBody;

  if (!id) throw badRequest('ID da transação é obrigatório');
  const scope = parseDeleteScope(query?.escopo ?? body?.escopo);

  const dbClient = createSupabaseClient({ useServiceRole: true });
  const { data: tx, error: readErr } = await dbClient
    .from('lancamentos_id')
    .select('id, data, recorrencia_id, recorrencia_ano_mes')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();
  if (readErr) throw badRequest(readErr.message);

  if (scope === 'este') {
    if (tx?.recorrencia_id && tx?.recorrencia_ano_mes) {
      const { error: skipErr } = await dbClient
        .from('recorrencia_skips')
        .insert([{ user_id: userId, recorrencia_id: tx.recorrencia_id, ano_mes: tx.recorrencia_ano_mes }]);
      if (skipErr && skipErr.code !== '23505') throw badRequest(skipErr.message);
    }
    const { error } = await dbClient
      .from('lancamentos_id')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw badRequest(error.message);
    return;
  }

  if (!tx?.recorrencia_id) throw badRequest('Esta transação não faz parte de uma recorrência');
  let del = dbClient
    .from('lancamentos_id')
    .delete()
    .eq('user_id', userId)
    .eq('recorrencia_id', tx.recorrencia_id);
  if (scope === 'futuros') {
    if (!tx.data) throw badRequest('Dados insuficientes para excluir os futuros');
    del = del.gte('data', tx.data);
  }
  const { error: delErr } = await del;
  if (delErr) throw badRequest(delErr.message);

  const recQuery = dbClient.from('recorrencias');
  const { error: recErr } = scope === 'futuros'
    ? await recQuery.update({ ativo: false }).eq('id', tx.recorrencia_id).eq('user_id', userId)
    : await recQuery.delete().eq('id', tx.recorrencia_id).eq('user_id', userId);
  if (recErr) throw badRequest(`Lançamentos excluídos, mas a recorrência não foi atualizada: ${recErr.message}`);
};
