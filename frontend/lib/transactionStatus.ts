export type TransactionTipo = 'entrada' | 'saida' | 'saída' | string

const normalizeTipo = (tipo: TransactionTipo) => {
  const t = String(tipo || '').toLowerCase()
  return t === 'saída' ? 'saida' : t
}

/** Entrada realizada → recebido; saída realizada → pago (paridade com backend). */
export function normalizeTransactionStatus(tipo: TransactionTipo, status?: string | null): string {
  const tipoNorm = normalizeTipo(tipo)
  const raw = String(status || '').trim().toLowerCase()

  if (tipoNorm === 'entrada') {
    if (raw === 'a_receber' || raw === 'pendente') return raw
    if (!raw || raw === 'pago' || raw === 'recebido') return 'recebido'
    return raw
  }

  if (raw === 'a_pagar' || raw === 'pendente') return raw
  if (!raw || raw === 'recebido') return 'pago'
  return raw || 'pago'
}

/** Rótulo do badge no extrato (entrada nunca mostra "pago"). */
export function getTransactionStatusLabel(tipo: TransactionTipo, status?: string | null): string {
  const tipoNorm = normalizeTipo(tipo)
  const normalized = normalizeTransactionStatus(tipo, status)
  const s = normalized.toLowerCase()

  if (s === 'recebido') return 'recebido'
  if (s === 'pago') return tipoNorm === 'entrada' ? 'recebido' : 'pago'
  if (s === 'a_receber') return 'a receber'
  if (s === 'a_pagar') return 'a pagar'
  return s || '—'
}

export function isRealizedTransactionStatus(tipo: TransactionTipo, status?: string | null): boolean {
  const s = normalizeTransactionStatus(tipo, status)
  return s === 'pago' || s === 'recebido'
}
