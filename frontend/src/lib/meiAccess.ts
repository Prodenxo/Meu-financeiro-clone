import type { UserRole } from './roles';

/** API/session: só `true`/`false` explícitos; null = sem MEI até toggle no admin. */
export function normalizeMeiFromSession(value: boolean | null | undefined): boolean | null {
  if (value === true) return true;
  if (value === false) return false;
  return null;
}

/**
 * Paridade App (`meiAccess.ts`) e rotas protegidas em `App.tsx` / `Sidebar`.
 * MEI liberado só com `mei === true` no vínculo; superadmin mantém bypass operacional.
 */
export function canAccessMeiArea(role: UserRole | null, mei: boolean | null): boolean {
  if (role === 'superadmin') {
    return true;
  }
  if (role === 'admin' || role === 'usuario') {
    return mei === true;
  }
  return false;
}
