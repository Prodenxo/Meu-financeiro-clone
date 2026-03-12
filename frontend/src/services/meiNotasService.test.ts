import { describe, expect, it, vi, beforeEach, type Mock } from 'vitest';
import {
  arquivarNfse,
  atualizarNfse,
  emitirNfse,
  cancelarNfse,
  listarCatalogoNfseClientes,
  listarCatalogoNfseProdutos,
  listarNfse,
  obterNfse,
  baixarNfsePdf,
  baixarNfseXml,
  type EmitirNfseInput,
  type NfseRecord
} from './meiNotasService';
import { apiClient } from './apiClient';

vi.mock('./apiClient', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    requestBlob: vi.fn()
  }
}));

const mockedApiClient = apiClient as unknown as {
  post: Mock;
  get: Mock;
  patch: Mock;
  requestBlob: Mock;
};

describe('meiNotasService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('envia emissao de NFSe para endpoint correto', async () => {
    const input: EmitirNfseInput = {
      prestadorCpfCnpj: '12345678000199',
      servico: {
        codigo: '1.02',
        discriminacao: 'Servico de teste',
        cnae: '6201500',
        aliquota: 2,
        valorServico: 100
      }
    };
    const response = { id: 'nfse-1', user_id: 'user-1' } as NfseRecord;
    mockedApiClient.post.mockResolvedValueOnce(response);

    const result = await emitirNfse(input);

    expect(mockedApiClient.post).toHaveBeenCalledWith('/mei-notas/emitir', input);
    expect(result).toEqual(response);
  });

  it('lista NFSe no endpoint esperado', async () => {
    const response: NfseRecord[] = [{ id: 'nfse-1', user_id: 'user-1' }];
    mockedApiClient.get.mockResolvedValueOnce(response);

    const result = await listarNfse();

    expect(mockedApiClient.get).toHaveBeenCalledWith('/mei-notas');
    expect(result).toEqual(response);
  });

  it('lista NFSe incluindo arquivadas quando solicitado', async () => {
    const response: NfseRecord[] = [{ id: 'nfse-2', user_id: 'user-1', archived_at: '2026-03-11T12:00:00Z' }];
    mockedApiClient.get.mockResolvedValueOnce(response);

    const result = await listarNfse({ includeArchived: true });

    expect(mockedApiClient.get).toHaveBeenCalledWith('/mei-notas?includeArchived=true');
    expect(result).toEqual(response);
  });

  it('lista catálogo de clientes e produtos com query params', async () => {
    mockedApiClient.get
      .mockResolvedValueOnce([{ id: 'cliente-1', nome: 'Cliente Teste' }])
      .mockResolvedValueOnce([{ id: 'produto-1', codigo: '1.02' }]);

    const clientes = await listarCatalogoNfseClientes({ q: 'cliente', limit: 15, documentType: 'NFSE' });
    const produtos = await listarCatalogoNfseProdutos({ q: '1.02', limit: 10, documentType: 'NFSE' });

    expect(mockedApiClient.get).toHaveBeenNthCalledWith(1, '/mei-notas/catalogo/clientes?q=cliente&limit=15&documentType=NFSE');
    expect(mockedApiClient.get).toHaveBeenNthCalledWith(2, '/mei-notas/catalogo/produtos?q=1.02&limit=10&documentType=NFSE');
    expect(clientes).toEqual([{ id: 'cliente-1', nome: 'Cliente Teste' }]);
    expect(produtos).toEqual([{ id: 'produto-1', codigo: '1.02' }]);
  });

  it('obtem NFSe com query sync=true quando solicitado', async () => {
    const response = { id: 'nfse-1', user_id: 'user-1' } as NfseRecord;
    mockedApiClient.get.mockResolvedValueOnce(response);

    const result = await obterNfse('nfse-1', true);

    expect(mockedApiClient.get).toHaveBeenCalledWith('/mei-notas/nfse-1?sync=true');
    expect(result).toEqual(response);
  });

  it('obtem NFSe sem query quando sync=false', async () => {
    const response = { id: 'nfse-1', user_id: 'user-1' } as NfseRecord;
    mockedApiClient.get.mockResolvedValueOnce(response);

    const result = await obterNfse('nfse-1');

    expect(mockedApiClient.get).toHaveBeenCalledWith('/mei-notas/nfse-1');
    expect(result).toEqual(response);
  });

  it('codifica ID antes de chamar endpoints de detalhe/download', async () => {
    const response = { id: 'nfse 1/2', user_id: 'user-1' } as NfseRecord;
    mockedApiClient.get.mockResolvedValueOnce(response);
    mockedApiClient.requestBlob.mockResolvedValue({
      blob: new Blob(['dummy'], { type: 'application/pdf' }),
      filename: 'nfse.pdf'
    });

    await obterNfse('nfse 1/2', true);
    await baixarNfsePdf('nfse 1/2');
    await baixarNfseXml('nfse 1/2');

    expect(mockedApiClient.get).toHaveBeenCalledWith('/mei-notas/nfse%201%2F2?sync=true');
    expect(mockedApiClient.requestBlob).toHaveBeenNthCalledWith(1, '/mei-notas/nfse%201%2F2/pdf', { method: 'GET' });
    expect(mockedApiClient.requestBlob).toHaveBeenNthCalledWith(2, '/mei-notas/nfse%201%2F2/xml', { method: 'GET' });
  });

  it('baixa PDF e XML pelos endpoints corretos', async () => {
    const fileResponse = {
      blob: new Blob(['dummy'], { type: 'application/pdf' }),
      filename: 'nfse.pdf'
    };
    mockedApiClient.requestBlob.mockResolvedValue(fileResponse);

    const pdf = await baixarNfsePdf('nfse-1');
    const xml = await baixarNfseXml('nfse-1');

    expect(mockedApiClient.requestBlob).toHaveBeenNthCalledWith(1, '/mei-notas/nfse-1/pdf', { method: 'GET' });
    expect(mockedApiClient.requestBlob).toHaveBeenNthCalledWith(2, '/mei-notas/nfse-1/xml', { method: 'GET' });
    expect(pdf).toEqual(fileResponse);
    expect(xml).toEqual(fileResponse);
  });

  it('atualiza, cancela e arquiva NFSe nos endpoints corretos', async () => {
    const response = { id: 'nfse-1', user_id: 'user-1' } as NfseRecord;
    mockedApiClient.patch.mockResolvedValueOnce(response);
    mockedApiClient.post.mockResolvedValue(response);

    const updated = await atualizarNfse('nfse-1', { descricaoInterna: 'Ajuste interno' });
    const cancelled = await cancelarNfse('nfse-1', { reason: 'Solicitação do cliente' });
    const archived = await arquivarNfse('nfse-1', { archived: true });

    expect(mockedApiClient.patch).toHaveBeenCalledWith('/mei-notas/nfse-1', { descricaoInterna: 'Ajuste interno' });
    expect(mockedApiClient.post).toHaveBeenNthCalledWith(1, '/mei-notas/nfse-1/cancelar', { reason: 'Solicitação do cliente' });
    expect(mockedApiClient.post).toHaveBeenNthCalledWith(2, '/mei-notas/nfse-1/arquivar', { archived: true });
    expect(updated).toEqual(response);
    expect(cancelled).toEqual(response);
    expect(archived).toEqual(response);
  });
});
