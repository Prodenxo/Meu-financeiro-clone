'use client';

import { Alert, Button, Card, EmptyState, Pill, cx } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { formatBrl } from '@/lib/finance/format';
import { AGENDA_KINDS, formatDayFull } from '@/lib/finance/agenda';
import d from '@/components/dashboard/dashboard.module.css';
import t from '@/components/transactions/transactions.module.css';
import s from './agenda.module.css';

const PILL_TONE = { conta: 'danger', compromisso: 'primary', recebimento: 'success', lembrete: 'warning' };

/** Etiqueta do tipo do item (ou categoria do lançamento). */
export function KindPill({ item }) {
  const kind = AGENDA_KINDS[item.kind];
  const label = item.source === 'transaction' ? item.title : kind.label.replace(/s$/, '');
  return (
    <Pill tone={PILL_TONE[item.kind]} icon={kind.icon}>
      {label}
    </Pill>
  );
}

function StatusHint({ item }) {
  if (item.source !== 'transaction') return null;
  const done = item.isDone;
  return (
    <span className={cx(s.apptAmount, item.isIncome ? t.positive : t.negative)} title={done ? (item.isIncome ? 'Recebido' : 'Pago') : item.isIncome ? 'A receber' : 'A pagar'}>
      {item.isIncome ? '+' : '−'}
      {formatBrl(item.amount)}
      {!done ? <Icon name="clock" size={12} style={{ marginLeft: 4, verticalAlign: '-2px' }} /> : null}
    </span>
  );
}

/** Um compromisso do dia: horário, barra colorida, título, descrição, etiqueta e ações. */
export function AppointmentRow({ item, canEdit, onEdit, onDetails }) {
  return (
    <article className={s.appt} aria-label={item.title}>
      {item.time ? <span className={s.apptTime}>{item.time}</span> : <span className={s.apptTimeAll}>{item.source === 'google' ? 'Dia inteiro' : 'Sem hora'}</span>}
      <span className={s.apptBar} style={{ background: item.color }} aria-hidden="true" />
      <div className={s.apptBody}>
        <div className={s.apptTop}>
          <div style={{ minWidth: 0 }}>
            <h3 className={s.apptTitle} title={item.title}>
              {item.source === 'transaction' ? (item.subtitle || item.title) : item.title}
            </h3>
            {item.source === 'google' && item.subtitle ? (
              <p className={s.apptSub} title={item.subtitle}>
                {item.subtitle}
              </p>
            ) : item.source === 'transaction' && item.subtitle ? (
              <p className={s.apptSub}>{item.title}</p>
            ) : item.location ? (
              <p className={s.apptSub}>
                <Icon name="map-pin" size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} />
                {item.location}
              </p>
            ) : null}
          </div>
          {item.source === 'google' ? (
            <span className={s.googleMark} title="Evento do Google Agenda" aria-label="Google Agenda">
              G
            </span>
          ) : (
            <StatusHint item={item} />
          )}
        </div>
        <div className={s.apptFoot}>
          <KindPill item={item} />
          <div className={s.apptActions}>
            {item.meetLink ? (
              <a className={s.miniBtn} href={item.meetLink} target="_blank" rel="noreferrer">
                <Icon name="video" size={13} /> Meet
              </a>
            ) : null}
            <button type="button" className={s.miniBtn} onClick={() => onEdit(item)} disabled={!canEdit(item)} title={canEdit(item) ? undefined : 'Conecte o Google Agenda para editar'}>
              <Icon name="pencil" size={13} /> Editar
            </button>
            <button type="button" className={s.miniBtn} onClick={() => onDetails(item)}>
              <Icon name="eye" size={13} /> Detalhes
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

/**
 * Card "Compromissos do dia" — sempre o dia selecionado no calendário, com o estado
 * da ligação Google (carregando / erro / não conectado) como no app atual.
 */
export function DailyAppointments({ dayKey, items, google, loading, onRetry, canEdit, onEdit, onDetails, onNew }) {
  const count = items.length;
  return (
    <Card aria-labelledby="agenda-day-title">
      <div className={s.apptHead}>
        <div>
          <h2 className={d.sectionTitle} id="agenda-day-title">
            Compromissos do dia
          </h2>
          <p className={d.sectionSub}>{formatDayFull(dayKey)}</p>
        </div>
        <Pill tone="primary">{`${count} ${count === 1 ? 'compromisso' : 'compromissos'}`}</Pill>
      </div>

      {loading ? (
        <p className={d.sectionSub} role="status" style={{ marginTop: 12 }}>
          Carregando eventos do Google…
        </p>
      ) : null}

      {google.error ? (
        <div style={{ marginTop: 12 }}>
          <Alert tone="error">
            {google.error}{' '}
            <button type="button" className={t.linkButton} onClick={onRetry}>
              Tentar novamente
            </button>
          </Alert>
        </div>
      ) : null}

      {!loading && !google.error && !google.connected ? (
        <p className={d.sectionSub} style={{ marginTop: 12 }}>
          Google Agenda não conectado — mostrando apenas lançamentos.
        </p>
      ) : null}

      {count === 0 ? (
        <EmptyState
          icon="calendar-days"
          title="Nenhum compromisso neste dia"
          text="Selecione outro dia no calendário ou crie um novo compromisso."
          action={
            <Button icon="plus" variant="outline" onClick={onNew}>
              Novo compromisso
            </Button>
          }
        />
      ) : (
        <div className={s.apptList}>
          {items.map((item) => (
            <AppointmentRow key={item.id} item={item} canEdit={canEdit} onEdit={onEdit} onDetails={onDetails} />
          ))}
        </div>
      )}
    </Card>
  );
}
