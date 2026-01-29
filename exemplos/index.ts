import {
  badRequest,
  corsHeaders,
  createAdminClient,
  generatePassword,
  getRequesterContext,
  jsonResponse,
  normalizeRoleValue,
  forbidden,
  HttpError,
} from '../_shared/user-management.ts';

const ROLE_CREATE_ALLOWED = new Set(['superadmin', 'admin']);
const ROLE_UPDATE_ALLOWED_SUPERADMIN = new Set(['admin', 'usuario', 'outsider']);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') throw badRequest('Método não suportado');

    const input = await req.json();
    const userId = input?.userId;
    if (!userId) throw badRequest('userId é obrigatório');

    const requester = await getRequesterContext(req);
    if (!ROLE_CREATE_ALLOWED.has(requester.role)) throw forbidden();

    const adminClient = createAdminClient();
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
      password: newPassword,
    });

    if (updateError) throw badRequest(updateError.message);

    return jsonResponse({ userId, password: newPassword });
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return jsonResponse({ error: message }, status);
  }
});
