import { afterEach, describe, expect, it, vi } from 'vitest';
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
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('getNfEmissionCompanyValidationMessage aceita formulário completo; IE pela política MEI (US-MEI-NFS-02)', () => {
    const base = fullValidForm();
    expect(getNfEmissionCompanyValidationMessage(base)).toBeNull();
    expect(
      getNfEmissionCompanyValidationMessage({ ...base, razaoSocial: '   ' })
    ).toContain('razão social');
  });

  it('buildNfEmissionEmpresaPayload omite inscrição municipal quando vazia; inclui quando preenchida; IE e nfe/nfce inativos sem config (apenas NFS-e)', () => {
    const form = fullValidForm();
    const payloadEmptyIm = buildNfEmissionEmpresaPayload({
      cnpj: '12345678000190',
      certificadoId: 'cert-abc',
      form
    });

    expect('inscricaoMunicipal' in payloadEmptyIm).toBe(false);

    const payloadWithIm = buildNfEmissionEmpresaPayload({
      cnpj: '12345678000190',
      certificadoId: 'cert-abc',
      form: { ...form, inscricaoMunicipal: '  12345  ' }
    });
    expect(payloadWithIm.inscricaoMunicipal).toBe('12345');

    const payload = payloadEmptyIm;
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

  it('buildNfEmissionEmpresaPayload inclui documentosAtivos quando fornecido (cadastro Guia MEI)', () => {
    const payload = buildNfEmissionEmpresaPayload({
      cnpj: '12345678000190',
      certificadoId: 'cert-abc',
      form: fullValidForm(),
      documentosAtivos: { nfse: true, nfe: true, nfce: false }
    });
    expect(payload.documentosAtivos).toEqual({ nfse: true, nfe: true, nfce: false });
  });

  it('buildNfEmissionEmpresaPayload envia endereco.codigoCidade como string só dígitos quando o form tem number (FR-CID-PAY-01)', () => {
    const form = { ...fullValidForm(), codigoCidade: 3550308 as unknown as string };
    const payload = buildNfEmissionEmpresaPayload({
      cnpj: '12345678000190',
      certificadoId: 'cert-abc',
      form
    });
    const endereco = payload.endereco as Record<string, unknown>;
    expect(endereco.codigoCidade).toBe('3550308');
    expect(typeof endereco.codigoCidade).toBe('string');
  });

  it('DP-PLOGIN-01: com VITE flag — inclui nfse.config.prefeitura login/senha quando ambos preenchidos', () => {
    vi.stubEnv('VITE_PLUGNOTAS_NFSE_PREFEITURA_CREDENCIAIS_ENABLED', 'true');
    const form = {
      ...fullValidForm(),
      prefeituraPortalUsuario: 'test-user',
      prefeituraPortalSenha: 'test-secret'
    };
    const payload = buildNfEmissionEmpresaPayload({
      cnpj: '12345678000190',
      certificadoId: 'cert-abc',
      form
    });
    const nfse = payload.nfse as Record<string, unknown>;
    const config = nfse.config as Record<string, unknown>;
    expect(config.prefeitura).toEqual({ login: 'test-user', senha: 'test-secret' });
  });

  it('DP-PLOGIN-01: validação exige par completo quando flag VITE ligada', () => {
    vi.stubEnv('VITE_PLUGNOTAS_NFSE_PREFEITURA_CREDENCIAIS_ENABLED', 'true');
    const form = { ...fullValidForm(), prefeituraPortalUsuario: 'only-user', prefeituraPortalSenha: '' };
    expect(getNfEmissionCompanyValidationMessage(form)).toContain('conjunto');
  });

  it('NFR-TIBGE-02: endereco não inclui codigoIBGECidade duplicado (canónico: só codigoCidade)', () => {
    const payload = buildNfEmissionEmpresaPayload({
      cnpj: '12345678000190',
      certificadoId: 'cert-abc',
      form: fullValidForm()
    });
    const endereco = payload.endereco as Record<string, unknown>;
    expect(endereco).not.toHaveProperty('codigoIBGECidade');
    expect(endereco).not.toHaveProperty('codigoIbgeCidade');
    expect(Object.keys(endereco).some((k) => k.toLowerCase().includes('codigoibge'))).toBe(false);
  });
});
