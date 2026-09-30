'use client';

import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { Card, CardHeader } from '@/components/ui';
import s from './agenda.module.css';

/** Card "Resumo do mês": rosca com total de compromissos e contagem/percentual por tipo. */
export function MonthSummary({ summary, monthName }) {
  const { total, rows } = summary;
  const data = rows.filter((r) => r.count > 0);

  return (
    <Card aria-labelledby="agenda-summary-title">
      <CardHeader title="Resumo do mês" id="agenda-summary-title" />
      <p className={s.gHint} style={{ marginTop: 2 }}>
        Seus compromissos financeiros em {monthName}.
      </p>

      <div className={s.donutWrap} role="img" aria-label={`${total} compromissos no mês`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data.length ? data : [{ id: 'empty', count: 1, hex: 'var(--mf-border)' }]}
              dataKey="count"
              nameKey="label"
              innerRadius="70%"
              outerRadius="100%"
              paddingAngle={data.length > 1 ? 2 : 0}
              stroke="none"
              isAnimationActive={false}
            >
              {(data.length ? data : [{ id: 'empty', hex: 'var(--mf-border)' }]).map((r) => (
                <Cell key={r.id} fill={r.hex} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className={s.donutCenter}>
          <span className={s.donutTotal}>{total}</span>
          <span className={s.donutLabel}>
            {total === 1 ? 'compromisso' : 'compromissos'}
            <br />
            no mês
          </span>
        </div>
      </div>

      <div className={s.sumList} role="list">
        {rows.map((r) => (
          <div key={r.id} className={s.sumRow} role="listitem">
            <span className={s.legendDot} style={{ background: r.color }} aria-hidden="true" />
            <span className={s.sumName}>{r.label}</span>
            <span className={s.sumCount}>{r.count}</span>
            <span className={s.sumPct}>{Math.round(r.pct)}%</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
