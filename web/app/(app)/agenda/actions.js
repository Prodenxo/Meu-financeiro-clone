'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/session';
import { parseMonthParam } from '@/lib/date';
import { formToGooglePayload, validateGoogleForm } from '@/lib/finance/agenda';
import { fetchGoogleMonth } from '@/lib/data/agenda';
import {
  checkGoogleAuth,
  createGoogleEvent,
  deleteGoogleEvent,
  disconnectGoogle,
  getGoogleAuthUrl,
  updateGoogleEvent,
} from '@/lib/data/googleCalendar';

/** Eventos Google de outro mês (troca de mês na tela). */
export async function loadGoogleMonthAction(mes) {
  const { supabase } = await requireUser();
  const month = parseMonthParam(mes, null);
  if (!month) return { ok: false, error: 'Mês inválido.' };
  const connected = await checkGoogleAuth(supabase);
  if (!connected) return { ok: true, connected: false, mes, events: [], error: null };
  const data = await fetchGoogleMonth(supabase, month);
  return { ok: true, connected: true, ...data };
}

/** Recarrega estado da ligação + eventos do mês ("Sincronizar agora"). */
export async function syncGoogleAction(mes) {
  const res = await loadGoogleMonthAction(mes);
  if (res.ok) revalidatePath('/agenda');
  return res;
}

/** URL para ligar a conta Google; a função devolve o utilizador a `returnTo?googleCalendar=...`. */
export async function googleAuthUrlAction(origin) {
  const { supabase } = await requireUser();
  const clean = String(origin || '').trim();
  if (!/^https?:\/\/[^/]+$/.test(clean)) return { ok: false, error: 'Origem inválida.' };
  try {
    const authUrl = await getGoogleAuthUrl(supabase, `${clean}/agenda`);
    return { ok: true, authUrl };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

export async function disconnectGoogleAction() {
  const { supabase } = await requireUser();
  try {
    await disconnectGoogle(supabase);
    const still = await checkGoogleAuth(supabase);
    if (still) return { ok: false, error: 'A desconexão não foi concluída no servidor. Tente novamente.' };
    revalidatePath('/agenda');
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

const FIELDS = ['title', 'description', 'location', 'startDate', 'endDate', 'startTime', 'endTime', 'colorId', 'recurrence', 'reminderMinutes'];

function readForm(formData) {
  const form = {};
  for (const f of FIELDS) form[f] = String(formData.get(f) ?? '').trim();
  form.isAllDay = formData.get('isAllDay') === 'on';
  form.createMeetLink = formData.get('createMeetLink') === 'on';
  form.eventId = String(formData.get('eventId') || '').trim();
  if (form.title.length > 200) form.title = form.title.slice(0, 200);
  return form;
}

/** Cria/edita compromisso no Google Agenda (mesmos campos do modal do app atual). */
export async function saveGoogleEventAction(_prev, formData) {
  const { supabase } = await requireUser();
  const form = readForm(formData);
  const errors = validateGoogleForm(form);
  if (Object.keys(errors).length) return { ok: false, errors };

  try {
    const payload = formToGooglePayload(form);
    const res = form.eventId ? await updateGoogleEvent(supabase, form.eventId, payload) : await createGoogleEvent(supabase, payload);
    revalidatePath('/agenda');
    return { ok: true, mode: form.eventId ? 'edit' : 'create', title: payload.title, mes: form.startDate.slice(0, 7), hangoutLink: res.hangoutLink };
  } catch (error) {
    return { ok: false, errors: { form: error.message || 'Não foi possível salvar o compromisso.' } };
  }
}

export async function deleteGoogleEventAction(eventId) {
  const { supabase } = await requireUser();
  const id = String(eventId || '').trim();
  if (!id) return { ok: false, error: 'Evento inválido.' };
  try {
    await deleteGoogleEvent(supabase, id);
    revalidatePath('/agenda');
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message || 'Não foi possível excluir o compromisso.' };
  }
}
