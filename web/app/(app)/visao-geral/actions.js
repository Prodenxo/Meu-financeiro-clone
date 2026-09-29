'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/session';
import { normalizeTransactionStatus } from '@/lib/finance/status';

/** "1.234,56" | "1234.56" | "1234" → número. */
function parseMoney(raw) {
  const s = String(raw || '').trim().replace(/\s|R\$/g, '');
  if (!s) return NaN;
  const normalized = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s;
  return Number(normalized);
}

/**
 * Cria um lançamento — mesma gravação do `transactionStore.addTransaction` do Expo
 * (tabela `lancamentos_id`, tipo 'entrada' | 'saída', status normalizado por tipo).
 * Sem integração com Google Agenda (fica para a etapa das Transações).
 */
export async function createTransactionAction(_prevState, formData) {
  const session = await requireUser();

  const tipoRaw = String(formData.get('tipo') || '');
  const tipo = tipoRaw === 'entrada' ? 'entrada' : tipoRaw === 'saida' ? 'saída' : null;
  const valor = parseMoney(formData.get('valor'));
  const classificacao = String(formData.get('classificacao') || '').trim();
  const data = String(formData.get('data') || '').trim();
  const realizado = formData.get('realizado') === 'on';
  const obs = String(formData.get('obs') || '').trim();
  const contaId = String(formData.get('conta_id') || '').trim();

  const errors = {};
  if (!tipo) errors.tipo = 'Escolha entrada ou saída.';
  if (!Number.isFinite(valor) || valor <= 0) errors.valor = 'Informe um valor maior que zero.';
  if (!classificacao) errors.classificacao = 'Escolha uma categoria.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) errors.data = 'Informe uma data válida.';
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const pendente = tipo === 'entrada' ? 'a_receber' : 'a_pagar';
  const status = normalizeTransactionStatus(tipo, realizado ? '' : pendente);

  const payload = {
    tipo,
    valor,
    classificacao,
    data,
    status,
    obs: obs || null,
    conta_id: contaId || null,
    user_id: session.userId,
  };

  const { error } = await session.supabase.from('lancamentos_id').insert(payload);
  if (error) {
    console.error('[createTransaction]', error);
    return { ok: false, errors: { form: `Não foi possível salvar: ${error.message}` } };
  }

  revalidatePath('/visao-geral');
  return { ok: true, tipo: tipo === 'entrada' ? 'entrada' : 'saida', valor };
}
