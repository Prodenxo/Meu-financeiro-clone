/**
 * Modelo da tela Transações — regras de `frontend/screens/TransactionsScreen.tsx`,
 * `lib/transactionPeriodFilter.ts`, `lib/contaFinanceiraIntegration.ts` e
 * `lib/exportTransactionsSpreadsheet.ts`, sem UI. Funções puras.
 */
import { normalizarTipo, normalizarValor, pad2, parseTransactionDate, toDayKey } from './normalize.js';
import { filterTransactionsByConta } from './contas.js';
import { isProjecao, projectRecurrences } from './recorrencias.js';
import { MONTH_NAMES } from './format.js';

export const PERIOD_PRESETS = ['Hoje', 'Essa semana', 'Esse mês'];

export const SORT_OPTIONS = [
  { value: 'recentes', label: 'Mais recentes' },
  { value: 'antigas', label: 'Mais antigas' },
  { value: 'maior', label: 'Maior valor' },
  { value: 'menor', label: 'Menor valor' },
];

export const DEFAULT_FILTERS = {
  period: 'Esse mês',
  dateRange: { start: '', end: '' },
  search: '',
  typeFilter: 'all',
  statusFilter: 'all',
  contaFilter: 'all',
};

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

export const dayKeyToDate = (key) => new Date(`${key}T12:00:00`);

/** 'YYYY-MM-DD' → 'DD/MM/AAAA' sem depender do fuso. */
export function formatDayKeyBr(key) {
  const [y, m, d] = String(key || '').slice(0, 10).split('-');
  return y && m && d ? `${d}/${m}/${y}` : '';
}

/** Intervalo personalizado só vale com as duas datas e início ≤ fim. */
export function isValidDateRange(range) {
  return Boolean(range?.start && range?.end && ISO_DAY.test(range.start) && ISO_DAY.test(range.end) && range.start <= range.end);
}

/** Semana de domingo a sábado (igual ao `isInCurrentWeek` do Expo). */
export function weekBounds(today) {
  const first = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay(), 12);
  const last = new Date(first.getFullYear(), first.getMonth(), first.getDate() + 6, 12);
  return { start: toDayKey(first), end: toDayKey(last) };
}

export function monthBounds({ year, month }) {
  const lastDay = new Date(year, month, 0).getDate();
  return { start: `${year}-${pad2(month)}-01`, end: `${year}-${pad2(month)}-${pad2(lastDay)}` };
}

/** Período efetivo (datas inclusivas + rótulo) a partir do preset, mês e intervalo. */
export function resolvePeriod({ period, selectedMonth, dateRange, today }) {
  if (isValidDateRange(dateRange)) {
    return {
      mode: 'custom',
      ...dateRange,
      label: `${formatDayKeyBr(dateRange.start)} até ${formatDayKeyBr(dateRange.end)}`,
    };
  }
  if (period === 'Hoje') {
    const key = toDayKey(today);
    return { mode: 'today', start: key, end: key, label: 'Hoje' };
  }
  if (period === 'Essa semana') return { mode: 'week', ...weekBounds(today), label: 'Esta semana' };
  return {
    mode: 'month',
    ...monthBounds(selectedMonth),
    label: `${MONTH_NAMES[selectedMonth.month - 1]} ${selectedMonth.year}`,
  };
}

export function matchesPeriod(t, resolved) {
  const key = toDayKey(parseTransactionDate(t));
  return key >= resolved.start && key <= resolved.end;
}

/** Meses cobertos pelas projeções — mesma regra do `projectionMonthRange` do Expo. */
export function projectionMonthRange(resolved, today) {
  if (resolved.mode === 'custom' || resolved.mode === 'month') {
    const s = dayKeyToDate(resolved.start);
    const e = dayKeyToDate(resolved.end);
    return { startYear: s.getFullYear(), startMonth: s.getMonth() + 1, endYear: e.getFullYear(), endMonth: e.getMonth() + 1 };
  }
  const y = today.getFullYear();
  const m = today.getMonth() + 1;
  return { startYear: y, startMonth: m, endYear: y, endMonth: m };
}

export function matchesSearch(t, search) {
  const q = String(search || '').toLowerCase();
  if (!q) return true;
  return (t.classificacao || '').toLowerCase().includes(q) || (t.obs || '').toLowerCase().includes(q);
}

/** KPIs do período (porta de `computeMonthFlowKpis`). */
export function computeMonthFlowKpis(list) {
  const isEntrada = (t) => normalizarTipo(t.tipo) === 'entrada';
  const entradasList = list.filter(isEntrada);
  const saidasList = list.filter((t) => !isEntrada(t));
  const entradas = entradasList.reduce((s, t) => s + normalizarValor(t.valor), 0);
  const saidas = saidasList.reduce((s, t) => s + normalizarValor(t.valor), 0);
  return {
    entradas,
    saidas,
    saldo: entradas - saidas,
    countEntradas: entradasList.length,
    countSaidas: saidasList.length,
  };
}

export function isPaidStatus(status) {
  const s = String(status || '').toLowerCase();
  return s === 'pago' || s === 'recebido';
}

export function matchesPills(t, { typeFilter, statusFilter }) {
  const isEntrada = String(t.tipo).toLowerCase() === 'entrada';
  if (typeFilter === 'entrada' && !isEntrada) return false;
  if (typeFilter === 'saida' && isEntrada) return false;
  if (statusFilter === 'pago' && !isPaidStatus(t.status)) return false;
  if (statusFilter === 'pendente' && isPaidStatus(t.status)) return false;
  return true;
}

const dateOf = (t) => String(t.data || t.criado_em || '').slice(0, 10);

export function sortTransactions(list, sort) {
  const out = [...list];
  const byDateDesc = (a, b) =>
    dateOf(b).localeCompare(dateOf(a)) || String(b.criado_em || '').localeCompare(String(a.criado_em || ''));
  if (sort === 'antigas') out.sort((a, b) => byDateDesc(b, a));
  else if (sort === 'maior') out.sort((a, b) => normalizarValor(b.valor) - normalizarValor(a.valor) || byDateDesc(a, b));
  else if (sort === 'menor') out.sort((a, b) => normalizarValor(a.valor) - normalizarValor(b.valor) || byDateDesc(a, b));
  else out.sort(byDateDesc);
  return out;
}

export function hasActiveFilters(filters) {
  return (
    filters.period !== DEFAULT_FILTERS.period ||
    isValidDateRange(filters.dateRange) ||
    Boolean(filters.search) ||
    filters.typeFilter !== 'all' ||
    filters.statusFilter !== 'all' ||
    filters.contaFilter !== 'all'
  );
}

/**
 * Tudo que a tela mostra. Os cards usam só lançamentos reais (período + busca + conta),
 * sem os filtros de tipo/situação — igual ao Expo. A lista junta reais e projeções.
 */
export function buildTransactionsModel({ transactions, recorrencias = [], skips = [], filters, selectedMonth, today, sort = 'recentes' }) {
  const resolved = resolvePeriod({ period: filters.period, selectedMonth, dateRange: filters.dateRange, today });
  const inScope = (t) => matchesPeriod(t, resolved) && matchesSearch(t, filters.search);

  const realFiltered = filterTransactionsByConta(transactions.filter(inScope), filters.contaFilter);
  const projections = projectRecurrences(recorrencias, transactions, projectionMonthRange(resolved, today), skips).filter(inScope);

  const combined = filterTransactionsByConta([...realFiltered, ...projections], filters.contaFilter);
  const rows = sortTransactions(combined.filter((t) => matchesPills(t, filters)), sort);

  return {
    period: resolved,
    kpis: computeMonthFlowKpis(realFiltered),
    series: buildFlowSeries(realFiltered, resolved),
    rows,
    exportRows: rows.filter((t) => !isProjecao(t)),
  };
}

function daysBetween(startKey, endKey) {
  return Math.round((dayKeyToDate(endKey) - dayKeyToDate(startKey)) / 86_400_000) + 1;
}

/**
 * Séries dos mini gráficos dos cards: saldo acumulado ao longo do período e
 * totais de entradas/saídas em faixas iguais do período.
 */
export function buildFlowSeries(list, resolved, { points = 30, bars = 8 } = {}) {
  const span = Math.max(1, daysBetween(resolved.start, resolved.end));
  const nPoints = Math.min(points, span);
  const nBars = Math.min(bars, span);
  const saldoDelta = new Array(nPoints).fill(0);
  const entradas = new Array(nBars).fill(0);
  const saidas = new Array(nBars).fill(0);

  for (const t of list) {
    const offset = daysBetween(resolved.start, toDayKey(parseTransactionDate(t))) - 1;
    if (offset < 0 || offset >= span) continue;
    const valor = normalizarValor(t.valor);
    const isEntrada = normalizarTipo(t.tipo) === 'entrada';
    saldoDelta[Math.floor((offset * nPoints) / span)] += isEntrada ? valor : -valor;
    (isEntrada ? entradas : saidas)[Math.floor((offset * nBars) / span)] += valor;
  }

  let acc = 0;
  const saldo = saldoDelta.map((d) => (acc += d));
  return { saldo, entradas, saidas };
}

export function paginate(list, page, pageSize) {
  const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  return { items: list.slice((current - 1) * pageSize, current * pageSize), page: current, totalPages };
}

/** Páginas visíveis na paginação: 1 … 4 5 6 … 12 */
export function pageWindow(page, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const out = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('…');
    out.push(p);
  });
  return out;
}

export function monthsAhead(selectedMonth, today) {
  return (selectedMonth.year - today.getFullYear()) * 12 + (selectedMonth.month - (today.getMonth() + 1));
}

/** Linhas da planilha — mesmo layout de `formatTransactionsForXlsx` do Expo. */
export function formatTransactionsForXlsx(transactions) {
  return transactions.map((t) => {
    let dataFormatada = '';
    if (t.data) dataFormatada = formatDayKeyBr(String(t.data).slice(0, 10));
    else if (t.criado_em) dataFormatada = new Date(t.criado_em).toLocaleDateString('pt-BR');

    const valorFormatado = (Number(t.valor) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const tipoFormatado = String(t.tipo || '').toLowerCase() === 'entrada' ? 'RECEITA' : 'DESPESA';

    const statusRaw = String(t.status || '').toLowerCase();
    const statusFormatado =
      statusRaw === 'recebido'
        ? 'Recebido'
        : statusRaw === 'pago'
          ? 'Pago'
          : statusRaw === 'a_receber'
            ? 'A Receber'
            : statusRaw === 'a_pagar'
              ? 'A Pagar'
              : t.status
                ? String(t.status)
                : '';

    return {
      Descrição: t.classificacao || '',
      Valor: valorFormatado,
      Tipo: tipoFormatado,
      Data: dataFormatada,
      Status: statusFormatado,
      Observações: t.obs || '-',
    };
  });
}

export const XLSX_COLUMN_WIDTHS = [30, 15, 12, 12, 15, 40].map((wch) => ({ wch }));
