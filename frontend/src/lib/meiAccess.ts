import type { UserRole } from './roles';

/**
 * Paridade App (`meiAccess.ts`) e rotas protegidas em `App.tsx` / `Sidebar`.
 * MEI: superadmin, admin, ou (usuario e MEI não desativado no vínculo).
 */
export function canAccessMeiArea(role: UserRole | null, mei: boolean | null): boolean {
  if (role === 'superadmin' || role === 'admin') {
    return true;
  }
  if (role === 'usuario' && mei !== false) {
    return true;
  }
  return false;
}
