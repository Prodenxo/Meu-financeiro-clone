import { apiClient } from './apiClient';

export interface ManagedUser {
  id: string;
  email: string | null;
  displayName: string | null;
  phone: string | null;
  role: 'superadmin' | 'admin' | 'usuario' | 'outsider';
  empresaId: string | null;
}

export async function listUsers() {
  const result = await apiClient.get<{ users: ManagedUser[] }>('/users');
  return result.users || [];
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
