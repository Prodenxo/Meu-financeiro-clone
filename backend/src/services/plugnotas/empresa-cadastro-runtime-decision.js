import { badRequest } from '../../utils/errors.js';
import { normalizeIbgeMunicipioCodigo } from '../../utils/ibge-municipio-codigo.js';
import {
  PREFEITURA_LOGIN_REQUIRED_BLOCKED_CODE,
  PREFEITURA_LOGIN_REQUIRED_BLOCKED_MESSAGE
} from './prefeituraPortalCredentials.js';
import {
  PREFEITURA_IBGE_APENAS_INSUFICIENTE_DP02_CODE,
  PREFEITURA_IBGE_APENAS_INSUFICIENTE_DP02_MESSAGE
} from './prefeituraIbgeOnlyBlock.js';

export const PLUGNOTAS_EMPRESA_PAYLOAD_CONTRATO_CODE = 'payload_contrato';
export const PLUGNOTAS_EMPRESA_AMBIENTE_CONFIGURACAO_CODE = 'ambiente_configuracao';
export const PLUGNOTAS_EMPRESA_NAO_CADASTRADA_CODE = 'empresa_nao_cadastrada';

export const EMPRESA_CADASTRO_RUNTIME_PAYLOAD_CONTRATO_MESSAGE =
  'Informe um código IBGE válido do município em `endereco.codigoCidade` antes de enviar o cadastro da empresa ao emissor fiscal.';

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

const toObject = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value;
};

const isNfseActive = (payload) => {
  const nfse = toObject(payload?.nfse);
  if (!Object.keys(nfse).length) return false;
  return nfse.ativo !== false;
};

const buildRuntimeDecisionFromPreflight = (scenario, preflight, upstreamCallSkipped = false) => ({
  scenario,
  consultedMunicipio: true,
  codigoIbge: preflight.codigoIbge,
  environment: preflight.environment,
  padraoNacionalEnabled: preflight.padraoNacionalEnabled,
  requiresLogin: preflight.requiresLogin,
  requiresSenha: preflight.requiresSenha,
  upstreamCallSkipped
});

export const buildEmpresaCadastroRuntimeDecision = ({
  scenario,
  consultedMunicipio = false,
  codigoIbge,
  environment,
  padraoNacionalEnabled,
  requiresLogin,
  requiresSenha,
  upstreamCallSkipped = false
}) => ({
  scenario,
  consultedMunicipio,
  ...(codigoIbge ? { codigoIbge } : {}),
  ...(environment ? { environment } : {}),
  ...(padraoNacionalEnabled !== undefined ? { padraoNacionalEnabled } : {}),
  ...(requiresLogin !== undefined ? { requiresLogin } : {}),
  ...(requiresSenha !== undefined ? { requiresSenha } : {}),
  upstreamCallSkipped
});

export const attachRuntimeDecisionToError = (error, runtimeDecision) => {
  if (!error || typeof error !== 'object' || !runtimeDecision) return error;
  const baseErrors =
    error.errors && typeof error.errors === 'object' && !Array.isArray(error.errors)
      ? error.errors
      : {};
  error.errors = { ...baseErrors, runtimeDecision };
  return error;
};

export const resolveEmpresaCadastroTargetEnvironment = (payload) => {
  const nfse = toObject(payload?.nfse);
  const config = toObject(nfse.config);
  return config.producao === false ? 'homologacao' : 'producao';
};

/**
 * POST sempre exige triagem municipal quando `nfse` está ativo.
 * PATCH só exige quando o payload traz o bloco `endereco`, preservando updates parciais legados.
 */
export const resolveEmpresaCadastroMunicipioPreflightInput = (
  payload,
  { operation = 'create' } = {}
) => {
  if (!isNfseActive(payload)) return null;

  const operationNorm = String(operation || '').trim().toLowerCase();
  if (operationNorm === 'update' && !hasOwn(payload || {}, 'endereco')) {
    return null;
  }

  const endereco = toObject(payload?.endereco);
  const codigoIbge = normalizeIbgeMunicipioCodigo(endereco.codigoCidade);
  if (codigoIbge.length !== 7) {
    throw badRequest(EMPRESA_CADASTRO_RUNTIME_PAYLOAD_CONTRATO_MESSAGE, {
      plugnotasCode: PLUGNOTAS_EMPRESA_PAYLOAD_CONTRATO_CODE,
      runtimeDecision: buildEmpresaCadastroRuntimeDecision({
        scenario: 'payload_contrato',
        consultedMunicipio: false,
        upstreamCallSkipped: true
      })
    });
  }

  return {
    codigoIbge,
    environment: resolveEmpresaCadastroTargetEnvironment(payload)
  };
};

export const evaluateEmpresaCadastroMunicipioPreflight = (preflight) => {
  if (!preflight || typeof preflight !== 'object') {
    return buildEmpresaCadastroRuntimeDecision({
      scenario: 'ambiente_configuracao',
      consultedMunicipio: false,
      upstreamCallSkipped: true
    });
  }

  if (preflight.requiresLogin || preflight.requiresSenha) {
    return buildRuntimeDecisionFromPreflight(
      'prefeitura_login_required_blocked',
      preflight,
      true
    );
  }

  if (preflight.padraoNacionalEnabled === true) {
    return buildRuntimeDecisionFromPreflight('success_nacional', preflight, false);
  }

  return buildRuntimeDecisionFromPreflight(
    'prefeitura_ibge_apenas_insuficiente_dp02',
    preflight,
    true
  );
};

export const createEmpresaCadastroBlockedErrorFromDecision = (runtimeDecision) => {
  const scenario = String(runtimeDecision?.scenario || '').trim();
  if (scenario === 'prefeitura_login_required_blocked') {
    return badRequest(PREFEITURA_LOGIN_REQUIRED_BLOCKED_MESSAGE, {
      plugnotasCode: PREFEITURA_LOGIN_REQUIRED_BLOCKED_CODE,
      runtimeDecision
    });
  }
  if (scenario === 'prefeitura_ibge_apenas_insuficiente_dp02') {
    return badRequest(PREFEITURA_IBGE_APENAS_INSUFICIENTE_DP02_MESSAGE, {
      plugnotasCode: PREFEITURA_IBGE_APENAS_INSUFICIENTE_DP02_CODE,
      runtimeDecision
    });
  }
  return badRequest(EMPRESA_CADASTRO_RUNTIME_PAYLOAD_CONTRATO_MESSAGE, {
    plugnotasCode: PLUGNOTAS_EMPRESA_PAYLOAD_CONTRATO_CODE,
    runtimeDecision
  });
};
