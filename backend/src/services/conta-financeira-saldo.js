const REALIZED_STATUS = new Set(['pago', 'recebido']);

const normalizeTipo = (tipo) => {
  const t = String(tipo || '').toLowerCase();
  if (t === 'saída' || t === 'saida') return 'saida';
  if (t === 'entrada') return 'entrada';
  return t;
};

const normalizeValor = (valor) => {
  if (typeof valor === 'number' && Number.isFinite(valor)) return valor;
  const n = Number(String(valor ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

/** Saldo = saldo_inicial + entradas realizadas − saídas realizadas da conta. */
export const computeContaSaldoAtual = (saldoInicial, lancamentos, contaId) => {
  let delta = 0;
  for (const tx of lancamentos || []) {
    if (!tx?.conta_id || String(tx.conta_id) !== String(contaId)) continue;
    if (!REALIZED_STATUS.has(String(tx.status || '').toLowerCase())) continue;
    const valor = normalizeValor(tx.valor);
    const tipo = normalizeTipo(tx.tipo);
    if (tipo === 'entrada') delta += valor;
    else if (tipo === 'saida') delta -= valor;
  }
  const base =
    typeof saldoInicial === 'number'
      ? saldoInicial
      : parseFloat(String(saldoInicial ?? 0)) || 0;
  return base + delta;
};
