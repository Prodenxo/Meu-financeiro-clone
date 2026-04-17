import { Fragment, useId, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { DreTableDensity } from '../../hooks/useDreTableDensity';
import type { DreHighlight, DreMatrixViewModel, DreRowViewModel, DreSubtotalViewModel } from '../../utils/dreMatrix';
import { formatDreCurrency } from '../../utils/dreMatrix';

function highlightClass(h: DreHighlight): string {
  if (h === 'rose') return 'text-rose-600 dark:text-rose-400 font-semibold';
  if (h === 'amber') return 'text-amber-600 dark:text-amber-400 font-semibold';
  if (h === 'emerald') return 'text-emerald-600 dark:text-emerald-400 font-semibold';
  return '';
}

/** P1 UX: resultado negativo distinguível do positivo (cor + título; não só cor). */
function resultadoRealizadoCellClass(value: number): string {
  const base = 'py-3 px-2 text-right tabular-nums text-lg font-semibold';
  if (value < 0) return `${base} text-rose-600 dark:text-rose-400`;
  return `${base} text-emerald-600 dark:text-emerald-400`;
}

function MetricCell({
  children,
  highlight,
  align = 'right',
  title,
  className = ''
}: {
  children: ReactNode;
  highlight: DreHighlight;
  align?: 'left' | 'right';
  title?: string;
  className?: string;
}) {
  const h = highlightClass(highlight);
  return (
    <td
      className={`py-2 px-2 min-w-[88px] ${align === 'right' ? 'text-right tabular-nums' : ''} ${h || 'text-slate-700 dark:text-slate-200'} ${className}`}
      title={title}
    >
      {children}
    </td>
  );
}

function rowByCategoryId(rows: DreRowViewModel[], id: number): DreRowViewModel | undefined {
  return rows.find((r) => r.categorias_id === id);
}

function emptyRow(id: number, nome: string): DreRowViewModel {
  return {
    categorias_id: id,
    nome,
    planejado: 0,
    realizado: 0,
    atingimentoLabel: '—',
    pctReceitaLabel: '—',
    highlightRealizado: 'none',
    highlightAtingimento: 'none'
  };
}

function SubtotalRow({
  sub,
  tooltips,
  showExtraMetrics
}: {
  sub: DreSubtotalViewModel;
  tooltips: { atingimento: string; pctReceita: string };
  showExtraMetrics: boolean;
}) {
  return (
    <tr className="border-t border-slate-200/80 dark:border-slate-700/60 font-semibold bg-slate-50/50 dark:bg-slate-900/30">
      <th scope="row" className="py-2 px-2 text-left text-slate-800 dark:text-slate-100">
        Subtotal
      </th>
      <MetricCell highlight={sub.highlightRealizado} className="min-w-[100px]">
        {formatDreCurrency(sub.realizado)}
      </MetricCell>
      {showExtraMetrics ? (
        <>
          <MetricCell highlight={sub.highlightAtingimento} title={tooltips.atingimento}>
            {sub.atingimentoLabel}
          </MetricCell>
          <MetricCell highlight="none" title={tooltips.pctReceita}>
            {sub.pctReceitaLabel}
          </MetricCell>
        </>
      ) : null}
    </tr>
  );
}

function SubtotalRowCompare({
  subs,
  tooltips,
  showExtraMetrics
}: {
  subs: DreSubtotalViewModel[];
  tooltips: { atingimento: string; pctReceita: string };
  showExtraMetrics: boolean;
}) {
  return (
    <tr className="border-t border-slate-200/80 dark:border-slate-700/60 font-semibold bg-slate-50/50 dark:bg-slate-900/30">
      <th
        scope="row"
        className="py-2 px-2 text-left text-slate-800 dark:text-slate-100 sticky left-0 bg-slate-50/90 dark:bg-slate-900/40 z-[1] shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)] dark:shadow-none"
      >
        Subtotal
      </th>
      {subs.flatMap((sub, mi) => [
        <MetricCell
          key={`${mi}-r`}
          highlight={sub.highlightRealizado}
          className={`min-w-[100px] ${mi > 0 ? 'border-l border-slate-200/50 dark:border-slate-800/40' : ''}`}
        >
          {formatDreCurrency(sub.realizado)}
        </MetricCell>,
        ...(showExtraMetrics
          ? [
              <MetricCell
                key={`${mi}-a`}
                highlight={sub.highlightAtingimento}
                title={tooltips.atingimento}
              >
                {sub.atingimentoLabel}
              </MetricCell>,
              <MetricCell key={`${mi}-pct`} highlight="none" title={tooltips.pctReceita}>
                {sub.pctReceitaLabel}
              </MetricCell>
            ]
          : [])
      ])}
    </tr>
  );
}

function DataRows({
  rows,
  tooltips,
  showExtraMetrics
}: {
  rows: DreRowViewModel[];
  tooltips: { atingimento: string; pctReceita: string };
  showExtraMetrics: boolean;
}) {
  return (
    <>
      {rows.map((row) => (
        <tr
          key={row.categorias_id}
          className="border-b border-slate-200/50 dark:border-slate-800/40 hover:bg-slate-100/40 dark:hover:bg-slate-900/20"
        >
          <th
            scope="row"
            className="py-2 px-2 text-left font-medium text-slate-800 dark:text-slate-100 sticky left-0 bg-white dark:bg-slate-950 z-[1] shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)] dark:shadow-none"
          >
            {row.nome}
          </th>
          <MetricCell highlight={row.highlightRealizado} className="min-w-[100px]">
            {formatDreCurrency(row.realizado)}
          </MetricCell>
          {showExtraMetrics ? (
            <>
              <MetricCell highlight={row.highlightAtingimento} title={tooltips.atingimento}>
                {row.atingimentoLabel}
              </MetricCell>
              <MetricCell highlight="none" title={tooltips.pctReceita}>
                {row.pctReceitaLabel}
              </MetricCell>
            </>
          ) : null}
        </tr>
      ))}
    </>
  );
}

function DataRowsCompare({
  models,
  section,
  tooltips,
  showExtraMetrics
}: {
  models: DreMatrixViewModel[];
  section: 'receitas' | 'despesas';
  tooltips: { atingimento: string; pctReceita: string };
  showExtraMetrics: boolean;
}) {
  const baseRows = models[0][section].rows;
  return (
    <>
      {baseRows.map((base) => (
        <tr
          key={base.categorias_id}
          className="border-b border-slate-200/50 dark:border-slate-800/40 hover:bg-slate-100/40 dark:hover:bg-slate-900/20"
        >
          <th
            scope="row"
            className="py-2 px-2 text-left font-medium text-slate-800 dark:text-slate-100 sticky left-0 bg-white dark:bg-slate-950 z-[1] shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)] dark:shadow-none"
          >
            {base.nome}
          </th>
          {models.flatMap((model, mi) => {
            const row =
              rowByCategoryId(model[section].rows, base.categorias_id) ?? emptyRow(base.categorias_id, base.nome);
            return [
              <MetricCell
                key={`${mi}-r`}
                highlight={row.highlightRealizado}
                className={`min-w-[100px] ${mi > 0 ? 'border-l border-slate-200/50 dark:border-slate-800/40' : ''}`}
              >
                {formatDreCurrency(row.realizado)}
              </MetricCell>,
              ...(showExtraMetrics
                ? [
                    <MetricCell
                      key={`${mi}-a`}
                      highlight={row.highlightAtingimento}
                      title={tooltips.atingimento}
                    >
                      {row.atingimentoLabel}
                    </MetricCell>,
                    <MetricCell key={`${mi}-pct`} highlight="none" title={tooltips.pctReceita}>
                      {row.pctReceitaLabel}
                    </MetricCell>
                  ]
                : [])
            ];
          })}
        </tr>
      ))}
    </>
  );
}

export interface DreMatrixTableProps {
  variant: 'single' | 'compare';
  models: DreMatrixViewModel[];
  tableTitle: string;
  tableDescriptionId?: string;
  tooltips: { atingimento: string; pctReceita: string };
  monthNames: string[];
  year: number;
  /** Índices 1–12 na ordem das colunas (modo compare). */
  compareMonths: number[];
  density: DreTableDensity;
}

export default function DreMatrixTable({
  variant,
  models,
  tableTitle,
  tableDescriptionId,
  tooltips,
  monthNames,
  year,
  compareMonths,
  density
}: DreMatrixTableProps) {
  const [openReceitas, setOpenReceitas] = useState(true);
  const [openDespesas, setOpenDespesas] = useState(true);
  const rid = useId().replace(/:/g, '');
  const did = useId().replace(/:/g, '');
  const bodyReceitas = `dre-data-rec-${rid}`;
  const bodyDespesas = `dre-data-desp-${did}`;

  const showExtraMetrics = density === 'completo';
  const n = models.length;
  /** Por mês: Realizado (+ Atingimento + % Receita no modo Completo). Sem coluna Planejado. */
  const metricsPerMonth = showExtraMetrics ? 3 : 1;
  const compareColSpan = 1 + metricsPerMonth * n;
  const minTableWidth =
    variant === 'compare'
      ? Math.max(400, 200 + n * (showExtraMetrics ? 280 : 120))
      : showExtraMetrics
        ? 440
        : 280;
  const singleColSpan = showExtraMetrics ? 4 : 2;

  const GroupHeader = ({
    label,
    open,
    onToggle,
    variant: v,
    controlsId,
    colSpan
  }: {
    label: string;
    open: boolean;
    onToggle: () => void;
    variant: 'receitas' | 'despesas';
    controlsId: string;
    colSpan: number;
  }) => {
    const bg =
      v === 'receitas'
        ? 'bg-emerald-50/80 dark:bg-emerald-950/30'
        : 'bg-slate-100/80 dark:bg-slate-800/50';
    return (
      <tr className={bg}>
        <th scope="colgroup" colSpan={colSpan} className="py-2 px-2 text-left">
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            aria-controls={controlsId}
            className="inline-flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100 w-full text-left min-h-[44px] lg:min-h-0"
          >
            {open ? <ChevronDown className="w-4 h-4 shrink-0" aria-hidden /> : <ChevronRight className="w-4 h-4 shrink-0" aria-hidden />}
            {label}
          </button>
        </th>
      </tr>
    );
  };

  if (variant === 'single') {
    const model = models[0];
    return (
      <div className="min-w-0 flex-1">
        <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-3">{tableTitle}</h3>
        <div className="overflow-x-auto rounded-lg border border-slate-200/70 dark:border-slate-800/60">
          <table className={`w-full text-sm ${showExtraMetrics ? 'min-w-[440px]' : 'min-w-[280px]'}`}>
            <thead>
              <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-200/70 dark:border-slate-800/60">
                <th scope="col" className="py-3 px-2 font-medium sticky left-0 bg-white dark:bg-slate-950 z-[2]">
                  Categoria
                </th>
                <th scope="col" className="py-3 px-2 font-medium text-right min-w-[100px]">
                  Realizado
                </th>
                {showExtraMetrics ? (
                  <>
                    <th
                      scope="col"
                      className="py-3 px-2 font-medium text-right min-w-[88px]"
                      title={tooltips.atingimento}
                    >
                      Atingimento
                    </th>
                    <th
                      scope="col"
                      className="py-3 px-2 font-medium text-right min-w-[88px]"
                      title={tooltips.pctReceita}
                    >
                      % Receita
                    </th>
                  </>
                ) : null}
              </tr>
            </thead>
            <tbody>
              <GroupHeader
                label="Receitas"
                open={openReceitas}
                onToggle={() => setOpenReceitas((x) => !x)}
                variant="receitas"
                controlsId={bodyReceitas}
                colSpan={singleColSpan}
              />
            </tbody>
            <tbody id={bodyReceitas} hidden={!openReceitas}>
              <DataRows rows={model.receitas.rows} tooltips={tooltips} showExtraMetrics={showExtraMetrics} />
            </tbody>
            <tbody>
              <SubtotalRow sub={model.receitas.subtotal} tooltips={tooltips} showExtraMetrics={showExtraMetrics} />
            </tbody>
            <tbody>
              <GroupHeader
                label="Despesas"
                open={openDespesas}
                onToggle={() => setOpenDespesas((x) => !x)}
                variant="despesas"
                controlsId={bodyDespesas}
                colSpan={singleColSpan}
              />
            </tbody>
            <tbody id={bodyDespesas} hidden={!openDespesas}>
              <DataRows rows={model.despesas.rows} tooltips={tooltips} showExtraMetrics={showExtraMetrics} />
            </tbody>
            <tbody>
              <SubtotalRow sub={model.despesas.subtotal} tooltips={tooltips} showExtraMetrics={showExtraMetrics} />
            </tbody>
            <tbody>
              <tr className="border-t-2 border-emerald-500/40 bg-slate-50/90 dark:bg-slate-900/50 font-semibold">
                <th scope="row" className="py-3 px-2 text-left text-slate-900 dark:text-white">
                  Resultado (realizado)
                </th>
                <td
                  className={resultadoRealizadoCellClass(model.resultadoRealizado)}
                  title={
                    model.resultadoRealizado < 0
                      ? 'Saldo negativo: despesas realizadas superam receitas neste período.'
                      : undefined
                  }
                >
                  {formatDreCurrency(model.resultadoRealizado)}
                </td>
                {showExtraMetrics ? (
                  <>
                    <td className="py-3 px-2 text-right tabular-nums text-slate-500 dark:text-slate-400">—</td>
                    <td className="py-3 px-2 text-right tabular-nums text-slate-500 dark:text-slate-400">—</td>
                  </>
                ) : null}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const monthHeaderLabels = compareMonths.map((m) => `${monthNames[m - 1]} ${year}`);

  return (
    <div className="min-w-0 flex-1">
      <h3
        className="text-base font-semibold text-slate-800 dark:text-white mb-3"
        id={tableDescriptionId}
      >
        {tableTitle}
      </h3>
      <div className="overflow-x-auto rounded-lg border border-slate-200/70 dark:border-slate-800/60">
        <table
          className="w-full text-sm"
          style={{ minWidth: minTableWidth }}
          aria-describedby={tableDescriptionId}
        >
          <thead>
            <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-200/70 dark:border-slate-800/60">
              <th
                scope="col"
                rowSpan={2}
                className="py-3 px-2 font-medium sticky left-0 bg-white dark:bg-slate-950 z-[2] align-bottom min-w-[200px]"
              >
                Categoria
              </th>
              {monthHeaderLabels.map((label, i) => (
                <th
                  key={i}
                  scope="colgroup"
                  colSpan={metricsPerMonth}
                  className={`py-3 px-2 font-medium text-center ${i > 0 ? 'border-l border-slate-200/70 dark:border-slate-800/60' : ''}`}
                >
                  {label}
                </th>
              ))}
            </tr>
            <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-200/70 dark:border-slate-800/60">
              {models.map((_, mi) => (
                <Fragment key={mi}>
                  <th
                    scope="col"
                    className={`py-2 px-2 font-medium text-right min-w-[100px] ${mi > 0 ? 'border-l border-slate-200/70 dark:border-slate-800/40' : ''}`}
                  >
                    Realizado
                  </th>
                  {showExtraMetrics ? (
                    <>
                      <th
                        scope="col"
                        className="py-2 px-2 font-medium text-right min-w-[88px]"
                        title={tooltips.atingimento}
                      >
                        Atingimento
                      </th>
                      <th
                        scope="col"
                        className="py-2 px-2 font-medium text-right min-w-[88px]"
                        title={tooltips.pctReceita}
                      >
                        % Receita
                      </th>
                    </>
                  ) : null}
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            <GroupHeader
              label="Receitas"
              open={openReceitas}
              onToggle={() => setOpenReceitas((x) => !x)}
              variant="receitas"
              controlsId={bodyReceitas}
              colSpan={compareColSpan}
            />
          </tbody>
          <tbody id={bodyReceitas} hidden={!openReceitas}>
            <DataRowsCompare
              models={models}
              section="receitas"
              tooltips={tooltips}
              showExtraMetrics={showExtraMetrics}
            />
          </tbody>
          <tbody>
            <SubtotalRowCompare
              subs={models.map((m) => m.receitas.subtotal)}
              tooltips={tooltips}
              showExtraMetrics={showExtraMetrics}
            />
          </tbody>
          <tbody>
            <GroupHeader
              label="Despesas"
              open={openDespesas}
              onToggle={() => setOpenDespesas((x) => !x)}
              variant="despesas"
              controlsId={bodyDespesas}
              colSpan={compareColSpan}
            />
          </tbody>
          <tbody id={bodyDespesas} hidden={!openDespesas}>
            <DataRowsCompare
              models={models}
              section="despesas"
              tooltips={tooltips}
              showExtraMetrics={showExtraMetrics}
            />
          </tbody>
          <tbody>
            <SubtotalRowCompare
              subs={models.map((m) => m.despesas.subtotal)}
              tooltips={tooltips}
              showExtraMetrics={showExtraMetrics}
            />
          </tbody>
          <tbody>
            <tr className="border-t-2 border-emerald-500/40 bg-slate-50/90 dark:bg-slate-900/50 font-semibold">
              <th
                scope="row"
                className="py-3 px-2 text-left text-slate-900 dark:text-white sticky left-0 bg-slate-50/90 dark:bg-slate-900/50 z-[1]"
              >
                Resultado (realizado)
              </th>
              {models.flatMap((model, mi) => {
                const cells = [
                  <td
                    key={`${mi}-rr`}
                    className={`${resultadoRealizadoCellClass(model.resultadoRealizado)} ${mi > 0 ? 'border-l border-slate-200/50 dark:border-slate-800/40' : ''}`}
                    title={
                      model.resultadoRealizado < 0
                        ? 'Saldo negativo: despesas realizadas superam receitas neste período.'
                        : undefined
                    }
                  >
                    {formatDreCurrency(model.resultadoRealizado)}
                  </td>
                ];
                if (showExtraMetrics) {
                  cells.push(
                    <td key={`${mi}-ra`} className="py-3 px-2 text-right tabular-nums text-slate-500 dark:text-slate-400">
                      —
                    </td>,
                    <td key={`${mi}-rpc`} className="py-3 px-2 text-right tabular-nums text-slate-500 dark:text-slate-400">
                      —
                    </td>
                  );
                }
                return cells;
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
