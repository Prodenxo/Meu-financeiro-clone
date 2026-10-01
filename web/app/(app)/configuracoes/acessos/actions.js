'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/session';
import { backendFetch } from '@/lib/auth/backendApi';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { clearAdminBackup, readAdminBackup, saveAdminBackup } from '@/lib/auth/impersonation';
import { validateSignupEmail, validateStrongPassword } from '@/lib/auth/validation';
import { canManageAccess, formatManageUserError, ROLE_OPTIONS_SUPERADMIN } from '@/lib/acessos/acessos';
import { getAccessToken, fetchEmpresaById } from '@/lib/data/acessos';

const PATH = '/configuracoes/acessos';

/**
 * Sessão + papel + token para falar com a API Express. A API valida tudo de novo
 * (escopo da empresa, papel do alvo, conta própria) — aqui é só o primeiro portão.
 */
async function requireManager({ superadminOnly = false } = {}) {
  const session = await requireUser();
  if (!canManageAccess(session.role)) return { error: 'Você não tem permissão para gerenciar acessos.' };
  if (superadminOnly && session.role !== 'superadmin') return { error: 'Só o super admin pode fazer isso.' };
  const token = await getAccessToken(session.supabase);
  if (!token) return { error: 'Sessão expirada. Entre novamente.' };
  return { session, token };
}

const fail = (error) => ({ ok: false, error: formatManageUserError(error?.message || error) });
const text = (v, max = 200) => String(v ?? '').trim().slice(0, max);
const isUuidish = (v) => /^[0-9a-f-]{20,64}$/i.test(String(v || ''));

/* ---------- Usuários ---------- */

/** `POST /users` — mesmo payload do painel atual: admin cria sempre `usuario` na própria empresa. */
export async function createUserAction(input) {
  const ctx = await requireManager();
  if (ctx.error) return { ok: false, error: ctx.error };
  const { session, token } = ctx;

  const email = text(input?.email).toLowerCase();
  const emailError = validateSignupEmail(email);
  if (emailError) return { ok: false, error: 'Informe um e-mail válido.' };

  const password = text(input?.password, 128);
  if (password) {
    const pwd = validateStrongPassword(password);
    if (!pwd.ok) return { ok: false, error: pwd.message };
  }

  const body = {
    email,
    password: password || undefined,
    displayName: text(input?.displayName, 120) || undefined,
    phone: text(input?.phone, 32) || undefined,
    role: 'usuario',
    mei: false,
  };
  if (session.role === 'superadmin') {
    const role = text(input?.role, 20);
    if (!ROLE_OPTIONS_SUPERADMIN.includes(role)) return { ok: false, error: 'Escolha o perfil do usuário.' };
    if (!isUuidish(input?.empresaId)) return { ok: false, error: 'Escolha a empresa do usuário.' };
    body.role = role;
    body.empresaId = text(input.empresaId, 64);
  }

  try {
    const data = await backendFetch('/users', { method: 'POST', body, token });
    revalidatePath(PATH);
    return { ok: true, generatedPassword: data?.generatedPassword || null, email: data?.email || email };
  } catch (error) {
    return fail(error);
  }
}

/** `PUT /users/:id` — nome, telefone, e-mail de login, perfil, empresa, MEI e validade. */
export async function updateUserAction(userId, input) {
  const ctx = await requireManager();
  if (ctx.error) return { ok: false, error: ctx.error };
  if (!isUuidish(userId)) return { ok: false, error: 'Usuário inválido.' };
  const { session, token } = ctx;
  const isSelf = userId === session.userId;

  const body = {};
  const displayName = text(input?.displayName, 120);
  if (displayName) body.displayName = displayName;
  const phone = text(input?.phone, 32);
  if (phone) body.phone = phone;
  if (input?.email !== undefined) {
    const email = text(input.email).toLowerCase();
    if (email) {
      if (validateSignupEmail(email)) return { ok: false, error: 'Informe um e-mail de login válido.' };
      body.email = email;
    }
  }
  if (typeof input?.mei === 'boolean') body.mei = input.mei;
  if (input?.expiresAt !== undefined) {
    const raw = text(input.expiresAt, 32);
    if (!raw) body.expiresAt = null;
    else {
      const d = new Date(`${raw}T23:59:59`);
      if (Number.isNaN(d.getTime())) return { ok: false, error: 'Data de validade inválida.' };
      body.expiresAt = d.toISOString();
    }
  }
  // Conta própria: perfil e empresa não vão no payload (o backend também bloqueia).
  if (!isSelf) {
    const role = text(input?.role, 20);
    if (role) {
      const allowed = session.role === 'superadmin' ? ROLE_OPTIONS_SUPERADMIN : ['usuario'];
      if (!allowed.includes(role)) return { ok: false, error: 'Perfil não permitido para o seu nível de acesso.' };
      body.role = role;
    }
    if (session.role === 'superadmin') {
      if (!isUuidish(input?.empresaId)) return { ok: false, error: 'Escolha a empresa do usuário.' };
      body.empresaId = text(input.empresaId, 64);
    }
  }

  try {
    await backendFetch(`/users/${encodeURIComponent(userId)}`, { method: 'PUT', body, token });
    revalidatePath(PATH);
    revalidatePath('/', 'layout');
    return { ok: true, emailChanged: Boolean(body.email) };
  } catch (error) {
    return fail(error);
  }
}

/** Bloquear (`POST /users/:id/ban`) ou liberar (`POST /users/:id/unban`). */
export async function setUserBlockedAction(userId, blocked) {
  const ctx = await requireManager();
  if (ctx.error) return { ok: false, error: ctx.error };
  if (!isUuidish(userId)) return { ok: false, error: 'Usuário inválido.' };
  if (userId === ctx.session.userId) return { ok: false, error: 'Você não pode bloquear a própria conta.' };

  try {
    if (blocked) {
      await backendFetch(`/users/${encodeURIComponent(userId)}/ban`, { method: 'POST', body: { status: false }, token: ctx.token });
    } else {
      await backendFetch(`/users/${encodeURIComponent(userId)}/unban`, { method: 'POST', body: {}, token: ctx.token });
    }
    revalidatePath(PATH);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

/** `DELETE /users/:id` — remove dados e a conta de login. */
export async function deleteUserAction(userId) {
  const ctx = await requireManager();
  if (ctx.error) return { ok: false, error: ctx.error };
  if (!isUuidish(userId)) return { ok: false, error: 'Usuário inválido.' };
  if (userId === ctx.session.userId) return { ok: false, error: 'Você não pode excluir a própria conta.' };

  try {
    await backendFetch(`/users/${encodeURIComponent(userId)}`, { method: 'DELETE', token: ctx.token });
    revalidatePath(PATH);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

/** `POST /users/:id/reset-password` — senha informada ou gerada pelo servidor. */
export async function resetUserPasswordAction(userId, password) {
  const ctx = await requireManager();
  if (ctx.error) return { ok: false, error: ctx.error };
  if (!isUuidish(userId)) return { ok: false, error: 'Usuário inválido.' };

  const provided = text(password, 128);
  if (provided) {
    const pwd = validateStrongPassword(provided);
    if (!pwd.ok) return { ok: false, error: pwd.message };
  }

  try {
    const data = await backendFetch(`/users/${encodeURIComponent(userId)}/reset-password`, {
      method: 'POST',
      body: provided ? { password: provided } : {},
      token: ctx.token,
    });
    return { ok: true, password: data?.password || provided };
  } catch (error) {
    return fail(error);
  }
}

/**
 * Acessar como outro usuário — `POST /auth/impersonate` devolve um `token_hash` de magic link;
 * guardamos a sessão do admin num cookie httpOnly e trocamos a sessão atual pela do alvo.
 */
export async function impersonateAction(userId, targetName) {
  const ctx = await requireManager();
  if (ctx.error) return { ok: false, error: ctx.error };
  if (!isUuidish(userId)) return { ok: false, error: 'Usuário inválido.' };
  const { session, token } = ctx;

  const {
    data: { session: current },
  } = await session.supabase.auth.getSession();
  if (!current?.refresh_token) return { ok: false, error: 'Sessão expirada. Entre novamente.' };

  let link;
  try {
    link = await backendFetch('/auth/impersonate', { method: 'POST', body: { userId }, token });
  } catch (error) {
    return fail(error);
  }
  if (!link?.token_hash) return { ok: false, error: 'Não foi possível gerar o acesso.' };

  await saveAdminBackup({
    accessToken: current.access_token,
    refreshToken: current.refresh_token,
    adminName: session.displayName,
    targetName: text(targetName, 120),
  });

  const { error } = await session.supabase.auth.verifyOtp({ token_hash: link.token_hash, type: 'magiclink' });
  if (error) {
    await clearAdminBackup();
    return { ok: false, error: formatManageUserError(error.message || 'Não foi possível entrar como este usuário.') };
  }

  revalidatePath('/', 'layout');
  redirect('/visao-geral');
}

/** Volta para a conta do administrador guardada no cookie (porta de `stopImpersonating`). */
export async function stopImpersonatingAction() {
  const backup = await readAdminBackup();
  if (!backup) redirect('/visao-geral');

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.setSession({ access_token: backup.accessToken, refresh_token: backup.refreshToken });
  await clearAdminBackup();
  if (error) {
    await supabase.auth.signOut();
    redirect('/login');
  }
  revalidatePath('/', 'layout');
  redirect(PATH);
}

/* ---------- Convites ---------- */

/** `POST /invites` — admin herda a própria empresa; superadmin escolhe. Devolve o token para montar o link. */
export async function createInviteAction({ empresaId, isReusable } = {}) {
  const ctx = await requireManager();
  if (ctx.error) return { ok: false, error: ctx.error };
  const { session, token } = ctx;

  const body = { is_reusable: Boolean(isReusable) };
  if (session.role === 'superadmin') {
    if (!isUuidish(empresaId)) return { ok: false, error: 'Escolha a empresa do convite.' };
    body.empresas_id = text(empresaId, 64);
  }

  try {
    const data = await backendFetch('/invites', { method: 'POST', body, token });
    const url = String(data?.inviteUrl || '');
    const rawToken = (() => {
      try {
        return new URL(url).searchParams.get('convite') || '';
      } catch {
        return '';
      }
    })();
    revalidatePath(PATH);
    return { ok: true, rawToken, invite: data?.invite || null };
  } catch (error) {
    return fail(error);
  }
}

/** `POST /invites/:id/revoke`. */
export async function revokeInviteAction(inviteId) {
  const ctx = await requireManager();
  if (ctx.error) return { ok: false, error: ctx.error };
  if (!isUuidish(inviteId)) return { ok: false, error: 'Convite inválido.' };

  try {
    await backendFetch(`/invites/${encodeURIComponent(inviteId)}/revoke`, { method: 'POST', body: {}, token: ctx.token });
    revalidatePath(PATH);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

/* ---------- Empresas (só superadmin, como no app atual) ---------- */

const EMPRESA_FIELDS = [
  'empresa', 'cnpj', 'razao_social', 'nome_fantasia', 'inscricao_estadual', 'regime_tributario',
  'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'estado', 'cep', 'telefone', 'email',
];

function buildEmpresaBody(input) {
  const body = {};
  for (const key of EMPRESA_FIELDS) {
    if (input?.[key] === undefined) continue;
    body[key] = text(input[key], 200) || null;
  }
  if (body.cnpj) body.cnpj = body.cnpj.replace(/\D/g, '') || null;
  if (body.cep) body.cep = body.cep.replace(/\D/g, '') || null;
  const maxMei = Number.parseInt(String(input?.max_mei ?? ''), 10);
  body.max_mei = Number.isFinite(maxMei) && maxMei > 0 ? maxMei : 0;
  if (input?.max_usuarios_nao_mei === null || input?.max_usuarios_nao_mei === '' || input?.max_usuarios_nao_mei === undefined) {
    body.max_usuarios_nao_mei = null;
  } else {
    const n = Number.parseInt(String(input.max_usuarios_nao_mei), 10);
    body.max_usuarios_nao_mei = Number.isFinite(n) && n > 0 ? n : null;
  }
  return body;
}

export async function loadEmpresaAction(empresaId) {
  const ctx = await requireManager();
  if (ctx.error) return { ok: false, error: ctx.error };
  if (!isUuidish(empresaId)) return { ok: false, error: 'Empresa inválida.' };
  try {
    const empresa = await fetchEmpresaById(ctx.token, empresaId);
    return { ok: true, empresa };
  } catch (error) {
    return fail(error);
  }
}

/** `POST /users/empresas` ou `PUT /users/empresas/:id`. */
export async function saveEmpresaAction(empresaId, input) {
  const ctx = await requireManager({ superadminOnly: true });
  if (ctx.error) return { ok: false, error: ctx.error };

  const body = buildEmpresaBody(input);
  if (body.cnpj && body.cnpj.length !== 14) return { ok: false, error: 'CNPJ deve ter 14 dígitos ou ficar em branco.' };
  if (!empresaId && !body.empresa && !body.nome_fantasia && !body.razao_social) {
    return { ok: false, error: 'Informe o nome da empresa.' };
  }

  try {
    const data = empresaId
      ? await backendFetch(`/users/empresas/${encodeURIComponent(empresaId)}`, { method: 'PUT', body, token: ctx.token })
      : await backendFetch('/users/empresas', { method: 'POST', body, token: ctx.token });
    revalidatePath(PATH);
    return { ok: true, empresa: data?.empresa || null };
  } catch (error) {
    return fail(error);
  }
}

/** `DELETE /users/empresas/:id` — remove vínculos e a empresa. */
export async function deleteEmpresaAction(empresaId) {
  const ctx = await requireManager({ superadminOnly: true });
  if (ctx.error) return { ok: false, error: ctx.error };
  if (!isUuidish(empresaId)) return { ok: false, error: 'Empresa inválida.' };
  try {
    await backendFetch(`/users/empresas/${encodeURIComponent(empresaId)}`, { method: 'DELETE', token: ctx.token });
    revalidatePath(PATH);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

/** `GET /users/empresas/cnpj-lookup/:cnpj` — autopreenchimento do cadastro. */
export async function lookupCnpjAction(cnpj) {
  const ctx = await requireManager({ superadminOnly: true });
  if (ctx.error) return { ok: false, error: ctx.error };
  const digits = String(cnpj || '').replace(/\D/g, '');
  if (digits.length !== 14) return { ok: false, error: 'CNPJ deve ter 14 dígitos.' };
  try {
    const data = await backendFetch(`/users/empresas/cnpj-lookup/${digits}`, { token: ctx.token });
    return { ok: true, data };
  } catch (error) {
    return fail(error);
  }
}
