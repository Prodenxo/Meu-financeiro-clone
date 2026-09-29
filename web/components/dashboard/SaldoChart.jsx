'use client';

import { useId } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, EmptyState, Select } from '@/components/ui';
import { formatAxisBrl, formatBrl } from '@/lib/finance/format';
import s from './dashboard.module.css';

function ChartTooltip({ active, payload, hideValues }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className={s.tooltip} role="status">
      <p className={s.tooltipLabel}>{point.label}</p>
      <p className={s.tooltipValue}>{hideValues ? 'R$ ••••' : formatBrl(point.saldo)}</p>
    </div>
  );
}

/**
 * Saldo acumulado no mês (só lançamentos realizados), 1 ponto por dia com movimento.
 * O filtro por conta é o mesmo do card de saldo (all | unassigned | id da conta).
 */
export function SaldoChart({ series, contas, contaFilter, onChangeContaFilter, balanceMode, hideValues, monthCount }) {
  const gradientId = useId();
  const last = series.length ? series[series.length - 1].saldo : 0;
  const min = series.length ? Math.min(...series.map((p) => p.saldo)) : 0;
  const max = series.length ? Math.max(...series.map((p) => p.saldo)) : 0;
  const positive = last >= 0;
  const stroke = positive ? 'var(--mf-primary)' : 'var(--mf-danger)';
  const titleId = `${gradientId}-title`;

  return (
    <Card aria-labelledby={titleId}>
      <div className={s.chartHead}>
        <div>
          <h2 className={s.sectionTitle} id={titleId}>
            Saldo no mês
          </h2>
          <p className={s.sectionSub}>Evolução do saldo acumulado com o que já foi pago ou recebido</p>
        </div>
        {contas.length > 0 ? (
          <Select
            value={contaFilter}
            onChange={(e) => onChangeContaFilter(e.target.value)}
            aria-label="Filtrar por conta"
            style={{ width: 'auto', minWidth: 180 }}
          >
            <option value="all">Todas as contas</option>
            <option value="unassigned">Sem conta vinculada</option>
            {contas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </Select>
        ) : null}
      </div>

      {series.length === 0 ? (
        <EmptyState
          icon="line-chart"
          title="Sem movimentações realizadas"
          text={
            monthCount > 0
              ? 'Há lançamentos no mês, mas nenhum marcado como pago ou recebido ainda.'
              : 'Registre a primeira entrada ou saída deste mês para ver o gráfico.'
          }
        />
      ) : (
        <>
          <div className={s.chartWrap}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={stroke} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={stroke} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--mf-border)" strokeDasharray="0" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'var(--mf-text-3)', fontSize: 11 }}
                  minTickGap={18}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={64}
                  tick={{ fill: 'var(--mf-text-3)', fontSize: 11 }}
                  tickFormatter={(v) => (hideValues ? '•••' : formatAxisBrl(v))}
                />
                <Tooltip
                  content={<ChartTooltip hideValues={hideValues} />}
                  cursor={{ stroke: 'var(--mf-border-strong)', strokeDasharray: '4 4' }}
                />
                <Area
                  type="monotone"
                  dataKey="saldo"
                  stroke={stroke}
                  strokeWidth={2.2}
                  fill={`url(#${gradientId})`}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--mf-card)' }}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className={s.chartSummary}>
            <div className={s.chartStat}>
              <span className={s.chartStatLabel}>Saldo do período</span>
              <span className={s.chartStatValue} style={{ color: stroke }}>
                {hideValues ? 'R$ ••••' : formatBrl(last)}
              </span>
            </div>
            <div className={s.chartStat}>
              <span className={s.chartStatLabel}>Menor ponto</span>
              <span className={s.chartStatValue}>{hideValues ? 'R$ ••••' : formatBrl(min)}</span>
            </div>
            <div className={s.chartStat}>
              <span className={s.chartStatLabel}>Maior ponto</span>
              <span className={s.chartStatValue}>{hideValues ? 'R$ ••••' : formatBrl(max)}</span>
            </div>
            {balanceMode === 'legacy' ? (
              <div className={s.chartStat}>
                <span className={s.chartStatLabel}>Base</span>
                <span className={s.chartStatValue} style={{ fontSize: 'var(--fs-sm)', fontWeight: 500 }}>
                  Sem contas cadastradas — saldo pelos lançamentos
                </span>
              </div>
            ) : null}
          </div>
        </>
      )}
    </Card>
  );
}
