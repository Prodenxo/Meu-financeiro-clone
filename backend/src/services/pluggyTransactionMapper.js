import { normalizeTransactionStatus } from './transactions.service.js';

/** Pluggy: amount positivo = crédito; negativo = débito (padrão comum na API). */
export function mapPluggyTransactionTipo(tx) {
  const type = String(tx?.type || tx?.flow || tx?.transactionType || '').toUpperCase();
  if (type === 'CREDIT' || type === 'IN' || type === 'INCOME') return 'entrada';
  if (type === 'DEBIT' || type === 'OUT' || type === 'EXPENSE') return 'saida';
  const amount = Number(tx?.amount);
  if (Number.isFinite(amount)) return amount >= 0 ? 'entrada' : 'saida';
  return 'saida';
}

export function mapPluggyTransactionValor(tx) {
  const amount = Number(tx?.amount);
  if (Number.isFinite(amount)) return Math.abs(amount);
  const raw = tx?.amountInAccountCurrency ?? tx?.value;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.abs(n) : 0;
}

export function mapPluggyTransactionData(tx) {
  const raw = tx?.date || tx?.postedDate || tx?.createdAt;
  if (!raw) return null;
  const s = String(raw);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

export function buildLancamentoFromPluggyTransaction(tx, { userId, contaId }) {
  const tipo = mapPluggyTransactionTipo(tx);
  const valor = mapPluggyTransactionValor(tx);
  const data = mapPluggyTransactionData(tx);
  if (!data || !Number.isFinite(valor) || valor <= 0) return null;

  const desc =
    String(tx?.description || tx?.merchant?.name || tx?.descriptionRaw || '').trim() ||
    'Movimentação bancária';

  const status = normalizeTransactionStatus(tipo, tipo === 'entrada' ? 'recebido' : 'pago');

  return {
    user_id: userId,
    conta_id: contaId,
    tipo,
    valor,
    classificacao: 'Open Finance',
    status,
    data,
    obs: desc,
    of_provider: 'pluggy',
    of_external_id: String(tx.id),
  };
}
