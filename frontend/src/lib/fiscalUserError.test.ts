import { describe, it, expect } from 'vitest';
import { ApiClientError } from '../utils/apiClientError';
import { PLUGNOTAS_CODE_CERTIFICADO_409_SEM_ID } from '../utils/plugnotasApiErrorCode';
import {
  mapMeiFiscalErrorToCopy,
  looksLikeOpaqueApiPayload,
  MEI_FISCAL_ERROR_FALLBACK_DESCRIPTION,
  MEI_FISCAL_GATEWAY_UPSTREAM_DESCRIPTION,
  meiFiscalToastMessage,
  isLikelyUserFacingFiscalValidationMessage,
  formatMeiFiscalMappedForAlert,
  PLUGNOTAS_CODE_PREFEITURA_IBGE_APENAS_INSUFICIENTE_DP02,
  PLUGNOTAS_CODE_PREFEITURA_LOGIN_REQUIRED_BLOCKED,
  PLUGNOTAS_CODE_PREFEITURA_LOGIN_REQUIRED_FALLBACK_AVAILABLE,
  resolveMeiFiscalScenario,
  stripPlugnotasRequestSuffix,
} from './fiscalUserError';

describe('mapMeiFiscalErrorToCopy', () => {
  it('gateway upstream: plugnotas_gateway_* prioriza copy canónica', () => {
    const copy = mapMeiFiscalErrorToCopy({
      rawMessage: '<html>502 Bad Gateway</html>',
      plugnotasCode: 'plugnotas_gateway_502',
    });
    expect(copy.title).toBe('Emissor fiscal temporariamente indisponível');
    expect(copy.description).toBe(MEI_FISCAL_GATEWAY_UPSTREAM_DESCRIPTION);
    expect(copy.gatewayUpstream).toBe(true);
  });

  it('gateway upstream: httpStatus 503 sem código', () => {
    const copy = mapMeiFiscalErrorToCopy({
      rawMessage: 'Service Unavailable',
      plugnotasCode: null,
      httpStatus: 503,
    });
    expect(copy.gatewayUpstream).toBe(true);
    expect(copy.description).toBe(MEI_FISCAL_GATEWAY_UPSTREAM_DESCRIPTION);
  });

  it('remove o sufixo técnico plugnotasRequest da mensagem mostrada à UI', () => {
    expect(
      stripPlugnotasRequestSuffix('Falha ao cadastrar (POST /empresa no emissor fiscal)', {
        method: 'POST',
        path: '/empresa',
      })
    ).toBe('Falha ao cadastrar');
  });

  it('mapeia certificado_409_sem_id com título e link de documentação', () => {
    const copy = mapMeiFiscalErrorToCopy({
      rawMessage: 'conflict',
      plugnotasCode: PLUGNOTAS_CODE_CERTIFICADO_409_SEM_ID,
    });
    expect(copy.title).toContain('Certificado');
    expect(copy.description).toMatch(/emissor|conta/i);
    expect(copy.actionLabel).toBe('Documentação');
    expect(copy.href).toContain('certificado-emissor-409-sem-id');
  });

  it('DP-PLOGIN-02: prefeitura_ibge_apenas_insuficiente_dp02 — copy limite do serviço (UX §7)', () => {
    const copy = mapMeiFiscalErrorToCopy({
      rawMessage: 'ignored when code set',
      plugnotasCode: PLUGNOTAS_CODE_PREFEITURA_IBGE_APENAS_INSUFICIENTE_DP02,
    });
    expect(copy.title).toContain('Limite');
    expect(copy.description).toMatch(/município|emissor/i);
    expect(copy.description).not.toMatch(/culpa|erro seu/i);
  });

  it('FR-NATEX: prefeitura_login_required_blocked gera copy de exceção municipal bloqueada sem pedir credenciais', () => {
    const copy = mapMeiFiscalErrorToCopy({
      rawMessage: 'ignored when code set',
      plugnotasCode: PLUGNOTAS_CODE_PREFEITURA_LOGIN_REQUIRED_BLOCKED,
      httpStatus: 400,
      plugnotasRequest: { method: 'POST', path: '/empresa' },
    });
    expect(copy.title).toContain('Exceção municipal');
    expect(copy.description).toMatch(/nfs-e nacional/i);
    expect(copy.description).not.toMatch(/login|senha/i);
    expect(copy.description).not.toMatch(/rota errada/i);
  });

  it('REC500 P2 / UX spec §9.1: bloqueio BFF mantém REC500-UX-L1 sem CTA principal de retry cego (requisitos alinhados a REC500-UX-L4)', () => {
    const copy = mapMeiFiscalErrorToCopy({
      rawMessage: 'ignored when code set',
      plugnotasCode: PLUGNOTAS_CODE_PREFEITURA_LOGIN_REQUIRED_BLOCKED,
      httpStatus: 400,
      plugnotasRequest: { method: 'POST', path: '/empresa' },
    });
    expect(copy.actionLabel).toBeUndefined();
    expect(copy.href).toBeUndefined();
    expect(copy.title).toMatch(/Exceção municipal|não suportada/i);
  });

  it('ROB: payload_contrato prioriza contrato estruturado do backend para revisão de dados', () => {
    const copy = mapMeiFiscalErrorToCopy({
      rawMessage: 'Falha na validação do JSON de Empresa: endereco.logradouro inválido',
      plugnotasCode: 'payload_contrato',
      httpStatus: 400,
      plugnotasRequest: { method: 'POST', path: '/empresa' },
    });
    expect(copy.title).toBe('Revise os dados do cadastro');
    expect(copy.description).toMatch(/revise cnpj|endereço|campos obrigatórios/i);
  });

  it('ROB: ambiente_configuracao usa código estruturado sem depender de heurística textual', () => {
    const copy = mapMeiFiscalErrorToCopy({
      rawMessage: 'Token inválido no emissor',
      plugnotasCode: 'ambiente_configuracao',
      httpStatus: 401,
      plugnotasRequest: { method: 'POST', path: '/empresa' },
    });
    expect(copy.title).toBe('Configuração do emissor fiscal');
    expect(copy.description).toMatch(/url base|token|ambiente/i);
  });

  it('usa fallback para payload que parece JSON de API', () => {
    const raw = JSON.stringify({
      success: false,
      message: 'x'.repeat(50),
      errors: { code: 'unknown', detail: 'y'.repeat(40) },
    });
    expect(looksLikeOpaqueApiPayload(raw)).toBe(true);
    const copy = mapMeiFiscalErrorToCopy({ rawMessage: raw, plugnotasCode: null });
    expect(copy.description).toBe(MEI_FISCAL_ERROR_FALLBACK_DESCRIPTION);
  });

  it('mapeia duplicado por palavra-chave', () => {
    const copy = mapMeiFiscalErrorToCopy({
      rawMessage: 'duplicate key value violates unique constraint',
      plugnotasCode: null,
    });
    expect(copy.title).toBe('Registo duplicado');
  });

  it('mapeia E0014 NFS-e Nacional como numeração repetida', () => {
    const copy = mapMeiFiscalErrorToCopy({
      rawMessage:
        'E0014: Conjunto de Série, Número, Código do Município Emissor e CNPJ/CPF informado nesta DPS já existe',
      plugnotasCode: null,
    });
    expect(copy.title).toMatch(/E0014/);
    expect(copy.description).toMatch(/Não é bloqueio por cliente/i);
  });

  it('mapeia conflito de RPS antes do genérico de duplicado', () => {
    const copy = mapMeiFiscalErrorToCopy({
      rawMessage: 'RPS duplicado já utilizado na prefeitura',
      plugnotasCode: null,
    });
    expect(copy.title).toBe('Numeração RPS em conflito');
  });

  it('mapeia id_integracao duplicado como emissão já enviada', () => {
    const copy = mapMeiFiscalErrorToCopy({
      rawMessage: 'duplicate key value violates unique constraint "mei_nfse_user_doc_type_id_integracao_uq"',
      plugnotasCode: null,
    });
    expect(copy.title).toBe('Emissão já enviada');
  });

  it('mensagem não mapeada usa fallback global (sem texto bruto da API)', () => {
    const copy = mapMeiFiscalErrorToCopy({
      rawMessage: 'ERR_PN_INTERNAL unexpected token in response',
      plugnotasCode: null,
    });
    expect(copy.title).toBe('Operação fiscal');
    expect(copy.description).toBe(MEI_FISCAL_ERROR_FALLBACK_DESCRIPTION);
  });

  it('meiFiscalToastMessage usa ApiClientError.plugnotasCode', () => {
    const err = new ApiClientError('ignored body', {
      plugnotasCode: PLUGNOTAS_CODE_CERTIFICADO_409_SEM_ID,
    });
    const line = meiFiscalToastMessage(err, 'fallback');
    expect(line).toMatch(/Certificado/i);
    expect(line).not.toContain('{');
  });

  it('POSQA / NF-e: mensagem agregada legível do provedor preserva detalhe (não só fallback global)', () => {
    const raw =
      'Validação NF-e no emissor: itens[0].ncm — NCM deve ter 8 dígitos numéricos; itens[0].cfop incompatível com operação.';
    expect(isLikelyUserFacingFiscalValidationMessage(raw)).toBe(true);
    const copy = mapMeiFiscalErrorToCopy({ rawMessage: raw, plugnotasCode: null });
    expect(copy.title).toBe('Validação ou rejeição no provedor');
    expect(copy.description).toContain('NCM');
    expect(copy.description).toContain('8 dígitos');
    const alertText = formatMeiFiscalMappedForAlert(copy);
    expect(alertText).toContain('NF-e');
    expect(alertText).toContain('NCM');
  });

  it('POSQA / NFC-e: rejeição modelo 65 / SEFAZ mantém texto acionável', () => {
    const raw =
      'NFC-e modelo 65: rejeição 215 — Falha no schema XML. Verifique CFOP e CST de ICMS do primeiro item.';
    const copy = mapMeiFiscalErrorToCopy({ rawMessage: raw, plugnotasCode: null });
    expect(copy.title).toBe('Validação ou rejeição no provedor');
    expect(copy.description).toMatch(/NFC-e|modelo 65|rejeição|CFOP|ICMS/i);
  });

  it('mensagem curta com pista fiscal (NCM) ainda mapeia para copy do provedor — seg. QA heurística', () => {
    const raw = 'NCM item 0 inválido.';
    expect(isLikelyUserFacingFiscalValidationMessage(raw)).toBe(true);
    const copy = mapMeiFiscalErrorToCopy({ rawMessage: raw, plugnotasCode: null });
    expect(copy.title).toBe('Validação ou rejeição no provedor');
    expect(copy.description).toContain('NCM');
  });

  it('usa GET /empresa/:cnpj + empresa_nao_cadastrada para manter causalidade de cadastro pendente', () => {
    const copy = mapMeiFiscalErrorToCopy({
      rawMessage:
        'Não há cadastro desta empresa no emissor fiscal para o token e ambiente configurados. (GET /empresa/12345678000190 no emissor fiscal)',
      plugnotasCode: 'empresa_nao_cadastrada',
      plugnotasRequest: { method: 'GET', path: '/empresa/12345678000190' },
    });
    expect(copy.title).toBe('Cadastro da empresa ainda não concluído');
    expect(copy.description).toMatch(/cadastro ainda não foi concluído|cadastro ainda não foi concluido/i);
    expect(copy.description).not.toMatch(/GET \/empresa|POST \/empresa|rota errada/i);
  });

  it('FR-ALNFB: runtimeDecision.scenario prevalece sobre plugnotasCode divergente', () => {
    expect(
      resolveMeiFiscalScenario({
        rawMessage: 'x',
        plugnotasCode: 'payload_contrato',
        httpStatus: 400,
        plugnotasRequest: { method: 'POST', path: '/empresa' },
        runtimeDecision: { scenario: 'prefeitura_login_required_fallback_available' },
      })
    ).toBe('prefeitura_login_required_fallback_available');
  });

  it('FR-PFLNAT P1: preflight híbrido resolvido (success_nacional, IBGE 5002704, requiresLogin) + operation created → success_nacional (não PLOGIN)', () => {
    expect(
      resolveMeiFiscalScenario({
        rawMessage: 'Cadastro em análise no emissor.',
        plugnotasCode: null,
        httpStatus: null,
        operation: 'created',
        runtimeDecision: {
          scenario: 'success_nacional',
          consultedMunicipio: true,
          codigoIbge: '5002704',
          padraoNacionalEnabled: true,
          requiresLogin: true,
          requiresSenha: false,
          upstreamCallSkipped: false,
        },
      })
    ).toBe('success_nacional');
  });

  it('FR-ALNFB: prefeitura_login_required_fallback_available gera copy do segundo passo (sem culpar endpoint)', () => {
    const copy = mapMeiFiscalErrorToCopy({
      rawMessage: 'ignored',
      plugnotasCode: PLUGNOTAS_CODE_PREFEITURA_LOGIN_REQUIRED_FALLBACK_AVAILABLE,
      httpStatus: 400,
    });
    expect(copy.title).toMatch(/prefeitura|portal/i);
    expect(copy.description).not.toMatch(/endpoint|rota errada|url incorreta/i);
  });

  it('ROB: resolveMeiFiscalScenario respeita precedência estruturada entre ambiente, payload e ausência de cadastro', () => {
    expect(
      resolveMeiFiscalScenario({
        rawMessage: 'ignored',
        plugnotasCode: PLUGNOTAS_CODE_PREFEITURA_IBGE_APENAS_INSUFICIENTE_DP02,
        httpStatus: 400,
        plugnotasRequest: { method: 'POST', path: '/empresa' },
      })
    ).toBe('prefeitura_ibge_apenas_insuficiente_dp02');

    expect(
      resolveMeiFiscalScenario({
        rawMessage: 'Service Unavailable',
        plugnotasCode: 'plugnotas_gateway_503',
        httpStatus: 503,
        plugnotasRequest: { method: 'POST', path: '/empresa' },
      })
    ).toBe('ambiente_configuracao');

    expect(
      resolveMeiFiscalScenario({
        rawMessage: 'Falha na validação do JSON de Empresa',
        plugnotasCode: 'payload_contrato',
        httpStatus: 400,
        plugnotasRequest: { method: 'POST', path: '/empresa' },
      })
    ).toBe('payload_contrato');

    expect(
      resolveMeiFiscalScenario({
        rawMessage: 'Não há cadastro desta empresa no emissor fiscal',
        plugnotasCode: 'empresa_nao_cadastrada',
        httpStatus: 404,
        plugnotasRequest: { method: 'GET', path: '/empresa/12345678000190' },
      })
    ).toBe('empresa_nao_cadastrada');
  });
});
