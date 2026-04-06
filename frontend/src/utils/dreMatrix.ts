import type { Category, DreMatrixCell } from '../services/categoryService';

export type DrePeriod = { kind: 'month'; month: number } | { kind: 'annual' };

export type DreHighlight = 'none' | 'rose' | 'amber' | 'emerald';

export interface DreRowViewModel {
  categorias_id: number;
  nome: string;
  planejado: number;
  realizado: number;
  atingimentoLabel: string;
  pctReceitaLabel: string;
  highlightRealizado: DreHighlight;
  highlightAtingimento: DreHighlight;
}

export interface DreSubtotalViewModel {
  planejado: number;
  realizado: number;
  atingimentoLabel: string;
  pctReceitaLabel: string;
}

export interface DreMatrixViewModel {
  periodLabel: string;
  isEmpty: boolean;
  receitas: { rows: DreRowViewModel[]; subtotal: DreSubtotalViewModel };
  despesas: { rows: DreRowViewModel[]; subtotal: DreSubtotalViewModel };
  resultadoRealizado: number;
}

export function isEntradaTipo(tipo: string): boolean {
  return tipo === 'entrada';
}

export function isSaidaTipo(tipo: string): boolean {
  return tipo === 'saida' || tipo === 'saída';
}

export function formatDreCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** Atingimento: % com 1 decimal pt-BR ou null → "—" */
export function formatAtingimento(pct: number | null): string {
  if (pct === null) return '—';
  return `${pct.toFixed(1).replace('.', ',')} %`;
}

/** % Receita: 1 decimal pt-BR ou null → "—" */
export function formatPctReceita(pct: number | null): string {
  if (pct === null) return '—';
  return `${pct.toFixed(1).replace('.', ',')} %`;
}

export function computeAtingimentoPercent(planejado: number, realizado: number): number | null {
  if (planejado <= 0) return null;
  return (realizado / planejado) * 100;
}

export function computePctReceitaLine(
  realizadoLinha: number,
  totalReceitaRealizada: number
): number | null {
  if (totalReceitaRealizada <= 0) return null;
  return (realizadoLinha / totalReceitaRealizada) * 100;
}

export function getPlanejadoCell(cell: DreMatrixCell | undefined): number {
  if (!cell || cell.valor_orcado === null || cell.valor_orcado === undefined) return 0;
  return Number(cell.valor_orcado);
}

export function getRealizadoCell(cell: DreMatrixCell | undefined, tipo: string): number {
  if (!cell) return 0;
  return isEntradaTipo(tipo) ? Number(cell.valor_recebido || 0) : Number(cell.valor_gasto || 0);
}

export function aggregateCategoryPeriod(
  categoriasId: number,
  tipo: string,
  period: DrePeriod,
  cells: DreMatrixCell[]
): { planejado: number; realizado: number } {
  const months = period.kind === 'month' ? [period.month] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const byMonth = new Map<number, DreMatrixCell>();
  for (const c of cells) {
    if (c.categorias_id === categoriasId) byMonth.set(c.month, c);
  }
  let planejado = 0;
  let realizado = 0;
  for (const m of months) {
    const cell = byMonth.get(m);
    planejado += getPlanejadoCell(cell);
    realizado += getRealizadoCell(cell, tipo);
  }
  return { planejado, realizado };
}

/** UX §3.3: pelo menos um mês com planejado > 0 ou realizado ≠ 0 */
export function isCategoryEligibleInYear(
  categoriasId: number,
  tipo: string,
  cells: DreMatrixCell[]
): boolean {
  const catCells = cells.filter((c) => c.categorias_id === categoriasId);
  for (const c of catCells) {
    const plan = c.valor_orcado != null ? Number(c.valor_orcado) : 0;
    const real = getRealizadoCell(c, tipo);
    if (plan > 0 || real !== 0) return true;
  }
  return false;
}

export function rowHighlights(
  tipo: 'entrada' | 'saida',
  planejado: number,
  realizado: number
): { highlightRealizado: DreHighlight; highlightAtingimento: DreHighlight } {
  const none: DreHighlight = 'none';
  if (tipo === 'saida') {
    if (planejado > 0 && realizado > planejado) {
      return { highlightRealizado: 'rose', highlightAtingimento: 'rose' };
    }
    return { highlightRealizado: none, highlightAtingimento: none };
  }
  if (planejado > 0) {
    if (realizado < planejado) {
      return { highlightRealizado: 'amber', highlightAtingimento: 'amber' };
    }
    if (realizado > planejado) {
      return { highlightRealizado: 'emerald', highlightAtingimento: 'emerald' };
    }
  }
  return { highlightRealizado: none, highlightAtingimento: none };
}

function buildRow(
  cat: Category,
  period: DrePeriod,
  cells: DreMatrixCell[],
  totalReceitaRealizada: number
): DreRowViewModel {
  const tipo = isEntradaTipo(cat.tipo) ? 'entrada' : 'saida';
  const { planejado, realizado } = aggregateCategoryPeriod(cat.id, cat.tipo, period, cells);
  const atingPct = computeAtingimentoPercent(planejado, realizado);
  const pctRec =
    tipo === 'entrada'
      ? computePctReceitaLine(realizado, totalReceitaRealizada)
      : computePctReceitaLine(realizado, totalReceitaRealizada);
  const { highlightRealizado, highlightAtingimento } = rowHighlights(tipo, planejado, realizado);
  return {
    categorias_id: cat.id,
    nome: cat.nome,
    planejado,
    realizado,
    atingimentoLabel: formatAtingimento(atingPct),
    pctReceitaLabel: formatPctReceita(pctRec),
    highlightRealizado,
    highlightAtingimento
  };
}

function sumRows(rows: DreRowViewModel[]): { planejado: number; realizado: number } {
  return rows.reduce(
    (acc, r) => ({ planejado: acc.planejado + r.planejado, realizado: acc.realizado + r.realizado }),
    { planejado: 0, realizado: 0 }
  );
}

function periodTitle(period: DrePeriod, year: number, monthNames: string[]): string {
  if (period.kind === 'annual') return `Total anual · ${year}`;
  return `${monthNames[period.month - 1]} ${year}`;
}

/**
 * Agrega categorias elegíveis, subtotais e resultado (realizado) para o período.
 */
export function buildDreMatrixViewModel(
  categories: Category[],
  cells: DreMatrixCell[],
  year: number,
  period: DrePeriod,
  monthNames: string[]
): DreMatrixViewModel {
  const eligible = categories.filter(
    (c) =>
      (isEntradaTipo(c.tipo) || isSaidaTipo(c.tipo)) &&
      isCategoryEligibleInYear(c.id, c.tipo, cells)
  );

  const entradas = eligible.filter((c) => isEntradaTipo(c.tipo));
  const saidas = eligible.filter((c) => isSaidaTipo(c.tipo));

  const totalReceitaRealizada = entradas.reduce((acc, cat) => {
    const { realizado } = aggregateCategoryPeriod(cat.id, cat.tipo, period, cells);
    return acc + realizado;
  }, 0);

  const receitaRows = entradas
    .map((cat) => buildRow(cat, period, cells, totalReceitaRealizada))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

  const despesaRows = saidas
    .map((cat) => buildRow(cat, period, cells, totalReceitaRealizada))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

  const sr = sumRows(receitaRows);
  const sd = sumRows(despesaRows);

  const subReceitas: DreSubtotalViewModel = {
    planejado: sr.planejado,
    realizado: sr.realizado,
    atingimentoLabel: formatAtingimento(computeAtingimentoPercent(sr.planejado, sr.realizado)),
    pctReceitaLabel: formatPctReceita(
      totalReceitaRealizada > 0 ? 100 : null
    )
  };

  const subDespesas: DreSubtotalViewModel = {
    planejado: sd.planejado,
    realizado: sd.realizado,
    atingimentoLabel: formatAtingimento(computeAtingimentoPercent(sd.planejado, sd.realizado)),
    pctReceitaLabel: formatPctReceita(
      computePctReceitaLine(sd.realizado, totalReceitaRealizada)
    )
  };

  const resultadoRealizado = sr.realizado - sd.realizado;
  const isEmpty = receitaRows.length === 0 && despesaRows.length === 0;

  return {
    periodLabel: periodTitle(period, year, monthNames),
    isEmpty,
    receitas: { rows: receitaRows, subtotal: subReceitas },
    despesas: { rows: despesaRows, subtotal: subDespesas },
    resultadoRealizado
  };
}
