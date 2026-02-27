import { describe, expect, it, vi, beforeEach, type Mock } from 'vitest';
import {
  emitirNfse,
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
    requestBlob: vi.fn()
  }
}));

const mockedApiClient = apiClient as unknown as {
  post: Mock;
  get: Mock;
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

  it('obtem NFSe com query sync=true quando solicitado', async () => {
    const response = { id: 'nfse-1', user_id: 'user-1' } as NfseRecord;
    mockedApiClient.get.mockResolvedValueOnce(response);

    const result = await obterNfse('nfse-1', true);

    expect(mockedApiClient.get).toHaveBeenCalledWith('/mei-notas/nfse-1?sync=true');
    expect(result).toEqual(response);
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
});
