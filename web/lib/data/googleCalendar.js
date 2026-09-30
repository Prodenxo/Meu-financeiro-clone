import 'server-only';
import { getSupabasePublicEnv } from '@/lib/supabase/env';

/**
 * Cliente da edge function `google-calendar` (a mesma que o app Expo usa em
 * `frontend/lib/google-calendar.ts`). Roda só no servidor: o token da sessão
 * Supabase vai no `Authorization` e nunca chega ao navegador.
 */

function functionsBase() {
  const { url } = getSupabasePublicEnv();
  return `${url.replace(/\/rest\/v1$/, '').replace(/\/$/, '')}/functions/v1/google-calendar`;
}

async function sessionToken(supabase) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token || null;
}

/**
 * @returns {Promise<{ ok: boolean, status: number, data: any }>}
 */
export async function googleCalendarRequest(supabase, path, { method = 'GET', query, body } = {}) {
  const token = await sessionToken(supabase);
  if (!token) return { ok: false, status: 401, data: { error: 'Usuário não autenticado' } };

  const { anonKey } = getSupabasePublicEnv();
  const url = new URL(`${functionsBase()}/${path}`);
  for (const [k, v] of Object.entries(query || {})) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }

  let res;
  try {
    res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(anonKey ? { apikey: anonKey } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });
  } catch (error) {
    console.error(`Error in google-calendar/${path}:`, error);
    return { ok: false, status: 0, data: { error: 'Não foi possível falar com o Google Agenda.' } };
  }

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return { ok: res.ok, status: res.status, data };
}

const errorMessage = (data, fallback) => (data && typeof data.error === 'string' && data.error) || fallback;

/** `true` quando há token válido (a função renova o access token se expirou). */
export async function checkGoogleAuth(supabase) {
  const r = await googleCalendarRequest(supabase, 'check-auth');
  return Boolean(r.ok && r.data?.authenticated);
}

/** Eventos do calendário principal no intervalo. Lança erro com mensagem amigável. */
export async function listGoogleEvents(supabase, { timeMin, timeMax }) {
  const r = await googleCalendarRequest(supabase, 'events', { query: { timeMin, timeMax } });
  if (!r.ok) throw new Error(errorMessage(r.data, 'Erro ao listar eventos do Google Agenda'));
  const events = r.data?.events || r.data?.items || (Array.isArray(r.data) ? r.data : []);
  return Array.isArray(events) ? events : [];
}

/** URL de autorização OAuth; `returnTo` volta com `?googleCalendar=connected|error`. */
export async function getGoogleAuthUrl(supabase, returnTo) {
  const r = await googleCalendarRequest(supabase, 'auth', { query: { returnTo } });
  if (!r.ok || !r.data?.authUrl) throw new Error(errorMessage(r.data, 'Erro ao obter URL de autorização'));
  return String(r.data.authUrl);
}

export async function disconnectGoogle(supabase) {
  let r = await googleCalendarRequest(supabase, 'disconnect', { method: 'DELETE' });
  if (!r.ok && (r.status === 404 || r.status === 405)) {
    r = await googleCalendarRequest(supabase, 'disconnect', { method: 'POST' });
  }
  if (!r.ok) throw new Error(errorMessage(r.data, 'Erro ao desconectar Google Agenda'));
}

export async function createGoogleEvent(supabase, payload) {
  const r = await googleCalendarRequest(supabase, 'create-custom-event', { method: 'POST', body: payload });
  if (!r.ok) throw new Error(errorMessage(r.data, 'Erro ao criar compromisso'));
  return { eventId: String(r.data?.eventId || ''), hangoutLink: r.data?.hangoutLink || null };
}

export async function updateGoogleEvent(supabase, eventId, payload) {
  const r = await googleCalendarRequest(supabase, 'update-custom-event', { method: 'POST', body: { eventId, ...payload } });
  if (!r.ok) throw new Error(errorMessage(r.data, 'Erro ao atualizar compromisso'));
  return { eventId: String(r.data?.eventId || eventId), hangoutLink: r.data?.hangoutLink || null };
}

export async function deleteGoogleEvent(supabase, eventId) {
  const r = await googleCalendarRequest(supabase, 'delete-custom-event', { method: 'POST', body: { eventId } });
  if (!r.ok) throw new Error(errorMessage(r.data, 'Erro ao excluir compromisso'));
}
