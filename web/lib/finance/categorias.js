import { normalizarTipo, normalizarValor, normalizeCategoryKey, parseTransactionDate, toDayKey, pad2 } from './normalize.js';
import { formatDayKeyLong } from './contasPage.js';
import { getCategorySliceColorForId } from './categoryColors.js';

/**
 * Regras da tela "Categorias" do app atual (`CategoriasScreen` + `useCategoryMonthSpending`),
 * portadas 1:1 para JS puro. Nada aqui toca rede ou DOM.
 */

export const ORPHAN_ID = '-1';
export const ORPHAN_NAME = 'Sem categoria';

/** Ids das categorias padrão usadas ao excluir (mesmos do app atual). */
export const DEFAULT_CATEGORY_ID = { saida: 62, entrada: 228 };

export const VIEW_TIPOS = [
  { value: 'saida', label: 'Saídas' },
  { value: 'entrada', label: 'Entradas' },
];

function dayKeyOf(t) {
  return toDayKey(parseTransactionDate(t));
}

export function monthRange({ year, month }) {
  const last = new Date(year, month, 0).getDate();
  return { startKey: `${year}-${pad2(month)}-01`, endKey: `${year}-${pad2(month)}-${pad2(last)}` };
}

/** Lançamentos do mês (qualquer status), como a consulta do hook do Expo. */
export function monthTransactions(transactions, selectedMonth) {
  const { startKey, endKey } = monthRange(selectedMonth);
  return transactions.filter((t) => {
    const k = dayKeyOf(t);
    return k >= startKey && k <= endKey;
  });
}

/**
 * Globais + do usuário; duplicata por nome/tipo fica com a do usuário
 * (`mergeCategoriesByName` do Expo). Ordena por nome.
 */
export function mergeCategoriesByName(list) {
  const byKey = new Map();
  for (const cat of list) {
    const tipo = normalizarTipo(cat.tipo);
    const key = `${String(cat.nome || '').trim().toLowerCase()}:${tipo}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, { ...cat, id: String(cat.id), tipo });
      continue;
    }
    if (existing.user_id == null && cat.user_id != null) byKey.set(key, { ...cat, id: String(cat.id), tipo });
  }
  return [...byKey.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }));
}

function matchesCategory(t, nome, tipo) {
  return normalizarTipo(t.tipo) === tipo && normalizeCategoryKey(t.classificacao) === normalizeCategoryKey(nome);
}

/**
 * Valor do mês por categoria (`amountForCategory` do Expo):
 * saída = todos os lançamentos da categoria no mês (qualquer status);
 * entrada = só os recebidos; se não houver recebido, usa todos (regra do app).
 */
export function amountForCategory(monthTxs, nome, tipo) {
  const txs = monthTxs.filter((t) => matchesCategory(t, nome, tipo));
  if (tipo === 'entrada') {
    const recebidos = txs.filter((t) => String(t.status || '').toLowerCase() === 'recebido');
    const recebido = recebidos.reduce((s, t) => s + normalizarValor(t.valor), 0);
    if (recebido > 0) return recebido;
  }
  return txs.reduce((s, t) => s + normalizarValor(t.valor), 0);
}

/** Linhas do tipo em exibição (+ "Sem categoria" quando há lançamentos órfãos), com busca e ordenação do Expo. */
export function buildCategoryRows({ categories, monthTxs, viewTipo, search = '' }) {
  const ofTipo = categories.filter((c) => normalizarTipo(c.tipo) === viewTipo);
  const catKeys = new Set(ofTipo.map((c) => normalizeCategoryKey(c.nome)));

  const rows = ofTipo.map((c) => {
    const transactions = monthTxs.filter((t) => matchesCategory(t, c.nome, viewTipo));
    return {
      id: String(c.id),
      nome: c.nome,
      tipo: viewTipo,
      user_id: c.user_id ?? null,
      amount: amountForCategory(monthTxs, c.nome, viewTipo),
      count: transactions.length,
      transactions,
      color: getCategorySliceColorForId(String(c.id)),
      isOrphan: false,
    };
  });

  const orphanTxs = monthTxs.filter((t) => {
    if (normalizarTipo(t.tipo) !== viewTipo) return false;
    const key = normalizeCategoryKey(t.classificacao);
    return !key || !catKeys.has(key);
  });
  if (orphanTxs.length > 0) {
    rows.push({
      id: ORPHAN_ID,
      nome: ORPHAN_NAME,
      tipo: viewTipo,
      user_id: null,
      amount: orphanTxs.reduce((s, t) => s + normalizarValor(t.valor), 0),
      count: orphanTxs.length,
      transactions: orphanTxs,
      color: getCategorySliceColorForId(ORPHAN_ID),
      isOrphan: true,
    });
  }

  const term = String(search || '').trim().toLowerCase();
  const filtered = term ? rows.filter((r) => String(r.nome || '').trim().toLowerCase().includes(term)) : rows;
  return filtered.sort((a, b) => {
    if (b.amount !== a.amount) return b.amount - a.amount;
    return a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' });
  });
}

export function hasMovement(row) {
  return row.amount > 0.009;
}

/** Total do mês no tipo em exibição (qualquer status) e fluxo geral do mês. */
export function buildMonthFlow(monthTxs) {
  let entradas = 0;
  let saidas = 0;
  for (const t of monthTxs) {
    if (normalizarTipo(t.tipo) === 'entrada') entradas += normalizarValor(t.valor);
    else saidas += normalizarValor(t.valor);
  }
  return { entradas, saidas };
}

/** Participação de cada linha no total do tipo (0–100, sem passar de 100). */
export function shareOf(amount, total) {
  return total > 0 ? Math.min(100, (amount / total) * 100) : 0;
}

/** Fatias da rosca: as maiores categorias com movimento + "Outras" com o restante. */
export function buildDistribution(rows, total, { limit = 3 } = {}) {
  const active = rows.filter(hasMovement);
  const top = active.slice(0, limit);
  const rest = active.slice(limit);
  const slices = top.map((r) => ({ id: r.id, nome: r.nome, valor: r.amount, pct: shareOf(r.amount, total), color: r.color }));
  if (rest.length > 0) {
    const valor = rest.reduce((s, r) => s + r.amount, 0);
    slices.push({ id: 'outras', nome: 'Outras', valor, pct: shareOf(valor, total), color: 'var(--mf-text-3)', count: rest.length });
  }
  return slices;
}

/** Últimas movimentações do mês (todos os tipos), mais recentes primeiro. */
export function buildRecentMovements(monthTxs, limit = 4) {
  return [...monthTxs]
    .sort((a, b) => dayKeyOf(b).localeCompare(dayKeyOf(a)) || String(b.criado_em || '').localeCompare(String(a.criado_em || '')))
    .slice(0, limit)
    .map((t) => ({
      id: t.id,
      title: String(t.classificacao || '').trim() || 'Lançamento',
      dateLabel: formatDayKeyLong(dayKeyOf(t)),
      tipo: normalizarTipo(t.tipo),
      valor: normalizarValor(t.valor),
    }));
}

/** Total do tipo acumulado dia a dia no mês (mini-gráfico do card "Total movimentado"). */
export function buildMonthTrend(monthTxs, viewTipo, selectedMonth) {
  const { startKey, endKey } = monthRange(selectedMonth);
  const byDay = new Map();
  for (const t of monthTxs) {
    if (normalizarTipo(t.tipo) !== viewTipo) continue;
    const k = dayKeyOf(t);
    byDay.set(k, (byDay.get(k) || 0) + normalizarValor(t.valor));
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

export function buildCategoriasModel({ categories, transactions, selectedMonth, viewTipo = 'saida', search = '' }) {
  const merged = mergeCategoriesByName(categories);
  const monthTxs = monthTransactions(transactions, selectedMonth);
  const rows = buildCategoryRows({ categories: merged, monthTxs, viewTipo, search });
  const allRows = search ? buildCategoryRows({ categories: merged, monthTxs, viewTipo }) : rows;
  const flow = buildMonthFlow(monthTxs);
  const total = viewTipo === 'entrada' ? flow.entradas : flow.saidas;
  const ofTipo = merged.filter((c) => c.tipo === viewTipo);
  const activeCount = allRows.filter(hasMovement).length;

  return {
    categories: merged,
    rows,
    total,
    flow,
    counts: { total: merged.length, ofTipo: ofTipo.length, active: activeCount },
    distribution: buildDistribution(allRows, total),
    recent: buildRecentMovements(monthTxs),
    trend: buildMonthTrend(monthTxs, viewTipo, selectedMonth),
    hasCategories: merged.length > 0,
  };
}
