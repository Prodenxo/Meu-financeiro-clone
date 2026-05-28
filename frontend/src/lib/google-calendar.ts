import { apiClient } from '../services/apiClient';

export interface GoogleCalendarEvent {
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
}

export interface GoogleCalendarListEvent {
  id: string;
  summary?: string;
  description?: string;
  start?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  status?: string;
}

/**
 * Verifica se o usuário está autenticado no Google Calendar
 */
export async function checkGoogleAuth(): Promise<{ authenticated: boolean; error?: string }> {
  try {
    const data = await apiClient.get<{ authenticated: boolean }>('/google-calendar/check-auth');
    return { authenticated: data.authenticated || false };
  } catch (error: any) {
    console.error('Erro ao verificar autenticação Google:', error);
    return { authenticated: false, error: error.message };
  }
}

/**
 * Lista eventos do Google Calendar
 */
export async function listCalendarEvents(params?: {
  timeMin?: string;
  timeMax?: string;
}): Promise<{ events: GoogleCalendarListEvent[]; error?: string }> {
  try {
    const query = new URLSearchParams();
    if (params?.timeMin) query.set('timeMin', params.timeMin);
    if (params?.timeMax) query.set('timeMax', params.timeMax);
    const queryString = query.toString();
    const url = queryString ? `/google-calendar/events?${queryString}` : '/google-calendar/events';
    const data = await apiClient.get<{ events: GoogleCalendarListEvent[] }>(url);
    return { events: data.events || [] };
  } catch (error: any) {
    console.error('Erro ao listar eventos do Google:', error);
    return { events: [], error: error.message };
  }
}

/**
 * Inicia o fluxo de autenticação OAuth do Google Calendar
 * @param returnTo URL de retorno após autorização (ex.: página de configurações)
 */
export async function startGoogleAuth(returnTo?: string): Promise<{ url?: string; error?: string }> {
  try {
    const query = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : '';
    const data = await apiClient.get<{ authUrl?: string; url?: string }>(`/google-calendar/auth${query}`);
    const authUrl = data.authUrl || data.url;
    if (!authUrl) {
      throw new Error('URL de autorização não foi retornada pelo backend');
    }
    return { url: authUrl };
  } catch (error: any) {
    console.error('Erro ao iniciar autenticação Google:', error);
    return { error: error.message };
  }
}

/**
 * Cria um evento no Google Calendar
 */
export async function createCalendarEvent(event: GoogleCalendarEvent): Promise<{ success: boolean; eventId?: string; error?: string }> {
  try {
    const data = await apiClient.post<{ eventId: string }>('/google-calendar/create-event', event);
    return { success: true, eventId: data.eventId };
  } catch (error: any) {
    console.error('Erro ao criar evento no Google Calendar:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Cria um evento no Google Calendar baseado em uma transação
 */
export async function createEventFromTransaction(transaction: {
  tipo: 'entrada' | 'saída';
  valor: number;
  classificacao: string;
  data?: string | null;
  status: string;
  obs?: string | null;
}): Promise<{ success: boolean; eventId?: string; error?: string }> {
  // Apenas criar eventos para transações com status "a_receber" ou "a_pagar"
  if (transaction.status !== 'a_receber' && transaction.status !== 'a_pagar') {
    return { success: false, error: 'Apenas transações com status "a_receber" ou "a_pagar" criam eventos' };
  }

  const date = transaction.data ? new Date(transaction.data + 'T00:00:00') : new Date();
  const dateStr = date.toISOString().split('T')[0];
  
  const summary = `${transaction.tipo === 'entrada' ? 'Receber' : 'Pagar'}: ${transaction.classificacao} - R$ ${transaction.valor.toFixed(2)}`;
  const description = transaction.obs || `Transação: ${transaction.classificacao}`;

  const event: GoogleCalendarEvent = {
    summary,
    description,
    start: {
      date: dateStr,
      timeZone: 'America/Sao_Paulo',
    },
    end: {
      date: dateStr,
      timeZone: 'America/Sao_Paulo',
    },
  };

  return await createCalendarEvent(event);
}

const CERT_EXPIRATION_EVENT_SUMMARY = 'Vencimento do certificado digital';

/**
 * Cria um evento de dia inteiro no Google Calendar na data de vencimento do certificado digital.
 */
export async function createCertificateExpirationEvent(
  certValidTo: string
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  const d = new Date(certValidTo);
  if (!Number.isFinite(d.getTime())) {
    return { success: false, error: 'Data de validade do certificado inválida' };
  }
  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const event: GoogleCalendarEvent = {
    summary: CERT_EXPIRATION_EVENT_SUMMARY,
    description: 'Data de vencimento do certificado digital (MEI).',
    start: {
      date: dateStr,
      timeZone: 'America/Sao_Paulo',
    },
    end: {
      date: dateStr,
      timeZone: 'America/Sao_Paulo',
    },
  };
  return await createCalendarEvent(event);
}

export { CERT_EXPIRATION_EVENT_SUMMARY };
