import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { getSession } from './authService';
import { apiClient } from './apiClient';

vi.mock('./apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    setAuthToken: vi.fn(),
    clearAuthToken: vi.fn()
  }
}));

const mockedApiClient = apiClient as unknown as {
  get: Mock;
  setAuthToken: Mock;
  clearAuthToken: Mock;
};

describe('authService.getSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('retorna null quando nao ha token no localStorage', async () => {
    const result = await getSession();
    expect(result).toBeNull();
    expect(mockedApiClient.get).not.toHaveBeenCalled();
  });

  it('retorna sessao normalizada quando backend responde sessao valida', async () => {
    localStorage.setItem(
      'financas-pessoais-auth-token',
      JSON.stringify({
        access_token: 'token-1',
        refresh_token: 'refresh-1',
        expires_at: 123
      })
    );

    mockedApiClient.get.mockResolvedValueOnce({
      session: {
        user: { id: 'user-1', email: 'u@test.com' },
        role: 'admin',
        empresaId: 'empresa-1'
      }
    });

    const result = await getSession();

    expect(mockedApiClient.get).toHaveBeenCalledWith('/auth/session');
    expect(mockedApiClient.setAuthToken).toHaveBeenCalled();
    expect(result).toEqual({
      user: { id: 'user-1', email: 'u@test.com' },
      access_token: 'token-1',
      refresh_token: 'refresh-1',
      expires_at: 123,
      role: 'admin',
      empresaId: 'empresa-1',
      mei: true
    });
  });

  it('limpa token e retorna null quando chamada de sessao falha', async () => {
    localStorage.setItem(
      'financas-pessoais-auth-token',
      JSON.stringify({ access_token: 'token-1' })
    );
    mockedApiClient.get.mockRejectedValueOnce(new Error('401'));

    const result = await getSession();

    expect(mockedApiClient.clearAuthToken).toHaveBeenCalled();
    expect(result).toBeNull();
  });
});
