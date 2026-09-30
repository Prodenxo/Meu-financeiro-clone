'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/session';
import { normalizeTransactionStatus } from '@/lib/finance/status';
import { parseMoney } from '@/lib/finance/money';

const MAX_IDS = 200;

function revalidateAll() {
  revalidatePath('/transacoes');
  revalidatePath('/visao-geral');
  revalidatePath('/agenda');
}

function cleanIds(ids) {
  if (!Array.isArray(ids)) return [];
  return [...new Set(ids.map((id) => String(id || '').trim()).filter((id) => id && !id.startsWith('proj_')))].slice(0, MAX_IDS);
}

/**
 * Cria ou edita um lançamento — mesma gravação do `transactionStore` do Expo
 * (tabela `lancamentos_id`, tipo 'entrada' | 'saída', status normalizado por tipo).
 * Com `recorrencia_id` + `recorrencia_ano_mes`, lança uma projeção de recorrência.
 */
export async function saveTransactionAction(_prevState, formData) {
  const session = await requireUser();

  const id = String(formData.get('id') || '').trim();
  const tipoRaw = String(formData.get('tipo') || '');
  const tipo = tipoRaw === 'entrada' ? 'entrada' : tipoRaw === 'saida' ? 'saída' : null;
  const valor = parseMoney(formData.get('valor'));
  const classificacao = String(formData.get('classificacao') || '').trim();
  const data = String(formData.get('data') || '').trim();
  const realizado = formData.get('realizado') === 'on';
  const obs = String(formData.get('obs') || '').trim();
  const contaId = String(formData.get('conta_id') || '').trim();
  const recorrenciaId = String(formData.get('recorrencia_id') || '').trim();
  const recorrenciaAnoMes = String(formData.get('recorrencia_ano_mes') || '').trim();

  const errors = {};
  if (!tipo) errors.tipo = 'Escolha entrada ou saída.';
  if (!Number.isFinite(valor) || valor <= 0) errors.valor = 'Informe um valor maior que zero.';
  if (!classificacao) errors.classificacao = 'Escolha uma categoria.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) errors.data = 'Informe uma data válida.';
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const pendente = tipo === 'entrada' ? 'a_receber' : 'a_pagar';
  const payload = {
    tipo,
    valor,
    classificacao,
    data,
    status: normalizeTransactionStatus(tipo, realizado ? '' : pendente),
    obs: obs || null,
    conta_id: contaId || null,
  };

  let error;
  if (id) {
    ({ error } = await session.supabase
      .from('lancamentos_id')
      .update(payload)
      .eq('id', id)
      .eq('user_id', session.userId));
  } else {
    if (recorrenciaId && /^\d{4}-\d{2}$/.test(recorrenciaAnoMes)) {
      const { data: rec } = await session.supabase
        .from('recorrencias')
        .select('id, categoria')
        .eq('id', recorrenciaId)
        .eq('user_id', session.userId)
        .maybeSingle();
      if (rec) {
        payload.recorrencia_id = rec.id;
        payload.recorrencia_ano_mes = recorrenciaAnoMes;
        if (rec.categoria != null) payload.categoria = rec.categoria;
      }
    }
    ({ error } = await session.supabase.from('lancamentos_id').insert({ ...payload, user_id: session.userId }));
  }

  if (error) {
    console.error('[saveTransaction]', error);
    return { ok: false, errors: { form: `Não foi possível salvar: ${error.message}` } };
  }

  revalidateAll();
  return { ok: true, edited: Boolean(id), tipo: tipo === 'entrada' ? 'entrada' : 'saida', valor };
}

/** "Marcar como pago/recebido" — entrada vira recebido, saída vira pago (igual ao Expo). */
export async function markTransactionsPaidAction(ids) {
  const session = await requireUser();
  const list = cleanIds(ids);
  if (list.length === 0) return { ok: false, error: 'Nenhuma transação selecionada.' };

  const { data: rows, error: readErr } = await session.supabase
    .from('lancamentos_id')
    .select('id, tipo')
    .eq('user_id', session.userId)
    .in('id', list);
  if (readErr) return { ok: false, error: `Não foi possível atualizar: ${readErr.message}` };

  const entradas = (rows || []).filter((r) => String(r.tipo).toLowerCase() === 'entrada').map((r) => r.id);
  const saidas = (rows || []).filter((r) => String(r.tipo).toLowerCase() !== 'entrada').map((r) => r.id);

  for (const [group, status] of [
    [entradas, 'recebido'],
    [saidas, 'pago'],
  ]) {
    if (group.length === 0) continue;
    const { error } = await session.supabase
      .from('lancamentos_id')
      .update({ status })
      .eq('user_id', session.userId)
      .in('id', group);
    if (error) return { ok: false, error: `Não foi possível atualizar: ${error.message}` };
  }

  revalidateAll();
  return { ok: true, count: (rows || []).length };
}

/**
 * Exclui lançamentos. Os que vieram de uma recorrência registram antes um "skip"
 * daquele mês (senão a projeção volta a aparecer) — igual ao `deleteTransaction` do Expo.
 */
export async function deleteTransactionsAction(ids) {
  const session = await requireUser();
  const list = cleanIds(ids);
  if (list.length === 0) return { ok: false, error: 'Nenhuma transação selecionada.' };

  const { data: rows, error: readErr } = await session.supabase
    .from('lancamentos_id')
    .select('id, recorrencia_id, recorrencia_ano_mes')
    .eq('user_id', session.userId)
    .in('id', list);
  if (readErr) return { ok: false, error: `Não foi possível excluir: ${readErr.message}` };

  for (const row of rows || []) {
    if (!row.recorrencia_id || !row.recorrencia_ano_mes) continue;
    const { error } = await session.supabase
      .from('recorrencia_skips')
      .insert([{ user_id: session.userId, recorrencia_id: row.recorrencia_id, ano_mes: row.recorrencia_ano_mes }]);
    if (error && error.code !== '23505') return { ok: false, error: `Não foi possível excluir: ${error.message}` };
  }

  const { error } = await session.supabase
    .from('lancamentos_id')
    .delete()
    .eq('user_id', session.userId)
    .in('id', list);
  if (error) return { ok: false, error: `Não foi possível excluir: ${error.message}` };

  revalidateAll();
  return { ok: true, count: (rows || []).length };
}

/**
 * Exclusão de lançamento recorrente com escopo (igual ao modal do Expo):
 * 'this' = só este mês · 'future' = este e os seguintes + desativa a recorrência ·
 * 'all' = todos os lançamentos vinculados + a recorrência.
 */
export async function deleteRecurringTransactionAction(id, scope) {
  if (scope === 'this') return deleteTransactionsAction([id]);

  const session = await requireUser();
  const txId = String(id || '').trim();
  if (!txId || (scope !== 'future' && scope !== 'all')) return { ok: false, error: 'Pedido de exclusão inválido.' };

  const { data: tx, error: readErr } = await session.supabase
    .from('lancamentos_id')
    .select('id, data, recorrencia_id')
    .eq('id', txId)
    .eq('user_id', session.userId)
    .maybeSingle();
  if (readErr) return { ok: false, error: `Não foi possível excluir: ${readErr.message}` };
  if (!tx?.recorrencia_id) return { ok: false, error: 'Esta transação não faz parte de uma recorrência.' };

  let del = session.supabase
    .from('lancamentos_id')
    .delete()
    .eq('user_id', session.userId)
    .eq('recorrencia_id', tx.recorrencia_id);
  if (scope === 'future') {
    if (!tx.data) return { ok: false, error: 'Dados insuficientes para excluir os futuros.' };
    del = del.gte('data', tx.data);
  }
  const { error: delErr } = await del;
  if (delErr) return { ok: false, error: `Não foi possível excluir: ${delErr.message}` };

  const recQuery = session.supabase.from('recorrencias');
  const { error: recErr } =
    scope === 'future'
      ? await recQuery.update({ ativo: false }).eq('id', tx.recorrencia_id).eq('user_id', session.userId)
      : await recQuery.delete().eq('id', tx.recorrencia_id).eq('user_id', session.userId);
  if (recErr) return { ok: false, error: `Lançamentos excluídos, mas a recorrência não foi atualizada: ${recErr.message}` };

  revalidateAll();
  return { ok: true };
}
