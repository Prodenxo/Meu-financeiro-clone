'use client';

import { useId } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, EmptyState, Segmented, Select, cx } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { formatAxisBrl, formatBrl } from '@/lib/finance/format';
import { CHART_RANGES } from '@/lib/finance/contasPage';
import d from '@/components/dashboard/dashboard.module.css';
import s from './contas.module.css';

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className={d.tooltip} role="status">
      <p className={d.tooltipLabel}>{point.label}</p>
      <p className={d.tooltipValue}>{formatBrl(point.saldo)}</p>
    </div>
  );
}

function formatPct(v) {
  return `${Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

/**
 * Evolução do saldo somado das contas (saldo inicial + lançamentos realizados), no mesmo
 * estilo do gráfico "Saldo no mês" da Visão geral. Janelas: 7D, 30D, 90D, 1A.
 */
export function AccountBalanceChart({ history, range, onChangeRange, contas, contaFilter, onChangeContaFilter, hasAccounts }) {
  const gradientId = useId();
  const titleId = `${gradientId}-title`;
  const { series, stats } = history;
  const delta = stats.delta;
  const stroke = delta >= 0 ? 'var(--mf-primary)' : 'var(--mf-danger)';
  const variation = stats.variationPct;

  return (
    <Card aria-labelledby={titleId}>
      <div className={d.chartHead}>
        <div>
          <h2 className={d.sectionTitle} id={titleId}>
            Evolução do saldo nas contas
          </h2>
          <p className={d.sectionSub}>Saldo inicial mais o que já foi pago ou recebido, dia a dia</p>
        </div>
        <div className={s.chartControls}>
          {contas.length > 1 ? (
            <Select value={contaFilter} onChange={(e) => onChangeContaFilter(e.target.value)} aria-label="Filtrar por conta" style={{ width: 'auto', minWidth: 160 }}>
              <option value="all">Todas as contas</option>
              {contas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </Select>
          ) : null}
          <Segmented ariaLabel="Período do gráfico" value={range} onChange={onChangeRange} options={CHART_RANGES.map((r) => ({ value: r.value, label: r.label }))} />
        </div>
      </div>

      {!hasAccounts ? (
        <EmptyState icon="line-chart" title="Sem contas cadastradas" text="Cadastre uma conta para acompanhar a evolução do saldo." />
      ) : (
        <>
          <div className={d.chartWrap}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={stroke} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={stroke} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--mf-border)" strokeDasharray="0" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'var(--mf-text-3)', fontSize: 11 }} minTickGap={24} />
                <YAxis tickLine={false} axisLine={false} width={64} tick={{ fill: 'var(--mf-text-3)', fontSize: 11 }} tickFormatter={formatAxisBrl} domain={['auto', 'auto']} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--mf-border-strong)', strokeDasharray: '4 4' }} />
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
          <div className={d.chartSummary}>
            <div className={d.chartStat}>
              <span className={d.chartStatLabel}>Saldo do período</span>
              <span className={d.chartStatValue} style={{ color: stroke }}>
                {delta > 0 ? '+' : ''}
                {formatBrl(delta)}
              </span>
            </div>
            <div className={d.chartStat}>
              <span className={d.chartStatLabel}>Menor ponto</span>
              <span className={d.chartStatValue}>{formatBrl(stats.min)}</span>
            </div>
            <div className={d.chartStat}>
              <span className={d.chartStatLabel}>Maior ponto</span>
              <span className={d.chartStatValue}>{formatBrl(stats.max)}</span>
            </div>
            <div className={d.chartStat}>
              <span className={d.chartStatLabel}>Variação</span>
              <span className={cx(d.chartStatValue, variation != null && (variation >= 0 ? s.variationUp : s.variationDown))} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {variation == null ? (
                  '—'
                ) : (
                  <>
                    <Icon name={variation >= 0 ? 'trending-up' : 'trending-down'} size={16} />
                    {formatPct(variation)}
                  </>
                )}
              </span>
            </div>
          </div>
          {!history.hasMovement ? <p className={s.instMeta}>Nenhum lançamento realizado nas contas neste período — a linha mostra o saldo atual.</p> : null}
        </>
      )}
    </Card>
  );
}
