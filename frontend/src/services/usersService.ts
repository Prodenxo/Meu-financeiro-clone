import { apiClient } from './apiClient';
import { normalizeRole } from '../lib/roles';

export interface ManagedUser {
  id: string;
  email: string | null;
  displayName: string | null;
  phone: string | null;
  role: 'superadmin' | 'admin' | 'usuario' | 'outsider';
  empresaId: string | null;
  empresaName?: string | null;
}

export interface EmpresaOption {
  id: string;
  empresa: string;
}

export async function listUsers() {
  const result = await apiClient.get<{ users: ManagedUser[] }>('/users');
  return (result.users || []).map((user) => ({
    ...user,
    role: normalizeRole(user.role) || user.role,
  }));
}

export async function listEmpresas() {
  const result = await apiClient.get<{ empresas: EmpresaOption[] }>('/users/empresas');
  return result.empresas || [];
}

export async function updateUser(
  userId: string,
  input: { role?: string; empresaId?: string; displayName?: string; phone?: string }
) {
  return apiClient.put<{ userId: string; role: string; empresaId: string }>(`/users/${userId}`, input);
}

export async function createUser(input: {
  email: string;
  password?: string;
  displayName?: string;
  phone?: string;
  role?: 'admin' | 'usuario' | 'outsider';
  empresaId?: string;
}) {
  return apiClient.post<{
    userId: string;
    email: string;
    role: string;
    empresaId: string;
    generatedPassword: string | null;
  }>('/users', input);
}
