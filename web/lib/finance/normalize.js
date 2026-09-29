/**
 * Normalização de lançamentos — porta fiel de `frontend/lib/dashboardUtils.ts`
 * e `frontend/lib/transactionPeriodFilter.ts`. Não alterar fórmulas aqui sem
 * alterar também no app Expo.
 */

export const pad2 = (value) => String(value).padStart(2, '0');

export const getMonthStart = (date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return `${year}-${pad2(month)}-01`;
};

export const normalizeCategoryKey = (nome) => String(nome || '').trim().toLowerCase();

/** 'entrada' | 'saida' (qualquer outra coisa conta como saída). */
export function normalizarTipo(tipo) {
  const tipoLower = String(tipo || '').toLowerCase().trim();
  if (tipoLower === 'entrada') return 'entrada';
  return 'saida';
}

export function normalizarValor(valor) {
  if (typeof valor === 'number') return Number.isNaN(valor) ? 0 : valor;
  const parsed = parseFloat(String(valor || '0'));
  return Number.isNaN(parsed) ? 0 : parsed;
}

/** Data do lançamento com fallback em `criado_em` (usada para ordenar/agrupar). */
export function parsearData(dataStr, criadoEmStr) {
  if (dataStr) {
    if (dataStr.includes('T')) return new Date(dataStr);
    if (/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) return new Date(`${dataStr}T00:00:00`);
    const parsed = new Date(dataStr);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date(criadoEmStr ?? '');
}

/** Data ao meio-dia (evita virar o dia por fuso) — usada nos filtros de período. */
export function parseTransactionDate(t) {
  const raw = t.data ? String(t.data).slice(0, 10) : '';
  if (raw && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return new Date(`${raw}T12:00:00`);
  }
  if (t.criado_em) return new Date(t.criado_em);
  return new Date();
}

export function isInSelectedMonth(t, selectedMonth) {
  const data = parseTransactionDate(t);
  return data.getMonth() === selectedMonth.month - 1 && data.getFullYear() === selectedMonth.year;
}

export function toDayKey(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** Normaliza uma linha de `lancamentos_id` como o `transactionStore` do Expo. */
export function normalizeLancamentoRow(t) {
  const categoriaRaw = t.categoria;
  let categoria = null;
  if (categoriaRaw !== null && categoriaRaw !== undefined) {
    categoria =
      typeof categoriaRaw === 'string'
        ? Number.isNaN(Number(categoriaRaw))
          ? categoriaRaw
          : Number(categoriaRaw)
        : categoriaRaw;
  }
  return {
    ...t,
    id: String(t.id || ''),
    valor: typeof t.valor === 'string' ? parseFloat(t.valor) : Number(t.valor),
    tipo: String(t.tipo) === 'saida' ? 'saída' : String(t.tipo),
    classificacao: String(t.classificacao || ''),
    status: String(t.status || ''),
    user_id: t.user_id ? String(t.user_id) : null,
    criado_em: String(t.criado_em || ''),
    data: t.data ? String(t.data) : null,
    categoria,
    obs: t.obs ? String(t.obs) : null,
    conta_id: t.conta_id ? String(t.conta_id) : null,
  };
}
