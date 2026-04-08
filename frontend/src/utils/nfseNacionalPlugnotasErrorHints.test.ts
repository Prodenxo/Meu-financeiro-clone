import { describe, it, expect } from 'vitest';

import {
  NFSE_NACIONAL_OPERACAO_DOC_ANCHOR,
  NFSE_NACIONAL_PLUGNOTAS_HINT_PATTERNS_DOC,
  PLUGNOTAS_EMPRESA_CONSULT_PENDENTE_CADASTRO_PREFIX,
  getNfseNacionalOperacaoHelpHref,
  getPlugnotasEmpresaCadastroErrorUxVariant,
  isPlugnotasEmpresaConsultNotFoundMessage,
  isPlugnotasEmpresaMunicipalRequirementMessage,
  isPlugnotasNfseConfigPrefeituraRequirementMessage,
  shouldOfferNfseNacionalOperacaoDocHint,
  withPlugnotasEmpresaConsultPendingCadastroPrefixIfApplicable
} from './nfseNacionalPlugnotasErrorHints';

describe('nfseNacionalPlugnotasErrorHints', () => {
  it('documenta lista de padrões para operação (sincronizar com operacao-mei-nfse.md)', () => {
    expect(NFSE_NACIONAL_PLUGNOTAS_HINT_PATTERNS_DOC.length).toBeGreaterThanOrEqual(6);
  });

  it('getNfseNacionalOperacaoHelpHref aponta para âncora operacional', () => {
    const href = getNfseNacionalOperacaoHelpHref();
    expect(href).toContain(`#${NFSE_NACIONAL_OPERACAO_DOC_ANCHOR}`);
    expect(href.startsWith('http') || href.startsWith('/')).toBe(true);
  });

  it.each([
    ['Campo nfse.nacional rejeitado pelo emissor.', true],
    ['Município não aderiu à NFS-e Nacional.', true],
    ['Credenciamento nacional indisponível para este CNPJ.', true],
    ['Falha na emissão nacional da nota de serviço (NFSe).', true],
    ['HTTP 400: ambiente nacional não disponível.', true],
    ['Plugnotas: configuração NFS-e Nacional inválida.', true],
    ['Informe a razão social.', false],
    ['revisar nfce.config.versaoQrCode', false],
    ['Preenchimento obrigatório: inscricaoMunicipal no cadastro da empresa.', true],
    ['JSON: nfse.config.prefeitura não informada para o emitente.', true],
    ['A prefeitura municipal é obrigatória na configuração NFSe da empresa.', true],
    ['Mensagem sem nacional nem municipio: inscricaoMunicipal inválida.', true],
    ['Erro em nfce.config.prefeitura no cadastro da empresa.', false]
  ])('shouldOfferNfseNacionalOperacaoDocHint(%s) → %s', (msg, expected) => {
    expect(shouldOfferNfseNacionalOperacaoDocHint(msg)).toBe(expected);
  });

  it.each([
    ['inscricaoMunicipal requerida.', true],
    ['Inscrição municipal ausente no payload.', true],
    ['nfse.config.prefeitura: campo obrigatório', true],
    ['prefeitura da sede no cadastro Plugnotas NFSe', true],
    ['Ir à prefeitura retirar guia', false],
    ['revisar nfce.config.prefeitura para empresa', false]
  ])('isPlugnotasEmpresaMunicipalRequirementMessage(%s) → %s', (msg, expected) => {
    expect(isPlugnotasEmpresaMunicipalRequirementMessage(msg)).toBe(expected);
  });

  it('PLUGNOTAS_EMPRESA_CONSULT_PENDENTE_CADASTRO_PREFIX é texto único para concatenação na consulta', () => {
    expect(PLUGNOTAS_EMPRESA_CONSULT_PENDENTE_CADASTRO_PREFIX.length).toBeGreaterThan(40);
    expect(PLUGNOTAS_EMPRESA_CONSULT_PENDENTE_CADASTRO_PREFIX).toContain('cadastro');
  });

  it.each([
    [
      'Falha na validação do JSON de Empresa: fields.nfse.config.prefeitura: Preenchimento obrigatório',
      true
    ],
    ['JSON: nfse.config.prefeitura não informada para o emitente.', true],
    ['config.prefeitura ausente no cadastro NFSe da empresa.', true],
    ['Validação Plugnotas: inscricaoMunicipal obrigatória no payload.', false],
    ['revisar nfce.config.prefeitura para empresa', false]
  ])('isPlugnotasNfseConfigPrefeituraRequirementMessage(%s) → %s', (msg, expected) => {
    expect(isPlugnotasNfseConfigPrefeituraRequirementMessage(msg)).toBe(expected);
    if (expected) {
      expect(isPlugnotasEmpresaMunicipalRequirementMessage(msg)).toBe(true);
    }
  });

  it.each([
    [
      'Falha na validação do JSON de Empresa: fields.nfse.config.prefeitura: Preenchimento obrigatório',
      'prefeitura-config'
    ],
    ['Validação Plugnotas: inscricaoMunicipal obrigatória no payload.', 'municipal-generic'],
    ['Informe a razão social.', 'generic'],
    [
      'Preenchimento obrigatório: inscricaoMunicipal e nfse.config.prefeitura no cadastro.',
      'prefeitura-config'
    ]
  ])('getPlugnotasEmpresaCadastroErrorUxVariant(%s) → %s', (msg, expected) => {
    expect(getPlugnotasEmpresaCadastroErrorUxVariant(msg)).toBe(expected);
  });

  it('PREF-L2 (spec UX §3.2): só IM obrigatória → municipal-generic, não prefeitura-config', () => {
    const l2 = 'Validação Plugnotas: inscricaoMunicipal obrigatória no payload.';
    expect(isPlugnotasNfseConfigPrefeituraRequirementMessage(l2)).toBe(false);
    expect(getPlugnotasEmpresaCadastroErrorUxVariant(l2)).toBe('municipal-generic');
  });

  it.each([
    ['HTTP 404 empresa não encontrada', true],
    ['Não localizamos empresa com os parâmetros informados.', true],
    ['Não há cadastro desta empresa no emissor fiscal.', true],
    ['Validação: razão social vazia.', false]
  ])('isPlugnotasEmpresaConsultNotFoundMessage(%s) → %s', (msg, expected) => {
    expect(isPlugnotasEmpresaConsultNotFoundMessage(msg)).toBe(expected);
  });

  describe('withPlugnotasEmpresaConsultPendingCadastroPrefixIfApplicable (§5.4 pós-retry)', () => {
    const notFound = 'HTTP 404: empresa não encontrada no emissor.';

    it('prefixa quando retry pendente e mensagem é “não encontrado”', () => {
      const out = withPlugnotasEmpresaConsultPendingCadastroPrefixIfApplicable(notFound, true);
      expect(out.startsWith(PLUGNOTAS_EMPRESA_CONSULT_PENDENTE_CADASTRO_PREFIX)).toBe(true);
      expect(out).toContain(notFound);
    });

    it('não prefixa sem retry pendente', () => {
      expect(withPlugnotasEmpresaConsultPendingCadastroPrefixIfApplicable(notFound, false)).toBe(notFound);
    });

    it('não prefixa se a mensagem não for de consulta “não encontrado”', () => {
      const other = 'Falha de rede ao consultar empresa.';
      expect(withPlugnotasEmpresaConsultPendingCadastroPrefixIfApplicable(other, true)).toBe(other);
    });
  });
});
