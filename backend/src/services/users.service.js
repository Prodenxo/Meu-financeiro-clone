import crypto from 'crypto';
import { createSupabaseClient } from '../config/supabase.js';
import { badRequest, forbidden, unauthorized } from '../utils/errors.js';

const ROLE_CREATE_ALLOWED = new Set(['superadmin', 'admin']);
const ROLE_TARGET_ALLOWED = new Set(['admin', 'usuario', 'outsider']);

const cleanPhone = (phone) => (phone?.startsWith('+') ? phone.substring(1) : phone);

const generatePassword = () => crypto.randomBytes(9).toString('base64').slice(0, 12);

const getRequesterContext = async (accessToken) => {
  if (!accessToken) throw unauthorized();

  const userClient = createSupabaseClient({ accessToken });
  const { data: { user } = {}, error: userError } = await userClient.auth.getUser();
  if (userError || !user) throw unauthorized();

  const { data: linkData } = await userClient
    .from('role_x_user_x_empresa')
    .select('empresas_id, roles_id')
    .eq('user_id', user.id)
    .eq('status', true)
    .maybeSingle();

  if (linkData?.roles_id) {
    const { data: roleData } = await userClient
      .from('roles')
      .select('roles')
      .eq('id', linkData.roles_id)
      .maybeSingle();

    if (roleData?.roles) {
      return {
        userId: user.id,
        role: roleData.roles,
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
    role: profile?.role || 'usuario',
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
      .select('*')
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
          role: roleMap.get(link.roles_id) || 'usuario',
          empresaId: link.empresas_id || null,
          empresa: empresaMap.get(link.empresas_id) || null
        };
      })
      .filter(Boolean)
  };
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
    .eq('roles', finalRole)
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
