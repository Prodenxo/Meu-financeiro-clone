'use client';

import { Card, CardHeader, EmptyState, IconBubble } from '@/components/ui';
import { formatBrl, formatSignedBrl } from '@/lib/finance/format';
import s from './dashboard.module.css';

const LIMIT = 4;

export function TodayCard({ flow, isCurrentMonth, hideValues }) {
  const items = flow.items.slice(0, LIMIT);
  const money = (v) => (hideValues ? 'R$ ••••' : formatBrl(v));

  return (
    <Card aria-labelledby="today-title">
      <CardHeader title="Hoje" id="today-title" />
      {!isCurrentMonth ? (
        <EmptyState icon="calendar-days" title="Você está vendo outro mês" text="O resumo de hoje aparece no mês atual." />
      ) : flow.items.length === 0 ? (
        <EmptyState icon="calendar-days" title="Nada registrado hoje" text="Entradas e saídas pagas ou recebidas hoje aparecem aqui." />
      ) : (
        <>
          <div className={s.todaySummary}>
            <div className={s.todayStat}>
              <span className={s.todayStatLabel}>Entrou</span>
              <span className={`${s.todayStatValue} ${s.trendUp}`}>{money(flow.income)}</span>
            </div>
            <div className={s.todayStat}>
              <span className={s.todayStatLabel}>Saiu</span>
              <span className={`${s.todayStatValue} ${s.trendDown}`}>{money(flow.expense)}</span>
            </div>
          </div>
          <ul className={s.list}>
            {items.map((item) => (
              <li key={item.id} className={s.listItem}>
                <IconBubble
                  name={item.tipo === 'entrada' ? 'arrow-up-right' : 'arrow-down-right'}
                  tone={item.tipo === 'entrada' ? 'success' : 'danger'}
                  size={30}
                  iconSize={14}
                />
                <div className={s.listText}>
                  <span className={s.listTitle} title={item.title}>
                    {item.title}
                  </span>
                </div>
                <span className={`${s.listValue} ${item.tipo === 'entrada' ? s.trendUp : ''}`}>
                  {hideValues ? 'R$ ••••' : formatSignedBrl(item.valor, item.tipo)}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}
