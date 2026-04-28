import { apiClient } from './apiClient';

/** Resposta pública de `GET|POST /invites/validate` (sem Bearer). */
export type InviteValidationStatus = 'valid' | 'expired' | 'revoked' | 'used' | 'invalid';

export async function validateInviteTokenPublic(rawToken: string) {
  const t = rawToken?.trim();
  if (!t) {
    return { status: 'invalid' as const };
  }
  return apiClient.get<{ 
    status: InviteValidationStatus;
    empresaName?: string | null;
  }>(
    `/invites/validate?token=${encodeURIComponent(t)}`
  );
}

/** US-INV-03: após signUp/signIn com Bearer. */
export async function acceptInviteRequest(body: { token: string; mei?: boolean }) {
  return apiClient.post<unknown>('/invites/accept', body);
}

export interface EmpresaInviteRow {
  id: string;
  empresas_id: string;
  created_at: string;
  expires_at: string;
  created_by: string;
  invited_email?: string | null;
  is_reusable?: boolean;
  uses_count?: number;
  raw_token?: string | null;
}

export interface CreateInviteResponse {
  inviteUrl: string;
  invite: Pick<EmpresaInviteRow, 'id' | 'empresas_id' | 'expires_at' | 'created_at' | 'invited_email'>;
}

/** Admin: corpo vazio. Superadmin: `{ empresas_id }` obrigatório. */
export async function createInvite(body: { 
  empresas_id?: string; 
  invited_email?: string | null;
  is_reusable?: boolean;
} = {}) {
  return apiClient.post<CreateInviteResponse>('/invites', body);
}

export async function listPendingInvites(params?: { empresas_id?: string }) {
  const q = params?.empresas_id
    ? `?empresas_id=${encodeURIComponent(params.empresas_id)}`
    : '';
  return apiClient.get<{ invites: EmpresaInviteRow[] }>(`/invites${q}`);
}

export async function revokeInvite(inviteId: string) {
  return apiClient.post<{ id: string; revoked_at: string }>(`/invites/${inviteId}/revoke`, {});
}
