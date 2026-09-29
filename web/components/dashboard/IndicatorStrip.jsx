'use client';

import { IconBubble } from '@/components/ui';
import s from './dashboard.module.css';

const ICON_BY_ID = {
  net: 'bar-chart',
  savings: 'wallet',
  avg: 'clock',
  pending: 'alert-circle',
  tx: 'receipt',
  delta: 'arrow-left-right',
};

const TONE = {
  positive: 'success',
  negative: 'danger',
  neutral: 'neutral',
  accent: 'primary',
};

const HIDE_IDS = new Set(['net', 'avg', 'pending']);

export function IndicatorStrip({ insights, hideValues }) {
  return (
    <section className={s.indicators} aria-label="Indicadores do mês">
      {insights.map((it) => (
        <div key={it.id} className={s.indicator} title={it.hint}>
          <IconBubble name={ICON_BY_ID[it.id] || 'tag'} tone={TONE[it.tone] || 'neutral'} size={36} iconSize={16} />
          <div className={s.indicatorText}>
            <span className={s.indicatorLabel}>{it.label}</span>
            <span className={s.indicatorValue}>{hideValues && HIDE_IDS.has(it.id) ? 'R$ ••••' : it.value}</span>
          </div>
        </div>
      ))}
    </section>
  );
}
