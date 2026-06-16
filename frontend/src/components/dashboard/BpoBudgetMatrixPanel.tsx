import { useCallback, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Download, Search } from 'lucide-react';
import FetchErrorBanner from '../FetchErrorBanner';
import LoadingOverlay from '../LoadingOverlay';
import { useDreMatrix } from '../../hooks/useDreMatrix';
import {
  bpoMonthHeaderLabel,
  aggregateBpoMonths,
  buildBpoMatrixViewModel,
  exportBpoMatrixCsv,
  filterBpoRowsBySearch,
  formatBpoMetricValue,
  type BpoColumnKey,
  type BpoMatrixRow,
  type BpoMonthMetrics,
  type BpoPendingTxn
} from '../../utils/bpoMatrix';

const DEFAULT_COLUMNS: BpoColumnKey[] = ['orcado', 'realizado', 'variacao'];

const COLUMN_LABELS: Record<BpoColumnKey, string> = {
  orcado: 'Orçado',
  realizado: 'Realizado',
  variacao: 'Variação'
};

export interface BpoBudgetMatrixPanelProps {
  userId: string;
  year: number;
  transactions: BpoPendingTxn[];
}

const STICKY_CATEGORY_CLASS =
  'sticky left-0 z-[3] min-w-[180px] border-r border-slate-200/80 dark:border-slate-700/60 shadow-[4px_0_8px_-4px_rgba(15,23,42,0.12)] dark:shadow-[4px_0_8px_-4px_rgba(0,0,0,0.45)]';

function toggleColumn(columns: BpoColumnKey[], key: BpoColumnKey): BpoColumnKey[] {
  if (columns.includes(key)) {
    const next = columns.filter((c) => c !== key);
    return next.length === 0 ? columns : next;
  }
  return [...columns, key];
}

function MetricCells({
  metrics,
  visibleColumns,
  borderLeft
}: {
  metrics: BpoMonthMetrics;
  visibleColumns: BpoColumnKey[];
  borderLeft?: boolean;
}) {
  return (
    <>
      {visibleColumns.map((col, idx) => (
        <td
          key={col}
          className={`py-2 px-2 text-right tabular-nums text-xs text-slate-700 dark:text-slate-200 min-w-[72px] ${
            borderLeft && idx === 0 ? 'border-l border-slate-200/60 dark:border-slate-700/50' : ''
          }`}
        >
          {formatBpoMetricValue(col, metrics)}
        </td>
      ))}
    </>
  );
}

function CategoryRows({
  rows,
  visibleColumns,
  condensed
}: {
  rows: BpoMatrixRow[];
  visibleColumns: BpoColumnKey[];
  condensed: boolean;
}) {
  if (condensed) return null;

  return (
    <>
      {rows.map((row) => (
        <tr
          key={row.categoriasId}
          className="border-b border-slate-200/40 dark:border-slate-800/40 hover:bg-slate-50/60 dark:hover:bg-slate-900/20"
        >
          <th
            scope="row"
            className={`py-2 px-3 text-left text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-950 ${STICKY_CATEGORY_CLASS}`}
          >
            {row.nome}
          </th>
          {row.byMonth.map((month, mi) => (
            <MetricCells key={mi} metrics={month} visibleColumns={visibleColumns} borderLeft />
          ))}
          <MetricCells metrics={row.annual} visibleColumns={visibleColumns} borderLeft />
        </tr>
      ))}
    </>
  );
}

export default function BpoBudgetMatrixPanel({
  userId,
  year,
  transactions
}: BpoBudgetMatrixPanelProps) {
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [visibleColumns, setVisibleColumns] = useState<BpoColumnKey[]>(DEFAULT_COLUMNS);
  const [condensed, setCondensed] = useState(false);
  const [openReceitas, setOpenReceitas] = useState(true);
  const [openDespesas, setOpenDespesas] = useState(true);

  const { categories, cells, loading, error, refetch } = useDreMatrix(userId, year);

  const model = useMemo(
    () => buildBpoMatrixViewModel(categories, cells, transactions, year),
    [categories, cells, transactions, year]
  );

  const receitas = useMemo(
    () => filterBpoRowsBySearch(model.receitas, appliedSearch),
    [model.receitas, appliedSearch]
  );
  const despesas = useMemo(
    () => filterBpoRowsBySearch(model.despesas, appliedSearch),
    [model.despesas, appliedSearch]
  );

  const emptyMonth = (): BpoMonthMetrics => ({ orcado: null, previsto: 0, realizado: 0, variacao: null });

  const receitaSubtotal = useMemo(() => {
    if (receitas.length === 0) return Array.from({ length: 12 }, emptyMonth);
    return receitas.reduce(
      (acc, row) =>
        acc.map((m, idx) => ({
          orcado:
            row.byMonth[idx].orcado !== null || m.orcado !== null
              ? (m.orcado ?? 0) + (row.byMonth[idx].orcado ?? 0)
              : null,
          previsto: m.previsto + row.byMonth[idx].previsto,
          realizado: m.realizado + row.byMonth[idx].realizado,
          variacao: null as number | null
        })),
      Array.from({ length: 12 }, () => ({ orcado: null, previsto: 0, realizado: 0, variacao: null }))
    ).map((m) => ({
      ...m,
      variacao: m.orcado !== null ? m.realizado - m.orcado : null
    }));
  }, [receitas, model.resultado]);

  const despesaSubtotal = useMemo(() => {
    if (despesas.length === 0) {
      return Array.from({ length: 12 }, () => ({ orcado: null, previsto: 0, realizado: 0, variacao: null }));
    }
    return despesas.reduce(
      (acc, row) =>
        acc.map((m, idx) => ({
          orcado:
            row.byMonth[idx].orcado !== null || m.orcado !== null
              ? (m.orcado ?? 0) + (row.byMonth[idx].orcado ?? 0)
              : null,
          previsto: m.previsto + row.byMonth[idx].previsto,
          realizado: m.realizado + row.byMonth[idx].realizado,
          variacao: null as number | null
        })),
      Array.from({ length: 12 }, () => ({ orcado: null, previsto: 0, realizado: 0, variacao: null }))
    ).map((m) => ({
      ...m,
      variacao: m.orcado !== null ? m.realizado - m.orcado : null
    }));
  }, [despesas]);

  const resultadoFiltrado = useMemo(
    () =>
      receitaSubtotal.map((r, idx) => {
        const d = despesaSubtotal[idx];
        const orcado =
          r.orcado !== null || d.orcado !== null ? (r.orcado ?? 0) - (d.orcado ?? 0) : null;
        return {
          orcado,
          previsto: r.previsto - d.previsto,
          realizado: r.realizado - d.realizado,
          variacao: orcado !== null ? r.realizado - d.realizado - orcado : null
        };
      }),
    [receitaSubtotal, despesaSubtotal]
  );

  const resultadoAnual = useMemo(
    () => aggregateBpoMonths(resultadoFiltrado),
    [resultadoFiltrado]
  );

  const handleApplySearch = useCallback(() => {
    setAppliedSearch(search.trim());
  }, [search]);

  const handleExport = useCallback(() => {
    const csv = exportBpoMatrixCsv(
      { receitas, despesas, resultado: resultadoFiltrado },
      year,
      visibleColumns
    );
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bpo-matriz-${year}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [receitas, despesas, resultadoFiltrado, year, visibleColumns]);

  const isEmpty = receitas.length === 0 && despesas.length === 0;
  const initialLoad = loading && categories.length === 0 && cells.length === 0;
  const metricsPerMonth = visibleColumns.length;
  const colSpan = 1 + metricsPerMonth * 13;

  return (
    <div className="space-y-4">
      {error ? <FetchErrorBanner message={error} onRetry={() => void refetch()} /> : null}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs text-slate-500 dark:text-slate-400" htmlFor="bpo-matrix-search">
            Buscar
          </label>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden />
              <input
                id="bpo-matrix-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleApplySearch();
                }}
                placeholder="Categoria..."
                className="planner-input py-2 pl-8 text-sm w-48"
              />
            </div>
            <button type="button" className="planner-button-secondary px-3 py-2 text-sm" onClick={handleApplySearch}>
              Aplicar
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">Colunas</span>
          <div className="inline-flex flex-wrap gap-1 rounded-lg border border-slate-200/90 dark:border-slate-700/80 p-0.5 bg-slate-100/90 dark:bg-slate-900/50">
            {DEFAULT_COLUMNS.map((col) => (
              <button
                key={col}
                type="button"
                aria-pressed={visibleColumns.includes(col)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  visibleColumns.includes(col)
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
                onClick={() => setVisibleColumns((prev) => toggleColumn(prev, col))}
              >
                {COLUMN_LABELS[col]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="planner-button-secondary px-3 py-2 text-sm"
          onClick={() => setCondensed((v) => !v)}
          aria-pressed={condensed}
        >
          {condensed ? 'Expandir' : 'Condensar'}
        </button>
        <button
          type="button"
          className="planner-button-secondary px-3 py-2 text-sm inline-flex items-center gap-1.5"
          onClick={handleExport}
          disabled={isEmpty}
        >
          <Download className="w-4 h-4" aria-hidden />
          Exportar
        </button>
      </div>

      {initialLoad ? (
        <div className="relative min-h-[240px]">
          <LoadingOverlay message="Carregando matriz BPO..." />
        </div>
      ) : null}

      {!initialLoad && !error && isEmpty ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Sem dados para {year}. Defina orçamentos ou registe movimentos para ver a matriz.
        </p>
      ) : null}

      {!initialLoad && !isEmpty ? (
        <div className="relative overflow-x-auto rounded-lg border border-slate-200/80 dark:border-slate-700/60">
          {loading ? (
            <div
              className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 dark:bg-slate-950/70"
              aria-busy="true"
            >
              <span className="text-sm text-slate-600 dark:text-slate-300">A atualizar…</span>
            </div>
          ) : null}
          <table className="w-full text-sm border-separate border-spacing-0 min-w-[960px]">
            <caption className="sr-only">
              Matriz orçado, previsto, realizado e variação por categoria e mês em {year}
            </caption>
            <thead>
              <tr className="bg-slate-50/90 dark:bg-slate-900/50">
                <th
                  rowSpan={2}
                  scope="col"
                  className={`py-2 px-3 text-left text-xs font-semibold bg-slate-50 dark:bg-slate-900 ${STICKY_CATEGORY_CLASS}`}
                >
                  Grupo / Categoria
                </th>
                {Array.from({ length: 12 }, (_, mi) => (
                  <th
                    key={mi}
                    colSpan={metricsPerMonth}
                    scope="colgroup"
                    className="py-2 px-1 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 border-l border-slate-200/60 dark:border-slate-700/50"
                  >
                    {bpoMonthHeaderLabel(mi, year)}
                  </th>
                ))}
                <th
                  colSpan={metricsPerMonth}
                  scope="colgroup"
                  className="py-2 px-1 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 border-l border-slate-200/60 dark:border-slate-700/50"
                >
                  Total
                </th>
              </tr>
              <tr className="bg-slate-50/70 dark:bg-slate-900/40">
                {Array.from({ length: 13 }, (_, block) =>
                  visibleColumns.map((col) => (
                    <th
                      key={`${block}-${col}`}
                      scope="col"
                      className={`py-1 px-1 text-[10px] font-medium text-slate-500 dark:text-slate-400 text-right ${
                        col === visibleColumns[0] ? 'border-l border-slate-200/60 dark:border-slate-700/50' : ''
                      }`}
                    >
                      {COLUMN_LABELS[col]}
                    </th>
                  ))
                )}
              </tr>
            </thead>
            <tbody>
              <tr className="bg-emerald-50/70 dark:bg-emerald-950/20">
                <th colSpan={colSpan} scope="colgroup" className="p-0">
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 py-2 px-3 text-left text-xs font-semibold text-emerald-800 dark:text-emerald-200"
                    onClick={() => setOpenReceitas((v) => !v)}
                    aria-expanded={openReceitas}
                  >
                    {openReceitas ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    (+) Receitas
                  </button>
                </th>
              </tr>
              {openReceitas ? (
                <>
                  <CategoryRows rows={receitas} visibleColumns={visibleColumns} condensed={condensed} />
                  <tr className="font-semibold bg-emerald-50/40 dark:bg-emerald-950/10 border-t border-slate-200/60">
                    <th scope="row" className={`py-2 px-3 text-left text-xs bg-emerald-50 dark:bg-emerald-950/30 ${STICKY_CATEGORY_CLASS}`}>
                      Subtotal receitas
                    </th>
                    {receitaSubtotal.map((m, mi) => (
                      <MetricCells key={mi} metrics={m} visibleColumns={visibleColumns} borderLeft />
                    ))}
                    <MetricCells
                      metrics={aggregateBpoMonths(receitaSubtotal)}
                      visibleColumns={visibleColumns}
                      borderLeft
                    />
                  </tr>
                </>
              ) : null}

              <tr className="bg-slate-100/80 dark:bg-slate-800/40">
                <th colSpan={colSpan} scope="colgroup" className="p-0">
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 py-2 px-3 text-left text-xs font-semibold text-slate-800 dark:text-slate-100"
                    onClick={() => setOpenDespesas((v) => !v)}
                    aria-expanded={openDespesas}
                  >
                    {openDespesas ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    (−) Despesas
                  </button>
                </th>
              </tr>
              {openDespesas ? (
                <>
                  <CategoryRows rows={despesas} visibleColumns={visibleColumns} condensed={condensed} />
                  <tr className="font-semibold bg-slate-100/50 dark:bg-slate-800/30 border-t border-slate-200/60">
                    <th scope="row" className={`py-2 px-3 text-left text-xs bg-slate-100 dark:bg-slate-800/50 ${STICKY_CATEGORY_CLASS}`}>
                      Subtotal despesas
                    </th>
                    {despesaSubtotal.map((m, mi) => (
                      <MetricCells key={mi} metrics={m} visibleColumns={visibleColumns} borderLeft />
                    ))}
                    <MetricCells
                      metrics={aggregateBpoMonths(despesaSubtotal)}
                      visibleColumns={visibleColumns}
                      borderLeft
                    />
                  </tr>
                </>
              ) : null}

              <tr className="font-semibold bg-sky-50/80 dark:bg-sky-950/20 border-t-2 border-sky-200/80 dark:border-sky-800/50">
                <th scope="row" className={`py-3 px-3 text-left text-sm text-sky-900 dark:text-sky-100 bg-sky-50 dark:bg-sky-950/40 ${STICKY_CATEGORY_CLASS}`}>
                  (=) Resultado
                </th>
                {resultadoFiltrado.map((m, mi) => (
                  <MetricCells key={mi} metrics={m} visibleColumns={visibleColumns} borderLeft />
                ))}
                <MetricCells metrics={resultadoAnual} visibleColumns={visibleColumns} borderLeft />
              </tr>
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
