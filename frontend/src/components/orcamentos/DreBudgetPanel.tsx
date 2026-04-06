import { useMemo, useState } from 'react';
import { Wallet } from 'lucide-react';
import EmptyState from '../EmptyState';
import FetchErrorBanner from '../FetchErrorBanner';
import LoadingOverlay from '../LoadingOverlay';
import { useDreMatrix } from '../../hooks/useDreMatrix';
import { buildDreMatrixViewModel, type DrePeriod } from '../../utils/dreMatrix';
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

export interface DreBudgetPanelProps {
  userId: string;
  year: number;
  onYearChange: (y: number) => void;
  yearOptions: number[];
  onGoToMonthTab: () => void;
}

export default function DreBudgetPanel({
  userId,
  year,
  onYearChange,
  yearOptions,
  onGoToMonthTab
}: DreBudgetPanelProps) {
  const now = new Date();
  const [period, setPeriod] = useState<DrePeriod>({ kind: 'month', month: now.getMonth() + 1 });
  const { categories, cells, loading, error, refetch } = useDreMatrix(userId, year);

  const model = useMemo(
    () => buildDreMatrixViewModel(categories, cells, year, period, MESES),
    [categories, cells, year, period]
  );

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

      {!initialLoad && !error && model.isEmpty ? (
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

      {!initialLoad && !model.isEmpty ? (
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
            <DrePeriodSidebar period={period} onPeriodChange={setPeriod} />
            <DreMatrixTable model={model} tooltips={TOOLTIPS} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
