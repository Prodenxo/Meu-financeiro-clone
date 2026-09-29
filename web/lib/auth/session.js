import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { resolveDisplayName, resolveRoleAndEmpresa } from './roles.js';

/**
 * Sessão + papel do usuário logado, memoizada por request (layout e página compartilham).
 * Redireciona para /login quando não há usuário válido.
 */
export const requireUser = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  const access = await resolveRoleAndEmpresa(supabase, user.id);

  return {
    supabase,
    user,
    userId: user.id,
    displayName: resolveDisplayName(user),
    role: access.role,
    empresaId: access.empresaId,
    mei: access.mei,
    accessPending: access.pending,
    accessError: access.error ?? null,
  };
});
