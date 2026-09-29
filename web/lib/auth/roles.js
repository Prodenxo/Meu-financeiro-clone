/** Porta de `frontend/lib/auth-roles.ts` + `frontend/lib/meiAccess.ts`. */

export function normalizeRoleValue(role) {
  if (!role) return null;
  const normalized = String(role).trim().toLowerCase();
  if (normalized === 'user') return 'usuario';
  if (['superadmin', 'admin', 'usuario', 'outsider'].includes(normalized)) return normalized;
  return null;
}

/** MEI liberado só com `mei === true` no vínculo; superadmin mantém bypass operacional. */
export function canAccessMeiArea(role, mei) {
  if (role === 'superadmin') return true;
  if (role === 'admin' || role === 'usuario') return mei === true;
  return false;
}

/**
 * Resolve papel / empresa / MEI do vínculo mais recente em `role_x_user_x_empresa`.
 * @returns {Promise<{role:string|null, empresaId:string|null, mei:boolean|null, pending:boolean, error?:string}>}
 */
export async function resolveRoleAndEmpresa(supabase, userId) {
  const empty = { role: null, empresaId: null, mei: null, pending: false };
  if (!userId) return empty;

  try {
    const { data: linkData, error: linkError } = await supabase
      .from('role_x_user_x_empresa')
      .select('empresas_id, roles_id, status, expires_at, mei')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (linkError) {
      console.warn('[Auth] role_x_user_x_empresa lookup error:', linkError.message);
    }

    // status === false → cadastro aguardando aprovação do superadmin
    if (linkData?.status === false) {
      return { role: null, empresaId: linkData.empresas_id || null, mei: null, pending: true };
    }

    if (linkData?.roles_id) {
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('roles')
        .eq('id', linkData.roles_id)
        .maybeSingle();

      if (roleError) {
        console.warn('[Auth] roles lookup error:', roleError.message);
      }

      const normalizedRole = normalizeRoleValue(roleData?.roles);
      if (normalizedRole) {
        if (normalizedRole === 'usuario' && linkData.expires_at) {
          const expiresAt = new Date(linkData.expires_at);
          if (expiresAt.getTime() <= Date.now()) {
            return { ...empty, error: 'Seu acesso expirou' };
          }
        }
        return {
          role: normalizedRole,
          empresaId: linkData.empresas_id || null,
          mei: linkData.mei === true,
          pending: false,
        };
      }
    }
  } catch (error) {
    console.warn('[Auth] link role resolution error:', error?.message || error);
  }

  return empty;
}

/** Nome exibido: `display_name` dos metadados (igual ao Expo); fallback e-mail. */
export function resolveDisplayName(user) {
  const name = user?.user_metadata?.display_name || user?.user_metadata?.full_name || '';
  if (name) return String(name).trim();
  return user?.email ? String(user.email).split('@')[0] : 'Usuário';
}

export function firstName(fullName) {
  return String(fullName || '').trim().split(/\s+/)[0] || 'você';
}
