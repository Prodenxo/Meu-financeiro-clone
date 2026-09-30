'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/session';
import { parseMoney } from '@/lib/finance/money';
import { parseMonthParam } from '@/lib/date';
import { monthStartKey } from '@/lib/finance/orcamentos';

const BUDGETS = 'orçamentos';
const VALOR = 'valor_orçado';

function revalidateAll() {
  revalidatePath('/orcamentos');
  revalidatePath('/visao-geral');
}

/** Garante que a categoria é do usuário (mesma tabela consultada pelo app atual). */
async function ownsCategory(supabase, userId, categoriaId) {
  const { data } = await supabase.from('categorias_id').select('id').eq('id', categoriaId).eq('user_id', userId).maybeSingle();
  return Boolean(data);
}

/** Porta de `saveCategoryBudget`: atualiza a linha do (categoria, usuário, mês) ou cria uma. */
async function upsertBudget(supabase, userId, categoriaId, valor, date) {
  const { data: existing, error: findError } = await supabase
    .from(BUDGETS)
    .select('id')
    .eq('categorias_id', categoriaId)
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle();
  if (findError) return findError;

  if (existing?.id) {
    const { error } = await supabase.from(BUDGETS).update({ [VALOR]: valor, date }).eq('id', existing.id).eq('user_id', userId);
    return error;
  }
  const { error } = await supabase.from(BUDGETS).insert({ categorias_id: categoriaId, [VALOR]: valor, user_id: userId, date });
  return error;
}

/** Cria ou edita o limite de uma categoria no mês (`?mes=AAAA-MM`). */
export async function saveBudgetAction(_prevState, formData) {
  const session = await requireUser();
  const categoriaId = Number(String(formData.get('categorias_id') || '').trim());
  const valor = parseMoney(formData.get('valor_orcado'));
  const month = parseMonthParam(String(formData.get('mes') || ''), null);

  const errors = {};
  if (!Number.isInteger(categoriaId) || categoriaId <= 0) errors.categorias_id = 'Selecione uma categoria.';
  if (!Number.isFinite(valor) || valor < 0) errors.valor_orcado = 'Informe um valor orçado válido.';
  if (!month) errors.form = 'Mês inválido.';
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  if (!(await ownsCategory(session.supabase, session.userId, categoriaId))) {
    return { ok: false, errors: { categorias_id: 'Categoria não encontrada.' } };
  }

  const error = await upsertBudget(session.supabase, session.userId, categoriaId, valor, monthStartKey(month));
  if (error) return { ok: false, errors: { form: `Não foi possível salvar o orçamento: ${error.message}` } };

  revalidateAll();
  return { ok: true, valor };
}

/** Porta de `deleteCategoryBudget`: zera o limite do mês (`valor_orçado` → null); o realizado e a categoria ficam. */
export async function deleteBudgetAction(categoriaIdRaw, mes) {
  const session = await requireUser();
  const categoriaId = Number(categoriaIdRaw);
  const month = parseMonthParam(String(mes || ''), null);
  if (!Number.isInteger(categoriaId) || !month) return { ok: false, error: 'Orçamento inválido.' };

  const error = await upsertBudget(session.supabase, session.userId, categoriaId, null, monthStartKey(month));
  if (error) return { ok: false, error: `Não foi possível remover o orçamento: ${error.message}` };

  revalidateAll();
  return { ok: true };
}

/**
 * Cola limites copiados na tela (categoria + valor) no mês escolhido.
 * Atualiza a linha do mês se já existir; senão cria. Categorias de outra conta são ignoradas.
 */
export async function pasteBudgetsAction(mes, entries) {
  const session = await requireUser();
  const month = parseMonthParam(String(mes || ''), null);
  if (!month) return { ok: false, error: 'Mês inválido.' };
  if (!Array.isArray(entries) || entries.length === 0) return { ok: false, error: 'Não há orçamento copiado.' };
  if (entries.length > 200) return { ok: false, error: 'Há limites demais para colar de uma vez.' };

  const parsed = [];
  for (const entry of entries) {
    const categoriaId = Number(entry?.categorias_id);
    const valor = Number(entry?.valor);
    if (!Number.isInteger(categoriaId) || categoriaId <= 0 || !Number.isFinite(valor) || valor < 0) continue;
    parsed.push({ categoriaId, valor });
  }
  if (parsed.length === 0) return { ok: false, error: 'O orçamento copiado não tem limites válidos.' };

  const { supabase, userId } = session;
  const ids = [...new Set(parsed.map((p) => p.categoriaId))];
  const { data: owned, error: ownErr } = await supabase.from('categorias_id').select('id').eq('user_id', userId).in('id', ids);
  if (ownErr) return { ok: false, error: `Não foi possível colar: ${ownErr.message}` };
  const ownedSet = new Set((owned || []).map((row) => Number(row.id)));
  const safe = parsed.filter((p) => ownedSet.has(p.categoriaId));
  if (safe.length === 0) return { ok: false, error: 'Nenhuma categoria copiada pertence à sua conta.' };

  const date = monthStartKey(month);
  const { data: currentRows, error: curErr } = await supabase.from(BUDGETS).select('id, categorias_id').eq('date', date).eq('user_id', userId);
  if (curErr) return { ok: false, error: `Não foi possível colar: ${curErr.message}` };

  const currentByCat = {};
  for (const row of currentRows || []) currentByCat[Number(row.categorias_id)] = row.id;

  const inserts = [];
  for (const { categoriaId, valor } of safe) {
    if (currentByCat[categoriaId]) {
      const { error } = await supabase.from(BUDGETS).update({ [VALOR]: valor, date }).eq('id', currentByCat[categoriaId]).eq('user_id', userId);
      if (error) return { ok: false, error: `Não foi possível colar: ${error.message}` };
    } else {
      inserts.push({ categorias_id: categoriaId, [VALOR]: valor, user_id: userId, date });
    }
  }
  if (inserts.length > 0) {
    const { error } = await supabase.from(BUDGETS).insert(inserts);
    if (error) return { ok: false, error: `Não foi possível colar: ${error.message}` };
  }

  revalidateAll();
  return { ok: true, count: safe.length };
}

/** Porta de `duplicateMonthlyBudgets`: copia os limites do mês anterior para o mês escolhido. */
export async function copyPreviousMonthBudgetsAction(mes) {
  const session = await requireUser();
  const month = parseMonthParam(String(mes || ''), null);
  if (!month) return { ok: false, error: 'Mês inválido.' };
  const { supabase, userId } = session;

  const currentStart = monthStartKey(month);
  const prev = month.month === 1 ? { year: month.year - 1, month: 12 } : { year: month.year, month: month.month - 1 };
  const prevStart = monthStartKey(prev);

  const [{ data: currentRows, error: curErr }, { data: prevRows, error: prevErr }] = await Promise.all([
    supabase.from(BUDGETS).select('id, categorias_id').eq('date', currentStart).eq('user_id', userId),
    supabase.from(BUDGETS).select(`categorias_id, ${VALOR}`).eq('date', prevStart).eq('user_id', userId).not(VALOR, 'is', null),
  ]);
  if (curErr || prevErr) return { ok: false, error: `Não foi possível copiar: ${(curErr || prevErr).message}` };
  if (!prevRows?.length) return { ok: false, error: 'O mês anterior não tem orçamentos para copiar.' };

  const currentByCat = {};
  for (const row of currentRows || []) currentByCat[Number(row.categorias_id)] = row.id;

  const inserts = [];
  for (const row of prevRows) {
    const catId = Number(row.categorias_id);
    const valor = Number(row[VALOR]);
    if (!catId || Number.isNaN(valor)) continue;
    if (currentByCat[catId]) {
      const { error } = await supabase.from(BUDGETS).update({ [VALOR]: valor, date: currentStart }).eq('id', currentByCat[catId]).eq('user_id', userId);
      if (error) return { ok: false, error: `Não foi possível copiar: ${error.message}` };
    } else {
      inserts.push({ categorias_id: catId, [VALOR]: valor, user_id: userId, date: currentStart });
    }
  }
  if (inserts.length > 0) {
    const { error } = await supabase.from(BUDGETS).insert(inserts);
    if (error) return { ok: false, error: `Não foi possível copiar: ${error.message}` };
  }

  revalidateAll();
  return { ok: true, count: prevRows.length };
}
