import { describe, it, expect } from 'vitest';

import {
  NFSE_NACIONAL_OPERACAO_DOC_ANCHOR,
  NFSE_NACIONAL_PLUGNOTAS_HINT_PATTERNS_DOC,
  getNfseNacionalOperacaoHelpHref,
  isPlugnotasEmpresaMunicipalRequirementMessage,
  shouldOfferNfseNacionalOperacaoDocHint
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
});
