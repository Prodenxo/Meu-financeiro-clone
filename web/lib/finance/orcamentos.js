/**
 * Modelo da tela Orçamentos — regras de `frontend/screens/OrcamentosScreen.tsx`,
 * `Orcamentos/BudgetCategoryRow.tsx` e `lib/categoryService.ts` (fetchCategoryBudgetsSummary),
 * sem UI. Funções puras.
 *
 * Regras do app atual preservadas:
 * - uma linha em `orçamentos` por categoria e mês (`date` = primeiro dia do mês);
 * - linha do usuário vale mais que a global (`user_id` nulo);
 * - só conta como orçamento quando `valor_orçado` não é nulo;
 * - realizado de despesa = TODAS as saídas do mês da categoria (qualquer status);
 *   realizado de receita = só entradas com status `recebido`;
 * - lançamento casa com a categoria pelo nome (`classificacao`, minúsculo/trim).
 */
import { normalizarTipo, normalizarValor, normalizeCategoryKey, pad2, parseTransactionDate, toDayKey } from './normalize.js';
import { formatDayMonth } from './format.js';
import { getCategorySliceColorForId } from './categoryColors.js';

export const CHART_RANGES = [
  { value: '7d', label: '7D', days: 7 },
  { value: '30d', label: '30D', days: 30 },
  { value: '90d', label: '90D', days: 90 },
  { value: '1a', label: '1A', days: 365 },
];

export const BUDGET_FILTERS = [
  { value: 'all', label: 'Todas as categorias' },
  { value: 'over', label: 'Acima do limite' },
  { value: 'ok', label: 'Dentro do limite' },
  { value: 'saida', label: 'Despesas' },
  { value: 'entrada', label: 'Receitas' },
];

export const BUDGET_SORTS = [
  { value: 'uso', label: 'Maior uso' },
  { value: 'nome', label: 'Nome (A–Z)' },
  { value: 'limite', label: 'Maior limite' },
  { value: 'disponivel', label: 'Menor disponível' },
];

export function monthStartKey({ year, month }) {
  return `${year}-${pad2(month)}-01`;
}

export function monthEndKey({ year, month }) {
  const last = new Date(year, month, 0).getDate();
  return `${year}-${pad2(month)}-${pad2(last)}`;
}

export function normalizeBudgetRow(row) {
  const raw = row['valor_orçado'] ?? row.valor_orcado;
  const valor = raw === null || raw === undefined || raw === '' ? null : Number(raw);
  return {
    id: String(row.id ?? ''),
    categorias_id: String(row.categorias_id ?? ''),
    valor_orcado: valor === null || Number.isNaN(valor) ? null : valor,
    user_id: row.user_id ? String(row.user_id) : null,
    date: row.date ? String(row.date).slice(0, 10) : null,
  };
}

/** Limite por categoria no mês (linha do usuário > linha global). Só valores não nulos. */
export function budgetValuesForMonth(rows, userId, selectedMonth) {
  const monthKey = monthStartKey(selectedMonth);
  const byCat = new Map();
  for (const r of rows) {
    if (r.date !== monthKey || !r.categorias_id) continue;
    const isOwn = r.user_id === userId;
    if (!isOwn && r.user_id !== null) continue;
    const prev = byCat.get(r.categorias_id);
    if (prev && prev.isOwn && !isOwn) continue;
    byCat.set(r.categorias_id, { valor: r.valor_orcado, isOwn });
  }
  const out = new Map();
  for (const [catId, { valor }] of byCat) if (valor !== null) out.set(catId, valor);
  return out;
}

/** Mapa nome normalizado → id da categoria (última vence, como no Expo). */
export function categoryIdByName(categories) {
  const map = {};
  for (const c of categories) if (c.nome) map[normalizeCategoryKey(c.nome)] = String(c.id);
  return map;
}

const dayKeyOf = (t) => toDayKey(parseTransactionDate(t));

/** Diz se o lançamento entra no "realizado" da categoria do tipo dado. */
export function countsAsRealized(t, tipoCategoria) {
  const tipo = normalizarTipo(t.tipo);
  if (tipoCategoria === 'entrada') return tipo === 'entrada' && String(t.status || '').toLowerCase() === 'recebido';
  return tipo === 'saida';
}

/** Realizado por categoria dentro de [startKey, endKey]. */
export function realizedByCategory(transactions, categories, startKey, endKey) {
  const idByName = categoryIdByName(categories);
  const tipoById = Object.fromEntries(categories.map((c) => [String(c.id), normalizarTipo(c.tipo)]));
  const out = new Map();
  for (const t of transactions) {
    const key = dayKeyOf(t);
    if (key < startKey || key > endKey) continue;
    const catId = idByName[normalizeCategoryKey(t.classificacao)];
    if (!catId) continue;
    if (!countsAsRealized(t, tipoById[catId])) continue;
    out.set(catId, (out.get(catId) || 0) + normalizarValor(t.valor));
  }
  return out;
}

export function budgetStatus({ tipo, orcado, realizado }) {
  if (tipo === 'entrada') {
    return realizado >= orcado && orcado > 0
      ? { key: 'ok', label: 'Meta atingida', tone: 'success' }
      : { key: 'progress', label: 'Em andamento', tone: 'neutral' };
  }
  return orcado > 0 && realizado > orcado
    ? { key: 'over', label: 'Acima do limite', tone: 'danger' }
    : { key: 'ok', label: 'Dentro do limite', tone: 'success' };
}

/** Itens da tela (uma linha por categoria com orçamento no mês). */
export function buildBudgetItems({ budgetRows, transactions, categories, userId, selectedMonth }) {
  const limits = budgetValuesForMonth(budgetRows, userId, selectedMonth);
  const realized = realizedByCategory(transactions, categories, monthStartKey(selectedMonth), monthEndKey(selectedMonth));
  const items = [];
  for (const c of categories) {
    const id = String(c.id);
    if (!limits.has(id)) continue;
    const tipo = normalizarTipo(c.tipo);
    const orcado = limits.get(id);
    const realizado = realized.get(id) || 0;
    const percentual = orcado > 0 ? (realizado / orcado) * 100 : realizado > 0 ? 100 : 0;
    items.push({
      categorias_id: id,
      nome: c.nome,
      tipo,
      orcado,
      realizado,
      disponivel: orcado - realizado,
      percentual,
      barPct: Math.min(100, percentual),
      status: budgetStatus({ tipo, orcado, realizado }),
      color: getCategorySliceColorForId(id),
    });
  }
  return items.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

export function buildBudgetTotals(items) {
  const orcado = items.reduce((s, i) => s + i.orcado, 0);
  const realizado = items.reduce((s, i) => s + i.realizado, 0);
  return {
    orcado,
    realizado,
    diferenca: orcado - realizado,
    percentual: orcado > 0 ? (realizado / orcado) * 100 : 0,
    count: items.length,
    overCount: items.filter((i) => i.status.key === 'over').length,
  };
}

export function filterBudgetItems(items, filter) {
  if (filter === 'over') return items.filter((i) => i.status.key === 'over');
  if (filter === 'ok') return items.filter((i) => i.status.key !== 'over');
  if (filter === 'saida' || filter === 'entrada') return items.filter((i) => i.tipo === filter);
  return items;
}

export function sortBudgetItems(items, sort) {
  const list = [...items];
  if (sort === 'nome') return list.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  if (sort === 'limite') return list.sort((a, b) => b.orcado - a.orcado);
  if (sort === 'disponivel') return list.sort((a, b) => a.disponivel - b.disponivel);
  return list.sort((a, b) => b.percentual - a.percentual || b.realizado - a.realizado);
}

/** Fim da janela do gráfico: hoje no mês atual; último dia nos demais meses. */
export function chartEndKey(selectedMonth, today) {
  const todayKey = typeof today === 'string' ? today : toDayKey(today);
  const end = monthEndKey(selectedMonth);
  const start = monthStartKey(selectedMonth);
  if (todayKey >= start && todayKey <= end) return todayKey;
  return end;
}

/**
 * Evolução do realizado acumulado por categoria com orçamento, dia a dia, na janela
 * (7D/30D/90D/1A) que termina no fim do período selecionado.
 */
export function buildBudgetHistory({ items, transactions, categories, selectedMonth, today, range = '30d' }) {
  const days = CHART_RANGES.find((r) => r.value === range)?.days ?? 30;
  const endKey = chartEndKey(selectedMonth, today);
  const [ey, em, ed] = endKey.split('-').map(Number);
  const start = new Date(ey, em - 1, ed - (days - 1), 12);
  const startKey = toDayKey(start);

  const tracked = items.map((i) => ({ id: i.categorias_id, nome: i.nome, tipo: i.tipo, color: i.status.key === 'over' ? 'var(--mf-danger)' : i.color }));
  const trackedIds = new Set(tracked.map((t) => t.id));
  const idByName = categoryIdByName(categories);
  const tipoById = Object.fromEntries(categories.map((c) => [String(c.id), normalizarTipo(c.tipo)]));

  const perDay = new Map(); // dayKey → Map(catId → valor)
  for (const t of transactions) {
    const key = dayKeyOf(t);
    if (key < startKey || key > endKey) continue;
    const catId = idByName[normalizeCategoryKey(t.classificacao)];
    if (!catId || !trackedIds.has(catId) || !countsAsRealized(t, tipoById[catId])) continue;
    const day = perDay.get(key) || new Map();
    day.set(catId, (day.get(catId) || 0) + normalizarValor(t.valor));
    perDay.set(key, day);
  }

  const acc = Object.fromEntries(tracked.map((t) => [t.id, 0]));
  const series = [];
  const cursor = new Date(start);
  for (let i = 0; i < days; i++) {
    const key = toDayKey(cursor);
    const day = perDay.get(key);
    if (day) for (const [catId, v] of day) acc[catId] += v;
    series.push({ dayKey: key, label: formatDayMonth(key), ...acc });
    cursor.setDate(cursor.getDate() + 1);
  }
  return { series, categories: tracked, hasMovement: perDay.size > 0 };
}

/** Série do total realizado acumulado no mês (tendência do card "Total utilizado"). */
export function buildMonthTrend(items, transactions, categories, selectedMonth) {
  const startKey = monthStartKey(selectedMonth);
  const endKey = monthEndKey(selectedMonth);
  const idByName = categoryIdByName(categories);
  const tipoById = Object.fromEntries(categories.map((c) => [String(c.id), normalizarTipo(c.tipo)]));
  const tracked = new Set(items.map((i) => i.categorias_id));
  const byDay = new Map();
  for (const t of transactions) {
    const key = dayKeyOf(t);
    if (key < startKey || key > endKey) continue;
    const catId = idByName[normalizeCategoryKey(t.classificacao)];
    if (!catId || !tracked.has(catId) || !countsAsRealized(t, tipoById[catId])) continue;
    byDay.set(key, (byDay.get(key) || 0) + normalizarValor(t.valor));
  }
  const days = Number(endKey.slice(-2));
  const out = [];
  let acc = 0;
  for (let d = 1; d <= days; d++) {
    acc += byDay.get(`${startKey.slice(0, 8)}${pad2(d)}`) || 0;
    out.push(acc);
  }
  return out;
}

export function buildOrcamentosModel({ budgetRows, transactions, categories, userId, selectedMonth, today, filter = 'all', sort = 'uso', chartRange = '30d' }) {
  const items = buildBudgetItems({ budgetRows, transactions, categories, userId, selectedMonth });
  const visible = sortBudgetItems(filterBudgetItems(items, filter), sort);
  return {
    items,
    visible,
    totals: buildBudgetTotals(items),
    attention: sortBudgetItems(items, 'uso').slice(0, 4),
    trend: buildMonthTrend(items, transactions, categories, selectedMonth),
    history: buildBudgetHistory({ items, transactions, categories, selectedMonth, today, range: chartRange }),
    /** Categorias ainda sem orçamento no mês — opções do modal "Novo orçamento". */
    availableCategories: categories.filter((c) => !items.some((i) => i.categorias_id === String(c.id))),
  };
}
