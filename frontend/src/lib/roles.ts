export type UserRole = 'superadmin' | 'admin' | 'usuario' | 'outsider';

export function hasRole(role: UserRole | null, allowed: UserRole[]) {
  if (!role) return false;
  if (role === 'superadmin') return true;
  return allowed.includes(role);
}
