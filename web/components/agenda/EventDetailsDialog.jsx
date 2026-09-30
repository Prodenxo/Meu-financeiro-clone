'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { formatBrl } from '@/lib/finance/format';
import { toMonthParam } from '@/lib/date';
import { AGENDA_KINDS, formatDayFull, googleCalendarDayUrl, monthOfKey } from '@/lib/finance/agenda';
import { KindPill } from './DailyAppointments';
import m from '@/components/dashboard/modal.module.css';
import s from './agenda.module.css';

const STATUS_LABEL = { pago: 'Pago', recebido: 'Recebido', a_pagar: 'A pagar', a_receber: 'A receber', pendente: 'Pendente' };

/** "Detalhes" de um item da agenda (lançamento ou evento Google). */
export function EventDetailsDialog({ item, canEdit, onEdit, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (el && !el.open) el.showModal();
  }, []);

  const kind = AGENDA_KINDS[item.kind];
  const isTx = item.source === 'transaction';
  const rows = [
    ['Quando', `${formatDayFull(item.dayKey)}${item.timeLabel ? ` · ${item.timeLabel}` : ''}`],
    ['Tipo', kind.label],
  ];
  if (isTx) {
    rows.push(['Categoria', item.title]);
    rows.push(['Valor', `${item.isIncome ? '+' : '−'} ${formatBrl(item.amount)}`]);
    rows.push(['Situação', STATUS_LABEL[item.status] || item.status || '—']);
    if (item.subtitle) rows.push(['Observação', item.subtitle]);
  } else {
    if (item.subtitle) rows.push(['Detalhes', item.subtitle]);
    if (item.location) rows.push(['Local', item.location]);
    if (item.raw?.recurrence?.length) rows.push(['Repetição', 'Evento recorrente']);
  }

  return (
    <dialog
      ref={dialogRef}
      className={m.dialog}
      aria-labelledby="ev-details-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className={m.body}>
        <header className={m.head}>
          <h2 className={m.title} id="ev-details-title">
            {isTx ? item.subtitle || item.title : item.title}
          </h2>
          <button type="button" className={m.close} onClick={onClose} aria-label="Fechar">
            <Icon name="x" size={18} />
          </button>
        </header>

        <KindPill item={item} />

        <dl className={s.detailList}>
          {rows.map(([k, v]) => (
            <div key={k} style={{ display: 'contents' }}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>

        <div className={s.detailActions}>
          {canEdit(item) ? (
            <Button
              icon="pencil"
              onClick={() => {
                onClose();
                onEdit(item);
              }}
            >
              Editar
            </Button>
          ) : null}
          {isTx ? (
            <Link href={`/transacoes?mes=${toMonthParam(monthOfKey(item.dayKey))}`} className={s.miniBtn} style={{ height: 40, padding: '0 14px', fontSize: 'var(--fs-base)' }}>
              <Icon name="arrow-left-right" size={14} /> Ver em Transações
            </Link>
          ) : (
            <>
              {item.meetLink ? (
                <a className={s.miniBtn} style={{ height: 40, padding: '0 14px', fontSize: 'var(--fs-base)' }} href={item.meetLink} target="_blank" rel="noreferrer">
                  <Icon name="video" size={14} /> Entrar no Meet
                </a>
              ) : null}
              <a
                className={s.miniBtn}
                style={{ height: 40, padding: '0 14px', fontSize: 'var(--fs-base)' }}
                href={item.htmlLink && !item.htmlLink.includes('msg=') ? item.htmlLink : googleCalendarDayUrl(item.dayKey)}
                target="_blank"
                rel="noreferrer"
              >
                <Icon name="external-link" size={14} /> Abrir no Google Agenda
              </a>
            </>
          )}
        </div>
      </div>
    </dialog>
  );
}
