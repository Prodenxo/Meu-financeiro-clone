import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Wallet } from 'lucide-react';
import EmptyState from '../EmptyState';
import FetchErrorBanner from '../FetchErrorBanner';
import LoadingOverlay from '../LoadingOverlay';
import { useMediaQueryMinLg } from '../../hooks/useMediaQueryMinLg';
import { useDreMatrix } from '../../hooks/useDreMatrix';
import {
  buildDreMatrixViewModel,
  toggleMonthInSelection,
  type DreUiSelection
} from '../../utils/dreMatrix';
import DreMatrixTable from './DreMatrixTable';
import DrePeriodSidebar from './DrePeriodSidebar';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const TOOLTIPS = {
  atingimento:
    'Percentagem do realizado face ao planejado neste período. "—" quando não há valor planejado.',
  pctReceita:
    'Peso desta linha sobre a receita total realizada no período (soma das categorias de entrada).'
};

function defaultMonthForYear(y: number): number {
  const now = new Date();
  return y === now.getFullYear() ? now.getMonth() + 1 : 1;
}

export interface DreBudgetPanelProps {
  userId: string;
  year: number;
  onYearChange: (y: number) => void;
  yearOptions: number[];
  onGoToMonthTab: () => void;
  /** Incrementado pelo pai após alterar orçamentos no modo mensal — força refetch da DRE. */
  matrixDataRevision?: number;
}

export default function DreBudgetPanel({
  userId,
  year,
  onYearChange,
  yearOptions,
  onGoToMonthTab,
  matrixDataRevision = 0
}: DreBudgetPanelProps) {
  const [dreSelection, setDreSelection] = useState<DreUiSelection>(() => ({
    mode: 'months',
    months: [defaultMonthForYear(year)]
  }));
  const [statusMessage, setStatusMessage] = useState('');
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevIsLgRef = useRef<boolean | null>(null);

  const isLg = useMediaQueryMinLg();
  const maxMonths = isLg ? 4 : 2;

  const announce = useCallback((msg: string) => {
    setStatusMessage(msg);
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    clearTimerRef.current = setTimeout(() => setStatusMessage(''), 8000);
  }, []);

  useEffect(() => {
    setDreSelection({ mode: 'months', months: [defaultMonthForYear(year)] });
  }, [year]);

  useEffect(() => {
    const wasLg = prevIsLgRef.current;
    prevIsLgRef.current = isLg;
    if (wasLg === true && isLg === false) {
      setDreSelection((prev) => {
        if (prev.mode !== 'months' || prev.months.length <= 2) return prev;
        const sorted = [...prev.months].sort((a, b) => a - b);
        const next = sorted.slice(0, 2);
        const names = next.map((m) => MESES[m - 1]).join(' e ');
        queueMicrotask(() =>
          announce(
            `Ecrã estreito: a comparação ficou limitada a dois meses. Mantidos: ${names}.`
          )
        );
        return { mode: 'months', months: next };
      });
    }
  }, [isLg, announce]);

  const handleToggleMonth = useCallback(
    (month: number) => {
      setDreSelection((prev) => {
        if (prev.mode === 'annual') return prev;
        const { next, rejected } = toggleMonthInSelection(prev.months, month, maxMonths);
        if (rejected) {
          queueMicrotask(() =>
            announce(
              `Limite de ${maxMonths} meses para comparação neste ecrã. Desmarque um mês para adicionar outro.`
            )
          );
          return prev;
        }
        return { mode: 'months', months: next };
      });
    },
    [maxMonths, announce]
  );

  const handleSelectAnnual = useCallback(() => {
    setDreSelection({ mode: 'annual' });
  }, []);

  const handleMonthFromAnnual = useCallback((month: number) => {
    setDreSelection({ mode: 'months', months: [month] });
  }, []);

  const { categories, cells, loading, error, refetch } = useDreMatrix(
    userId,
    year,
    matrixDataRevision
  );

  const { tableVariant, models, compareMonths, tableTitle, descriptionId } = useMemo(() => {
    if (dreSelection.mode === 'annual') {
      const m = buildDreMatrixViewModel(categories, cells, year, { kind: 'annual' }, MESES);
      return {
        tableVariant: 'single' as const,
        models: [m],
        compareMonths: [] as number[],
        tableTitle: m.periodLabel,
        descriptionId: undefined as string | undefined
      };
    }
    const months = dreSelection.months;
    if (months.length === 1) {
      const m = buildDreMatrixViewModel(
        categories,
        cells,
        year,
        { kind: 'month', month: months[0] },
        MESES
      );
      return {
        tableVariant: 'single' as const,
        models: [m],
        compareMonths: months,
        tableTitle: m.periodLabel,
        descriptionId: undefined as string | undefined
      };
    }
    const sorted = [...months].sort((a, b) => a - b);
    const ms = sorted.map((month) =>
      buildDreMatrixViewModel(categories, cells, year, { kind: 'month', month }, MESES)
    );
    const list = sorted.map((m) => MESES[m - 1]).join(', ');
    const title = `Comparando ${sorted.length} meses: ${list}.`;
    return {
      tableVariant: 'compare' as const,
      models: ms,
      compareMonths: sorted,
      tableTitle: title,
      descriptionId: 'dre-compare-desc'
    };
  }, [categories, cells, year, dreSelection]);

  const model = models[0];
  const isEmptyView = model?.isEmpty ?? true;

  const yearIndex = yearOptions.indexOf(year);
  const canPrev = yearIndex > 0;
  const canNext = yearIndex >= 0 && yearIndex < yearOptions.length - 1;

  const initialLoad = loading && categories.length === 0 && cells.length === 0;

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-3xl">
        Visão de resultado pessoal com base nas categorias e movimentos da app. Não substitui
        demonstrações contabilísticas ou obrigações fiscais.
      </p>

      <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {statusMessage}
      </p>

      {error ? <FetchErrorBanner message={error} onRetry={() => void refetch()} /> : null}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-600 dark:text-slate-400">Ano</span>
        <button
          type="button"
          className="planner-button-secondary px-3 py-2 text-sm min-w-[44px] min-h-[44px] lg:min-h-0 lg:min-w-0"
          onClick={() => canPrev && onYearChange(yearOptions[yearIndex - 1])}
          disabled={!canPrev}
          aria-label="Ano anterior"
        >
          ◀
        </button>
        <select
          className="planner-input py-2 text-sm w-28"
          value={year}
          onChange={(e) => onYearChange(Number(e.target.value))}
          aria-label="Ano da DRE"
        >
          {yearOptions.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="planner-button-secondary px-3 py-2 text-sm min-w-[44px] min-h-[44px] lg:min-h-0 lg:min-w-0"
          onClick={() => canNext && onYearChange(yearOptions[yearIndex + 1])}
          disabled={!canNext}
          aria-label="Ano seguinte"
        >
          ▶
        </button>
      </div>

      {initialLoad ? (
        <div className="planner-card p-8 min-h-[240px] relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <LoadingOverlay message="Carregando visão DRE..." />
          </div>
        </div>
      ) : null}

      {!initialLoad && !error && isEmptyView ? (
        <EmptyState
          icon={Wallet}
          title="Sem dados para este ano"
          description="Defina orçamentos ou registe movimentos no modo Por mês para ver a DRE."
          action={
            <button type="button" className="planner-button" onClick={onGoToMonthTab}>
              Ir para orçamento do mês
            </button>
          }
        />
      ) : null}

      {!initialLoad && !isEmptyView ? (
        <div className="planner-card p-4 md:p-6 relative">
          {loading ? (
            <div
              className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/70 dark:bg-slate-950/70 backdrop-blur-[1px]"
              aria-busy="true"
              aria-live="polite"
            >
              <span className="text-sm text-slate-600 dark:text-slate-300">A atualizar…</span>
            </div>
          ) : null}
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
            <DrePeriodSidebar
              selection={dreSelection}
              maxMonths={maxMonths}
              onToggleMonth={handleToggleMonth}
              onSelectAnnual={handleSelectAnnual}
              onMonthFromAnnual={handleMonthFromAnnual}
            />
            <DreMatrixTable
              variant={tableVariant}
              models={models}
              tableTitle={tableTitle}
              tableDescriptionId={descriptionId}
              tooltips={TOOLTIPS}
              monthNames={MESES}
              year={year}
              compareMonths={compareMonths}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
