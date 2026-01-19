export type UserRole = 'superadmin' | 'admin' | 'usuario' | 'outsider';

export function normalizeRole(role?: string | null): UserRole | null {
  if (!role) return null;
  const normalized = role.trim().toLowerCase();
  if (normalized === 'superadmin') return 'superadmin';
  if (normalized === 'admin') return 'admin';
  if (normalized === 'usuario' || normalized === 'user') return 'usuario';
  if (normalized === 'outsider') return 'outsider';
  return null;
}

export function hasRole(role: UserRole | null, allowed: UserRole[]) {
  if (!role) return false;
  if (role === 'superadmin') return true;
  return allowed.includes(role);
}
