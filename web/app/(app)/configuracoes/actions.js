'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/session';
import { backendFetch } from '@/lib/auth/backendApi';
import { authErrorMessage, validateOptionalDisplayName, validateSignupEmail } from '@/lib/auth/validation';
import { getPhoneValidationError, normalizePhoneDigits } from '@/lib/phone/phone';
import { checkGoogleAuth, disconnectGoogle, getGoogleAuthUrl } from '@/lib/data/googleCalendar';

async function sessionToken(supabase) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token || null;
}

/**
 * Nome exibido — mesma gravação do `authStore.updateDisplayName` do Expo:
 * `user_metadata.display_name` + espelho best-effort em `profiles.display_name`.
 */
export async function updateDisplayNameAction(displayName) {
  const { supabase, userId } = await requireUser();
  const name = String(displayName || '').trim();
  if (!name) return { ok: false, error: 'Por favor, insira um nome válido.' };
  const invalid = validateOptionalDisplayName(name);
  if (invalid) return { ok: false, error: invalid };

  const { data, error } = await supabase.auth.updateUser({ data: { display_name: name } });
  if (error) return { ok: false, error: authErrorMessage(error) };

  try {
    await supabase.from('profiles').upsert({ id: data.user?.id || userId, display_name: name }, { onConflict: 'id' });
  } catch (profileError) {
    console.warn('[Configurações] profiles.display_name não atualizado:', profileError?.message || profileError);
  }

  revalidatePath('/', 'layout');
  return { ok: true, displayName: data.user?.user_metadata?.display_name || name };
}

/**
 * Telefone — mesma rota do app atual (`POST /api/auth/update-phone`): o backend valida,
 * libera o número de outras contas e sincroniza o vínculo do WhatsApp.
 */
export async function updatePhoneAction(phone) {
  const { supabase } = await requireUser();
  const digits = normalizePhoneDigits(phone);
  const invalid = getPhoneValidationError(digits);
  if (invalid) return { ok: false, error: invalid };

  const token = await sessionToken(supabase);
  if (!token) return { ok: false, error: 'Sessão expirada. Entre novamente.' };

  try {
    const result = await backendFetch('/auth/update-phone', { method: 'POST', body: { phone: digits }, token });
    revalidatePath('/configuracoes');
    return { ok: true, phone: String(result?.phone || digits) };
  } catch (err) {
    const message = String(err?.message || '');
    if (/outra conta/i.test(message) || /PHONE_ALREADY_LINKED/.test(message)) {
      return { ok: false, error: 'Este número de WhatsApp já está em outra conta. Entre na conta certa ou peça ao suporte para desvincular.' };
    }
    return { ok: false, error: message || 'Erro ao salvar telefone. Por favor, tente novamente.' };
  }
}

/**
 * Alteração de e-mail — `supabase.auth.updateUser({ email })` como no Expo:
 * o Supabase envia o link de confirmação e o e-mail só muda depois do clique.
 */
export async function changeEmailAction(email) {
  const { supabase, user } = await requireUser();
  const next = String(email || '').trim().toLowerCase();
  if (!next) return { ok: false, error: 'Por favor, insira um e-mail.' };
  const invalid = validateSignupEmail(next);
  if (invalid) return { ok: false, error: 'E-mail inválido.' };
  if (next === String(user.email || '').trim().toLowerCase()) {
    return { ok: false, error: 'Informe um e-mail diferente do atual.' };
  }

  const { error } = await supabase.auth.updateUser({ email: next });
  if (error) return { ok: false, error: authErrorMessage(error) };
  return {
    ok: true,
    message: `Enviamos um link de confirmação para ${next}. O e-mail só passa a valer após você clicar no link.`,
  };
}

/** URL OAuth do Google; a edge function devolve para `/configuracoes?googleCalendar=connected|error`. */
export async function googleAuthUrlFromSettingsAction(origin) {
  const { supabase } = await requireUser();
  const clean = String(origin || '').trim();
  if (!/^https?:\/\/[^/]+$/.test(clean)) return { ok: false, error: 'Origem inválida.' };
  try {
    const authUrl = await getGoogleAuthUrl(supabase, `${clean}/configuracoes`);
    return { ok: true, authUrl };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

export async function disconnectGoogleFromSettingsAction() {
  const { supabase } = await requireUser();
  try {
    await disconnectGoogle(supabase);
    const still = await checkGoogleAuth(supabase);
    if (still) return { ok: false, error: 'A desconexão não foi concluída no servidor. Tente novamente.' };
    revalidatePath('/configuracoes');
    revalidatePath('/agenda');
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

/** Configuração do formulário de chamado (nome do projeto) — `GET /api/support/ticket-form`. */
export async function supportTicketFormAction() {
  const { supabase } = await requireUser();
  const token = await sessionToken(supabase);
  if (!token) return { ok: false, error: 'Sessão expirada. Entre novamente.' };
  try {
    const data = await backendFetch('/support/ticket-form', { token });
    return { ok: true, projeto: data?.projeto || { nome: 'Meu Financeiro' } };
  } catch (err) {
    return { ok: false, error: err?.message || 'Não foi possível carregar o formulário de suporte.' };
  }
}
