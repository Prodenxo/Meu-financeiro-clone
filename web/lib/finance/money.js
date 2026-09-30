/** "1.234,56" | "1234.56" | "1234" | "R$ -1.234,56" → número (NaN se vazio/inválido). */
export function parseMoney(raw) {
  const s = String(raw || '').trim().replace(/\s|R\$/g, '');
  if (!s) return NaN;
  const normalized = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s;
  return Number(normalized);
}

/** Número → "1234,56" para preencher campos de texto. */
export function toMoneyInput(valor) {
  const n = Number(valor);
  return Number.isFinite(n) ? n.toFixed(2).replace('.', ',') : '';
}
