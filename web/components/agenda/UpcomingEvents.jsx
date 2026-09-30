'use client';

import { Card, CardHeader, EmptyState, IconBubble, cx } from '@/components/ui';
import { formatBrl, MONTH_SHORT } from '@/lib/finance/format';
import { AGENDA_KINDS, formatWeekday } from '@/lib/finance/agenda';
import t from '@/components/transactions/transactions.module.css';
import s from './agenda.module.css';

const BUBBLE_TONE = { conta: 'danger', compromisso: 'primary', recebimento: 'success', lembrete: 'warning' };

/** Card "Próximos compromissos": data, ícone, descrição, valor ou horário e categoria. */
export function UpcomingEvents({ items, onOpen, onSeeAll }) {
  return (
    <Card aria-labelledby="agenda-upcoming-title">
      <CardHeader
        title="Próximos compromissos"
        id="agenda-upcoming-title"
        action={
          <button type="button" className={t.linkButton} onClick={onSeeAll}>
            Ver todos →
          </button>
        }
      />
      <p className={s.gHint} style={{ marginTop: 2 }}>
        Veja os próximos eventos da sua agenda.
      </p>
      {items.length === 0 ? (
        <EmptyState icon="calendar-days" title="Nada agendado" text="Nenhum compromisso a partir de hoje neste mês." />
      ) : (
        <div className={s.upList} role="list">
          {items.map((item) => {
            const kind = AGENDA_KINDS[item.kind];
            const mon = MONTH_SHORT[Number(item.dayKey.slice(5, 7)) - 1].toUpperCase();
            return (
              <button key={item.id} type="button" className={s.upRow} role="listitem" onClick={() => onOpen(item)} style={{ textAlign: 'left' }}>
                <span className={s.dateBadge}>
                  <span className={s.dateBadgeDay}>{item.dayKey.slice(8, 10)}</span>
                  <span className={s.dateBadgeMon}>{mon}</span>
                </span>
                <IconBubble name={kind.icon} tone={BUBBLE_TONE[item.kind]} size={34} iconSize={16} />
                <span className={s.apptBody} style={{ gap: 2 }}>
                  <span className={s.apptTitle} title={item.title}>
                    {item.source === 'transaction' ? item.subtitle || item.title : item.title}
                  </span>
                  <span className={s.apptSub}>{item.source === 'transaction' ? item.title : kind.label.replace(/s$/, '')}</span>
                </span>
                <span className={s.upRight}>
                  {item.source === 'transaction' ? (
                    <span className={cx(s.upValue, item.isIncome ? t.positive : t.negative)}>
                      {item.isIncome ? '+' : '−'} {formatBrl(item.amount)}
                    </span>
                  ) : (
                    <span className={cx(s.upValue, s.upValuePrimary)}>{item.time || 'Dia inteiro'}</span>
                  )}
                  <span className={s.apptSub}>{formatWeekday(item.dayKey)}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}
