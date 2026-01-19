import crypto from 'crypto';
import { createSupabaseClient } from '../config/supabase.js';
import { badRequest, forbidden, unauthorized } from '../utils/errors.js';

const ROLE_CREATE_ALLOWED = new Set(['superadmin', 'admin']);
const ROLE_TARGET_ALLOWED = new Set(['admin', 'usuario', 'outsider']);
const ROLE_UPDATE_ALLOWED_SUPERADMIN = new Set(['admin', 'usuario', 'outsider']);

const normalizeRoleValue = (role) => {
  if (!role) return null;
  const normalized = String(role).trim().toLowerCase();
  if (normalized === 'user') return 'usuario';
  return normalized;
};

const cleanPhone = (phone) => (phone?.startsWith('+') ? phone.substring(1) : phone);

const generatePassword = () => crypto.randomBytes(9).toString('base64').slice(0, 12);

const getRequesterContext = async (accessToken) => {
  if (!accessToken) throw unauthorized();

  const userClient = createSupabaseClient({ accessToken });
  const { data: { user } = {}, error: userError } = await userClient.auth.getUser();
  if (userError || !user) throw unauthorized();

  const linkClient = createSupabaseClient({ useServiceRole: true });
  const { data: linkData, error: linkError } = await linkClient
    .from('role_x_user_x_empresa')
    .select('empresas_id, roles_id')
    .eq('user_id', user.id)
    .eq('status', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (linkError) {
    console.warn('[Users] role_x_user_x_empresa lookup error:', linkError.message);
  }

  if (linkData?.roles_id) {
    const { data: roleData, error: roleError } = await linkClient
      .from('roles')
      .select('roles')
      .eq('id', linkData.roles_id)
      .maybeSingle();

    if (roleError) {
      console.warn('[Users] roles lookup error:', roleError.message);
    }

    if (roleData?.roles) {
      return {
        userId: user.id,
        role: normalizeRoleValue(roleData.roles),
        empresaId: linkData.empresas_id || null
      };
    }
  }

  const { data: profile } = await userClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  return {
    userId: user.id,
    role: normalizeRoleValue(profile?.role) || 'usuario',
    empresaId: null
  };
};

export const listUsers = async (accessToken) => {
  const { role, empresaId } = await getRequesterContext(accessToken);
  if (!ROLE_CREATE_ALLOWED.has(role)) throw forbidden();

  const adminClient = createSupabaseClient({ useServiceRole: true });
  let query = adminClient
    .from('role_x_user_x_empresa')
    .select('user_id, empresas_id, roles_id');

  if (role === 'admin') {
    if (!empresaId) throw forbidden();
    query = query.eq('empresas_id', empresaId);
  }

  const { data: links, error } = await query;
  if (error) throw badRequest(error.message);

  const userIds = (links || []).map((link) => link.user_id).filter(Boolean);
  const roleIds = Array.from(
    new Set((links || []).map((link) => link.roles_id).filter(Boolean))
  );
  const empresaIds = Array.from(
    new Set((links || []).map((link) => link.empresas_id).filter(Boolean))
  );
  let roleMap = new Map();
  if (roleIds.length > 0) {
    const { data: rolesData } = await adminClient
      .from('roles')
      .select('id, roles')
      .in('id', roleIds);
    roleMap = new Map((rolesData || []).map((role) => [role.id, role.roles]));
  }
  let empresaMap = new Map();
  if (empresaIds.length > 0) {
    const { data: empresasData } = await adminClient
      .from('empresas')
      .select('id, empresa')
      .in('id', empresaIds);
    empresaMap = new Map((empresasData || []).map((empresa) => [empresa.id, empresa]));
  }
  const users = await Promise.all(
    userIds.map(async (userId) => {
      const { data, error: userError } = await adminClient.auth.admin.getUserById(userId);
      if (userError || !data?.user) return null;
      return {
        id: data.user.id,
        email: data.user.email,
        displayName: data.user.user_metadata?.display_name || null,
        phone: data.user.user_metadata?.phone || null
      };
    })
  );

  const userMap = new Map(users.filter(Boolean).map((item) => [item.id, item]));

  return {
    users: (links || [])
      .map((link) => {
        const user = userMap.get(link.user_id);
        if (!user) return null;
        return {
          ...user,
          role: normalizeRoleValue(roleMap.get(link.roles_id) || 'usuario'),
          empresaId: link.empresas_id || null,
          empresaName: empresaMap.get(link.empresas_id)?.empresa || null
        };
      })
      .filter(Boolean)
  };
};

export const listEmpresas = async (accessToken) => {
  const { role, empresaId } = await getRequesterContext(accessToken);
  if (!ROLE_CREATE_ALLOWED.has(role)) throw forbidden();

  const adminClient = createSupabaseClient({ useServiceRole: true });
  let query = adminClient
    .from('empresas')
    .select('id, empresa')
    .order('empresa', { ascending: true });

  if (role === 'admin') {
    if (!empresaId) throw forbidden();
    query = query.eq('id', empresaId);
  }

  const { data, error } = await query;
  if (error) throw badRequest(error.message);

  console.log('[Users] listEmpresas role:', role, 'empresaId:', empresaId, 'count:', data?.length || 0);
  return { empresas: data || [] };
};

export const createUser = async (accessToken, input) => {
  const { role: requesterRole, empresaId: requesterEmpresaId } = await getRequesterContext(accessToken);
  if (!ROLE_CREATE_ALLOWED.has(requesterRole)) throw forbidden();

  const email = input?.email?.trim();
  const password = input?.password?.trim();
  const displayName = input?.displayName?.trim() || null;
  const phone = cleanPhone(input?.phone?.trim());
  const requestedRole = input?.role;
  const requestedEmpresaId = input?.empresaId || null;

  if (!email) throw badRequest('Email é obrigatório');

  let finalRole = 'usuario';
  let finalEmpresaId = requesterEmpresaId;

  if (requesterRole === 'admin') {
    if (requestedRole && requestedRole !== 'usuario') {
      throw badRequest('Admin só pode criar usuário padrão');
    }
    if (!requesterEmpresaId) throw forbidden();
  }

  if (requesterRole === 'superadmin') {
    if (!requestedRole || !ROLE_TARGET_ALLOWED.has(requestedRole)) {
      throw badRequest('Role inválida');
    }
    if (!requestedEmpresaId) throw badRequest('Empresa é obrigatória');
    finalRole = requestedRole;
    finalEmpresaId = requestedEmpresaId;
  }

  const adminClient = createSupabaseClient({ useServiceRole: true });

  if (finalRole === 'admin') {
    const { data: adminRole } = await adminClient
      .from('roles')
      .select('id')
      .eq('roles', 'admin')
      .maybeSingle();

    if (adminRole?.id) {
      const { data: existingAdmin } = await adminClient
        .from('role_x_user_x_empresa')
        .select('id')
        .eq('empresas_id', finalEmpresaId)
        .eq('roles_id', adminRole.id)
        .maybeSingle();

      if (existingAdmin) {
        throw badRequest('Essa empresa já possui um Admin');
      }
    }
  }

    const { data: roleData } = await adminClient
    .from('roles')
    .select('id, roles')
      .ilike('roles', finalRole)
    .maybeSingle();

  if (!roleData?.id) throw badRequest('Role não encontrada');

  const finalPassword = password || generatePassword();
  const { data: createdUser, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password: finalPassword,
    email_confirm: true,
    user_metadata: {
      display_name: displayName,
      phone: phone || null
    }
  });

  if (createError || !createdUser?.user) {
    throw badRequest(createError?.message || 'Erro ao criar usuário');
  }

  const { error: linkError } = await adminClient
    .from('role_x_user_x_empresa')
    .insert({
      user_id: createdUser.user.id,
      roles_id: roleData.id,
      empresas_id: finalEmpresaId,
      status: true
    });

  if (linkError) throw badRequest(linkError.message);

  if (phone) {
    await adminClient
      .from('n8n_link')
      .upsert(
        { user_id: createdUser.user.id, user_number: phone },
        { onConflict: 'user_id' }
      );
  }

  return {
    userId: createdUser.user.id,
    email: createdUser.user.email,
    role: finalRole,
    empresaId: finalEmpresaId,
    generatedPassword: password ? null : finalPassword
  };
};

export const updateUser = async (accessToken, userId, input) => {
  if (!userId) throw badRequest('userId é obrigatório');

  const requester = await getRequesterContext(accessToken);
  if (!ROLE_CREATE_ALLOWED.has(requester.role)) throw forbidden();

  const requestedRole = normalizeRoleValue(input?.role);
  const requestedEmpresaId = input?.empresaId || null;
  const requestedDisplayName = input?.displayName?.trim();
  const requestedPhone = cleanPhone(input?.phone?.trim());

  const adminClient = createSupabaseClient({ useServiceRole: true });
  const { data: linkData, error: linkError } = await adminClient
    .from('role_x_user_x_empresa')
    .select('id, empresas_id, roles_id')
    .eq('user_id', userId)
    .eq('status', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (linkError) throw badRequest(linkError.message);
  if (!linkData?.roles_id) throw badRequest('Vínculo de role não encontrado');

  const { data: roleData, error: roleError } = await adminClient
    .from('roles')
    .select('roles')
    .eq('id', linkData.roles_id)
    .maybeSingle();

  if (roleError) throw badRequest(roleError.message);
  const targetRole = normalizeRoleValue(roleData?.roles) || 'usuario';

  if (requester.role === 'admin') {
    if (targetRole !== 'usuario') throw forbidden();
    if (!requester.empresaId || requester.empresaId !== linkData.empresas_id) throw forbidden();
    if (requestedRole && requestedRole !== 'usuario') throw forbidden();
  }

  if (requester.role === 'superadmin') {
    if (!ROLE_UPDATE_ALLOWED_SUPERADMIN.has(targetRole)) throw forbidden();
    if (requestedRole && !ROLE_UPDATE_ALLOWED_SUPERADMIN.has(requestedRole)) {
      throw badRequest('Role inválida');
    }
  }

  let finalRole = requestedRole || targetRole;
  let finalEmpresaId = linkData.empresas_id;

  if (requester.role === 'superadmin') {
    if (!requestedEmpresaId) throw badRequest('Empresa é obrigatória');
    finalEmpresaId = requestedEmpresaId;
  }

  console.log('[Users] updateUser', {
    requesterRole: requester.role,
    targetRole,
    requestedRole,
    requestedEmpresaId,
    finalRole,
    finalEmpresaId,
    requestedDisplayName,
    requestedPhone
  });

  if (finalRole === 'admin') {
    const { data: adminRole } = await adminClient
      .from('roles')
      .select('id')
      .ilike('roles', 'admin')
      .maybeSingle();

    if (adminRole?.id) {
      const { data: existingAdmin } = await adminClient
        .from('role_x_user_x_empresa')
        .select('id')
        .eq('empresas_id', finalEmpresaId)
        .eq('roles_id', adminRole.id)
        .neq('user_id', userId)
        .maybeSingle();

      if (existingAdmin) {
        throw badRequest('Essa empresa já possui um Admin');
      }
    }
  }

  const { data: roleIdData } = await adminClient
    .from('roles')
    .select('id')
    .ilike('roles', finalRole)
    .maybeSingle();

  if (!roleIdData?.id) throw badRequest('Role não encontrada');

  const { error: updateError } = await adminClient
    .from('role_x_user_x_empresa')
    .update({
      roles_id: roleIdData.id,
      empresas_id: finalEmpresaId
    })
    .eq('id', linkData.id);

  if (updateError) throw badRequest(updateError.message);

  if (requestedDisplayName || requestedPhone) {
    const metadata = {};
    if (requestedDisplayName) metadata.display_name = requestedDisplayName;
    if (requestedPhone) metadata.phone = requestedPhone;
    const { error: updateUserError } = await adminClient.auth.admin.updateUserById(userId, {
      user_metadata: metadata
    });
    if (updateUserError) {
      console.warn('[Users] updateUser metadata error:', updateUserError.message);
      throw badRequest(updateUserError.message);
    }
  }

  if (requestedPhone) {
    await adminClient
      .from('n8n_link')
      .upsert(
        { user_id: userId, user_number: requestedPhone },
        { onConflict: 'user_id' }
      );
  }

  return {
    userId,
    role: finalRole,
    empresaId: finalEmpresaId
  };
};

export const syncPhone = async (userId, phone) => {
  if (!phone) throw badRequest('Telefone é obrigatório');
  const cleanedPhone = cleanPhone(phone);

  const dbClient = createSupabaseClient({ useServiceRole: true });
  const { error } = await dbClient
    .from('n8n_link')
    .upsert(
      { user_id: userId, user_number: cleanedPhone },
      { onConflict: 'user_id' }
    );

  if (error) throw badRequest(error.message);
  return { success: true, phone: cleanedPhone };
};
