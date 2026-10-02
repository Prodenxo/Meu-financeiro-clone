'use client';

import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '@/components/ui';
import { formatAxisBrl, formatBrl } from '@/lib/finance/format';
import s from './bpo.module.css';

function Tip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div role="status" style={{ background: 'var(--mf-card)', border: '1px solid var(--mf-border)', borderRadius: 8, padding: '8px 10px' }}>
      <p style={{ margin: '0 0 4px', fontWeight: 700 }}>{label}</p>
      {payload.map((item) => (
        <p key={item.dataKey} style={{ margin: 0, color: item.color }}>
          {item.name}: {item.value === null || item.value === undefined ? '—' : formatBrl(item.value)}
        </p>
      ))}
    </div>
  );
}

const axis = { fontSize: 11, fill: 'var(--mf-text-3)' };

/** Dois gráficos do ano, com os mesmos subtotais da matriz (receitas, despesas, orçado, realizado). */
export function BpoCharts({ series }) {
  const hasMovement = series.some((p) => p.receitas !== 0 || p.despesas !== 0 || p.orcado);
  if (!hasMovement) return null;

  return (
    <div className={s.charts}>
      <Card className={s.chartCard}>
        <div className={s.chartHead}>
          <h2 style={{ margin: 0, fontSize: 'var(--fs-lg)' }}>Receitas e despesas</h2>
        </div>
        <div className={s.chartBox}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--mf-border)" vertical={false} />
              <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} />
              <YAxis tick={axis} axisLine={false} tickLine={false} tickFormatter={formatAxisBrl} width={72} />
              <Tooltip content={<Tip />} />
              <Legend />
              <Line type="linear" dataKey="receitas" name="Receitas" stroke="var(--mf-success)" strokeWidth={2} dot={false} />
              <Line type="linear" dataKey="despesas" name="Despesas" stroke="var(--mf-danger)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className={s.chartCard}>
        <div className={s.chartHead}>
          <h2 style={{ margin: 0, fontSize: 'var(--fs-lg)' }}>Planejado x realizado</h2>
        </div>
        <div className={s.chartBox}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--mf-border)" vertical={false} />
              <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} />
              <YAxis tick={axis} axisLine={false} tickLine={false} tickFormatter={formatAxisBrl} width={72} />
              <Tooltip content={<Tip />} />
              <Legend />
              <Bar dataKey="orcado" name="Orçado" fill="var(--mf-primary-soft)" stroke="var(--mf-primary)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="realizado" name="Realizado" fill="var(--mf-primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
