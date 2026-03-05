import { apiClient } from './apiClient';
import { normalizeRole } from '../lib/roles';

const ALLOWED_USER_ROLES = new Set(['admin', 'usuario', 'outsider']);

const sanitizeUserRole = (role?: string | null) => {
  const normalized = normalizeRole(role);
  if (!normalized || !ALLOWED_USER_ROLES.has(normalized)) return undefined;
  return normalized;
};

export interface ManagedUser {
  id: string;
  email: string | null;
  displayName: string | null;
  phone: string | null;
  role: 'superadmin' | 'admin' | 'usuario' | 'outsider';
  empresaId: string | null;
  empresaName?: string | null;
  status?: boolean | null;
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
  const sanitizedRole = sanitizeUserRole(input.role);
  const payload = {
    ...input,
    ...(sanitizedRole ? { role: sanitizedRole } : {})
  };
  return apiClient.put<{ userId: string; role: string; empresaId: string }>(`/users/${userId}`, payload);
}

export async function banUser(userId: string) {
  return apiClient.post<{ userId: string; bannedUntil: string }>(`/users/${userId}/ban`);
}

export async function unbanUser(userId: string) {
  return apiClient.post<{ userId: string; status: boolean }>(`/users/${userId}/unban`);
}

export async function deleteUser(userId: string) {
  return apiClient.delete<{ userId: string }>(`/users/${userId}`);
}

export async function resetUserPassword(userId: string, password?: string) {
  return apiClient.post<{ userId: string; password: string }>(`/users/${userId}/reset-password`, {
    password
  });
}

export interface EmpresaFullData {
  id?: string;
  empresa?: string;
  cnpj?: string;
  razao_social?: string;
  nome_fantasia?: string;
  inscricao_estadual?: string;
  regime_tributario?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  telefone?: string;
  email?: string;
}

export async function getEmpresa() {
  return apiClient.get<{ empresa: EmpresaFullData }>('/users/empresas/current');
}

export async function createEmpresa(input: EmpresaFullData) {
  return apiClient.post<{ empresa: EmpresaFullData }>('/users/empresas', input);
}

export async function updateEmpresa(empresaId: string, input: EmpresaFullData) {
  return apiClient.put<{ empresa: EmpresaFullData }>(`/users/empresas/${empresaId}`, input);
}

export async function createUser(input: {
  email: string;
  password?: string;
  displayName?: string;
  phone?: string;
  role?: 'admin' | 'usuario' | 'outsider';
  empresaId?: string;
}) {
  const sanitizedRole = sanitizeUserRole(input.role);
  const payload = {
    ...input,
    ...(sanitizedRole ? { role: sanitizedRole } : {})
  };
  return apiClient.post<{
    userId: string;
    email: string;
    role: string;
    empresaId: string;
    generatedPassword: string | null;
  }>('/users', payload);
}
