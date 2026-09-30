'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/session';
import { CONTA_TIPO_LABELS } from '@/lib/finance/contas';
import { findBankById } from '@/lib/finance/bankCatalog';
import { parseMoney } from '@/lib/finance/money';

function revalidateAll() {
  revalidatePath('/contas');
  revalidatePath('/visao-geral');
  revalidatePath('/transacoes');
}

/** Mesma mensagem amigável do app atual quando a tabela ainda não existe. */
function formatContaDbError(error) {
  const msg = String(error?.message || 'Erro ao gravar a conta.');
  if (error?.code === 'PGRST205' || /schema cache/i.test(msg) || /relation.*does not exist/i.test(msg)) {
    return 'A tabela contas_financeiras ainda não existe no Supabase. Execute o arquivo Site/supabase/migrations/CONTAS_FINANCEIRAS_APPLY_MANUAL.sql no SQL Editor do projeto.';
  }
  return msg;
}

function parseDay(raw) {
  const s = String(raw || '').trim();
  if (!s) return { value: null, ok: true };
  const n = Number(s);
  return Number.isInteger(n) && n >= 1 && n <= 31 ? { value: n, ok: true } : { value: null, ok: false };
}

/**
 * Cria ou edita uma conta — mesmas regras do `ContaModal` + `contaFinanceiraStore` do Expo
 * (tabela `contas_financeiras`, `atualizado_em` sempre atualizado, limite só para cartão).
 */
export async function saveContaAction(_prevState, formData) {
  const session = await requireUser();

  const id = String(formData.get('id') || '').trim();
  const mode = String(formData.get('bank_mode') || ''); // 'catalog' | 'custom'
  const bankId = String(formData.get('instituicao_id') || '').trim();
  const bank = mode === 'catalog' ? findBankById(bankId) : null;
  const nome = String(formData.get('nome') || '').trim();
  const tipo = String(formData.get('tipo') || '').trim();
  const cor = String(formData.get('cor') || '').trim();
  const saldoInicial = parseMoney(formData.get('saldo_inicial'));
  const limiteRaw = String(formData.get('limite_credito') || '').trim();
  const limite = limiteRaw ? parseMoney(limiteRaw) : null;
  const fechamento = parseDay(formData.get('dia_fechamento'));
  const vencimento = parseDay(formData.get('dia_vencimento'));
  const isCartao = tipo === 'cartao_credito';

  const errors = {};
  if (!id && mode !== 'catalog' && mode !== 'custom') errors.bank = 'Escolha um banco ou "Outra conta".';
  if (mode === 'catalog' && !bank) errors.bank = 'Banco não encontrado. Escolha novamente.';
  if (!nome) errors.nome = 'Informe um nome para a conta.';
  if (!CONTA_TIPO_LABELS[tipo]) errors.tipo = 'Escolha o tipo da conta.';
  if (!Number.isFinite(saldoInicial)) errors.saldo_inicial = 'Informe um saldo válido.';
  if (isCartao && limiteRaw && (!Number.isFinite(limite) || limite < 0)) errors.limite_credito = 'Informe um limite válido.';
  if (isCartao && !fechamento.ok) errors.dia_fechamento = 'Dia entre 1 e 31.';
  if (isCartao && !vencimento.ok) errors.dia_vencimento = 'Dia entre 1 e 31.';
  if (!/^#[0-9a-fA-F]{6}$/.test(cor)) errors.cor = 'Escolha uma cor.';
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const payload = {
    nome,
    tipo,
    saldo_inicial: saldoInicial,
    limite_credito: isCartao ? limite : null,
    dia_fechamento: isCartao ? fechamento.value : null,
    dia_vencimento: isCartao ? vencimento.value : null,
    cor,
    instituicao_id: bank ? bank.id : null,
    ativo: true,
    atualizado_em: new Date().toISOString(),
  };

  let error;
  if (id) {
    ({ error } = await session.supabase.from('contas_financeiras').update(payload).eq('id', id).eq('user_id', session.userId));
  } else {
    ({ error } = await session.supabase.from('contas_financeiras').insert({ ...payload, user_id: session.userId }));
  }
  if (error) return { ok: false, errors: { form: formatContaDbError(error) } };

  revalidateAll();
  return { ok: true, mode: id ? 'edit' : 'create' };
}

/** Exclui a conta do usuário; lançamentos vinculados ficam sem conta (regra do app atual). */
export async function deleteContaAction(id) {
  const session = await requireUser();
  const contaId = String(id || '').trim();
  if (!contaId) return { ok: false, error: 'Conta inválida.' };

  const { error } = await session.supabase.from('contas_financeiras').delete().eq('id', contaId).eq('user_id', session.userId);
  if (error) return { ok: false, error: formatContaDbError(error) };

  revalidateAll();
  return { ok: true };
}
