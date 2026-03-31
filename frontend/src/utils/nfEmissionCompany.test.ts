import { describe, expect, it } from 'vitest';
import {
  buildNfEmissionEmpresaPayload,
  getDefaultNfEmissionCompanyForm,
  getNfEmissionCompanyValidationMessage,
  PLUGNOTAS_MEI_INSCRICAO_ESTADUAL_QUANDO_VAZIA,
  PLUGNOTAS_NFSE_NACIONAL_DEFAULT_ON,
  PLUGNOTAS_NFSE_NACIONAL_PAYLOAD_KEY
} from './nfEmissionCompany';

const fullValidForm = () => ({
  ...getDefaultNfEmissionCompanyForm(),
  razaoSocial: 'Empresa Teste LTDA',
  cep: '01310100',
  logradouro: 'Av. Paulista',
  numero: '1000',
  bairro: 'Bela Vista',
  codigoCidade: '3550308',
  descricaoCidade: 'São Paulo',
  estado: 'SP'
});

describe('nfEmissionCompany', () => {
  it('getNfEmissionCompanyValidationMessage aceita formulário completo sem inscrição municipal; IE pela política MEI (US-MEI-NFS-02)', () => {
    const base = fullValidForm();
    expect(getNfEmissionCompanyValidationMessage(base)).toBeNull();
    expect(
      getNfEmissionCompanyValidationMessage({ ...base, razaoSocial: '   ' })
    ).toContain('razão social');
  });

  it('buildNfEmissionEmpresaPayload omite inscrição municipal quando vazia; inclui IE e nfe/nfce inativos sem config (apenas NFS-e)', () => {
    const form = fullValidForm();
    const payload = buildNfEmissionEmpresaPayload({
      cnpj: '12345678000190',
      certificadoId: 'cert-abc',
      form
    });

    expect('inscricaoMunicipal' in payload).toBe(false);
    expect(payload.inscricaoEstadual).toBe(PLUGNOTAS_MEI_INSCRICAO_ESTADUAL_QUANDO_VAZIA);
    expect(payload.certificado).toBe('cert-abc');
    const nfce = payload.nfce as Record<string, unknown>;
    expect(nfce.ativo).toBe(false);
    expect('config' in nfce).toBe(false);
    const nfe = payload.nfe as Record<string, unknown>;
    expect(nfe.ativo).toBe(false);
    expect('config' in nfe).toBe(false);
    const nfse = payload.nfse as Record<string, unknown>;
    expect(nfse[PLUGNOTAS_NFSE_NACIONAL_PAYLOAD_KEY]).toBe(PLUGNOTAS_NFSE_NACIONAL_DEFAULT_ON);
  });

  it('buildNfEmissionEmpresaPayload envia inscrição municipal quando preenchida', () => {
    const form = { ...fullValidForm(), inscricaoMunicipal: '12345' };
    const payload = buildNfEmissionEmpresaPayload({ cnpj: '12345678000190', form });
    expect(payload.inscricaoMunicipal).toBe('12345');
  });

  it('buildNfEmissionEmpresaPayload sempre envia IE pela política MEI e omite certificado no PATCH', () => {
    const payload = buildNfEmissionEmpresaPayload({
      cnpj: '12345678000190',
      form: fullValidForm()
    });
    expect(payload.certificado).toBeUndefined();
    expect(payload.inscricaoEstadual).toBe(PLUGNOTAS_MEI_INSCRICAO_ESTADUAL_QUANDO_VAZIA);
    const nfce = payload.nfce as Record<string, unknown>;
    expect(nfce.ativo).toBe(false);
    expect('config' in nfce).toBe(false);
    const nfe = payload.nfe as Record<string, unknown>;
    expect(nfe.ativo).toBe(false);
    expect('config' in nfe).toBe(false);
    const nfse = payload.nfse as Record<string, unknown>;
    expect(nfse[PLUGNOTAS_NFSE_NACIONAL_PAYLOAD_KEY]).toBe(PLUGNOTAS_NFSE_NACIONAL_DEFAULT_ON);
  });
});
