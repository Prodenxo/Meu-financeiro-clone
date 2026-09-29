'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { backendFetch } from '@/lib/auth/backendApi';
import {
  authErrorMessage,
  cleanPhone,
  isValidCnpjDigits,
  isValidCpfDigits,
  validateOptionalDisplayName,
  validateSignupEmail,
  validateStrongPassword,
} from '@/lib/auth/validation';

const str = (formData, key) => String(formData.get(key) ?? '').trim();

function safeNext(next) {
  return next.startsWith('/') && !next.startsWith('//') ? next : '/visao-geral';
}

/** Login com e-mail e senha (mesmo `signInWithPassword` do app Expo). */
export async function signInAction(_prevState, formData) {
  const email = str(formData, 'email');
  const password = String(formData.get('password') || '');
  const next = str(formData, 'next');

  if (!email || !password) {
    return { error: 'Por favor, preencha todos os campos.', email };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: authErrorMessage(error), email };

  redirect(safeNext(next));
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/login');
}

/**
 * Recuperação de senha — mesma chamada do Expo (`POST /api/auth/reset-password`):
 * o backend monta o link (com `token_hash`) e envia o e-mail.
 */
export async function forgotPasswordAction(_prevState, formData) {
  const email = str(formData, 'email').toLowerCase();
  if (!email) return { error: 'Por favor, informe seu e-mail.' };
  const emailError = validateSignupEmail(email);
  if (emailError) return { error: emailError, email };

  try {
    await backendFetch('/auth/reset-password', { method: 'POST', body: { email } });
  } catch (err) {
    return { error: err.message || 'Erro ao enviar link de recuperação.', email };
  }
  return {
    ok: true,
    message:
      'Se este e-mail estiver cadastrado, enviamos um link de recuperação. Verifique a caixa de entrada e o spam. ' +
      'E-mails @hotmail/@outlook podem demorar ou ir para lixo eletrônico. Aguarde 1 minuto entre tentativas. ' +
      'O link expira em cerca de 1 hora.',
  };
}

/**
 * Cadastro com convite — porta de `authStore.signUp` + `RegisterAuthForm`:
 * cria a conta, garante o profile e vincula à empresa via `POST /api/invites/accept`.
 */
export async function signUpWithInviteAction(_prevState, formData) {
  const email = str(formData, 'email');
  const displayName = str(formData, 'displayName');
  const phone = str(formData, 'phone');
  const password = String(formData.get('password') || '');
  const inviteToken = str(formData, 'convite');
  const values = { email, displayName, phone };

  if (!email || !password.trim() || !displayName || !phone) {
    return { error: 'Todos os campos são obrigatórios. Por favor, preencha Nome, E-mail, Telefone e Senha.', values };
  }
  const eEmail = validateSignupEmail(email);
  if (eEmail) return { error: eEmail, values };
  const eName = validateOptionalDisplayName(displayName);
  if (eName) return { error: eName, values };
  const pwd = validateStrongPassword(password);
  if (!pwd.ok) return { error: pwd.message, values };
  if (!inviteToken) return { error: 'Nenhum convite detectado.', values };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { phone: cleanPhone(phone), display_name: displayName || null } },
  });
  if (error) return { error: authErrorMessage(error), values };
  if (!data.user) return { error: 'Não foi possível criar a conta. Tente novamente.', values };

  if (!data.session) {
    await supabase.auth.signOut();
    return {
      ok: true,
      needsEmailConfirmation: true,
      message: `Verifique seu e-mail (${data.user.email ?? email}) para confirmar a conta. Depois faça login.`,
    };
  }

  try {
    await supabase.functions.invoke('ensure-profile');
  } catch (err) {
    console.warn('[signUp] ensure-profile falhou:', err?.message || err);
  }
  try {
    await backendFetch('/invites/accept', {
      method: 'POST',
      body: { token: inviteToken, mei: false },
      token: data.session.access_token,
    });
  } catch (err) {
    console.warn('[signUp] aceitar convite falhou:', err?.message || err);
  }

  redirect('/visao-geral');
}

/**
 * Solicitação de acesso (cadastro público) — mesma Edge Function do Expo
 * (`submit-access-request`); a conta só é liberada após aprovação.
 */
export async function submitAccessRequestAction(_prevState, formData) {
  const pessoaTipo = str(formData, 'pessoaTipo') === 'pf' ? 'pf' : 'pj';
  const v = {
    fullName: str(formData, 'fullName'),
    email: str(formData, 'email'),
    phone: str(formData, 'phone'),
    cnpj: str(formData, 'cnpj'),
    cpf: str(formData, 'cpf'),
    razaoSocial: str(formData, 'razaoSocial'),
    nomeFantasia: str(formData, 'nomeFantasia'),
    cep: str(formData, 'cep'),
    logradouro: str(formData, 'logradouro'),
    numero: str(formData, 'numero'),
    complemento: str(formData, 'complemento'),
    bairro: str(formData, 'bairro'),
    cidade: str(formData, 'cidade'),
    estado: str(formData, 'estado').toUpperCase(),
    empresaTelefone: str(formData, 'empresaTelefone'),
    empresaEmail: str(formData, 'empresaEmail'),
  };
  const password = String(formData.get('password') || '');
  const confirmPassword = String(formData.get('confirmPassword') || '');
  const fail = (error) => ({ error });

  if (!v.fullName || !v.email || !v.phone || !password.trim() || !confirmPassword.trim()) {
    return fail('Preencha todos os campos obrigatórios da seção "Seus dados".');
  }
  const eEmail = validateSignupEmail(v.email);
  if (eEmail) return fail(eEmail);
  const eName = validateOptionalDisplayName(v.fullName);
  if (eName) return fail(eName);
  const pwd = validateStrongPassword(password);
  if (!pwd.ok) return fail(pwd.message);
  if (password !== confirmPassword) return fail('As senhas não conferem.');

  const docDigits = (pessoaTipo === 'pf' ? v.cpf : v.cnpj).replace(/\D/g, '');
  if (pessoaTipo === 'pj') {
    if (!isValidCnpjDigits(docDigits)) return fail('Informe um CNPJ válido.');
    if (!v.razaoSocial && !v.nomeFantasia) return fail('Informe a razão social ou o nome fantasia.');
  } else if (!isValidCpfDigits(docDigits)) {
    return fail('Informe um CPF válido.');
  }

  const nomeEmpresaPf = v.nomeFantasia || v.razaoSocial || v.fullName;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.functions.invoke('submit-access-request', {
    body: {
      user: { fullName: v.fullName, email: v.email, phone: v.phone || null, password },
      empresa: {
        tipoPessoa: pessoaTipo,
        cnpj: docDigits,
        razaoSocial: pessoaTipo === 'pf' ? v.razaoSocial || nomeEmpresaPf : v.razaoSocial,
        nomeFantasia: pessoaTipo === 'pf' ? v.nomeFantasia || nomeEmpresaPf : v.nomeFantasia,
        cep: v.cep.replace(/\D/g, ''),
        logradouro: v.logradouro,
        numero: v.numero,
        complemento: v.complemento,
        bairro: v.bairro,
        cidade: v.cidade,
        estado: v.estado,
        telefone: v.empresaTelefone,
        email: v.empresaEmail,
      },
      observacao: null,
    },
  });

  if (error) {
    let msg = 'Não foi possível enviar a solicitação. Tente novamente.';
    try {
      const body = await error.context?.json?.();
      if (typeof body?.error === 'string') msg = body.error;
    } catch {
      /* mantém mensagem padrão */
    }
    return fail(msg);
  }
  if (data && typeof data.error === 'string') return fail(data.error);

  return { ok: true };
}
