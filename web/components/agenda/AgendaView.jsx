'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { deleteGoogleEventAction, disconnectGoogleAction, googleAuthUrlAction, loadGoogleMonthAction, syncGoogleAction } from '@/app/(app)/agenda/actions';
import { Alert, Button, cx } from '@/components/ui';
import { NewTransactionModal } from '@/components/dashboard/NewTransactionModal';
import { toMonthParam } from '@/lib/date';
import {
  addDays,
  buildAgendaItems,
  itemsOfDay,
  monthBounds,
  monthOfKey,
  monthSummary,
  periodLabel,
  upcomingItems,
} from '@/lib/finance/agenda';
import d from '@/components/dashboard/dashboard.module.css';
import t from '@/components/transactions/transactions.module.css';
import { CalendarHeader } from './CalendarHeader';
import { CalendarView } from './CalendarView';
import { DailyAppointments } from './DailyAppointments';
import { DeleteGoogleEventDialog } from './DeleteGoogleEventDialog';
import { EventDetailsDialog } from './EventDetailsDialog';
import { GoogleCalendarIntegration } from './GoogleCalendarIntegration';
import { GoogleEventModal } from './GoogleEventModal';
import { MonthSummary } from './MonthSummary';
import { QuickAgendaActions } from './QuickAgendaActions';
import { UpcomingEvents } from './UpcomingEvents';
import s from './agenda.module.css';

const MONTH_LONG = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

function AgendaHeader({ onToday, onNew }) {
  return (
    <header className={t.header}>
      <div>
        <p className={t.crumb}>Início / Agenda</p>
        <h1 className={t.title}>Agenda</h1>
        <p className={t.subtitle}>Organize seus compromissos financeiros e lembretes.</p>
      </div>
      <div className={t.headerActions}>
        <Button variant="outline" icon="calendar-days" onClick={onToday}>
          Hoje
        </Button>
        <Button icon="plus" onClick={onNew}>
          Novo compromisso
        </Button>
      </div>
    </header>
  );
}

function ConnectPrompt({ onConfirm, onClose, busy }) {
  return (
    <div className={t.toast} role="dialog" aria-label="Conectar Google Agenda">
      <Alert tone="info">
        <strong>Conectar Google Agenda</strong>
        <br />
        Para criar compromissos é preciso autorizar o acesso ao seu calendário do Google.
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <Button size="sm" onClick={onConfirm} disabled={busy}>
            Conectar
          </Button>
          <Button size="sm" variant="outline" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
        </div>
      </Alert>
    </div>
  );
}

/**
 * Tela Agenda. Lançamentos vêm todos do servidor; eventos Google chegam por mês
 * (primeiro mês no servidor, os demais por server action) — regras em `lib/finance/agenda.js`.
 */
export function AgendaView({ data, userEmail, todayKey, initialDay, initialView, oauthStatus }) {
  const [selectedDay, setSelectedDay] = useState(initialDay);
  const [view, setView] = useState(initialView);
  const [connected, setConnected] = useState(data.google.connected);
  const [googleByMonth, setGoogleByMonth] = useState(() => ({ [data.google.mes]: { events: data.google.events, error: data.google.error } }));
  const [loadingMonth, setLoadingMonth] = useState(null);
  const [modal, setModal] = useState(null); // { type: 'google'|'tx'|'details', ... }
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [connectPrompt, setConnectPrompt] = useState(null); // callback após conectar
  const [toast, setToast] = useState(() =>
    oauthStatus === 'connected'
      ? { tone: 'success', text: 'Google Agenda vinculada com sucesso!' }
      : oauthStatus === 'error'
        ? { tone: 'error', text: 'Não foi possível conectar o Google Agenda.' }
        : null,
  );
  const [isPending, startTransition] = useTransition();
  const requested = useRef(new Set([data.google.mes]));

  const mes = selectedDay.slice(0, 7);
  const month = useMemo(() => monthOfKey(selectedDay), [selectedDay]);
  const google = googleByMonth[mes] || { events: [], error: null };

  const items = useMemo(() => buildAgendaItems({ transactions: data.transactions, googleEvents: google.events, month }), [data.transactions, google.events, month]);

  const dayItems = useMemo(() => itemsOfDay(items, selectedDay), [items, selectedDay]);
  const upcoming = useMemo(() => upcomingItems(items, todayKey, 4), [items, todayKey]);
  const summary = useMemo(() => monthSummary(items), [items]);

  /* ---- toast + retorno do OAuth ---- */
  useEffect(() => {
    if (!toast) return undefined;
    const tm = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(tm);
  }, [toast]);

  useEffect(() => {
    if (!oauthStatus) return;
    // Limpa `?googleCalendar=` da URL depois de mostrar o aviso.
    const url = new URL(window.location.href);
    url.searchParams.delete('googleCalendar');
    window.history.replaceState(null, '', url.toString());
  }, [oauthStatus]);

  /* ---- eventos Google por mês ---- */
  const fetchMonth = useCallback(
    (key, force = false) => {
      if (!force && requested.current.has(key)) return;
      requested.current.add(key);
      setLoadingMonth(key);
      startTransition(async () => {
        const res = force ? await syncGoogleAction(key) : await loadGoogleMonthAction(key);
        if (res?.ok) {
          setConnected(Boolean(res.connected));
          setGoogleByMonth((cur) => ({ ...cur, [key]: { events: res.events || [], error: res.error || null } }));
        } else {
          setGoogleByMonth((cur) => ({ ...cur, [key]: { events: cur[key]?.events || [], error: res?.error || 'Erro ao carregar eventos do Google Agenda' } }));
        }
        setLoadingMonth((cur) => (cur === key ? null : cur));
      });
    },
    [startTransition],
  );

  useEffect(() => {
    if (connected) fetchMonth(mes);
  }, [mes, connected, fetchMonth]);

  /* ---- navegação ---- */
  const syncUrl = (day, v) => window.history.replaceState(null, '', `/agenda?dia=${day}&vista=${v}`);
  const goToDay = (day, v = view) => {
    setSelectedDay(day);
    syncUrl(day, v);
  };
  const changeView = (v) => {
    setView(v);
    syncUrl(selectedDay, v);
  };
  const navigate = (dir) => {
    if (view === 'week') return goToDay(addDays(selectedDay, 7 * dir));
    if (view === 'day') return goToDay(addDays(selectedDay, dir));
    const target = { year: month.year, month: month.month + dir };
    if (target.month === 0) {
      target.month = 12;
      target.year -= 1;
    } else if (target.month === 13) {
      target.month = 1;
      target.year += 1;
    }
    const { startKey } = monthBounds(target);
    return goToDay(todayKey.slice(0, 7) === startKey.slice(0, 7) ? todayKey : startKey);
  };

  /* ---- Google: conectar / sincronizar / desconectar ---- */
  const connectGoogle = () => {
    startTransition(async () => {
      const res = await googleAuthUrlAction(window.location.origin);
      if (res?.ok) window.location.assign(res.authUrl);
      else setToast({ tone: 'error', text: res?.error || 'Não foi possível iniciar a conexão com o Google.' });
    });
  };
  const syncNow = () => {
    fetchMonth(mes, true);
    setToast({ tone: 'info', text: 'Sincronizando com o Google Agenda…' });
  };
  const disconnect = () => {
    startTransition(async () => {
      const res = await disconnectGoogleAction();
      if (res?.ok) {
        setConnected(false);
        setGoogleByMonth({});
        requested.current = new Set();
        setToast({ tone: 'success', text: 'Google Agenda desconectado.' });
      } else {
        setToast({ tone: 'error', text: res?.error || 'Não foi possível desconectar.' });
      }
    });
  };

  /* ---- modais ---- */
  const requireGoogle = (next) => {
    if (connected) next();
    else setConnectPrompt(() => next);
  };
  const openNewEvent = (isAllDay = false) => requireGoogle(() => setModal({ type: 'google', event: null, defaults: { startDate: selectedDay, isAllDay } }));
  const openPayment = () => setModal({ type: 'tx' });
  const canEdit = (item) => item.source === 'transaction' || connected;
  const openEdit = (item) => {
    if (item.source === 'google') requireGoogle(() => setModal({ type: 'google', event: item.raw, defaults: { startDate: item.dayKey } }));
    else setModal({ type: 'tx', draft: item.raw });
  };
  const openDetails = (item) => setModal({ type: 'details', item });
  const closeModal = useCallback(() => setModal(null), []);

  const onGoogleSaved = useCallback(
    (res) => {
      setToast({ tone: 'success', text: res.mode === 'edit' ? `“${res.title}” atualizado no Google Agenda.` : `“${res.title}” criado no Google Agenda.` });
      requested.current.delete(res.mes);
      requested.current.delete(mes);
      fetchMonth(res.mes);
      if (res.mes !== mes) fetchMonth(mes);
    },
    [fetchMonth, mes],
  );

  const askDelete = (event) => {
    setModal(null);
    setDeleteError('');
    setDeleteTarget(event);
  };
  const confirmDelete = () => {
    const ev = deleteTarget;
    if (!ev) return;
    startTransition(async () => {
      const res = await deleteGoogleEventAction(ev.id);
      if (res?.ok) {
        setDeleteTarget(null);
        setToast({ tone: 'success', text: `“${ev.summary || 'Compromisso'}” excluído do Google Agenda.` });
        requested.current.delete(mes);
        fetchMonth(mes);
      } else {
        setDeleteError(res?.error || 'Não foi possível excluir.');
      }
    });
  };

  const scrollToDay = () => document.getElementById('agenda-day-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const contasAtivas = useMemo(() => data.contas.filter((c) => c.ativo), [data.contas]);
  const loading = loadingMonth === mes;

  return (
    <div className={s.page}>
      <AgendaHeader onToday={() => goToDay(todayKey)} onNew={() => openNewEvent(false)} />

      {isPending ? <div className={t.pendingBar} role="status" aria-label="Carregando" /> : null}

      <CalendarHeader label={periodLabel(view, month, selectedDay)} view={view} onPrev={() => navigate(-1)} onNext={() => navigate(1)} onView={changeView} />

      <div className={s.topGrid}>
        <div className={d.mainCol}>
          <CalendarView view={view} month={month} items={items} selectedDay={selectedDay} todayKey={todayKey} onSelect={(k) => goToDay(k)} onOpen={openDetails} />
          <QuickAgendaActions onNew={() => openNewEvent(false)} onReminder={() => openNewEvent(true)} onPayment={openPayment} busy={isPending} />
        </div>
        <aside className={s.sideCol}>
          <DailyAppointments
            dayKey={selectedDay}
            items={dayItems}
            google={{ connected, error: google.error }}
            loading={loading}
            onRetry={() => fetchMonth(mes, true)}
            canEdit={canEdit}
            onEdit={openEdit}
            onDetails={openDetails}
            onNew={() => openNewEvent(false)}
          />
        </aside>
      </div>

      <div className={s.bottomGrid}>
        <UpcomingEvents items={upcoming} onOpen={openDetails} onSeeAll={scrollToDay} />
        <MonthSummary summary={summary} monthName={MONTH_LONG[month.month - 1]} />
        <GoogleCalendarIntegration connected={connected} email={userEmail} busy={isPending} onConnect={connectGoogle} onSync={syncNow} onDisconnect={disconnect} />
      </div>

      {modal?.type === 'google' ? (
        <GoogleEventModal key={modal.event?.id || 'new'} event={modal.event} defaults={modal.defaults} onClose={closeModal} onSaved={onGoogleSaved} onDelete={askDelete} />
      ) : null}

      {modal?.type === 'tx' ? (
        <NewTransactionModal
          key={modal.draft?.id || 'new-tx'}
          mode={modal.draft ? 'edit' : 'create'}
          draft={modal.draft || null}
          initialTipo="saida"
          categories={data.categories.list}
          contas={contasAtivas}
          todayKey={selectedDay}
          onClose={closeModal}
        />
      ) : null}

      {modal?.type === 'details' ? <EventDetailsDialog item={modal.item} canEdit={canEdit} onEdit={openEdit} onClose={closeModal} /> : null}

      {deleteTarget ? (
        <DeleteGoogleEventDialog title={deleteTarget.summary} pending={isPending} error={deleteError} onConfirm={confirmDelete} onClose={() => setDeleteTarget(null)} />
      ) : null}

      {connectPrompt ? (
        <ConnectPrompt
          busy={isPending}
          onClose={() => setConnectPrompt(null)}
          onConfirm={() => {
            setConnectPrompt(null);
            connectGoogle();
          }}
        />
      ) : null}

      {toast && !connectPrompt ? (
        <div className={t.toast}>
          <Alert tone={toast.tone}>{toast.text}</Alert>
        </div>
      ) : null}

      <span className={cx('sr-only')} aria-live="polite">
        {isPending ? 'Carregando' : ''}
      </span>
    </div>
  );
}
