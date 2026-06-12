import { describe, expect, it } from 'vitest';
import {
  buildNfEmissionEmpresaPayload,
  getDefaultNfEmissionCompanyForm,
  getNfEmissionCompanyValidationMessage,
  isPlugnotasRpsSerieNotRegisteredMessage,
  PLUGNOTAS_MEI_INSCRICAO_ESTADUAL_QUANDO_VAZIA,
  PLUGNOTAS_NFSE_NACIONAL_DEFAULT_ON,
  PLUGNOTAS_NFSE_CONFIG_CONSULTA_NACIONAL_KEY,
  PLUGNOTAS_NFSE_CONFIG_NACIONAL_KEY
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
  estado: 'SP',
  email: 'contato@empresa.com.br',
});

describe('nfEmissionCompany', () => {
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

    expect(payloadEmptyIm.rps).toEqual({
      lote: 1,
      numeracao: [{ numero: 1, serie: '1' }]
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
    const config = nfse.config as Record<string, unknown>;
    expect(config[PLUGNOTAS_NFSE_CONFIG_NACIONAL_KEY]).toBe(PLUGNOTAS_NFSE_NACIONAL_DEFAULT_ON);
    expect(config[PLUGNOTAS_NFSE_CONFIG_CONSULTA_NACIONAL_KEY]).toBe(PLUGNOTAS_NFSE_NACIONAL_DEFAULT_ON);
    expect('nacional' in nfse).toBe(false);
  });

  it('isPlugnotasRpsSerieNotRegisteredMessage detecta ausência de série RPS no emissor', () => {
    expect(isPlugnotasRpsSerieNotRegisteredMessage('Nenhuma série cadastrada')).toBe(true);
    expect(isPlugnotasRpsSerieNotRegisteredMessage('Nenhuma serie cadastrada para nfse')).toBe(true);
    expect(isPlugnotasRpsSerieNotRegisteredMessage('Erro genérico de validação')).toBe(false);
  });

  it('buildNfEmissionEmpresaPayload inclui rps personalizado quando o formulário define lote/número/série', () => {
    const form = {
      ...fullValidForm(),
      rpsLote: 10,
      rpsNumero: 200,
      rpsSerie: 'NF'
    };
    const payload = buildNfEmissionEmpresaPayload({
      cnpj: '12345678000190',
      certificadoId: 'cert-abc',
      form
    });
    expect(payload.rps).toEqual({
      lote: 10,
      numeracao: [{ numero: 200, serie: 'NF' }]
    });
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
    const config = nfse.config as Record<string, unknown>;
    expect(config[PLUGNOTAS_NFSE_CONFIG_NACIONAL_KEY]).toBe(PLUGNOTAS_NFSE_NACIONAL_DEFAULT_ON);
    expect(config[PLUGNOTAS_NFSE_CONFIG_CONSULTA_NACIONAL_KEY]).toBe(PLUGNOTAS_NFSE_NACIONAL_DEFAULT_ON);
    expect('nacional' in nfse).toBe(false);
  });

  it('buildNfEmissionEmpresaPayload reflete documentosAtivos no shape local do payload quando fornecido (cadastro Guia MEI)', () => {
    const payload = buildNfEmissionEmpresaPayload({
      cnpj: '12345678000190',
      certificadoId: 'cert-abc',
      form: fullValidForm(),
      documentosAtivos: { nfse: true, nfe: true, nfce: false }
    });
    expect(payload.documentosAtivos).toEqual({ nfse: true, nfe: true, nfce: false });
    const nfse = payload.nfse as Record<string, unknown>;
    const nfseConfig = nfse.config as Record<string, unknown>;
    expect(nfse.ativo).toBe(true);
    expect(nfseConfig[PLUGNOTAS_NFSE_CONFIG_NACIONAL_KEY]).toBe(PLUGNOTAS_NFSE_NACIONAL_DEFAULT_ON);
    expect(nfseConfig[PLUGNOTAS_NFSE_CONFIG_CONSULTA_NACIONAL_KEY]).toBe(PLUGNOTAS_NFSE_NACIONAL_DEFAULT_ON);
    const nfe = payload.nfe as Record<string, unknown>;
    expect(nfe.ativo).toBe(true);
    expect((nfe.config as Record<string, unknown>).producao).toBe(true);
    const nfce = payload.nfce as Record<string, unknown>;
    expect(nfce.ativo).toBe(false);
    expect('config' in nfce).toBe(false);
  });

  it('buildNfEmissionEmpresaPayload não mantém nfseNacional quando NFS-e não está selecionada', () => {
    const payload = buildNfEmissionEmpresaPayload({
      cnpj: '12345678000190',
      certificadoId: 'cert-abc',
      form: fullValidForm(),
      documentosAtivos: { nfse: false, nfe: false, nfce: true }
    });

    expect(payload.documentosAtivos).toEqual({ nfse: false, nfe: false, nfce: true });
    const nfse = payload.nfse as Record<string, unknown>;
    expect(nfse.ativo).toBe(false);
    expect('config' in nfse).toBe(false);
    const nfe = payload.nfe as Record<string, unknown>;
    expect(nfe.ativo).toBe(false);
    expect('config' in nfe).toBe(false);
    const nfce = payload.nfce as Record<string, unknown>;
    expect(nfce.ativo).toBe(true);
    expect((nfce.config as Record<string, unknown>).producao).toBe(true);
    expect((nfce.config as Record<string, unknown>).serie).toBe(1);
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

  it('FR-NATEX: payload de empresa não inclui credenciais municipais no bloco nfse.config.prefeitura', () => {
    const form = fullValidForm();
    const payload = buildNfEmissionEmpresaPayload({
      cnpj: '12345678000190',
      certificadoId: 'cert-abc',
      form
    });
    const nfse = payload.nfse as Record<string, unknown>;
    const config = nfse.config as Record<string, unknown>;
    expect(config.prefeitura).toBeUndefined();
  });

  it('REC500 P2: cadastro com codigoCidade 5002704 não antecipa credenciais municipais no payload (fronteira browser)', () => {
    const form = { ...fullValidForm(), codigoCidade: '5002704', descricaoCidade: 'Fixture' };
    const payload = buildNfEmissionEmpresaPayload({
      cnpj: '12345678000190',
      certificadoId: 'cert-abc',
      form
    });
    const nfse = payload.nfse as Record<string, unknown>;
    const config = nfse.config as Record<string, unknown>;
    expect((payload.endereco as Record<string, unknown>).codigoCidade).toBe('5002704');
    expect(config.prefeitura).toBeUndefined();
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
