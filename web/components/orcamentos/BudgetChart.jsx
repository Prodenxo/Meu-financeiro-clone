'use client';

import { useId } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, EmptyState, Segmented } from '@/components/ui';
import { formatAxisBrl, formatBrl } from '@/lib/finance/format';
import { CHART_RANGES } from '@/lib/finance/orcamentos';
import d from '@/components/dashboard/dashboard.module.css';
import s from './orcamentos.module.css';

function ChartTooltip({ active, payload, label, categories }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={d.tooltip} role="status">
      <p className={d.tooltipLabel}>{label}</p>
      {payload.map((p) => {
        const cat = categories.find((c) => c.id === p.dataKey);
        return (
          <p key={p.dataKey} className={d.tooltipValue} style={{ color: p.stroke }}>
            {cat?.nome || p.dataKey}: {formatBrl(p.value)}
          </p>
        );
      })}
    </div>
  );
}

/**
 * Evolução do realizado acumulado por categoria com orçamento — uma linha por categoria
 * com área suave, no mesmo estilo do gráfico da Visão geral. Janelas 7D/30D/90D/1A.
 */
export function BudgetChart({ history, range, onChangeRange }) {
  const gradientBase = useId();
  const titleId = `${gradientBase}-title`;
  const { series, categories, hasMovement } = history;

  return (
    <Card aria-labelledby={titleId}>
      <div className={d.chartHead}>
        <div>
          <h2 className={d.sectionTitle} id={titleId}>
            Evolução dos gastos por categoria
          </h2>
          <p className={d.sectionSub}>Veja a evolução dos valores realizados ao longo do período.</p>
        </div>
        <div className={s.chartControls}>
          <Segmented ariaLabel="Período do gráfico" value={range} onChange={onChangeRange} options={CHART_RANGES.map((r) => ({ value: r.value, label: r.label }))} />
        </div>
      </div>

      {categories.length === 0 ? (
        <EmptyState icon="line-chart" title="Sem orçamentos neste mês" text="Defina limites por categoria para acompanhar a evolução." />
      ) : (
        <>
          <div className={d.chartWrap}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  {categories.map((c, i) => (
                    <linearGradient key={c.id} id={`${gradientBase}-${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={c.color} stopOpacity={0.22} />
                      <stop offset="100%" stopColor={c.color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid vertical={false} stroke="var(--mf-border)" strokeDasharray="0" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'var(--mf-text-3)', fontSize: 11 }} minTickGap={24} />
                <YAxis tickLine={false} axisLine={false} width={64} tick={{ fill: 'var(--mf-text-3)', fontSize: 11 }} tickFormatter={formatAxisBrl} />
                <Tooltip content={<ChartTooltip categories={categories} />} cursor={{ stroke: 'var(--mf-border-strong)', strokeDasharray: '4 4' }} />
                {categories.map((c, i) => (
                  <Area
                    key={c.id}
                    type="monotone"
                    dataKey={c.id}
                    name={c.nome}
                    stroke={c.color}
                    strokeWidth={2.2}
                    fill={`url(#${gradientBase}-${i})`}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--mf-card)' }}
                    isAnimationActive={false}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className={s.legend} aria-label="Categorias no gráfico">
            {categories.map((c) => (
              <span key={c.id} className={s.legendItem}>
                <span className={s.legendDot} style={{ background: c.color }} aria-hidden="true" />
                {c.nome}
              </span>
            ))}
          </div>
          {!hasMovement ? <p className={s.fieldHint}>Nenhum lançamento nessas categorias no período.</p> : null}
        </>
      )}
    </Card>
  );
}
