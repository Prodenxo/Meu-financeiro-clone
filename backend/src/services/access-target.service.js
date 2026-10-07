import { forbidden } from '../utils/errors.js';

const normalizeRole = (role) => {
  if (!role) return null;
  const normalized = String(role).trim().toLowerCase();
  return normalized === 'user' ? 'usuario' : normalized;
};

/**
 * Perfil e empresa do usuário alvo, lidos com service role (mesma regra de `banUser`/`deleteUser`:
 * vínculo mais recente em `role_x_user_x_empresa`; sem vínculo, `profiles.role`).
 * @param {import('@supabase/supabase-js').SupabaseClient} adminClient
 * @param {string} userId
 */
export const resolveAccessTarget = async (adminClient, userId) => {
  const { data: link, error: linkError } = await adminClient
    .from('role_x_user_x_empresa')
    .select('empresas_id, roles_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (linkError) throw forbidden('Não foi possível verificar o perfil do usuário alvo');

  if (link?.roles_id) {
    const { data: roleRow, error: roleError } = await adminClient
      .from('roles')
      .select('roles')
      .eq('id', link.roles_id)
      .maybeSingle();
    if (roleError) throw forbidden('Não foi possível verificar o perfil do usuário alvo');
    return { role: normalizeRole(roleRow?.roles) || 'usuario', empresaId: link.empresas_id || null, hasLink: true };
  }

  const { data: profile } = await adminClient.from('profiles').select('role').eq('id', userId).maybeSingle();
  return { role: normalizeRole(profile?.role) || 'usuario', empresaId: link?.empresas_id || null, hasLink: Boolean(link) };
};

/**
 * Quem pode "acessar como" (mesma regra das demais ações de gestão):
 * superadmin → qualquer conta que não seja superadmin; admin → só `usuario` da própria empresa.
 * @param {{ userId: string, role: string, empresaId: string | null }} requester
 * @param {string} targetUserId
 * @param {{ role: string, empresaId: string | null }} target
 */
export const assertCanImpersonate = (requester, targetUserId, target) => {
  if (requester.role !== 'superadmin' && requester.role !== 'admin') {
    throw forbidden('Apenas administradores podem acessar outras contas');
  }
  if (requester.userId === targetUserId) throw forbidden('Você já está na sua própria conta');
  if (target.role === 'superadmin') throw forbidden('Não é possível acessar contas de superadmin');
  if (requester.role === 'admin') {
    if (target.role !== 'usuario') throw forbidden('Administradores só podem acessar contas de usuários');
    if (!requester.empresaId || requester.empresaId !== target.empresaId) {
      throw forbidden('Você só pode acessar usuários da sua própria empresa');
    }
  }
};
