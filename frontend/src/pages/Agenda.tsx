import React, { useState, useEffect, useRef } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {
  checkGoogleAuth,
  listCalendarEvents,
  createCertificateExpirationEvent,
  CERT_EXPIRATION_EVENT_SUMMARY,
} from '../lib/google-calendar';
import { useTransactionStore } from '../store/transactionStore';
import { fetchMeiCertificateStatus } from '../services/guidesMeiService';
import type { MeiCertificateStatus } from '../services/guidesMeiService';
import PageShell from '../components/PageShell';
import PageTitle from '../components/PageTitle';
import LoadingOverlay from '../components/LoadingOverlay';
import FetchErrorBanner from '../components/FetchErrorBanner';

const locales = {
  'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const messages = {
  allDay: 'Dia todo',
  previous: '<',
  next: '>',
  today: 'Hoje',
  month: 'Mês',
  week: 'Semana',
  day: 'Dia',
  agenda: 'Agenda',
  date: 'Data',
  time: 'Hora',
  event: 'Evento',
  noEventsInRange: 'Não há eventos neste período.',
  showMore: (total: number) => `+ Ver mais (${total})`
};

export default function Agenda() {
  const [events, setEvents] = useState<any[]>([]);
  const [googleEvents, setGoogleEvents] = useState<any[]>([]);
  const [loadingGoogleEvents, setLoadingGoogleEvents] = useState(false);
  const [googleEventsError, setGoogleEventsError] = useState<string | null>(null);
  const [isGoogleAuthorized, setIsGoogleAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [meiCertificateStatus, setMeiCertificateStatus] = useState<MeiCertificateStatus | null>(null);
  const syncedCertValidToRef = useRef<string | null>(null);
  const { transactions } = useTransactionStore();

  useEffect(() => {
    let cancelled = false;
    fetchMeiCertificateStatus()
      .then((data) => { if (!cancelled) setMeiCertificateStatus(data); })
      .catch(() => { if (!cancelled) setMeiCertificateStatus(null); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const certValidTo = meiCertificateStatus?.certValidTo ?? null;
    if (
      !meiCertificateStatus?.hasUserCertificate ||
      !certValidTo ||
      !isGoogleAuthorized
    ) {
      return;
    }
    if (syncedCertValidToRef.current === certValidTo) {
      return;
    }
    syncedCertValidToRef.current = certValidTo;
    const d = new Date(certValidTo);
    if (!Number.isFinite(d.getTime())) return;
    const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
    const timeMin = startOfDay.toISOString();
    const timeMax = endOfDay.toISOString();
    listCalendarEvents({ timeMin, timeMax })
      .then(({ events: dayEvents, error }) => {
        if (error) return;
        const alreadyExists = (dayEvents ?? []).some(
          (e) => (e.summary ?? '').trim() === CERT_EXPIRATION_EVENT_SUMMARY
        );
        if (alreadyExists) return;
        return createCertificateExpirationEvent(certValidTo);
      })
      .then((result) => {
        if (result && !result.success && result.error) {
          console.warn('[Agenda] Não foi possível criar evento de vencimento do certificado no Google:', result.error);
        }
      })
      .catch((err) => {
        console.warn('[Agenda] Sync evento vencimento certificado no Google:', err);
      });
  }, [meiCertificateStatus?.hasUserCertificate, meiCertificateStatus?.certValidTo, isGoogleAuthorized]);

  useEffect(() => {
    checkAuthStatus();
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Criar eventos do calendário baseados em todas as transações com data
    const transactionEvents = transactions
      .filter(t => t.data)
      .map(t => {
        const date = new Date(t.data + 'T00:00:00');
        const statusLabel = t.status === 'recebido' ? 'Recebido' :
                          t.status === 'pago' ? 'Pago' :
                          t.status === 'a_receber' ? 'A Receber' :
                          t.status === 'a_pagar' ? 'A Pagar' : t.status;
        return {
          title: `${statusLabel}: ${t.classificacao} - R$ ${t.valor.toFixed(2)}`,
          start: date,
          end: date,
          allDay: true,
          tipo: t.tipo,
          status: t.status,
          source: 'transaction',
        };
      });
    const certEvents: typeof transactionEvents = [];
    if (meiCertificateStatus?.hasUserCertificate && meiCertificateStatus?.certValidTo) {
      const certDate = new Date(meiCertificateStatus.certValidTo);
      if (Number.isFinite(certDate.getTime())) {
        const start = new Date(certDate.getFullYear(), certDate.getMonth(), certDate.getDate());
        certEvents.push({
          title: 'Vencimento do certificado digital',
          start,
          end: new Date(start),
          allDay: true,
          source: 'certificate',
        });
      }
    }
    setEvents([...transactionEvents, ...googleEvents, ...certEvents]);
  }, [transactions, googleEvents, meiCertificateStatus]);

  useEffect(() => {
    if (!isGoogleAuthorized) {
      setGoogleEvents([]);
      setGoogleEventsError(null);
      return;
    }

    fetchGoogleEvents();
  }, [isGoogleAuthorized]);

  const checkAuthStatus = async () => {
    setCheckingAuth(true);
    const { authenticated } = await checkGoogleAuth();
    setIsGoogleAuthorized(authenticated);
    setCheckingAuth(false);
  };

  const fetchGoogleEvents = async () => {
    setLoadingGoogleEvents(true);
    setGoogleEventsError(null);

    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const { events: googleItems, error } = await listCalendarEvents({
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
    });

    if (error) {
      setGoogleEvents([]);
      setGoogleEventsError(error);
      setLoadingGoogleEvents(false);
      return;
    }

    const calendarEvents = googleItems
      .map(item => {
        const startRaw = item.start?.dateTime || item.start?.date;
        if (!startRaw) return null;
        const endRaw = item.end?.dateTime || item.end?.date || startRaw;

        const startDate = new Date(startRaw.includes('T') ? startRaw : `${startRaw}T00:00:00`);
        let endDate = new Date(endRaw.includes('T') ? endRaw : `${endRaw}T00:00:00`);

        const allDay = !!item.start?.date && !item.start?.dateTime;
        if (allDay && item.end?.date) {
          endDate = new Date(item.end.date + 'T00:00:00');
          endDate.setDate(endDate.getDate() - 1);
        }

        return {
          title: item.summary || 'Evento do Google',
          start: startDate,
          end: endDate,
          allDay,
          source: 'google',
          status: item.status,
        };
      })
      .filter(Boolean);

    setGoogleEvents(calendarEvents);
    setLoadingGoogleEvents(false);
  };

  return (
    <PageShell>
      <PageTitle subtitle="Visualize seus pagamentos futuros e eventos">Agenda</PageTitle>
      <div className="h-full flex flex-col">
        {checkingAuth ? (
          <div className="planner-card mb-4 overflow-hidden p-0 md:mb-8">
            <LoadingOverlay message="A verificar ligação ao Google Calendar…" className="min-h-[100px] rounded-xl" />
          </div>
        ) : !isGoogleAuthorized ? (
          <div className="planner-card p-4 md:p-6 mb-4 md:mb-8">
            <h2 className="text-lg md:text-xl font-semibold mb-4 dark:text-white">Integração com Google Agenda</h2>
            <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 mb-4">
              Para visualizar seus pagamentos futuros como eventos, autorize o acesso à sua agenda do Google.
            </p>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-500 mb-4">
              Você pode fazer isso nas <a href="/settings" className="text-blue-600 dark:text-blue-400 underline">Configurações</a>.
            </p>
          </div>
        ) : (
          <div className="bg-emerald-100/70 dark:bg-emerald-900/40 p-3 rounded-xl mb-4 md:mb-8 flex items-center justify-between border border-emerald-200/60 dark:border-emerald-800/60">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm md:text-base text-emerald-600 dark:text-emerald-300">
                Google Calendar conectado
              </p>
            </div>
          </div>
        )}

        {isGoogleAuthorized && (
          <>
            {loadingGoogleEvents ? (
              <div className="planner-card mb-4 overflow-hidden p-0 md:mb-8">
                <LoadingOverlay message="A carregar eventos do Google Calendar…" className="min-h-[88px] rounded-xl" />
              </div>
            ) : null}
            {googleEventsError ? (
              <FetchErrorBanner
                title="Não foi possível carregar eventos do Google Calendar"
                message={googleEventsError}
                onRetry={() => void fetchGoogleEvents()}
              />
            ) : null}
          </>
        )}

        {meiCertificateStatus?.hasUserCertificate && meiCertificateStatus?.certValidTo && (
          <div className="bg-slate-100 dark:bg-slate-800/60 p-3 rounded-xl mb-4 md:mb-8 border border-slate-200/60 dark:border-slate-700/60">
            <p className="text-sm md:text-base text-slate-700 dark:text-slate-300">
              Certificado digital válido até{' '}
              {new Date(meiCertificateStatus.certValidTo).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })}
              .
            </p>
          </div>
        )}

        <div className="planner-card p-4 md:p-6 flex-grow">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ minHeight: isMobile ? 400 : 600 }}
            messages={messages}
            culture='pt-BR'
            defaultView='month'
            eventPropGetter={(event) => {
              let backgroundColor: string;

              if (event.source === 'certificate') {
                backgroundColor = '#D97706';
              } else if (event.source === 'google') {
                backgroundColor = '#2563EB';
              } else if (event.tipo === 'entrada') {
                // Entradas: verde escuro para recebido, verde claro/amarelo para a_receber
                backgroundColor = event.status === 'recebido' ? '#10B981' : '#84CC16';
              } else {
                // Saídas: vermelho escuro para pago, laranja para a_pagar
                backgroundColor = event.status === 'pago' ? '#DC2626' : '#F97316';
              }
              
              return { style: { backgroundColor, color: 'white', borderRadius: '5px', border: 'none' } };
            }}
          />
        </div>

        {/* Lista de eventos do mês - Mobile */}
        {events.length > 0 && (
          <div className="mt-4 md:hidden">
            <h2 className="text-lg font-semibold mb-3 dark:text-white">Eventos do Mês</h2>
            <div className="space-y-2">
              {events.slice(0, 5).map((event, idx) => (
                <div key={idx} className="planner-card-muted p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium dark:text-white">
                        {new Date(event.start).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - {event.title}
                      </p>
                    </div>
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ 
                        backgroundColor: event.source === 'certificate'
                          ? '#D97706'
                          : event.source === 'google'
                            ? '#2563EB'
                            : (event.tipo === 'entrada' 
                              ? (event.status === 'recebido' ? '#10B981' : '#84CC16')
                              : (event.status === 'pago' ? '#DC2626' : '#F97316'))
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
