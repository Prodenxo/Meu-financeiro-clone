import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import {
  listEmpresas,
  getEmpresa,
  getEmpresaById,
  createEmpresa,
  updateEmpresa,
  createEmpresaLimits,
  updateEmpresaLimits
} from './usersService';
import { apiClient } from './apiClient';

vi.mock('./apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn()
  }
}));

const mockedApiClient = apiClient as unknown as {
  get: Mock;
  post: Mock;
  put: Mock;
};

describe('usersService contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('consulta empresa atual e empresa por id nos endpoints esperados', async () => {
    mockedApiClient.get
      .mockResolvedValueOnce({ empresa: { id: 'empresa-1' } })
      .mockResolvedValueOnce({ empresa: { id: 'empresa-2' } });

    await getEmpresa();
    await getEmpresaById('empresa-2');

    expect(mockedApiClient.get).toHaveBeenNthCalledWith(1, '/users/empresas/current');
    expect(mockedApiClient.get).toHaveBeenNthCalledWith(2, '/users/empresas/empresa-2');
  });

  it('lista empresas e cria/atualiza empresa no backend de users', async () => {
    mockedApiClient.get.mockResolvedValueOnce({ empresas: [] });
    mockedApiClient.post.mockResolvedValueOnce({ empresa: { id: 'empresa-1' } });
    mockedApiClient.put.mockResolvedValueOnce({ empresa: { id: 'empresa-1' } });

    await listEmpresas();
    await createEmpresa({ empresa: 'Empresa Teste', cidade: 'Sao Paulo' });
    await updateEmpresa('empresa-1', { cidade: 'Campinas' });

    expect(mockedApiClient.get).toHaveBeenCalledWith('/users/empresas');
    expect(mockedApiClient.post).toHaveBeenCalledWith('/users/empresas', {
      empresa: 'Empresa Teste',
      cidade: 'Sao Paulo'
    });
    expect(mockedApiClient.put).toHaveBeenCalledWith('/users/empresas/empresa-1', {
      cidade: 'Campinas'
    });
  });

  it('mantem endpoints de limites de empresa no mesmo contrato', async () => {
    mockedApiClient.post.mockResolvedValueOnce({ empresa: { id: 'empresa-3' } });
    mockedApiClient.put.mockResolvedValueOnce({ empresa: { id: 'empresa-3' } });

    await createEmpresaLimits({ empresa: 'Empresa X', max_mei: 10, max_usuarios_nao_mei: 5 });
    await updateEmpresaLimits('empresa-3', { max_mei: 12 });

    expect(mockedApiClient.post).toHaveBeenCalledWith('/users/empresas', {
      empresa: 'Empresa X',
      max_mei: 10,
      max_usuarios_nao_mei: 5
    });
    expect(mockedApiClient.put).toHaveBeenCalledWith('/users/empresas/empresa-3', {
      max_mei: 12
    });
  });
});
