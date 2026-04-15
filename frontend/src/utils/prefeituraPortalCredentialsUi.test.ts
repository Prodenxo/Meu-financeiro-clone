import { describe, it, expect } from 'vitest';
import {
  getPrefeituraPortalCredentialsValidationMessage,
  mergePrefeituraPortalCredentialsIntoEmpresaPayload
} from './prefeituraPortalCredentialsUi';
import { buildNfEmissionEmpresaPayload } from './nfEmissionCompany';

describe('prefeituraPortalCredentialsUi', () => {
  it('getPrefeituraPortalCredentialsValidationMessage exige par login+senha', () => {
    expect(getPrefeituraPortalCredentialsValidationMessage('', '')).toMatch(/login e a senha/i);
    expect(getPrefeituraPortalCredentialsValidationMessage('a', '')).toMatch(/senha/i);
    expect(getPrefeituraPortalCredentialsValidationMessage('', 'b')).toMatch(/login/i);
    expect(getPrefeituraPortalCredentialsValidationMessage('a', 'b')).toBeNull();
  });

  it('mergePrefeituraPortalCredentialsIntoEmpresaPayload define trilho municipal e prefeitura', () => {
    const base = buildNfEmissionEmpresaPayload({
      cnpj: '12345678000190',
      certificadoId: 'cert-1',
      form: {
        razaoSocial: 'X',
        nomeFantasia: '',
        email: '',
        inscricaoMunicipal: '',
        regimeTributario: '1',
        simplesNacional: true,
        cep: '01310100',
        tipoLogradouro: 'Rua',
        logradouro: 'Paulista',
        numero: '1',
        complemento: '',
        bairro: 'Centro',
        codigoCidade: '3550308',
        descricaoCidade: 'São Paulo',
        estado: 'SP'
      },
      documentosAtivos: { nfse: true, nfe: false, nfce: false }
    });
    const merged = mergePrefeituraPortalCredentialsIntoEmpresaPayload(base, {
      login: ' user ',
      senha: ' secret ',
      codigoIbgeDigits: '3550308'
    });
    const cfg = (merged.nfse as { config?: Record<string, unknown> }).config;
    expect(cfg?.nfseNacional).toBe(false);
    expect(cfg?.consultaNfseNacional).toBe(false);
    expect((cfg?.prefeitura as { login?: string }).login).toBe('user');
    expect((cfg?.prefeitura as { senha?: string }).senha).toBe('secret');
    expect((cfg?.prefeitura as { codigoIbge?: string }).codigoIbge).toBe('3550308');
  });
});
