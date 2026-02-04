import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const badRequest = (message = 'Requisição inválida') => new HttpError(400, message);
export const unauthorized = (message = 'Não autenticado') => new HttpError(401, message);
export const forbidden = (message = 'Acesso negado') => new HttpError(403, message);

export const jsonResponse = (payload: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

export const getAuthHeader = (req: Request) => req.headers.get('Authorization') ?? '';

export const createAdminClient = () =>
  createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY);

export const createAuthedClient = (req: Request) =>
  createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: getAuthHeader(req),
      },
    },
  });

export const requireAuthUser = async (req: Request) => {
  const authHeader = getAuthHeader(req);
  if (!authHeader) throw unauthorized();
  const supabase = createAuthedClient(req);
  const { data: { user } = {}, error } = await supabase.auth.getUser();
  if (error || !user) throw unauthorized();
  return user;
};

export type UserRole = 'superadmin' | 'admin' | 'usuario' | 'outsider';

export const normalizeRoleValue = (role?: string | null): UserRole | null => {
  if (!role) return null;
  const normalized = String(role).trim().toLowerCase();
  if (normalized === 'user') return 'usuario';
  if (normalized === 'superadmin') return 'superadmin';
  if (normalized === 'admin') return 'admin';
  if (normalized === 'usuario') return 'usuario';
  if (normalized === 'outsider') return 'outsider';
  return null;
};

export const roleToDbValue = (role?: UserRole | null) => {
  if (!role) return null;
  if (role === 'usuario') return 'user';
  return role;
};

export const cleanPhone = (phone?: string | null) =>
  phone?.startsWith('+') ? phone.substring(1) : phone;

export const generatePassword = () => crypto.randomUUID().replace(/-/g, '').slice(0, 12);

export const getRequesterContext = async (req: Request) => {
  const user = await requireAuthUser(req);
  const adminClient = createAdminClient();

  const { data: linkData, error: linkError } = await adminClient
    .from('role_x_user_x_empresa')
    .select('empresas_id, roles_id, status')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (linkError) {
    console.warn('[Edge] role_x_user_x_empresa lookup error:', linkError.message);
  }

  if (linkData?.status === false) {
    throw forbidden('Seu perfil está bloqueado');
  }

  if (linkData?.roles_id) {
    const { data: roleData, error: roleError } = await adminClient
      .from('roles')
      .select('roles')
      .eq('id', linkData.roles_id)
      .maybeSingle();

    if (roleError) {
      console.warn('[Edge] roles lookup error:', roleError.message);
    }

    const normalized = normalizeRoleValue(roleData?.roles);
    if (normalized) {
      return {
        userId: user.id,
        role: normalized,
        empresaId: linkData.empresas_id || null,
      };
    }
  }

  const { data: profile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  return {
    userId: user.id,
    role: normalizeRoleValue(profile?.role) || 'usuario',
    empresaId: null,
  };
};
