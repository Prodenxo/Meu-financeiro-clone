/**
 * Modelo da Visão geral — todas as contas do `DashboardScreen.tsx` e
 * `screens/Dashboard/dashboardInsights.ts` do Expo, sem UI. Função pura:
 * recebe dados brutos + filtros e devolve o que a tela mostra.
 */
import {
  isInSelectedMonth,
  normalizarTipo,
  normalizarValor,
  parseTransactionDate,
  parsearData,
  toDayKey,
} from './normalize.js';
import { isRealizedLancamentoStatus } from './status.js';
import {
  buildContaNameMap,
  computeLegacyBalance,
  computeSaldosByConta,
  describeBalance,
  filterTransactionsByConta,
  resolveDashboardBalance,
} from './contas.js';
import { formatBrl, formatDayMonth, formatPct } from './format.js';

function filterMonth(list, { year, month }) {
  return list.filter((t) => isInSelectedMonth(t, { year, month }));
}

function sumByTipo(list, tipo) {
  return list
    .filter((t) => normalizarTipo(t.tipo) === tipo)
    .reduce((s, t) => s + normalizarValor(t.valor), 0);
}

export function prevMonth({ year, month }) {
  const d = new Date(year, month - 2, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export function nextMonth({ year, month }) {
  const d = new Date(year, month, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

/** Insights (mesma lista/ordem/tons do Expo — `buildDashboardInsights`). */
export function buildDashboardInsights(transactions, selectedMonth) {
  const current = filterMonth(transactions, selectedMonth);
  const previous = filterMonth(transactions, prevMonth(selectedMonth));

  const income = sumByTipo(current, 'entrada');
  const expenses = sumByTipo(current, 'saida');
  const net = income - expenses;
  const prevExpenses = sumByTipo(previous, 'saida');
  const expenseDelta = prevExpenses > 0 ? ((expenses - prevExpenses) / prevExpenses) * 100 : null;

  const daysInMonth = new Date(selectedMonth.year, selectedMonth.month, 0).getDate();
  const avgDaily = daysInMonth > 0 ? expenses / daysInMonth : 0;

  const pending = current.filter((t) => normalizarTipo(t.tipo) === 'saida' && t.status === 'a_pagar');
  const pendingTotal = pending.reduce((s, t) => s + normalizarValor(t.valor), 0);

  const savingsRate = income > 0 ? (net / income) * 100 : 0;

  const insights = [
    {
      id: 'net',
      label: 'Resultado do mês',
      value: formatBrl(net),
      hint: net >= 0 ? 'Entrou mais do que saiu' : 'Gastou mais do que entrou',
      tone: net >= 0 ? 'positive' : 'negative',
      icon: 'analytics',
    },
    {
      id: 'savings',
      label: 'Quanto sobrou',
      value: `${Math.round(savingsRate)}%`,
      hint: 'Do total que entrou, quanto ficou',
      tone: savingsRate >= 20 ? 'positive' : savingsRate < 0 ? 'negative' : 'neutral',
      icon: 'wallet',
    },
    {
      id: 'avg',
      label: 'Média diária',
      value: formatBrl(avgDaily),
      hint: `Média de despesas nos ${daysInMonth} dias do mês`,
      tone: 'neutral',
      icon: 'time',
    },
    {
      id: 'pending',
      label: 'A pagar',
      value: formatBrl(pendingTotal),
      hint: `${pending.length} conta${pending.length === 1 ? '' : 's'} ainda não paga${pending.length === 1 ? '' : 's'}`,
      tone: pendingTotal > 0 ? 'negative' : 'positive',
      icon: 'alert',
    },
    {
      id: 'tx',
      label: 'Lançamentos',
      value: String(current.length),
      hint: 'Entradas e saídas registradas no mês',
      tone: 'accent',
      icon: 'receipt',
    },
  ];

  if (expenseDelta !== null) {
    insights.push({
      id: 'delta',
      label: 'Gastos vs mês passado',
      value: formatPct(expenseDelta),
      hint: `Mês passado: ${formatBrl(prevExpenses)}`,
      tone: expenseDelta <= 0 ? 'positive' : 'negative',
      icon: 'swap',
    });
  }

  return { insights, pending, pendingTotal, income, expenses, net };
}

/** Série do gráfico: 1 ponto por dia com movimentação realizada, saldo acumulado no mês. */
export function buildSaldoSeries(monthTransactions) {
  const sorted = [...monthTransactions].sort(
    (a, b) => parsearData(a.data, a.criado_em).getTime() - parsearData(b.data, b.criado_em).getTime(),
  );
  const daySaldo = new Map();
  let acumulado = 0;
  for (const t of sorted) {
    if (!isRealizedLancamentoStatus(t.status)) continue;
    const valor = normalizarValor(t.valor);
    acumulado += normalizarTipo(t.tipo) === 'entrada' ? valor : -valor;
    daySaldo.set(toDayKey(parsearData(t.data, t.criado_em)), acumulado);
  }
  return Array.from(daySaldo.keys())
    .sort()
    .map((dayKey) => ({ dayKey, label: formatDayMonth(dayKey), saldo: daySaldo.get(dayKey) }));
}

/** Últimas movimentações do mês (mais recentes primeiro). */
export function buildRecentActivity(transactions, selectedMonth, categoriasMap, limit = 6) {
  const current = filterMonth(transactions, selectedMonth);
  const sorted = [...current].sort(
    (a, b) => parsearData(b.data, b.criado_em).getTime() - parsearData(a.data, a.criado_em).getTime(),
  );
  return sorted.slice(0, limit).map((t) => {
    const tipo = normalizarTipo(t.tipo);
    const valor = normalizarValor(t.valor);
    let catKey = t.categoria ? String(t.categoria) : String(t.classificacao || '');
    if (!catKey || catKey === 'NaN') catKey = 'sem-categoria';
    const title = categoriasMap[catKey] || t.classificacao || 'Lançamento';
    const d = parsearData(t.data, t.criado_em);
    return {
      id: t.id,
      title: String(title),
      categoryName: String(title),
      dateKey: toDayKey(d),
      dateLabel: formatDayMonth(toDayKey(d)),
      valor,
      tipo,
      tipoRaw: t.tipo,
      status: t.status,
    };
  });
}

/** Entradas/saídas realizadas hoje (fuso local). */
export function buildTodayFlow(transactions, referenceDate = new Date()) {
  const dayKey = toDayKey(referenceDate);
  let income = 0;
  let expense = 0;
  const items = [];
  for (const t of transactions) {
    if (!isRealizedLancamentoStatus(t.status)) continue;
    if (toDayKey(parseTransactionDate(t)) !== dayKey) continue;
    const valor = normalizarValor(t.valor);
    const tipo = normalizarTipo(t.tipo);
    if (tipo === 'entrada') income += valor;
    else expense += valor;
    items.push({ id: t.id, title: t.classificacao || 'Lançamento', valor, tipo });
  }
  return { dayKey, income, expense, items };
}

/** Orçamentos do mês com % realizado (mesma regra de `categorizedBudgets`). */
export function buildBudgets(budgetSummary, categoriasMap, categoriasTipoMap) {
  return budgetSummary
    .filter((item) => item.valor_orcado !== null && Number(item.valor_orcado) > 0)
    .map((item) => {
      const orcado = normalizarValor(item.valor_orcado);
      const gasto = normalizarValor(item.valor_gasto);
      const recebido = normalizarValor(item.valor_recebido);
      const tipo = categoriasTipoMap[String(item.categorias_id)] || 'saida';
      const realizado = tipo === 'entrada' ? recebido : gasto;
      const percentual = orcado > 0 ? (realizado / orcado) * 100 : 0;
      return {
        categorias_id: item.categorias_id,
        nome: categoriasMap[String(item.categorias_id)] || 'Sem categoria',
        tipo,
        orcado,
        realizado,
        percentual,
      };
    });
}

/**
 * Faixa do orçamento — replica os "baldes" do Expo (`bucketedBudgets`).
 * Saída: ≤25 verde · ≤50 amarelo · ≤75 laranja · >75 vermelho.
 * Entrada: ≥75 verde · >50 amarelo · >25 laranja · ≤25 vermelho.
 */
export function budgetTone(item) {
  const p = item.percentual;
  if (item.tipo === 'entrada') {
    if (p >= 75) return 'success';
    if (p > 50) return 'warning';
    if (p > 25) return 'orange';
    return 'danger';
  }
  if (p <= 25) return 'success';
  if (p <= 50) return 'warning';
  if (p <= 75) return 'orange';
  return 'danger';
}

/** Despesas por categoria no mês, separadas em pagos / a pagar. */
export function buildExpensesByCategory(monthTransactions, categoriasMap) {
  const despesas = monthTransactions.filter((t) => normalizarTipo(t.tipo) === 'saida');
  const reduce = (list) => {
    const acc = {};
    for (const curr of list) {
      const valor = normalizarValor(curr.valor);
      let catKey = curr.categoria ? String(curr.categoria) : String(curr.classificacao || '');
      if (!catKey || catKey === 'NaN' || catKey === 'undefined' || catKey === 'null') {
        catKey = 'sem-categoria';
      }
      acc[catKey] = (acc[catKey] || 0) + valor;
    }
    return Object.entries(acc)
      .map(([key, total]) => ({
        key,
        nome: categoriasMap[key] || (key === 'sem-categoria' ? 'Sem categoria' : key),
        total,
      }))
      .sort((a, b) => b.total - a.total);
  };
  const pagos = reduce(despesas.filter((t) => t.status === 'pago'));
  const aPagar = reduce(despesas.filter((t) => t.status === 'a_pagar'));
  return {
    pagos,
    aPagar,
    totalPagos: pagos.reduce((s, c) => s + c.total, 0),
    totalAPagar: aPagar.reduce((s, c) => s + c.total, 0),
  };
}

/**
 * Monta tudo o que a Visão geral exibe.
 * @param {object} input
 * @param {Array} input.transactions  lançamentos normalizados (todos do usuário)
 * @param {Array} input.contas        contas_financeiras normalizadas
 * @param {Record<string,string>} input.categoriasMap     id → nome
 * @param {Record<string,'entrada'|'saida'>} input.categoriasTipoMap
 * @param {Array} input.budgetSummary  resumo de orçamento do mês
 * @param {{year:number,month:number}} input.selectedMonth
 * @param {'all'|'unassigned'|string} input.contaFilter
 * @param {Date} [input.today]
 */
export function buildDashboardModel({
  transactions,
  contas,
  categoriasMap,
  categoriasTipoMap,
  budgetSummary,
  selectedMonth,
  contaFilter,
  today = new Date(),
}) {
  const contasAtivas = contas.filter((c) => c.ativo);
  const contaNameById = buildContaNameMap(contasAtivas);
  const saldosByContaId = computeSaldosByConta(contasAtivas, transactions);
  const contasComSaldo = contasAtivas.map((c) => ({
    ...c,
    saldoAtual: saldosByContaId[c.id] ?? c.saldo_inicial,
  }));

  const scoped = filterTransactionsByConta(transactions, contaFilter);
  const legacyBalance = computeLegacyBalance(transactions);
  const balanceMeta = resolveDashboardBalance(contasAtivas, transactions, legacyBalance, contaFilter);
  const balanceCopy = describeBalance(contaFilter, balanceMeta.mode, contaNameById);

  const monthTransactions = scoped.filter((t) => isInSelectedMonth(t, selectedMonth));

  const realized = monthTransactions.filter((t) => isRealizedLancamentoStatus(t.status));
  const totalIncome = sumByTipo(realized, 'entrada');
  const totalExpenses = sumByTipo(realized, 'saida');
  const countIncome = realized.filter((t) => normalizarTipo(t.tipo) === 'entrada').length;
  const countExpenses = realized.filter((t) => normalizarTipo(t.tipo) === 'saida').length;

  const insightsBundle = buildDashboardInsights(scoped, selectedMonth);
  const pendingItems = insightsBundle.pending
    .map((t) => {
      let catKey = t.categoria ? String(t.categoria) : String(t.classificacao || '');
      if (!catKey || catKey === 'NaN') catKey = 'sem-categoria';
      const d = parsearData(t.data, t.criado_em);
      return {
        id: t.id,
        title: categoriasMap[catKey] || t.classificacao || 'Lançamento',
        valor: normalizarValor(t.valor),
        dateKey: toDayKey(d),
        dateLabel: formatDayMonth(toDayKey(d)),
      };
    })
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey));

  return {
    balance: {
      value: balanceMeta.value,
      mode: balanceMeta.mode,
      label: balanceCopy.label,
      hint: balanceCopy.hint,
    },
    totals: { income: totalIncome, expenses: totalExpenses, countIncome, countExpenses },
    contasComSaldo,
    contaNameById,
    saldoSeries: buildSaldoSeries(monthTransactions),
    insights: insightsBundle.insights,
    pending: { total: insightsBundle.pendingTotal, items: pendingItems },
    recent: buildRecentActivity(scoped, selectedMonth, categoriasMap, 6),
    todayFlow: buildTodayFlow(scoped, today),
    budgets: buildBudgets(budgetSummary, categoriasMap, categoriasTipoMap),
    expensesByCategory: buildExpensesByCategory(monthTransactions, categoriasMap),
    monthCount: monthTransactions.length,
  };
}
