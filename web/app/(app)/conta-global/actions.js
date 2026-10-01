'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/session';
import { formatContaMoedaGlobalDbError } from '@/lib/data/contaGlobal';
import { isMoedaCode, normalizeMoedaCode } from '@/lib/finance/moedas';
import { parseMoney } from '@/lib/finance/money';

/** Só a própria tela: a Conta global não participa dos saldos da Visão geral. */
function revalidate() {
  revalidatePath('/conta-global');
}

/**
 * Cria ou edita uma moeda — mesmas regras do `ContaMoedaModal` + `contaMoedaGlobalStore` do Expo
 * (código ISO de 3 letras, valor ≥ 0, apelido opcional até 80 caracteres, `atualizado_em` sempre
 * atualizado). BRL fica de fora, como no backend (`createContaMoedaGlobal`).
 */
export async function saveMoedaGlobalAction(_prevState, formData) {
  const session = await requireUser();

  const id = String(formData.get('id') || '').trim();
  const moeda = normalizeMoedaCode(formData.get('moeda'));
  const nomeRaw = String(formData.get('nome') || '').trim();
  const valor = parseMoney(formData.get('valor'));

  const errors = {};
  if (!isMoedaCode(moeda)) errors.moeda = 'Selecione uma moeda válida (código de 3 letras).';
  else if (moeda === 'BRL') errors.moeda = 'Reais ficam nas suas contas; a Conta global é só para moedas estrangeiras.';
  if (!Number.isFinite(valor) || valor < 0) errors.valor = 'Informe um valor válido (zero ou mais).';
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const payload = {
    moeda,
    nome: nomeRaw ? nomeRaw.slice(0, 80) : null,
    valor,
    ativo: true,
    atualizado_em: new Date().toISOString(),
  };

  let error;
  if (id) {
    ({ error } = await session.supabase.from('contas_moeda_global').update(payload).eq('id', id).eq('user_id', session.userId));
  } else {
    ({ error } = await session.supabase.from('contas_moeda_global').insert({ ...payload, user_id: session.userId }));
  }
  if (error) return { ok: false, errors: { form: formatContaMoedaGlobalDbError(error) } };

  revalidate();
  return { ok: true, mode: id ? 'edit' : 'create', moeda };
}

/** Exclui a moeda do utilizador (mesma operação do `contaMoedaGlobalStore.deleteConta`). */
export async function deleteMoedaGlobalAction(id) {
  const session = await requireUser();
  const contaId = String(id || '').trim();
  if (!contaId) return { ok: false, error: 'Moeda inválida.' };

  const { error } = await session.supabase.from('contas_moeda_global').delete().eq('id', contaId).eq('user_id', session.userId);
  if (error) return { ok: false, error: formatContaMoedaGlobalDbError(error) };

  revalidate();
  return { ok: true };
}
