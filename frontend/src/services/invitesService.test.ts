import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import {
  acceptInviteRequest,
  createInvite,
  listPendingInvites,
  revokeInvite,
  validateInviteTokenPublic
} from './invitesService';
import { apiClient } from './apiClient';

vi.mock('./apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn()
  }
}));

const mockedApiClient = apiClient as unknown as {
  get: Mock;
  post: Mock;
};

describe('invitesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createInvite envia POST /invites com corpo vazio (admin)', async () => {
    mockedApiClient.post.mockResolvedValueOnce({
      inviteUrl: 'http://localhost/register?convite=x',
      invite: { id: 'i1', empresas_id: 'e1', expires_at: '', created_at: '', invited_email: null }
    });

    await createInvite({});

    expect(mockedApiClient.post).toHaveBeenCalledWith('/invites', {});
  });

  it('createInvite envia empresas_id para superadmin', async () => {
    mockedApiClient.post.mockResolvedValueOnce({
      inviteUrl: 'u',
      invite: { id: 'i2', empresas_id: 'e2', expires_at: '', created_at: '', invited_email: null }
    });

    await createInvite({ empresas_id: 'e2' });

    expect(mockedApiClient.post).toHaveBeenCalledWith('/invites', { empresas_id: 'e2' });
  });

  it('listPendingInvites chama GET /invites sem query quando sem filtro', async () => {
    mockedApiClient.get.mockResolvedValueOnce({ invites: [] });

    await listPendingInvites();

    expect(mockedApiClient.get).toHaveBeenCalledWith('/invites');
  });

  it('listPendingInvites acrescenta empresas_id na query quando informado', async () => {
    mockedApiClient.get.mockResolvedValueOnce({ invites: [] });

    await listPendingInvites({ empresas_id: 'emp-1' });

    expect(mockedApiClient.get).toHaveBeenCalledWith('/invites?empresas_id=emp-1');
  });

  it('revokeInvite chama POST /invites/:id/revoke', async () => {
    mockedApiClient.post.mockResolvedValueOnce({ id: 'inv-9', revoked_at: '2026-01-01T00:00:00.000Z' });

    await revokeInvite('inv-9');

    expect(mockedApiClient.post).toHaveBeenCalledWith('/invites/inv-9/revoke', {});
  });

  it('validateInviteTokenPublic retorna invalid sem HTTP quando token vazio', async () => {
    const r = await validateInviteTokenPublic('   ');
    expect(r).toEqual({ status: 'invalid' });
    expect(mockedApiClient.get).not.toHaveBeenCalled();
  });

  it('validateInviteTokenPublic chama GET /invites/validate com token codificado', async () => {
    mockedApiClient.get.mockResolvedValueOnce({ status: 'valid' });

    await validateInviteTokenPublic('a/b+c=');

    expect(mockedApiClient.get).toHaveBeenCalledWith(
      `/invites/validate?token=${encodeURIComponent('a/b+c=')}`
    );
  });

  it('acceptInviteRequest chama POST /invites/accept', async () => {
    mockedApiClient.post.mockResolvedValueOnce({});

    await acceptInviteRequest({ token: 'rawtok', mei: true });

    expect(mockedApiClient.post).toHaveBeenCalledWith('/invites/accept', { token: 'rawtok', mei: true });
  });
});
