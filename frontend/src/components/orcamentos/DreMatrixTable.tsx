import { useId, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { DreHighlight, DreMatrixViewModel, DreRowViewModel, DreSubtotalViewModel } from '../../utils/dreMatrix';
import { formatDreCurrency } from '../../utils/dreMatrix';

function highlightClass(h: DreHighlight): string {
  if (h === 'rose') return 'text-rose-500 dark:text-rose-400 font-semibold';
  if (h === 'amber') return 'text-amber-500 dark:text-amber-400 font-semibold';
  if (h === 'emerald') return 'text-emerald-600 dark:text-emerald-400 font-semibold';
  return '';
}

function MetricCell({
  children,
  highlight,
  align = 'right',
  title
}: {
  children: ReactNode;
  highlight: DreHighlight;
  align?: 'left' | 'right';
  title?: string;
}) {
  const h = highlightClass(highlight);
  return (
    <td
      className={`py-2 px-2 ${align === 'right' ? 'text-right tabular-nums' : ''} ${h || 'text-slate-700 dark:text-slate-200'}`}
      title={title}
    >
      {children}
    </td>
  );
}

function SubtotalRow({
  sub,
  tooltips
}: {
  sub: DreSubtotalViewModel;
  tooltips: { atingimento: string; pctReceita: string };
}) {
  return (
    <tr className="border-t border-slate-200/80 dark:border-slate-700/60 font-semibold bg-slate-50/50 dark:bg-slate-900/30">
      <th scope="row" className="py-2 px-2 text-left text-slate-800 dark:text-slate-100">
        Subtotal
      </th>
      <td className="py-2 px-2 text-right tabular-nums">{formatDreCurrency(sub.planejado)}</td>
      <td className="py-2 px-2 text-right tabular-nums">{formatDreCurrency(sub.realizado)}</td>
      <td className="py-2 px-2 text-right tabular-nums" title={tooltips.atingimento}>
        {sub.atingimentoLabel}
      </td>
      <td className="py-2 px-2 text-right tabular-nums" title={tooltips.pctReceita}>
        {sub.pctReceitaLabel}
      </td>
    </tr>
  );
}

function DataRows({
  rows,
  tooltips
}: {
  rows: DreRowViewModel[];
  tooltips: { atingimento: string; pctReceita: string };
}) {
  return (
    <>
      {rows.map((row) => (
        <tr
          key={row.categorias_id}
          className="border-b border-slate-200/50 dark:border-slate-800/40 hover:bg-slate-100/40 dark:hover:bg-slate-900/20"
        >
          <th scope="row" className="py-2 px-2 text-left font-medium text-slate-800 dark:text-slate-100 sticky left-0 bg-white dark:bg-slate-950 z-[1] shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)] dark:shadow-none">
            {row.nome}
          </th>
          <td className="py-2 px-2 text-right tabular-nums text-slate-700 dark:text-slate-200">
            {formatDreCurrency(row.planejado)}
          </td>
          <MetricCell highlight={row.highlightRealizado}>{formatDreCurrency(row.realizado)}</MetricCell>
          <MetricCell highlight={row.highlightAtingimento} title={tooltips.atingimento}>
            {row.atingimentoLabel}
          </MetricCell>
          <MetricCell highlight="none" title={tooltips.pctReceita}>
            {row.pctReceitaLabel}
          </MetricCell>
        </tr>
      ))}
    </>
  );
}

export interface DreMatrixTableProps {
  model: DreMatrixViewModel;
  tooltips: { atingimento: string; pctReceita: string };
}

export default function DreMatrixTable({ model, tooltips }: DreMatrixTableProps) {
  const [openReceitas, setOpenReceitas] = useState(true);
  const [openDespesas, setOpenDespesas] = useState(true);
  const rid = useId().replace(/:/g, '');
  const did = useId().replace(/:/g, '');
  const bodyReceitas = `dre-data-rec-${rid}`;
  const bodyDespesas = `dre-data-desp-${did}`;

  const GroupHeader = ({
    label,
    open,
    onToggle,
    variant,
    controlsId
  }: {
    label: string;
    open: boolean;
    onToggle: () => void;
    variant: 'receitas' | 'despesas';
    controlsId: string;
  }) => {
    const bg =
      variant === 'receitas'
        ? 'bg-emerald-50/80 dark:bg-emerald-950/30'
        : 'bg-slate-100/80 dark:bg-slate-800/50';
    return (
      <tr className={bg}>
        <th scope="colgroup" colSpan={5} className="py-2 px-2 text-left">
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

  return (
    <div className="min-w-0 flex-1">
      <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-3">{model.periodLabel}</h3>
      <div className="overflow-x-auto rounded-lg border border-slate-200/70 dark:border-slate-800/60">
        <table className="w-full text-sm min-w-[520px]">
          <thead>
            <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-200/70 dark:border-slate-800/60">
              <th scope="col" className="py-3 px-2 font-medium sticky left-0 bg-white dark:bg-slate-950 z-[2]">
                Categoria
              </th>
              <th scope="col" className="py-3 px-2 font-medium text-right">
                Planejado
              </th>
              <th scope="col" className="py-3 px-2 font-medium text-right">
                Realizado
              </th>
              <th scope="col" className="py-3 px-2 font-medium text-right" title={tooltips.atingimento}>
                Atingimento
              </th>
              <th scope="col" className="py-3 px-2 font-medium text-right" title={tooltips.pctReceita}>
                % Receita
              </th>
            </tr>
          </thead>
          <tbody>
            <GroupHeader
              label="Receitas"
              open={openReceitas}
              onToggle={() => setOpenReceitas((v) => !v)}
              variant="receitas"
              controlsId={bodyReceitas}
            />
          </tbody>
          <tbody id={bodyReceitas} hidden={!openReceitas}>
            <DataRows rows={model.receitas.rows} tooltips={tooltips} />
          </tbody>
          <tbody>
            <SubtotalRow sub={model.receitas.subtotal} tooltips={tooltips} />
          </tbody>
          <tbody>
            <GroupHeader
              label="Despesas"
              open={openDespesas}
              onToggle={() => setOpenDespesas((v) => !v)}
              variant="despesas"
              controlsId={bodyDespesas}
            />
          </tbody>
          <tbody id={bodyDespesas} hidden={!openDespesas}>
            <DataRows rows={model.despesas.rows} tooltips={tooltips} />
          </tbody>
          <tbody>
            <SubtotalRow sub={model.despesas.subtotal} tooltips={tooltips} />
          </tbody>
          <tbody>
            <tr className="border-t-2 border-emerald-500/40 bg-slate-50/90 dark:bg-slate-900/50 font-semibold">
              <th scope="row" className="py-3 px-2 text-left text-slate-900 dark:text-white">
                Resultado (realizado)
              </th>
              <td className="py-3 px-2 text-right tabular-nums text-slate-500 dark:text-slate-400">—</td>
              <td className="py-3 px-2 text-right tabular-nums text-lg text-emerald-600 dark:text-emerald-400">
                {formatDreCurrency(model.resultadoRealizado)}
              </td>
              <td className="py-3 px-2 text-right tabular-nums text-slate-500 dark:text-slate-400">—</td>
              <td className="py-3 px-2 text-right tabular-nums text-slate-500 dark:text-slate-400">—</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
