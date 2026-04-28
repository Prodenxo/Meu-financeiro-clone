import crypto from 'crypto';
import { createSupabaseClient } from '../config/supabase.js';
import { badRequest, forbidden, unauthorized } from '../utils/errors.js';

const ROLE_CREATE_ALLOWED = new Set(['superadmin', 'admin']);
const ROLE_TARGET_ALLOWED = new Set(['admin', 'usuario', 'outsider']);
const ROLE_UPDATE_ALLOWED_SUPERADMIN = new Set(['admin', 'usuario', 'outsider']);
const ROLE_DEFAULT = 'usuario';
const EMPRESA_SELECT_FIELDS = [
  'id',
  'empresa',
  'cnpj',
  'razao_social',
  'nome_fantasia',
  'inscricao_estadual',
  'regime_tributario',
  'logradouro',
  'numero',
  'complemento',
  'bairro',
  'cidade',
  'estado',
  'cep',
  'telefone',
  'email',
  'max_mei',
  'max_usuarios_nao_mei'
].join(', ');
const EMPRESA_TEXT_FIELDS = [
  'empresa',
  'cnpj',
  'razao_social',
  'nome_fantasia',
  'inscricao_estadual',
  'regime_tributario',
  'logradouro',
  'numero',
  'complemento',
  'bairro',
  'cidade',
  'estado',
  'cep',
  'telefone',
  'email'
];

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

const findRoleByCandidates = async (adminClient, candidates) => {
  if (candidates.length === 0) return null;

  const filters = candidates
    .map((candidate) => `roles.ilike.${candidate}`)
    .join(',');

  const { data, error } = await adminClient
    .from('roles')
    .select('id, roles')
    .or(filters)
    .limit(1)
    .maybeSingle();

  if (error) throw badRequest(error.message);
  if (!data?.id) return null;

  return { roleId: data.id, role: normalizeRoleValue(data.roles) };
};

export const ensureRoleId = async (adminClient, role) => {
  const resolved = await findRoleByCandidates(adminClient, getRoleCandidates(role));
  if (resolved?.roleId) return resolved;

  const fallback = await findRoleByCandidates(adminClient, getRoleCandidates(ROLE_DEFAULT));
  if (fallback?.roleId && normalizeRoleValue(role) && normalizeRoleValue(role) !== ROLE_DEFAULT) {
    console.warn('[Users] role fallback:', { requestedRole: role, resolvedRole: fallback.role });
  }
  return fallback || { roleId: null, role: null };
};

const cleanPhone = (phone) => (phone?.startsWith('+') ? phone.substring(1) : phone);

const generatePassword = () => crypto.randomBytes(9).toString('base64').slice(0, 12);
const normalizeEmpresaText = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const normalized = String(value).trim();
  return normalized || null;
};
const normalizeCnpj = (value) => {
  const normalized = normalizeEmpresaText(value);
  if (normalized === undefined) return undefined;
  if (normalized === null) return null;
  const digits = normalized.replace(/\D/g, '');
  return digits || null;
};
const resolveEmpresaName = (input) => {
  const preferred = normalizeEmpresaText(input?.empresa);
  if (preferred) return preferred;
  const fromRazao = normalizeEmpresaText(input?.razao_social);
  if (fromRazao) return fromRazao;
  const fromFantasia = normalizeEmpresaText(input?.nome_fantasia);
  if (fromFantasia) return fromFantasia;
  return null;
};

const normalizeLimitInput = (value, fieldName) => {
  if (value === undefined || value === null || value === '') return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || !Number.isInteger(numeric)) {
    throw badRequest(`${fieldName} deve ser um inteiro valido`);
  }
  if (numeric < 0) {
    throw badRequest(`${fieldName} deve ser maior ou igual a 0`);
  }
  return numeric;
};

const normalizeLimitValue = (value) => {
  if (value === undefined || value === null) return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return numeric;
};
const buildEmpresaPayload = (input = {}, { requireName = false } = {}) => {
  const payload = {};
  for (const field of EMPRESA_TEXT_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(input, field)) continue;
    payload[field] = field === 'cnpj'
      ? normalizeCnpj(input[field])
      : normalizeEmpresaText(input[field]);
  }

  if (Object.prototype.hasOwnProperty.call(input, 'max_mei')) {
    payload.max_mei = normalizeLimitInput(input.max_mei, 'max_mei');
  }
  if (Object.prototype.hasOwnProperty.call(input, 'max_usuarios_nao_mei')) {
    payload.max_usuarios_nao_mei = normalizeLimitInput(
      input.max_usuarios_nao_mei,
      'max_usuarios_nao_mei'
    );
  }

  if (requireName) {
    payload.empresa = resolveEmpresaName({ ...input, empresa: payload.empresa ?? input?.empresa });
    if (!payload.empresa) throw badRequest('Empresa e obrigatoria');
  }

  return payload;
};
const getEmpresaRecordById = async (adminClient, empresaId) => {
  const { data, error } = await adminClient
    .from('empresas')
    .select(EMPRESA_SELECT_FIELDS)
    .eq('id', empresaId)
    .maybeSingle();
  if (error) throw badRequest(error.message || 'Erro ao carregar empresa');
  if (!data?.id) throw badRequest('Empresa nao encontrada');
  return data;
};

const resolveMeiValue = (value, defaultValue = true) => (
  typeof value === 'boolean' ? value : defaultValue
);

const isUnlimitedLimit = (value) => value === null;

const getEmpresaLimits = async (adminClient, empresaId) => {
  if (!empresaId) throw badRequest('Empresa e obrigatoria');

  const { data, error } = await adminClient
    .from('empresas')
    .select('id, max_mei, max_usuarios_nao_mei')
    .eq('id', empresaId)
    .maybeSingle();

  if (error) throw badRequest(error.message);
  if (!data?.id) throw badRequest('Empresa nao encontrada');

  return {
    maxMei: normalizeLimitValue(data.max_mei),
    maxNaoMei: normalizeLimitValue(data.max_usuarios_nao_mei)
  };
};

const countActiveUsersByMei = async (adminClient, { empresaId, mei, ignoreUserId }) => {
  let query = adminClient
    .from('role_x_user_x_empresa')
    .select('id', { count: 'exact', head: true })
    .eq('empresas_id', empresaId)
    .eq('status', true);

  if (mei) {
    query = query.or('mei.is.null,mei.eq.true');
  } else {
    query = query.eq('mei', false);
  }

  if (ignoreUserId) {
    query = query.neq('user_id', ignoreUserId);
  }

  const { count, error } = await query;
  if (error) throw badRequest(error.message);
  return count || 0;
};

export const ensureEmpresaCapacity = async (adminClient, { empresaId, mei, ignoreUserId }) => {
  const { maxMei, maxNaoMei } = await getEmpresaLimits(adminClient, empresaId);
  const limit = mei ? maxMei : maxNaoMei;

  if (isUnlimitedLimit(limit)) return;

  const total = await countActiveUsersByMei(adminClient, { empresaId, mei, ignoreUserId });
  if (total >= limit) {
    throw badRequest(
      mei
        ? 'Limite de MEI atingido para esta empresa'
        : 'Limite de usuarios nao MEI atingido para esta empresa'
    );
  }
};

/**
 * Convite por empresa (US-INV-03): bloqueia contas administrativas e quem já tem vínculo ativo.
 * @param {import('@supabase/supabase-js').SupabaseClient} adminClient
 * @param {string} userId
 */
export const assertUserEligibleForEmpresaInvite = async (adminClient, userId) => {
  if (!userId) throw badRequest('Usuário inválido');

  const { data: profile, error: profileErr } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (profileErr) throw badRequest(profileErr.message);

  const profileRole = normalizeRoleValue(profile?.role);
  if (profileRole === 'admin' || profileRole === 'superadmin') {
    throw forbidden('Contas administrativas não podem aceitar convite de usuário');
  }

  const { data: activeLink, error: linkErr } = await adminClient
    .from('role_x_user_x_empresa')
    .select('id, empresas_id')
    .eq('user_id', userId)
    .eq('status', true)
    .limit(1)
    .maybeSingle();

  if (linkErr) throw badRequest(linkErr.message);
  
  // Se já tem empresa vinculada, bloqueia. Se tem vínculo mas empresas_id é null, permite (foi criado no signup).
  if (activeLink?.id && activeLink.empresas_id != null) {
    throw badRequest('Esta conta já está vinculada a uma empresa');
  }
};

export const getRequesterContext = async (accessToken) => {
  if (!accessToken) throw unauthorized();

  const userClient = createSupabaseClient({ accessToken });
  const { data: { user } = {}, error: userError } = await userClient.auth.getUser();
  if (userError || !user) throw unauthorized();

  const linkClient = createSupabaseClient({ useServiceRole: true });
  const { data: linkData, error: linkError } = await linkClient
    .from('role_x_user_x_empresa')
    .select('id, empresas_id, roles_id, status, mei, expires_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (linkError) {
    console.warn('[Users] role_x_user_x_empresa lookup error:', linkError.message);
  }

  if (linkData?.roles_id) {
    if (linkData?.status === false) {
      throw forbidden('Seu perfil está bloqueado');
    }
    if (linkData?.expires_at && new Date(linkData.expires_at) < new Date()) {
      if (linkData?.id) {
        await linkClient
          .from('role_x_user_x_empresa')
          .update({ status: false })
          .eq('id', linkData.id);
      }
      throw forbidden('Seu acesso expirou');
    }
    const { data: roleData, error: roleError } = await linkClient
      .from('roles')
      .select('roles')
      .eq('id', linkData.roles_id)
      .maybeSingle();

    if (roleError) {
      console.warn('[Users] roles lookup error:', roleError.message);
    }

    if (roleData?.roles) {
      const mei = typeof linkData?.mei === 'boolean' ? linkData.mei : true;
      return {
        userId: user.id,
        role: normalizeRoleValue(roleData.roles),
        empresaId: linkData.empresas_id || null,
        mei
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
    empresaId: null,
    mei: true
  };
};

export const listUsers = async (accessToken, queryParams = {}) => {
  const { search } = queryParams;
  const { role, empresaId } = await getRequesterContext(accessToken);
  if (!ROLE_CREATE_ALLOWED.has(role)) throw forbidden();

  const adminClient = createSupabaseClient({ useServiceRole: true });
  const searchTerm = search?.toLowerCase().trim();

  // 1. Obter todos os usuários do Auth que batem com a busca (ou todos se não houver busca)
  // Como temos 700+, vamos carregar em lotes se houver busca, ou focar nos vínculos se não houver.
  let allAuthUsers = [];
  if (searchTerm) {
    // Busca ativa: varrer até encontrar ou carregar um bom número
    let page = 1;
    while (page <= 10) { // Até 1000 usuários
      const { data: { users }, error } = await adminClient.auth.admin.listUsers({ page, perPage: 100 });
      if (error || !users || users.length === 0) break;
      
      const matches = users.filter(u => 
        u.email?.toLowerCase().includes(searchTerm) || 
        u.user_metadata?.display_name?.toLowerCase().includes(searchTerm)
      );
      allAuthUsers = allAuthUsers.concat(matches);
      
      // Se já achamos muitos resultados, paramos
      if (allAuthUsers.length > 50) break;
      page++;
    }
  }

  // 2. Obter links de empresas
  let linksQuery = adminClient
    .from('role_x_user_x_empresa')
    .select('user_id, empresas_id, roles_id, status, mei, expires_at');

  if (role === 'admin') {
    if (!empresaId) throw forbidden();
    linksQuery = linksQuery.eq('empresas_id', empresaId);
  }

  const { data: links, error: linksErr } = await linksQuery;
  if (linksErr) throw badRequest(linksErr.message);

  const linkedUserIds = new Set((links || []).map(l => l.user_id));

  // 3. Se houver busca e for Superadmin, incluir usuários do Auth que NÃO estão nos links (órfãos)
  if (searchTerm && role === 'superadmin') {
    for (const au of allAuthUsers) {
      if (!linkedUserIds.has(au.id)) {
        // Adicionar um link "fictício" para representar o usuário sem empresa
        links.push({
          user_id: au.id,
          empresas_id: null,
          roles_id: null,
          status: true,
          mei: true,
          expires_at: null,
          isOrphan: true
        });
      }
    }
  }

  // 4. Filtrar links se houver busca (caso a busca não tenha vindo do Auth primeiro)
  // No caso de listagem normal (sem busca), precisamos carregar os dados do Auth para os links.
  const userIdsToFetch = searchTerm 
    ? allAuthUsers.map(u => u.id)
    : (links || []).map(l => l.user_id).filter(Boolean);

  // Otimização: carregar dados do Auth em lote para os usuários necessários
  // (O listUsers do Supabase não permite filtrar por IDs, então usamos o cache de allAuthUsers ou buscamos)
  const userMap = new Map();
  
  // Alimentar mapa com o que já temos da busca
  allAuthUsers.forEach(u => userMap.set(u.id, {
    id: u.id,
    email: u.email,
    displayName: u.user_metadata?.display_name || null,
    phone: u.user_metadata?.phone || null
  }));

  // Buscar faltantes (apenas se não for uma busca global que já varreu o auth)
  const missingIds = userIdsToFetch.filter(id => !userMap.has(id));
  if (missingIds.length > 0) {
    // Para não estourar limite, buscamos um por um apenas os necessários (limitado a 100 para segurança)
    const limitedMissing = missingIds.slice(0, 100);
    await Promise.all(limitedMissing.map(async (id) => {
      const { data } = await adminClient.auth.admin.getUserById(id);
      if (data?.user) {
        userMap.set(id, {
          id: data.user.id,
          email: data.user.email,
          displayName: data.user.user_metadata?.display_name || null,
          phone: data.user.user_metadata?.phone || null
        });
      }
    }));
  }

  // 5. Carregar Roles e Empresas para o mapeamento final
  const roleIds = Array.from(new Set((links || []).map(l => l.roles_id).filter(Boolean)));
  const empresaIds = Array.from(new Set((links || []).map(l => l.empresas_id).filter(Boolean)));

  const [{ data: rolesData }, { data: empresasData }] = await Promise.all([
    adminClient.from('roles').select('id, roles').in('id', roleIds.length ? roleIds : ['none']),
    adminClient.from('empresas').select('id, empresa').in('id', empresaIds.length ? empresaIds : ['none'])
  ]);

  const roleMap = new Map((rolesData || []).map(r => [r.id, r.roles]));
  const empresaMap = new Map((empresasData || []).map(e => [e.id, e]));

  // 6. Montar lista final
  const resultUsers = (links || [])
    .map((link) => {
      const user = userMap.get(link.user_id);
      if (!user) return null;
      
      // Se estamos buscando e o usuário não bate com o termo (e não veio do allAuthUsers), removemos
      if (searchTerm && !allAuthUsers.some(au => au.id === user.id)) return null;

      return {
        ...user,
        role: normalizeRoleValue(roleMap.get(link.roles_id) || (link.isOrphan ? 'N/A' : 'usuario')),
        empresaId: link.empresas_id || null,
        empresaName: empresaMap.get(link.empresas_id)?.empresa || (link.isOrphan ? 'SEM VÍNCULO' : null),
        status: link.status ?? true,
        mei: typeof link.mei === 'boolean' ? link.mei : true,
        expiresAt: link.expires_at ? new Date(link.expires_at).toISOString() : null
      };
    })
    .filter(Boolean);

  return { users: resultUsers };
};

export const getViewableUserIds = async (accessToken) => {
  const { role, empresaId } = await getRequesterContext(accessToken);
  if (!ROLE_CREATE_ALLOWED.has(role)) throw forbidden();

  const adminClient = createSupabaseClient({ useServiceRole: true });
  let query = adminClient
    .from('role_x_user_x_empresa')
    .select('user_id, empresas_id');

  if (role === 'admin') {
    if (!empresaId) throw forbidden();
    query = query.eq('empresas_id', empresaId);
  }

  const { data, error } = await query;
  if (error) throw badRequest(error.message);

  const userIds = Array.from(
    new Set((data || []).map((link) => link.user_id).filter(Boolean))
  );

  return { role, empresaId, userIds };
};

export const canViewUser = async (accessToken, targetUserId) => {
  if (!targetUserId) throw badRequest('UserId ausente');
  const { userIds } = await getViewableUserIds(accessToken);
  return userIds.includes(targetUserId);
};

export const listEmpresas = async (accessToken) => {
  const { role, empresaId } = await getRequesterContext(accessToken);
  if (!ROLE_CREATE_ALLOWED.has(role)) throw forbidden();

  const adminClient = createSupabaseClient({ useServiceRole: true });
  let query = adminClient
    .from('empresas')
    .select('id, empresa, max_mei, max_usuarios_nao_mei')
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

export const getEmpresa = async (accessToken) => {
  const { role, empresaId } = await getRequesterContext(accessToken);
  if (!ROLE_CREATE_ALLOWED.has(role)) throw forbidden();
  if (!empresaId) throw badRequest('Empresa nao encontrada para o usuario atual');

  const adminClient = createSupabaseClient({ useServiceRole: true });
  const empresa = await getEmpresaRecordById(adminClient, empresaId);
  return { empresa };
};

export const getEmpresaById = async (accessToken, empresaId) => {
  const normalizedEmpresaId = String(empresaId || '').trim();
  if (!normalizedEmpresaId) throw badRequest('Empresa e obrigatoria');

  const requester = await getRequesterContext(accessToken);
  if (!ROLE_CREATE_ALLOWED.has(requester.role)) throw forbidden();
  if (requester.role === 'admin' && requester.empresaId !== normalizedEmpresaId) {
    throw forbidden('Usuário fora do escopo da empresa');
  }

  const adminClient = createSupabaseClient({ useServiceRole: true });
  const empresa = await getEmpresaRecordById(adminClient, normalizedEmpresaId);
  return { empresa };
};

export const createEmpresa = async (accessToken, input) => {
  const { role } = await getRequesterContext(accessToken);
  if (role !== 'superadmin') throw forbidden();
  const payload = buildEmpresaPayload(input, { requireName: true });

  const adminClient = createSupabaseClient({ useServiceRole: true });
  const { data, error } = await adminClient
    .from('empresas')
    .insert(payload)
    .select(EMPRESA_SELECT_FIELDS)
    .maybeSingle();

  if (error) throw badRequest(error.message || 'Erro ao criar empresa');

  return { empresa: data };
};

export const updateEmpresa = async (accessToken, empresaId, input) => {
  const { role } = await getRequesterContext(accessToken);
  if (role !== 'superadmin') throw forbidden();
  if (!empresaId) throw badRequest('Empresa e obrigatoria');
  const updates = buildEmpresaPayload(input);

  if (Object.keys(updates).length === 0) {
    throw badRequest('Nenhum campo informado para atualizar');
  }

  const adminClient = createSupabaseClient({ useServiceRole: true });
  const { data, error } = await adminClient
    .from('empresas')
    .update(updates)
    .eq('id', empresaId)
    .select(EMPRESA_SELECT_FIELDS)
    .maybeSingle();

  if (error) throw badRequest(error.message || 'Erro ao atualizar empresa');
  if (!data?.id) throw badRequest('Empresa nao encontrada');

  return { empresa: data };
};

export const createUser = async (accessToken, input, deps = {}) => {
  const getRequesterContextFn = deps.getRequesterContextFn || getRequesterContext;
  const createSupabaseClientFn = deps.createSupabaseClientFn || createSupabaseClient;
  const { role: requesterRole, empresaId: requesterEmpresaId } = await getRequesterContextFn(accessToken);
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

  const adminClient = createSupabaseClientFn({ useServiceRole: true });

  const targetMei = resolveMeiValue(input?.mei, false);
  await ensureEmpresaCapacity(adminClient, { empresaId: finalEmpresaId, mei: targetMei });

  const { roleId, role: resolvedRole } = await ensureRoleId(adminClient, finalRole);
  if (!roleId) throw badRequest('Role não encontrada');
  if (resolvedRole && resolvedRole !== finalRole) {
    finalRole = resolvedRole;
  }

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

  const expiresAtInsert =
    finalRole === 'usuario' && input?.expiresAt
      ? new Date(input.expiresAt).toISOString()
      : null;
  const { error: linkError } = await adminClient
    .from('role_x_user_x_empresa')
    .insert({
      user_id: createdUser.user.id,
      roles_id: roleId,
      empresas_id: finalEmpresaId,
      status: true,
      mei: targetMei,
      ...(expiresAtInsert ? { expires_at: expiresAtInsert } : {})
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
  const requestedMei = typeof input?.mei === 'boolean' ? input.mei : undefined;
  const requestedExpiresAt =
    input?.expiresAt === undefined
      ? undefined
      : input.expiresAt
        ? new Date(input.expiresAt).toISOString()
        : null;

  const adminClient = createSupabaseClient({ useServiceRole: true });
  const { data: linkData, error: linkError } = await adminClient
    .from('role_x_user_x_empresa')
    .select('id, empresas_id, roles_id, mei')
    .eq('user_id', userId)
    .eq('status', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (linkError) throw badRequest(linkError.message);
  const currentEmpresaId = linkData?.empresas_id || null;
  const currentMei = resolveMeiValue(linkData?.mei);
  let targetMei = requestedMei !== undefined ? requestedMei : currentMei;
  let targetEmpresaId = currentEmpresaId;
  let capacityChecked = false;
  let linkRecord = linkData;
  if (!linkRecord?.roles_id) {
    if (requester.role !== 'superadmin') {
      throw badRequest('Vínculo de role não encontrado');
    }

    if (!requestedEmpresaId) {
      throw badRequest('Empresa é obrigatória');
    }

    const roleForLink = requestedRole || 'usuario';
    if (!ROLE_UPDATE_ALLOWED_SUPERADMIN.has(roleForLink)) {
      throw badRequest('Role inválida');
    }

    const { roleId, role: resolvedRole } = await ensureRoleId(adminClient, roleForLink);
    if (!roleId) throw badRequest('Role não encontrada');
    if (resolvedRole && resolvedRole !== roleForLink) {
      console.warn('[Users] updateUser role fallback:', {
        requestedRole: roleForLink,
        resolvedRole
      });
    }

    const { data: existingLink, error: existingLinkError } = await adminClient
      .from('role_x_user_x_empresa')
      .select('id, empresas_id, roles_id, mei')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingLinkError) throw badRequest(existingLinkError.message);

    targetEmpresaId = requestedEmpresaId;
    const fallbackMei = resolveMeiValue(existingLink?.mei);
    targetMei = requestedMei !== undefined ? requestedMei : fallbackMei;

    await ensureEmpresaCapacity(adminClient, {
      empresaId: targetEmpresaId,
      mei: targetMei,
      ignoreUserId: userId
    });
    capacityChecked = true;

    if (existingLink?.id) {
    const { data: updatedLink, error: updateLinkError } = await adminClient
      .from('role_x_user_x_empresa')
      .update({
        roles_id: roleId,
        empresas_id: requestedEmpresaId,
        status: true,
        ...(requestedMei !== undefined ? { mei: requestedMei } : {})
      })
        .eq('id', existingLink.id)
        .select('id, empresas_id, roles_id')
        .maybeSingle();

      if (updateLinkError) throw badRequest(updateLinkError.message);
      linkRecord = updatedLink;
    } else {
    const { data: createdLink, error: createLinkError } = await adminClient
      .from('role_x_user_x_empresa')
      .insert({
        user_id: userId,
        roles_id: roleId,
        empresas_id: requestedEmpresaId,
        status: true,
        mei: targetMei
      })
        .select('id, empresas_id, roles_id')
        .maybeSingle();

      if (createLinkError) throw badRequest(createLinkError.message);

      linkRecord = createdLink;
    }
  }

  const { data: roleData, error: roleError } = await adminClient
    .from('roles')
    .select('roles')
    .eq('id', linkRecord.roles_id)
    .maybeSingle();

  if (roleError) throw badRequest(roleError.message);
  const targetRole = normalizeRoleValue(roleData?.roles) || 'usuario';

  if (requester.role === 'admin') {
    if (targetRole !== 'usuario') throw forbidden();
    if (!requester.empresaId || requester.empresaId !== linkRecord.empresas_id) throw forbidden();
    if (requestedRole && requestedRole !== 'usuario') throw forbidden();
  }

  if (requester.role === 'superadmin') {
    if (!ROLE_UPDATE_ALLOWED_SUPERADMIN.has(targetRole)) throw forbidden();
    if (requestedRole && !ROLE_UPDATE_ALLOWED_SUPERADMIN.has(requestedRole)) {
      throw badRequest('Role inválida');
    }
  }

  let finalRole = requestedRole || targetRole;
  let finalEmpresaId = linkRecord.empresas_id;

  if (requester.role === 'superadmin') {
    if (!requestedEmpresaId) throw badRequest('Empresa é obrigatória');
    finalEmpresaId = requestedEmpresaId;
  }

  targetEmpresaId = finalEmpresaId;

  if (!capacityChecked) {
    const shouldCheckCapacity = targetEmpresaId !== currentEmpresaId || targetMei !== currentMei;
    if (shouldCheckCapacity) {
      await ensureEmpresaCapacity(adminClient, {
        empresaId: targetEmpresaId,
        mei: targetMei,
        ignoreUserId: userId
      });
    }
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

  const { roleId, role: resolvedRole } = await ensureRoleId(adminClient, finalRole);
  if (!roleId) throw badRequest('Role não encontrada');
  if (resolvedRole && resolvedRole !== finalRole) {
    finalRole = resolvedRole;
  }

  const updatePayload = {
    roles_id: roleId,
    empresas_id: finalEmpresaId,
    ...(requestedMei !== undefined ? { mei: requestedMei } : {})
  };
  if (targetRole === 'usuario' && requestedExpiresAt !== undefined) {
    updatePayload.expires_at = requestedExpiresAt;
  }
  if (finalRole !== 'usuario') {
    updatePayload.expires_at = null;
  }
  const { error: updateError } = await adminClient
    .from('role_x_user_x_empresa')
    .update(updatePayload)
    .eq('id', linkRecord.id);

  if (updateError) throw badRequest(updateError.message);

  if (requestedDisplayName || requestedPhone) {
    const metadata = {};
    if (requestedDisplayName) {
      metadata.display_name = requestedDisplayName;
      metadata.name = requestedDisplayName;
      metadata.full_name = requestedDisplayName;
    }
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

  if (requestedDisplayName) {
    await adminClient
      .from('profiles')
      .upsert(
        { id: userId, display_name: requestedDisplayName },
        { onConflict: 'id' }
      );
  }

  return {
    userId,
    role: finalRole,
    empresaId: finalEmpresaId
  };
};

export const banUser = async (accessToken, userId, status = false) => {
  if (!userId) throw badRequest('userId é obrigatório');

  const requester = await getRequesterContext(accessToken);
  if (!ROLE_CREATE_ALLOWED.has(requester.role)) throw forbidden();

  const adminClient = createSupabaseClient({ useServiceRole: true });
  const { data: linkData, error: linkError } = await adminClient
    .from('role_x_user_x_empresa')
    .select('id, empresas_id, roles_id')
    .eq('user_id', userId)
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
  }

  if (requester.role === 'superadmin') {
    if (!ROLE_UPDATE_ALLOWED_SUPERADMIN.has(targetRole)) throw forbidden();
  }

  const { error: banError } = await adminClient
    .from('role_x_user_x_empresa')
    .update({ status })
    .eq('id', linkData.id);
  if (banError) throw badRequest(banError.message);

  return { userId, status };
};

export const deleteUser = async (accessToken, userId) => {
  if (!userId) throw badRequest('userId é obrigatório');

  const requester = await getRequesterContext(accessToken);
  if (!ROLE_CREATE_ALLOWED.has(requester.role)) throw forbidden();

  const adminClient = createSupabaseClient({ useServiceRole: true });
  const { data: linkData, error: linkError } = await adminClient
    .from('role_x_user_x_empresa')
    .select('empresas_id, roles_id')
    .eq('user_id', userId)
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
  }

  if (requester.role === 'superadmin') {
    if (!ROLE_UPDATE_ALLOWED_SUPERADMIN.has(targetRole)) throw forbidden();
  }

  const deleteByUserId = async (table) => {
    const { error } = await adminClient.from(table).delete().eq('user_id', userId);
    if (error) throw badRequest(error.message);
  };

  await deleteByUserId('lancamentos_id');
  await deleteByUserId('categorias_id');
  await deleteByUserId('n8n_link');
  await deleteByUserId('google_tokens_id');
  await deleteByUserId('role_x_user_x_empresa');
  await adminClient.from('profiles').delete().eq('id', userId);

  const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(userId);
  if (deleteAuthError) throw badRequest(deleteAuthError.message);

  return { userId };
};

export const deleteEmpresa = async (accessToken, empresaId) => {
  if (!empresaId) throw badRequest('empresaId é obrigatório');

  const requester = await getRequesterContext(accessToken);
  if (requester.role !== 'superadmin') throw forbidden();

  const adminClient = createSupabaseClient({ useServiceRole: true });

  // 1. Remover todos os vínculos de usuários com esta empresa
  const { error: linksError } = await adminClient
    .from('role_x_user_x_empresa')
    .delete()
    .eq('empresas_id', empresaId);
  
  if (linksError) throw badRequest(`Erro ao remover vínculos: ${linksError.message}`);

  // 2. Remover a empresa propriamente dita
  const { error: empresaError } = await adminClient
    .from('empresas')
    .delete()
    .eq('id', empresaId);

  if (empresaError) throw badRequest(`Erro ao remover empresa: ${empresaError.message}`);

  return { empresaId };
};

export const resetUserPassword = async (accessToken, userId, input) => {
  if (!userId) throw badRequest('userId é obrigatório');

  const requester = await getRequesterContext(accessToken);
  if (!ROLE_CREATE_ALLOWED.has(requester.role)) throw forbidden();

  const adminClient = createSupabaseClient({ useServiceRole: true });
  const { data: linkData, error: linkError } = await adminClient
    .from('role_x_user_x_empresa')
    .select('empresas_id, roles_id')
    .eq('user_id', userId)
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
  }

  if (requester.role === 'superadmin') {
    if (!ROLE_UPDATE_ALLOWED_SUPERADMIN.has(targetRole)) throw forbidden();
  }

  const newPassword = input?.password?.trim() || generatePassword();
  const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
    password: newPassword
  });

  if (updateError) throw badRequest(updateError.message);
  return { userId, password: newPassword };
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
