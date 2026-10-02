/**
 * Visão BPO — porta de `frontend/lib/bpoMatrix.ts` e do painel `BpoBudgetMatrixPanel`.
 * Variação é diferença em reais (realizado − orçado), nunca percentual. Sem orçamento, orçado e
 * variação ficam `null` e a tela mostra "—". Realizado zero continua "R$ 0,00".
 * "Condensar" (no painel antigo) esconde as linhas de categoria e os subtotais; ficam os grupos
 * e o resultado.
 */

export const BPO_YEAR_MIN = 2020;

export const BPO_COLUMNS = ['orcado', 'realizado', 'variacao'];

export const BPO_COLUMN_LABELS = {
  orcado: 'Orçado',
  realizado: 'Realizado',
  variacao: 'Variação',
};

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const EMPTY_MONTH = () => ({ orcado: null, previsto: 0, realizado: 0, variacao: null });

const isEntrada = (tipo) => tipo === 'entrada';
const isSaida = (tipo) => tipo === 'saida' || tipo === 'saída';

export function formatBpoCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function bpoMonthHeaderLabel(monthIndex, year) {
  return `${MONTH_LABELS[monthIndex]}/${String(year).slice(-2)}`;
}

export function computeBpoVariacao(orcado, realizado) {
  if (orcado === null || orcado === undefined) return null;
  return realizado - orcado;
}

export function aggregateBpoMonths(months) {
  let orcadoSum = 0;
  let hasOrcado = false;
  let previsto = 0;
  let realizado = 0;
  for (const m of months) {
    if (m.orcado !== null && m.orcado !== undefined) {
      hasOrcado = true;
      orcadoSum += m.orcado;
    }
    previsto += m.previsto || 0;
    realizado += m.realizado || 0;
  }
  return {
    orcado: hasOrcado ? orcadoSum : null,
    previsto,
    realizado,
    variacao: hasOrcado ? computeBpoVariacao(orcadoSum, realizado) : null,
  };
}

function realizadoOf(cell, tipo) {
  if (!cell) return 0;
  return isEntrada(tipo) ? Number(cell.valor_recebido || 0) : Number(cell.valor_gasto || 0);
}

function isRowEligible(months) {
  return months.some((m) => m.realizado !== 0 || (m.orcado !== null && m.orcado > 0));
}

function buildRow(cat, cells) {
  const byMonth = [];
  const cellByMonth = new Map();
  for (const cell of cells) {
    if (Number(cell.categorias_id) === Number(cat.id)) cellByMonth.set(Number(cell.month), cell);
  }
  for (let month = 1; month <= 12; month += 1) {
    const cell = cellByMonth.get(month);
    const raw = cell?.valor_orcado;
    const orcado = raw === null || raw === undefined ? null : Number(raw);
    const realizado = realizadoOf(cell, cat.tipo);
    byMonth.push({
      orcado: Number.isNaN(orcado) ? null : orcado,
      previsto: 0,
      realizado,
      variacao: computeBpoVariacao(Number.isNaN(orcado) ? null : orcado, realizado),
    });
  }
  return {
    categoriasId: Number(cat.id),
    nome: cat.nome,
    tipo: isEntrada(cat.tipo) ? 'entrada' : 'saida',
    byMonth,
    annual: aggregateBpoMonths(byMonth),
  };
}

/**
 * Mesma montagem do app atual. `pendingTxns` alimentava a coluna "previsto", que o painel
 * nunca exibe — por isso não entra no cálculo visível (orçado, realizado, variação).
 */
export function buildBpoMatrixViewModel(categories, cells) {
  const rows = (categories || [])
    .filter((c) => isEntrada(c.tipo) || isSaida(c.tipo))
    .map((c) => buildRow(c, cells || []))
    .filter((r) => isRowEligible(r.byMonth))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

  return {
    receitas: rows.filter((r) => r.tipo === 'entrada'),
    despesas: rows.filter((r) => r.tipo === 'saida'),
  };
}

/**
 * Filtro de categoria. No painel antigo era um campo de texto + «Aplicar»; aqui é uma lista
 * com as categorias da própria matriz, então o filtro é pelo id (vazio = todas).
 */
export function filterBpoRowsByCategory(rows, categoryId) {
  const id = Number(categoryId);
  if (!categoryId || !Number.isFinite(id)) return rows;
  return rows.filter((r) => r.categoriasId === id);
}

/** Subtotal de um grupo depois do filtro — mesma conta do painel (`sumSection`). */
export function sumBpoSection(rows) {
  if (!rows.length) return Array.from({ length: 12 }, EMPTY_MONTH);
  const totals = Array.from({ length: 12 }, EMPTY_MONTH);
  for (const row of rows) {
    row.byMonth.forEach((m, idx) => {
      const t = totals[idx];
      if (m.orcado !== null || t.orcado !== null) t.orcado = (t.orcado ?? 0) + (m.orcado ?? 0);
      t.previsto += m.previsto;
      t.realizado += m.realizado;
    });
  }
  return totals.map((t) => ({
    ...t,
    variacao: t.orcado !== null ? computeBpoVariacao(t.orcado, t.realizado) : null,
  }));
}

/** Resultado do mês = receitas − despesas. Orçado só existe se algum dos lados tiver orçamento. */
export function subtractBpoSections(receitas, despesas) {
  return receitas.map((left, idx) => {
    const right = despesas[idx];
    const orcado =
      left.orcado !== null || right.orcado !== null ? (left.orcado ?? 0) - (right.orcado ?? 0) : null;
    const realizado = left.realizado - right.realizado;
    return {
      orcado,
      previsto: left.previsto - right.previsto,
      realizado,
      variacao: orcado !== null ? computeBpoVariacao(orcado, realizado) : null,
    };
  });
}

export function buildBpoTable(model, categoryId) {
  const receitas = filterBpoRowsByCategory(model.receitas, categoryId);
  const despesas = filterBpoRowsByCategory(model.despesas, categoryId);
  const receitaSubtotal = sumBpoSection(receitas);
  const despesaSubtotal = sumBpoSection(despesas);
  const resultado = subtractBpoSections(receitaSubtotal, despesaSubtotal);
  return {
    receitas,
    despesas,
    receitaSubtotal,
    despesaSubtotal,
    receitaAnual: aggregateBpoMonths(receitaSubtotal),
    despesaAnual: aggregateBpoMonths(despesaSubtotal),
    resultado,
    resultadoAnual: aggregateBpoMonths(resultado),
    isEmpty: receitas.length === 0 && despesas.length === 0,
  };
}

/**
 * Séries do topo, tiradas dos subtotais da matriz (sem o filtro de categoria):
 * receitas e despesas = realizado de cada grupo; planejado = soma do orçado dos dois
 * (null quando nenhum dos dois tem orçamento naquele mês).
 */
export function buildBpoChartSeries(model, year) {
  const table = buildBpoTable(model, '');
  return table.receitaSubtotal.map((rec, i) => {
    const desp = table.despesaSubtotal[i];
    const hasOrcado = rec.orcado !== null || desp.orcado !== null;
    return {
      label: bpoMonthHeaderLabel(i, year),
      receitas: rec.realizado,
      despesas: desp.realizado,
      orcado: hasOrcado ? (rec.orcado ?? 0) + (desp.orcado ?? 0) : null,
      realizado: rec.realizado + desp.realizado,
    };
  });
}

export function formatBpoMetricValue(column, metrics) {
  if (column === 'orcado') return metrics.orcado === null || metrics.orcado === undefined ? '—' : formatBpoCurrency(metrics.orcado);
  if (column === 'realizado') return formatBpoCurrency(metrics.realizado);
  return metrics.variacao === null || metrics.variacao === undefined ? '—' : formatBpoCurrency(metrics.variacao);
}

/** Não deixa desligar a última coluna (igual ao `toggleColumn` do painel). A ordem canônica se mantém. */
export function toggleBpoColumn(visible, key) {
  const current = BPO_COLUMNS.filter((c) => visible.includes(c));
  if (current.includes(key)) {
    const next = current.filter((c) => c !== key);
    return next.length === 0 ? current : next;
  }
  return BPO_COLUMNS.filter((c) => current.includes(c) || c === key);
}

export function parseBpoYear(value, currentYear) {
  const year = Number(value);
  if (!Number.isInteger(year)) return currentYear;
  return Math.min(currentYear, Math.max(BPO_YEAR_MIN, year));
}

export function bpoYearOptions(currentYear) {
  const years = [];
  for (let y = currentYear; y >= BPO_YEAR_MIN; y -= 1) years.push(y);
  return years;
}
