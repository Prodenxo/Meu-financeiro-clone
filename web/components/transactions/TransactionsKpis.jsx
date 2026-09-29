'use client';

import { useId } from 'react';
import { IconBubble, cx } from '@/components/ui';
import { formatBrl } from '@/lib/finance/format';
import s from './transactions.module.css';

const W = 120;
const H = 44;

/** Linha do saldo acumulado no período (SVG leve, sem biblioteca de gráfico). */
function Sparkline({ values, color }) {
  const gradientId = useId();
  if (values.length === 0) return null;
  const pts = values.length === 1 ? [values[0], values[0]] : values;
  const min = Math.min(0, ...pts);
  const max = Math.max(0, ...pts);
  const range = max - min || 1;
  const coords = pts.map((v, i) => [(i / (pts.length - 1)) * W, H - 4 - ((v - min) / range) * (H - 8)]);
  const line = coords.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const zeroY = H - 4 - ((0 - min) / range) * (H - 8);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${W},${zeroY} L0,${zeroY} Z`} fill={`url(#${gradientId})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** Barras dos totais por faixa do período. */
function MiniBars({ values, color }) {
  const max = Math.max(...values, 0);
  const n = values.length || 1;
  const gap = 4;
  const bw = (W - gap * (n - 1)) / n;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      {values.map((v, i) => {
        const h = max > 0 ? Math.max(3, (v / max) * (H - 2)) : 3;
        return (
          <rect
            key={i}
            x={i * (bw + gap)}
            y={H - h}
            width={bw}
            height={h}
            rx={Math.min(3, bw / 2)}
            fill={color}
            opacity={v > 0 ? 0.9 : 0.18}
          />
        );
      })}
    </svg>
  );
}

function KpiCard({ label, icon, iconTone, value, valueClass, hint, chart }) {
  return (
    <article className={s.kpi}>
      <div className={s.kpiHead}>
        <IconBubble name={icon} tone={iconTone} size={32} iconSize={16} />
        <span className={s.kpiLabel}>{label}</span>
      </div>
      <div className={s.kpiBody}>
        <div className={s.kpiText}>
          <span className={cx(s.kpiValue, valueClass)}>{value}</span>
          <span className={s.kpiHint}>{hint}</span>
        </div>
        <div className={s.kpiChart}>{chart}</div>
      </div>
    </article>
  );
}

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export function TransactionsKpis({ kpis, series, periodHint }) {
  const saldoTone = kpis.saldo < 0 ? 'danger' : kpis.saldo > 0 ? 'success' : 'primary';
  const saldoColor = kpis.saldo < 0 ? 'var(--mf-danger)' : 'var(--mf-success)';

  return (
    <section className={s.kpis} aria-label="Resumo do período">
      <KpiCard
        label="Saldo do período"
        icon="wallet"
        iconTone={saldoTone}
        value={formatBrl(kpis.saldo)}
        valueClass={kpis.saldo < 0 ? s.negative : undefined}
        hint={periodHint}
        chart={<Sparkline values={series.saldo} color={saldoColor} />}
      />
      <KpiCard
        label="Entradas"
        icon="arrow-up-right"
        iconTone="success"
        value={formatBrl(kpis.entradas)}
        valueClass={s.positive}
        hint={plural(kpis.countEntradas, 'lançamento', 'lançamentos')}
        chart={<MiniBars values={series.entradas} color="var(--mf-success)" />}
      />
      <KpiCard
        label="Saídas"
        icon="arrow-down-right"
        iconTone="danger"
        value={formatBrl(kpis.saidas)}
        valueClass={s.negative}
        hint={plural(kpis.countSaidas, 'lançamento', 'lançamentos')}
        chart={<MiniBars values={series.saidas} color="var(--mf-danger)" />}
      />
    </section>
  );
}
