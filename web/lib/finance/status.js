/** Porta de `frontend/lib/transactionStatus.ts` e `frontend/lib/contaSaldo.ts` (status). */

const normalizeTipo = (tipo) => {
  const t = String(tipo || '').toLowerCase();
  return t === 'saída' ? 'saida' : t;
};

export const REALIZED_LANCAMENTO_STATUS = new Set(['pago', 'recebido']);

export function isRealizedLancamentoStatus(status) {
  return REALIZED_LANCAMENTO_STATUS.has(String(status || '').toLowerCase());
}

/** Entrada realizada → recebido; saída realizada → pago (paridade com backend). */
export function normalizeTransactionStatus(tipo, status) {
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
}

/** Rótulo curto do badge de situação. */
export function getTransactionStatusLabel(tipo, status) {
  const tipoNorm = normalizeTipo(tipo);
  const s = normalizeTransactionStatus(tipo, status).toLowerCase();

  if (s === 'recebido') return 'Recebido';
  if (s === 'pago') return tipoNorm === 'entrada' ? 'Recebido' : 'Pago';
  if (s === 'a_receber') return 'A receber';
  if (s === 'a_pagar') return 'Pendente';
  if (s === 'pendente') return 'Pendente';
  return s || '—';
}

/** Tom visual do badge: success (realizado), warning (pendente), neutral. */
export function getTransactionStatusTone(tipo, status) {
  const s = normalizeTransactionStatus(tipo, status).toLowerCase();
  if (s === 'recebido') return 'success';
  if (s === 'pago') return 'neutral';
  if (s === 'a_receber' || s === 'a_pagar' || s === 'pendente') return 'warning';
  return 'neutral';
}
