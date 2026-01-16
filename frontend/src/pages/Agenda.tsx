import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { checkGoogleAuth } from '../lib/google-calendar';
import { useTransactionStore } from '../store/transactionStore';
import Layout from '../Layout/Layout';

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
  const [isGoogleAuthorized, setIsGoogleAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const { transactions } = useTransactionStore();

  useEffect(() => {
    checkAuthStatus();
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Criar eventos do calendário baseados em todas as transações com data
    const calendarEvents = transactions
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
        };
      });
    setEvents(calendarEvents);
  }, [transactions]);

  const checkAuthStatus = async () => {
    setCheckingAuth(true);
    const { authenticated } = await checkGoogleAuth();
    setIsGoogleAuthorized(authenticated);
    setCheckingAuth(false);
  };

  return (
    <Layout>
      <div className="p-4 md:p-6 h-full flex flex-col">
        <h1 className="text-xl md:text-3xl font-bold mb-4 dark:text-white">Agenda</h1>
        <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 mb-4">
          Visualize seus pagamentos futuros e eventos
        </p>
        
        {checkingAuth ? (
          <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-md mb-4 md:mb-8">
            <p className="text-gray-600 dark:text-gray-400">Verificando autenticação...</p>
          </div>
        ) : !isGoogleAuthorized ? (
          <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-md mb-4 md:mb-8">
            <h2 className="text-lg md:text-xl font-semibold mb-4 dark:text-white">Integração com Google Agenda</h2>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-4">
              Para visualizar seus pagamentos futuros como eventos, autorize o acesso à sua agenda do Google.
            </p>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-500 mb-4">
              Você pode fazer isso nas <a href="/settings" className="text-blue-600 dark:text-blue-400 underline">Configurações</a>.
            </p>
          </div>
        ) : (
          <div className="bg-green-100 dark:bg-green-900 p-3 rounded-md mb-4 md:mb-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm md:text-base text-green-600 dark:text-green-300">
                Google Calendar conectado
              </p>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-md flex-grow">
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
              
              if (event.tipo === 'entrada') {
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
                <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium dark:text-white">
                        {new Date(event.start).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - {event.title}
                      </p>
                    </div>
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ 
                        backgroundColor: event.tipo === 'entrada' 
                          ? (event.status === 'recebido' ? '#10B981' : '#84CC16')
                          : (event.status === 'pago' ? '#DC2626' : '#F97316')
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
