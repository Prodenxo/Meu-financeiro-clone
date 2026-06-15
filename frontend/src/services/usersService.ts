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
  mei?: boolean | null;
  expiresAt?: string | null;
}

export interface EmpresaOption {
  id: string;
  empresa: string;
  max_mei?: number | null;
  max_usuarios_nao_mei?: number | null;
  /** Vagas MEI pagas em PIX antes da Stripe — saldo manual pelo superadmin. */
  legacy_mei_slots_pix?: number | null;
}

export interface EmpresaLimitsPayload {
  empresa: string;
  max_mei?: number | null;
  max_usuarios_nao_mei?: number | null;
  legacy_mei_slots_pix?: number | null;
}

export interface EmpresaUpdatePayload {
  empresa?: string;
  max_mei?: number | null;
  max_usuarios_nao_mei?: number | null;
  legacy_mei_slots_pix?: number | null;
}

export async function listUsers(search?: string) {
  const q = search ? `?search=${encodeURIComponent(search)}` : '';
  const result = await apiClient.get<{ users: ManagedUser[] }>(`/users${q}`);
  return (result.users || []).map((user) => ({
    ...user,
    role: normalizeRole(user.role) || user.role,
    mei: typeof user.mei === 'boolean' ? user.mei : null,
  }));
}

export async function listEmpresas() {
  const result = await apiClient.get<{ empresas: EmpresaOption[] }>('/users/empresas');
  return result.empresas || [];
}

export async function createEmpresaLimits(input: EmpresaLimitsPayload) {
  return apiClient.post<{
    empresa: EmpresaOption & { max_mei?: number | null; max_usuarios_nao_mei?: number | null };
  }>('/users/empresas', input);
}

export async function updateEmpresaLimits(empresaId: string, input: EmpresaUpdatePayload) {
  return apiClient.put<{ empresa: EmpresaOption }>(`/users/empresas/${empresaId}`, input);
}

export async function deleteEmpresa(empresaId: string) {
  return apiClient.delete<{ success: boolean }>(`/users/empresas/${empresaId}`);
}

export async function updateUser(
  userId: string,
  input: {
    role?: string;
    empresaId?: string;
    displayName?: string;
    phone?: string;
    email?: string;
    mei?: boolean;
    expiresAt?: string | null;
  }
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

export type AdminMeiDocumentosAtivosInput = {
  nfse: boolean;
  nfe: boolean;
  nfce: boolean;
};

export async function patchAdminMeiDocumentosAtivos(
  userId: string,
  documentosAtivos: AdminMeiDocumentosAtivosInput
): Promise<{ documentosAtivos: AdminMeiDocumentosAtivosInput }> {
  return apiClient.patch<{ documentosAtivos: AdminMeiDocumentosAtivosInput }>(
    `/admin/users/${encodeURIComponent(userId)}/mei-documentos-ativos`,
    { documentosAtivos }
  );
}

export async function resetUserPassword(userId: string, password?: string) {
  return apiClient.post<{ userId: string; password: string }>(`/users/${userId}/reset-password`, {
    password
  });
}

export async function sendUserPasswordResetEmail(userId: string) {
  return apiClient.post<{ userId: string; sent: boolean }>(
    `/users/${userId}/send-password-reset-email`,
    {}
  );
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
  max_mei?: number | null;
  max_usuarios_nao_mei?: number | null;
  legacy_mei_slots_pix?: number | null;
}

export async function getEmpresa() {
  return apiClient.get<{ empresa: EmpresaFullData }>('/users/empresas/current');
}

export async function getEmpresaById(empresaId: string) {
  return apiClient.get<{ empresa: EmpresaFullData }>(`/users/empresas/${empresaId}`);
}

export async function createEmpresa(input: EmpresaFullData) {
  return apiClient.post<{ empresa: EmpresaFullData }>('/users/empresas', input);
}

export async function updateEmpresa(empresaId: string, input: EmpresaFullData) {
  return apiClient.put<{ empresa: EmpresaFullData }>(`/users/empresas/${empresaId}`, input);
}

export interface CnpjLookupResult {
  cpfCnpj: string;
  razaoSocial: string | null;
  nomeFantasia: string | null;
  email: string | null;
  telefone: { ddd: string; numero: string } | null;
  inscricaoMunicipal: string | null;
  inscricaoEstadual: string | null;
  endereco: {
    logradouro: string | null;
    numero: string | null;
    complemento: string | null;
    bairro: string | null;
    codigoCidade: string | null;
    descricaoCidade: string | null;
    estado: string | null;
    cep: string | null;
  };
  situacaoCadastral?: string | null;
  porte?: string | null;
  opcaoSimples?: boolean | null;
}

const shouldFallbackCnpjLookup = (error: unknown) => {
  if (!(error instanceof Error)) return true;
  const msg = error.message.toLowerCase();
  if (msg.includes('not authenticated') || msg.includes('não autenticado')) return false;
  if (msg.includes('inválido') || msg.includes('14 dígitos')) return false;
  if (msg.includes('não encontrado')) return false;
  return true;
};

/** Consulta dados cadastrais (PlugNotas + BrasilAPI no backend; fallback direto BrasilAPI no browser). */
export async function lookupEmpresaCnpj(cnpj: string): Promise<CnpjLookupResult> {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) throw new Error('CNPJ deve ter 14 dígitos.');

  try {
    return await apiClient.get<CnpjLookupResult>(`/users/empresas/cnpj-lookup/${digits}`);
  } catch (backendError) {
    if (!shouldFallbackCnpjLookup(backendError)) throw backendError;
    const { fetchBrasilApiCnpj, mapBrasilApiToCnpjLookupResult } = await import('../utils/brasilApi');
    const raw = await fetchBrasilApiCnpj(digits);
    return mapBrasilApiToCnpjLookupResult(raw, digits);
  }
}

export async function createUser(input: {
  email: string;
  password?: string;
  displayName?: string;
  phone?: string;
  role?: 'admin' | 'usuario' | 'outsider';
  empresaId?: string;
  mei?: boolean;
  expiresAt?: string | null;
}) {
  const sanitizedRole = sanitizeUserRole(input.role);
  const payload = {
    ...input,
    mei: input.mei === true,
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
