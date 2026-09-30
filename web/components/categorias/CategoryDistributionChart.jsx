'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardHeader, EmptyState } from '@/components/ui';
import { formatBrl } from '@/lib/finance/format';
import d from '@/components/dashboard/dashboard.module.css';
import s from './categorias.module.css';

function SliceTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className={d.tooltip}>
      <p className={d.tooltipLabel}>
        {p.nome} · {Math.round(p.pct)}%
      </p>
      <p className={d.tooltipValue}>{formatBrl(p.valor)}</p>
    </div>
  );
}

/** Rosca "Distribuição dos gastos por categoria" com total no centro e legenda lateral. */
export function CategoryDistributionChart({ distribution, total, viewTipo }) {
  const isSaida = viewTipo === 'saida';
  const title = isSaida ? 'Distribuição dos gastos por categoria' : 'Distribuição das entradas por categoria';

  return (
    <Card aria-labelledby="cat-chart-title">
      <CardHeader title={title} icon="pie-chart" iconTone="primary" id="cat-chart-title" />
      {distribution.length === 0 ? (
        <EmptyState icon="pie-chart" title="Sem dados para o gráfico" text="Registre lançamentos neste mês para ver a distribuição por categoria." />
      ) : (
        <div className={s.donutWrap}>
          <div className={s.donutChart} role="img" aria-label={`Total ${formatBrl(total)} distribuído em ${distribution.length} fatias`}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={distribution} dataKey="valor" nameKey="nome" innerRadius="68%" outerRadius="100%" paddingAngle={2} stroke="none" isAnimationActive={false}>
                  {distribution.map((slice) => (
                    <Cell key={slice.id} fill={slice.color} />
                  ))}
                </Pie>
                <Tooltip content={<SliceTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className={s.donutCenter}>
              <span className={s.donutLabel}>Total</span>
              <span className={s.donutTotal}>{formatBrl(total)}</span>
            </div>
          </div>
          <ul className={s.legend} aria-label="Legenda">
            {distribution.map((slice) => (
              <li key={slice.id} className={s.legendRow}>
                <span className={s.legendDot} style={{ background: slice.color }} aria-hidden="true" />
                <span className={s.legendName} title={slice.nome}>
                  {slice.nome}
                </span>
                <span className={s.legendPct}>{Math.round(slice.pct)}%</span>
                <span className={s.legendValue}>{formatBrl(slice.valor)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
