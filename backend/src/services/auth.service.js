import { createSupabaseClient } from '../config/supabase.js';
import { env } from '../config/env.js';
import { badRequest, forbidden, unauthorized, serviceUnavailable } from '../utils/errors.js';
import crypto from 'crypto';

const hashInviteToken = (rawToken) => crypto.createHash('sha256').update(String(rawToken).trim(), 'utf8').digest('hex');

const ROLE_DEFAULT = 'usuario';
const ROLE_ALLOWED = new Set(['superadmin', 'admin', 'usuario', 'outsider']);

const normalizeRoleValue = (role) => {
  if (!role) return null;
  const normalized = String(role).trim().toLowerCase();
  if (normalized === 'user') return 'usuario';
  return normalized;
};

const getRoleCandidates = (role) => {
  const normalized = normalizeRoleValue(role);
  if (!normalized) return [];
  if (normalized === 'usuario') return ['user', 'usuario'];
  return [normalized];
};

const ensureSignupRoleLink = async (adminClient, userId, empresaId = null) => {
  const { data: activeLink, error: activeLinkError } = await adminClient
    .from('role_x_user_x_empresa')
    .select('id')
    .eq('user_id', userId)
    .eq('status', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (activeLinkError) {
    console.error('[AuthService] ensureSignupRoleLink: falha ao buscar link ativo', activeLinkError);
  }

  if (activeLink) return activeLink;

  const { data: roleData, error: roleError } = await adminClient
    .from('roles')
    .select('id')
    .eq('roles', 'User')
    .single();

  if (roleError || !roleData) {
    console.error('[AuthService] ensureSignupRoleLink: falha ao buscar role User', roleError);
    return null;
  }

  const { error: linkError } = await adminClient
    .from('role_x_user_x_empresa')
    .insert({
      user_id: userId,
      roles_id: roleData.id,
      empresas_id: empresaId,
      status: true,
      mei: false
    });

  if (linkError) {
    console.error('[AuthService] ensureSignupRoleLink: falha ao criar link inicial', linkError);
  }

  return null;
};

const getRoleAndCompanyFromLink = async ({ accessToken, userId }) => {
  if (!accessToken || !userId) return { role: null, empresaId: null, mei: null };

  const linkClient = env.SUPABASE_SERVICE_ROLE_KEY
    ? createSupabaseClient({ useServiceRole: true })
    : createSupabaseClient({ accessToken });
  const { data: linkData, error } = await linkClient
    .from('role_x_user_x_empresa')
    .select('empresas_id, roles_id, mei')
    .eq('user_id', userId)
    .eq('status', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn('[Auth] role_x_user_x_empresa lookup error:', error.message);
  }

  if (!error && linkData?.roles_id) {
    const { data: roleData, error: roleError } = await linkClient
      .from('roles')
      .select('roles')
      .eq('id', linkData.roles_id)
      .maybeSingle();

    if (roleError) {
      console.warn('[Auth] roles lookup error:', roleError.message);
    }

    if (roleData?.roles) {
      const mei = typeof linkData?.mei === 'boolean' ? linkData.mei : true;
      return {
        role: normalizeRoleValue(roleData.roles),
        empresaId: linkData.empresas_id || null,
        mei
      };
    }
  }

  return { role: null, empresaId: null, mei: null };
};

const ensureUserNotBlocked = async ({ accessToken, userId }) => {
  if (!accessToken || !userId || !env.SUPABASE_SERVICE_ROLE_KEY) return;
  const adminClient = createSupabaseClient({ useServiceRole: true });
  const { data: linkData } = await adminClient
    .from('role_x_user_x_empresa')
    .select('id, status, expires_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (linkData?.status === false) {
    throw forbidden('Seu perfil está bloqueado');
  }

  if (linkData?.expires_at && new Date(linkData.expires_at) < new Date()) {
    if (linkData?.id) {
      await adminClient
        .from('role_x_user_x_empresa')
        .update({ status: false })
        .eq('id', linkData.id);
    }
    throw forbidden('Seu acesso expirou');
  }
};

const getOrCreateProfileRole = async ({ accessToken, userId }) => {
  if (!accessToken || !userId) return ROLE_DEFAULT;

  const userClient = createSupabaseClient({ accessToken });
  const { data: profile } = await userClient
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (profile?.role) return profile.role;

  if (!env.SUPABASE_SERVICE_ROLE_KEY) return ROLE_DEFAULT;

  const adminClient = createSupabaseClient({ useServiceRole: true });
  const { data: created } = await adminClient
    .from('profiles')
    .insert({ id: userId, role: ROLE_DEFAULT })
    .select('role')
    .single();

  return created?.role || ROLE_DEFAULT;
};

const getResolvedRoleAndCompany = async ({ accessToken, userId }) => {
  const linkResult = await getRoleAndCompanyFromLink({ accessToken, userId });
  if (linkResult.role) {
    return linkResult;
  }

  const profileRole = await getOrCreateProfileRole({ accessToken, userId });
  const mei = typeof linkResult.mei === 'boolean' ? linkResult.mei : true;
  return { role: profileRole, empresaId: linkResult.empresaId || null, mei };
};

export const signUp = async ({ email, password, phone, displayName, inviteToken }, deps = {}) => {
  if (!email || !password) {
    throw badRequest('Email e senha são obrigatórios');
  }

  const createSupabaseClientFn = deps.createSupabaseClientFn || createSupabaseClient;
  const cleanedPhone = phone?.startsWith('+') ? phone.substring(1) : phone;
  const supabase = createSupabaseClientFn({ useServiceRole: !!env.SUPABASE_SERVICE_ROLE_KEY });
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        phone: cleanedPhone || null,
        display_name: displayName || null
      }
    }
  });

  if (error) {
    throw badRequest(error.message);
  }

  const userId = data.user?.id;

  if (userId && env.SUPABASE_SERVICE_ROLE_KEY) {
    const adminClient = createSupabaseClientFn({ useServiceRole: true });
    
    let empresaId = null;
    const tokenToUse = inviteToken || deps.inviteToken;
    console.log('[AuthService] Tentando processar convite no signUp. Token:', tokenToUse);
    
    if (tokenToUse) {
      const tokenHash = hashInviteToken(tokenToUse);
      console.log('[AuthService] Hash gerado:', tokenHash);
      
      const { data: inviteData, error: inviteErr } = await adminClient
        .from('empresa_invites')
        .select('id, empresas_id, expires_at, used_at, revoked_at, is_reusable, uses_count')
        .eq('token_hash', tokenHash)
        .maybeSingle();
      
      if (inviteErr) {
        console.error('[AuthService] Erro DB ao buscar convite:', inviteErr);
      }
      
      const now = new Date();
      const expires = inviteData?.expires_at ? new Date(inviteData.expires_at) : null;
      const isExpired = expires && expires <= now;

      // Se for reutilizável, ignoramos used_at
      const isPending = inviteData && 
                        (inviteData.is_reusable || !inviteData.used_at) && 
                        !inviteData.revoked_at && 
                        !isExpired;

      if (isPending) {
        empresaId = inviteData.empresas_id;
        
        if (inviteData.is_reusable) {
          // Apenas incrementa o contador
          await adminClient.rpc('increment_invite_uses', { invite_id: inviteData.id });
          // Fallback caso a RPC não exista:
          await adminClient
            .from('empresa_invites')
            .update({ uses_count: (inviteData.uses_count || 0) + 1 })
            .eq('id', inviteData.id);
        } else {
          // Comportamento clássico: marca como usado
          await adminClient
            .from('empresa_invites')
            .update({ used_at: new Date().toISOString(), uses_count: 1 })
            .eq('id', inviteData.id);
        }
      }
 else {
        console.warn('[AuthService] Convite inválido, expirado ou já usado.');
      }
    }

    await adminClient
      .from('profiles')
      .insert({ 
        id: userId, 
        role: ROLE_DEFAULT,
        display_name: displayName || null,
        phone: cleanedPhone || null
      })
      .select('role')
      .single();

    await ensureSignupRoleLink(adminClient, userId, empresaId);
  }

  if (userId && cleanedPhone) {
    try {
      const adminClient = createSupabaseClientFn({ useServiceRole: true });
      await adminClient
        .from('n8n_link')
        .upsert(
          { user_id: userId, user_number: cleanedPhone },
          { onConflict: 'user_id' }
        );
    } catch {
      // não bloquear signup por falha de sincronização
    }
  }

  const session = data.session || null;
  return {
    user: data.user,
    userId,
    phone: cleanedPhone || data.user?.user_metadata?.phone || null,
    displayName: displayName || data.user?.user_metadata?.display_name || null,
    session: session
      ? {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at
        }
      : null
  };
};

const isHttpError = (err) => err && typeof err.status === 'number';

export const signIn = async ({ email, password }) => {
  if (!email || !password) {
    throw badRequest('Email e senha são obrigatórios');
  }

  const { data, error } = await createSupabaseClient().auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    const rawMessage = error.message || '';
    if (rawMessage.toLowerCase().includes('invalid login credentials')) {
      throw unauthorized('Email ou senha incorretos');
    }
    if (error.status === 429) {
      throw badRequest('Muitas tentativas. Aguarde alguns minutos e tente novamente.');
    }
    throw unauthorized(rawMessage || 'Falha ao autenticar');
  }

  await ensureUserNotBlocked({
    accessToken: data.session?.access_token ?? null,
    userId: data.user?.id ?? ''
  });

  const { role, empresaId, mei } = await getResolvedRoleAndCompany({
    accessToken: data.session?.access_token ?? null,
    userId: data.user?.id ?? ''
  });

  return {
    user: data.user,
    userId: data.user?.id || null,
    phone: data.user?.user_metadata?.phone || null,
    displayName: data.user?.user_metadata?.display_name || null,
    role,
    empresaId,
    mei,
    session: data.session
  };
};

export const signOut = async (accessToken) => {
  if (!accessToken) return;
  const { error } = await createSupabaseClient({ accessToken }).auth.signOut();
  if (error) {
    throw badRequest(error.message);
  }
};

export const getSession = async (accessToken) => {
  if (!accessToken) return null;

  const supabase = createSupabaseClient({ accessToken });
  const { data: { user } = {}, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  await ensureUserNotBlocked({ accessToken, userId: user.id });

  const { role, empresaId, mei } = await getResolvedRoleAndCompany({ accessToken, userId: user.id });

  return {
    user: {
      id: user.id,
      email: user.email,
      phone: user.user_metadata?.phone || null,
      displayName: user.user_metadata?.display_name || null
    },
    access_token: accessToken,
    role,
    empresaId,
    mei
  };
};

export const resetPasswordForEmail = async (email) => {
  if (!email) throw badRequest('Email é obrigatório');
  const supabase = createSupabaseClient();
  const baseUrl = env.FRONTEND_URL ? env.FRONTEND_URL.replace(/\/$/, '') : '';
  const redirectTo = baseUrl ? `${baseUrl}/reset-password` : undefined;
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo
  });
  if (error) throw badRequest(error.message);
};

export const processRecoveryHash = async ({ access_token, refresh_token, type }) => {
  if (type !== 'recovery' || !access_token) {
    throw badRequest('Hash inválido');
  }

  const recoveryClient = createSupabaseClient({ accessToken: access_token });
  const { data: { session } = {}, error } = await recoveryClient.auth.setSession({
    access_token,
    refresh_token: refresh_token || ''
  });

  if (error || !session) {
    throw badRequest(error?.message || 'Token inválido ou expirado');
  }

  return {
    session: {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      user: session.user
    }
  };
};

export const exchangeCodeForSession = async (code) => {
  if (!code) throw badRequest('Código de recuperação ausente');
  const supabase = createSupabaseClient();
  const { data: { session } = {}, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !session) {
    throw badRequest(error?.message || 'Código inválido ou expirado');
  }
  return {
    session: {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      user: session.user
    }
  };
};

export const updatePassword = async ({ accessToken, userId, newPassword }) => {
  if (!newPassword) throw badRequest('Senha inválida');

  if (env.SUPABASE_SERVICE_ROLE_KEY && userId) {
    const adminClient = createSupabaseClient({ useServiceRole: true });
    const { error } = await adminClient.auth.admin.updateUserById(userId, {
      password: newPassword
    });
    if (error) throw badRequest(error.message);
    return;
  }

  if (!accessToken) {
    throw unauthorized('Token ausente');
  }

  const supabase = createSupabaseClient({ accessToken });
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    if (String(error.message || '').toLowerCase().includes('session')) {
      throw badRequest('Sessão inválida. Solicite um novo link de recuperação.');
    }
    throw badRequest(error.message);
  }
};

export const updatePhone = async (accessToken, phone) => {
  if (!accessToken) throw unauthorized();
  if (!phone) throw badRequest('Telefone é obrigatório');

  const supabase = createSupabaseClient({ accessToken });
  const { data: { user } = {}, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw unauthorized();

  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw badRequest('SUPABASE_SERVICE_ROLE_KEY não configurada');
  }

  const cleanedPhone = phone.startsWith('+') ? phone.substring(1) : phone;
  const adminClient = createSupabaseClient({ useServiceRole: true });
  const { error } = await adminClient.auth.admin.updateUserById(user.id, {
    user_metadata: { phone: cleanedPhone }
  });
  if (error) throw badRequest(error.message);

  await adminClient
    .from('n8n_link')
    .upsert(
      { user_id: user.id, user_number: cleanedPhone },
      { onConflict: 'user_id' }
    );

  return cleanedPhone;
};

export const updateDisplayName = async (accessToken, displayName) => {
  if (!accessToken) throw unauthorized();
  if (!displayName) throw badRequest('Nome inválido');

  const supabase = createSupabaseClient({ accessToken });
  const { data: { user } = {}, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw unauthorized();

  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw badRequest('SUPABASE_SERVICE_ROLE_KEY não configurada');
  }

  const adminClient = createSupabaseClient({ useServiceRole: true });
  const { error } = await adminClient.auth.admin.updateUserById(user.id, {
    user_metadata: { display_name: displayName }
  });
  if (error) throw badRequest(error.message);
};

export const getLastSeenUpdate = async (accessToken) => {
  if (!accessToken) throw unauthorized();
  const supabase = createSupabaseClient({ accessToken });
  const { data: { user } = {}, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw unauthorized();

  const { data, error } = await supabase
    .from('profiles')
    .select('last_seen_update_id')
    .eq('id', user.id)
    .single();

  if (error) throw badRequest(error.message);
  return { lastSeenUpdateId: data?.last_seen_update_id ?? null };
};

export const updateLastSeenUpdate = async (accessToken, updateId) => {
  if (!accessToken) throw unauthorized();
  if (!updateId || typeof updateId !== 'string') throw badRequest('updateId é obrigatório');

  const supabase = createSupabaseClient({ accessToken });
  const { data: { user } = {}, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw unauthorized();

  const { error } = await supabase
    .from('profiles')
    .update({ last_seen_update_id: updateId })
    .eq('id', user.id);

  if (error) throw badRequest(error.message);
  return { success: true };
};

export const updateRole = async (accessToken, userId, role) => {
  if (!accessToken) throw unauthorized();
  if (!userId || !role) throw badRequest('userId e role são obrigatórios');
  if (!ROLE_ALLOWED.has(role)) throw badRequest('Role inválida');

  const supabase = createSupabaseClient({ accessToken });
  const { data: { user } = {}, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw unauthorized();

  const { data: requesterProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (requesterProfile?.role !== 'superadmin') {
    throw forbidden();
  }

  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw badRequest('SUPABASE_SERVICE_ROLE_KEY não configurada');
  }

  const adminClient = createSupabaseClient({ useServiceRole: true });
  const { error } = await adminClient
    .from('profiles')
    .update({ role })
    .eq('id', userId);

  if (error) throw badRequest(error.message);

  return { success: true };
};

export const resolveRequesterContext = async (accessToken) => {
  const session = await getSession(accessToken);
  if (!session) throw unauthorized('Sessão expirada ou inválida');

  return {
    userId: session.user.id,
    role: session.role,
    empresaId: session.empresaId
  };
};
