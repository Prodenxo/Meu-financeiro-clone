import { describe, expect, it, vi, beforeEach } from 'vitest';
import { emitirNotaAsAdmin } from './adminUserDataService';
import { apiClient } from './apiClient';

vi.mock('./apiClient', () => ({
  apiClient: {
    post: vi.fn()
  }
}));

const sampleNfeLikePayload = {
  emitente: { cpfCnpj: '11222333000181' },
  destinatario: { cpfCnpj: '12345678901', razaoSocial: 'Dest' },
  itens: [
    {
      codigo: '1',
      descricao: 'Item',
      ncm: '12345678',
      cfop: '5102',
      unidade: 'UN',
      quantidade: 1,
      valorUnitario: 10,
      tributos: {
        icms: { csosn: '102' },
        pis: { cst: '49' },
        cofins: { cst: '49' }
      }
    }
  ]
};

describe('emitirNotaAsAdmin', () => {
  beforeEach(() => {
    vi.mocked(apiClient.post).mockResolvedValue({ id: 'rec-1' } as never);
  });

  it('envia NFS-e com documentType NFSE', async () => {
    await emitirNotaAsAdmin('user-abc', {
      documentType: 'NFSE',
      tomadorCpfCnpj: '12345678901',
      tomadorRazaoSocial: 'Cliente',
      servico: {
        codigo: '010101',
        discriminacao: 'Serviço',
        cnae: '6201501',
        valorServico: '10'
      }
    });
    expect(apiClient.post).toHaveBeenCalledWith('/admin/users/user-abc/mei-nfse/emitir', expect.objectContaining({
      documentType: 'NFSE',
      tomadorRazaoSocial: 'Cliente'
    }));
  });

  it('envia NF-e com documentType NFE e payload', async () => {
    await emitirNotaAsAdmin('user-xyz', {
      documentType: 'NFE',
      payload: sampleNfeLikePayload
    });
    expect(apiClient.post).toHaveBeenCalledWith('/admin/users/user-xyz/mei-nfse/emitir', {
      documentType: 'NFE',
      payload: sampleNfeLikePayload
    });
  });

  it('envia NFC-e com documentType NFCE e payload', async () => {
    await emitirNotaAsAdmin('user-nfce', {
      documentType: 'NFCE',
      payload: sampleNfeLikePayload
    });
    expect(apiClient.post).toHaveBeenCalledWith('/admin/users/user-nfce/mei-nfse/emitir', {
      documentType: 'NFCE',
      payload: sampleNfeLikePayload
    });
  });
});
