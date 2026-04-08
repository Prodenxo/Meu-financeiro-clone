import { env } from '../../config/env.js';
import { HttpError, badRequest } from '../../utils/errors.js';
import { buildErrorMessageFromBody } from './plugnotas-error-message.js';
import { isPlugnotasDebugExplicitlyEnabled } from './plugnotas-debug-env.js';
import {
  isEmpresaCadastroPlugnotasPath,
  logPlugnotasEmpresaCadastro400Request
} from './plugnotas-empresa-cadastro-debug.js';
import {
  logPlugnotasCertificado409Resolve,
  PLUGNOTAS_CERT_409_RESOLVE_STEPS
} from './plugnotas-certificado-409-resolve-log.js';
import { maskPlugnotasPathOrUrlForLog } from './plugnotas-request-log-path.js';
import {
  extrairCertificadoIdDeListagem,
  normalizeCertificadoIdCandidate,
  normalizeCertificadoListItems
} from './plugnotas-certificado-listagem-parse.js';
import { getPlugnotasRootUrl } from './root-url.js';
import {
  PLUGNOTAS_MEI_INSCRICAO_ESTADUAL_QUANDO_VAZIA,
  PLUGNOTAS_NFSE_NACIONAL_DEFAULT_ON,
  PLUGNOTAS_NFSE_NACIONAL_PAYLOAD_KEY
} from './plugnotas-mei-empresa-policy.js';
import {
  applyEmpresaPlugnotasDocumentSelectionForPatch,
  applyEmpresaPlugnotasDocumentSelectionForPost,
  resolveDocumentosAtivosForPatch,
  resolveDocumentosAtivosForPost,
  stripDocumentosAtivos
} from './plugnotas-empresa-documentos-ativos.js';
import { normalizeIbgeMunicipioCodigo } from '../../utils/ibge-municipio-codigo.js';
const normalizeDoc = (value) => String(value || '').replace(/\D/g, '');

/** Blocos mínimos inativos — sem `config`, para não disparar validação SEFAZ / `versaoQrCode` no Plugnotas (produto apenas NFS-e). Ver `docs/adr/ADR-plugnotas-empresa-payload-apenas-nfse.md`. */
const PLUGNOTAS_EMPRESA_APENAS_NFSE_NFE = Object.freeze({ ativo: false, tipoContrato: 0 });
const PLUGNOTAS_EMPRESA_APENAS_NFSE_NFCE = Object.freeze({ ativo: false, tipoContrato: 0 });

const hasOwn = (obj, key) =>
  Object.prototype.hasOwnProperty.call(obj, key);

/**
 * Garante `endereco.codigoCidade` como string só com dígitos antes do Plugnotas (FR-CID-BE-01).
 * Não cria `endereco` se ausente.
 * @param {Record<string, unknown>} payload
 */
const normalizePayloadEnderecoCodigoCidade = (payload) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return;
  const endereco = payload.endereco;
  if (!endereco || typeof endereco !== 'object' || Array.isArray(endereco)) return;
  if (!hasOwn(endereco, 'codigoCidade')) return;
  endereco.codigoCidade = normalizeIbgeMunicipioCodigo(endereco.codigoCidade);
};

/**
 * IE ausente ou em branco → `ISENTO` (MEI sem IE coletada na UI).
 * @param {Record<string, unknown>} payload
 */
const normalizeInscricaoEstadualApenasNfse = (payload) => {
  const ieRaw = payload.inscricaoEstadual;
  const ieStr = ieRaw != null ? String(ieRaw).trim() : '';
  if (!ieStr) {
    payload.inscricaoEstadual = PLUGNOTAS_MEI_INSCRICAO_ESTADUAL_QUANDO_VAZIA;
  }
};

/**
 * PATCH: só toca `nfse` se o cliente enviou o bloco (D-N03 / FR-NA03). Preenche nacional ON se a chave não veio.
 * @param {Record<string, unknown>} payload
 */
const applyNfseNacionalDefaultForPatch = (payload) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return;
  if (!hasOwn(payload, 'nfse')) return;
  const nfse = toObject(payload.nfse);
  const next = { ...nfse };
  if (!hasOwn(next, PLUGNOTAS_NFSE_NACIONAL_PAYLOAD_KEY)) {
    next[PLUGNOTAS_NFSE_NACIONAL_PAYLOAD_KEY] = PLUGNOTAS_NFSE_NACIONAL_DEFAULT_ON;
  }
  payload.nfse = next;
};

/**
 * PATCH: não inclui `nfe`/`nfce` se o cliente não os enviou (evita reativar NFC-e legada).
 * Se enviados, substitui por blocos inativos sem `config`. IE só se a chave vier no corpo.
 * @param {Record<string, unknown>} payload
 */
const applyEmpresaPlugnotasApenasNfseForPatch = (payload) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return;
  if (hasOwn(payload, 'nfe')) {
    payload.nfe = { ...PLUGNOTAS_EMPRESA_APENAS_NFSE_NFE };
  }
  if (hasOwn(payload, 'nfce')) {
    payload.nfce = { ...PLUGNOTAS_EMPRESA_APENAS_NFSE_NFCE };
  }
  if (hasOwn(payload, 'inscricaoEstadual')) {
    normalizeInscricaoEstadualApenasNfse(payload);
  }
  applyNfseNacionalDefaultForPatch(payload);
};

const toObject = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value;
};

const toMessage = (payload, fallback = '') => {
  if (!payload) return fallback;
  if (typeof payload === 'string') return payload || fallback;
  if (typeof payload !== 'object') return fallback;
  return payload?.error?.message || payload?.message || payload?.error || fallback;
};

/** Mensagem de erro Plugnotas incluindo `errors` / detalhes quando o corpo for JSON. */
const messageFromPlugnotasPayload = (payload, statusText) => {
  if (payload === null || payload === undefined) return statusText;
  if (typeof payload === 'string') return payload || statusText;
  if (typeof payload === 'object' && !Array.isArray(payload)) {
    return buildErrorMessageFromBody(payload, statusText);
  }
  return toMessage(payload, statusText);
};

/** Metadados para o cliente (Network / apiClient) identificar qual chamada ao Plugnotas falhou. */
const plugnotasRequestErrors = (method, path) => ({
  plugnotasRequest: { method, path }
});

const ensureConfigured = () => {
  if (!env.PLUGNOTAS_API_BASE_URL) {
    throw badRequest('Serviço de emissão fiscal não configurado');
  }
  if (!env.PLUGNOTAS_API_KEY) {
    throw badRequest('Token do serviço de emissão fiscal não configurado');
  }
};

const withTimeout = (ms) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  return { controller, timeout };
};

const parseResponsePayload = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }
  try {
    const text = await response.text();
    return text || null;
  } catch {
    return null;
  }
};

const requestJson = async (method, path, body) => {
  ensureConfigured();
  const timeoutMs = Number(env.PLUGNOTAS_TIMEOUT_MS || 15000);
  const { controller, timeout } = withTimeout(timeoutMs);
  const baseUrl = getPlugnotasRootUrl();

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': env.PLUGNOTAS_API_KEY
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: controller.signal
    });

    const payload = await parseResponsePayload(response);
    if (!response.ok) {
      const message = messageFromPlugnotasPayload(payload, response.statusText);
      const fullUrl = `${baseUrl}${path}`;
      if (
        response.status === 400
        && body
        && typeof body === 'object'
        && !Array.isArray(body)
        && isEmpresaCadastroPlugnotasPath(path)
      ) {
        logPlugnotasEmpresaCadastro400Request({ method, path, body });
      }
      if (process.env.NODE_ENV !== 'production' || isPlugnotasDebugExplicitlyEnabled()) {
        const pathLog = maskPlugnotasPathOrUrlForLog(path);
        const fullUrlLog = maskPlugnotasPathOrUrlForLog(fullUrl);
        // eslint-disable-next-line no-console
        console.error('[plugnotas]', method, pathLog, response.status, message, fullUrlLog);
      }
      if (response.status === 401) {
        throw new HttpError(
          401,
          message || 'Token do serviço de emissão fiscal inválido',
          plugnotasRequestErrors(method, path)
        );
      }
      if (response.status === 403) {
        throw new HttpError(
          403,
          message || 'Acesso negado pelo serviço de emissão fiscal',
          plugnotasRequestErrors(method, path)
        );
      }
      if (response.status === 404) {
        throw new HttpError(404, message || 'Empresa não encontrada', plugnotasRequestErrors(method, path));
      }
      if (response.status === 409) {
        throw new HttpError(409, message || 'Empresa já cadastrada', plugnotasRequestErrors(method, path));
      }
      throw new HttpError(
        response.status || 400,
        message || 'Erro no serviço de emissão fiscal',
        plugnotasRequestErrors(method, path)
      );
    }

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return { message: toMessage(payload, null) };
    }
    return payload;
  } finally {
    clearTimeout(timeout);
  }
};

const requestFormData = async (method, path, body) => {
  ensureConfigured();
  const timeoutMs = Number(env.PLUGNOTAS_TIMEOUT_MS || 15000);
  const { controller, timeout } = withTimeout(timeoutMs);
  const baseUrl = getPlugnotasRootUrl();

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        'x-api-key': env.PLUGNOTAS_API_KEY
      },
      body,
      signal: controller.signal
    });

    const payload = await parseResponsePayload(response);
    if (!response.ok) {
      const message = messageFromPlugnotasPayload(payload, response.statusText);
      const fullUrl = `${baseUrl}${path}`;
      if (process.env.NODE_ENV !== 'production' || isPlugnotasDebugExplicitlyEnabled()) {
        const pathLog = maskPlugnotasPathOrUrlForLog(path);
        const fullUrlLog = maskPlugnotasPathOrUrlForLog(fullUrl);
        // eslint-disable-next-line no-console
        console.error('[plugnotas]', method, pathLog, response.status, message, fullUrlLog);
      }
      if (response.status === 401) {
        throw new HttpError(
          401,
          message || 'Token do serviço de emissão fiscal inválido',
          plugnotasRequestErrors(method, path)
        );
      }
      if (response.status === 403) {
        throw new HttpError(
          403,
          message || 'Acesso negado pelo serviço de emissão fiscal',
          plugnotasRequestErrors(method, path)
        );
      }
      throw new HttpError(
        response.status || 400,
        message || 'Erro no serviço de emissão fiscal',
        plugnotasRequestErrors(method, path)
      );
    }

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return { message: toMessage(payload, null) };
    }
    return payload;
  } finally {
    clearTimeout(timeout);
  }
};

const isConflictLikeError = (error) => {
  const status = Number(error?.status || 0);
  if (status === 409) return true;
  const message = String(error?.message || '').toLowerCase();
  if (!message) return false;
  return (
    message.includes('já cadastrada')
    || message.includes('ja cadastrada')
    || message.includes('already exists')
    || message.includes('empresa existente')
    || message.includes('empresa já existe')
    || message.includes('duplicate')
    || message.includes('duplicado')
    || message.includes('conflito')
  );
};

/** PATCH /empresa/:cnpj retorna 404 quando não há empresa para o token (mensagem típica do Plugnotas). */
const isEmpresaNaoLocalizadaPlugnotas404 = (error) => {
  const status = Number(error?.status ?? 0);
  if (status !== 404) return false;
  const m = String(error?.message || '').toLowerCase();
  return (
    m.includes('não localizamos')
    || m.includes('nao localizamos')
    || m.includes('não encontramos')
    || m.includes('nao encontramos')
  );
};

const MSG_EMPRESA_NAO_CADASTRADA_EMISSOR =
  'Não há cadastro desta empresa no emissor fiscal para o token e ambiente configurados. '
  + 'Cadastre primeiro na guia MEI: envie o certificado (.pfx) e os dados para gravar a empresa no emissor; '
  + 'só depois use "Atualizar cadastro (sem novo certificado)". '
  + 'Confira no painel do emissor se o CNPJ está na mesma conta e se a URL base da API e a chave '
  + 'configuradas no servidor são do mesmo ambiente (sandbox ou produção).';

/**
 * Plugnotas API pública: atualização de empresa é PATCH em /empresa/:cnpj.
 * PUT em /empresa ou /empresa/:cnpj retorna 404 "Esta rota não existe no serviço".
 */
const buildUpdateAttempts = (cnpj, payload) => {
  const safeCnpj = encodeURIComponent(cnpj);
  return [{ method: 'PATCH', path: `/empresa/${safeCnpj}`, body: payload }];
};

const tryUpdateEmpresa = async (cnpj, payload) => {
  const attempts = buildUpdateAttempts(cnpj, payload);
  let lastError = null;
  /** @type {{ method: string, path: string, status: number|null, message: string }[]} */
  const failures = [];

  for (const attempt of attempts) {
    try {
      const response = await requestJson(attempt.method, attempt.path, attempt.body);
      return { response, attempt, lastError: null, failures: [] };
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        throw error;
      }
      lastError = error;
      const status = typeof error?.status === 'number' ? error.status : null;
      const message = error instanceof Error ? error.message : String(error || '');
      failures.push({
        method: attempt.method,
        path: attempt.path,
        status,
        message
      });
    }
  }

  return { response: null, attempt: null, lastError, failures };
};

/** POST /certificado retorna 409 quando o .pfx já foi cadastrado na conta. */
const isCertificadoDuplicado409 = (error) => {
  if (Number(error?.status) !== 409) return false;
  const m = String(error?.message || '').toLowerCase();
  return m.includes('certificado') && (m.includes('já existe') || m.includes('ja existe') || m.includes('parâmetros'));
};

const extractCertificadoIdFromEmpresaPayload = (payload) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const root = toObject(payload);
  const data = toObject(payload?.data);
  const nestedCert = typeof data.certificado === 'object' && data.certificado !== null
    ? data.certificado
    : null;
  const nestedIdCert = typeof data.idCertificado === 'object' && data.idCertificado !== null
    ? data.idCertificado
    : null;

  const candidates = [
    typeof data.certificado === 'string' ? normalizeCertificadoIdCandidate(data.certificado) : null,
    nestedCert ? normalizeCertificadoIdCandidate(nestedCert.id) : null,
    nestedCert ? normalizeCertificadoIdCandidate(nestedCert._id) : null,
    normalizeCertificadoIdCandidate(data.idCertificado),
    normalizeCertificadoIdCandidate(data.certificadoId),
    nestedIdCert ? normalizeCertificadoIdCandidate(nestedIdCert.id) : null,
    nestedIdCert ? normalizeCertificadoIdCandidate(nestedIdCert._id) : null,
    typeof root.certificado === 'string' ? normalizeCertificadoIdCandidate(root.certificado) : null
  ];
  for (const c of candidates) {
    if (c) return c;
  }
  return null;
};

/**
 * Após 409 no POST /certificado, obtém o ID do certificado já existente (GET empresa e/ou GET /certificado).
 * Logs estruturados por etapa: US-MEI-FISC-04 (`PLUGNOTAS_CERT_409_RESOLVE_LOG_LEVEL`).
 * @param {string|undefined} cpfCnpjInput
 * @returns {Promise<string|null>}
 */
const resolverCertificadoIdAposConflito409 = async (cpfCnpjInput) => {
  const cnpj = normalizeDoc(cpfCnpjInput || '');
  if (cnpj.length !== 14) return null;

  try {
    const emp = await requestJson('GET', `/empresa/${encodeURIComponent(cnpj)}`);
    const fromEmp = extractCertificadoIdFromEmpresaPayload(emp);
    if (fromEmp) return fromEmp;
    logPlugnotasCertificado409Resolve({
      step: PLUGNOTAS_CERT_409_RESOLVE_STEPS.EMPRESA_GET,
      cpfCnpj14: cnpj,
      outcome: 'no_certificado_id_in_payload'
    });
  } catch (err) {
    if (err?.status !== 404 && err?.status !== 400) throw err;
    logPlugnotasCertificado409Resolve({
      step: PLUGNOTAS_CERT_409_RESOLVE_STEPS.EMPRESA_GET,
      cpfCnpj14: cnpj,
      outcome: 'http_error',
      httpStatus: err.status
    });
  }

  try {
    const filtered = await requestJson(
      'GET',
      `/certificado?cpfCnpj=${encodeURIComponent(cnpj)}`
    );
    const fromFiltered = extrairCertificadoIdDeListagem(filtered, cnpj);
    if (fromFiltered) return fromFiltered;
    const itemsFiltered = normalizeCertificadoListItems(filtered);
    logPlugnotasCertificado409Resolve({
      step: PLUGNOTAS_CERT_409_RESOLVE_STEPS.CERTIFICADO_FILTRO,
      cpfCnpj14: cnpj,
      outcome: 'no_id_resolved',
      listItemCount: itemsFiltered.length
    });
  } catch (err) {
    if (err?.status !== 404 && err?.status !== 400) throw err;
    logPlugnotasCertificado409Resolve({
      step: PLUGNOTAS_CERT_409_RESOLVE_STEPS.CERTIFICADO_FILTRO,
      cpfCnpj14: cnpj,
      outcome: 'http_error',
      httpStatus: err.status
    });
  }

  try {
    const list = await requestJson('GET', '/certificado');
    const fromList = extrairCertificadoIdDeListagem(list, cnpj);
    if (fromList) return fromList;
    const items = normalizeCertificadoListItems(list);
    const first = items[0] && typeof items[0] === 'object' ? items[0] : null;
    logPlugnotasCertificado409Resolve({
      step: PLUGNOTAS_CERT_409_RESOLVE_STEPS.PARSE_LISTAGEM,
      cpfCnpj14: cnpj,
      outcome: 'no_id_resolved',
      listItemCount: items.length,
      ...(first ? { firstItemKeysCount: Object.keys(first).length } : {})
    });
  } catch (err) {
    if (err?.status === 404) {
      logPlugnotasCertificado409Resolve({
        step: PLUGNOTAS_CERT_409_RESOLVE_STEPS.CERTIFICADO_LISTA,
        cpfCnpj14: cnpj,
        outcome: 'http_error',
        httpStatus: 404
      });
      return null;
    }
    throw err;
  }

  return null;
};

export const cadastrarCertificadoPlugNotas = async ({
  fileBuffer,
  fileName,
  mimeType,
  password,
  email,
  cpfCnpj
}) => {
  if (!fileBuffer) {
    throw badRequest('Arquivo do certificado é obrigatório');
  }
  if (!password) {
    throw badRequest('Senha do certificado é obrigatória');
  }

  const formData = new FormData();
  const blob = new Blob([fileBuffer], {
    type: mimeType || 'application/x-pkcs12'
  });
  formData.append('arquivo', blob, fileName || 'certificado.pfx');
  formData.append('senha', String(password));
  if (email) {
    formData.append('email', String(email));
  }

  try {
    const response = await requestFormData('POST', '/certificado', formData);
    const data = toObject(response?.data);

    return {
      id: typeof data.id === 'string' ? data.id : null,
      message: typeof response?.message === 'string' ? response.message : null,
      raw: response
    };
  } catch (error) {
    if (!isCertificadoDuplicado409(error)) {
      throw error;
    }
    const resolved = await resolverCertificadoIdAposConflito409(cpfCnpj);
    if (resolved) {
      return {
        id: resolved,
        message: 'Certificado já existente no emissor fiscal; ID recuperado para continuar o cadastro da empresa.',
        raw: {
          recoveredFrom409: true,
          conflictMessage: error instanceof Error ? error.message : String(error)
        }
      };
    }
    throw badRequest(
      'O certificado já está cadastrado no emissor fiscal, mas não foi possível obter o ID automaticamente. '
      + 'Confirme o CNPJ no formulário, verifique no painel do emissor se o certificado aparece nesta conta '
      + 'e se a URL base da API e a chave configuradas no servidor são do mesmo ambiente.',
      { plugnotasCode: 'certificado_409_sem_id' }
    );
  }
};

/**
 * Consulta cadastro da empresa no provedor de emissão pelo CNPJ (somente dígitos após normalização).
 * @param {string} cnpjInput
 * @returns {Promise<Record<string, unknown>>}
 */
export const consultarEmpresaPlugNotas = async (cnpjInput) => {
  const cnpj = normalizeDoc(cnpjInput || '');
  if (cnpj.length !== 14) {
    throw badRequest('CNPJ da empresa deve ter 14 dígitos');
  }
  return await requestJson('GET', `/empresa/${encodeURIComponent(cnpj)}`);
};

/**
 * Atualiza cadastro da empresa no provedor via PATCH /empresa/:cnpj, sem exigir reenvio de certificado.
 * Útil quando a empresa e o certificado já existem no provedor e só os dados cadastrais mudam.
 * @param {Record<string, unknown>} input
 */
export const atualizarEmpresaPlugNotas = async (input) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw badRequest('Payload da empresa é obrigatório e deve ser um objeto');
  }

  const payload = { ...input };
  const cnpj = normalizeDoc(payload?.cpfCnpj || payload?.cnpj || '');
  if (cnpj.length !== 14) {
    throw badRequest('CNPJ da empresa deve ter 14 dígitos');
  }

  payload.cpfCnpj = cnpj;
  delete payload.cnpj;

  const cert = payload.certificado;
  if (cert === undefined || cert === null || String(cert).trim() === '') {
    delete payload.certificado;
  }

  const docPatch = resolveDocumentosAtivosForPatch(payload);
  stripDocumentosAtivos(payload);
  if (docPatch.present && docPatch.selection) {
    applyEmpresaPlugnotasDocumentSelectionForPatch(payload, docPatch.selection);
    if (hasOwn(payload, 'inscricaoEstadual')) {
      normalizeInscricaoEstadualApenasNfse(payload);
    }
  } else {
    applyEmpresaPlugnotasApenasNfseForPatch(payload);
  }

  normalizePayloadEnderecoCodigoCidade(payload);

  const updateResult = await tryUpdateEmpresa(cnpj, payload);
  if (updateResult.response) {
    const data = toObject(updateResult.response?.data);
    const fallbackMessage = `Empresa atualizada no serviço de emissão (${updateResult.attempt.method} ${updateResult.attempt.path}).`;
    return {
      cnpj: typeof data.cnpj === 'string' ? data.cnpj : cnpj,
      message: typeof updateResult.response?.message === 'string'
        ? updateResult.response.message
        : fallbackMessage,
      operation: 'updated',
      raw: updateResult.response
    };
  }

  const err = updateResult.lastError;
  if (err && typeof err === 'object' && err.status === 401) throw err;
  if (err && typeof err === 'object' && err.status === 403) throw err;
  const failures = Array.isArray(updateResult.failures) ? updateResult.failures : [];
  if (isEmpresaNaoLocalizadaPlugnotas404(err)) {
    throw badRequest(MSG_EMPRESA_NAO_CADASTRADA_EMISSOR, {
      plugnotasUpdateAttempts: failures,
      plugnotasCode: 'empresa_nao_cadastrada'
    });
  }
  const msg = err instanceof Error
    ? err.message
    : String(err || 'Não foi possível atualizar a empresa no serviço de emissão fiscal');
  throw badRequest(msg, { plugnotasUpdateAttempts: failures });
};

export const cadastrarEmpresaPlugNotas = async (input) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw badRequest('Payload da empresa é obrigatório e deve ser um objeto');
  }

  const payload = { ...input };
  const cnpj = normalizeDoc(payload?.cpfCnpj || payload?.cnpj || '');
  if (cnpj.length !== 14) {
    throw badRequest('CNPJ da empresa deve ter 14 dígitos');
  }
  if (!payload?.certificado) {
    throw badRequest('Certificado é obrigatório para emitir notas no serviço de emissão fiscal');
  }

  payload.cpfCnpj = cnpj;
  delete payload.cnpj;

  const docPost = resolveDocumentosAtivosForPost(payload);
  stripDocumentosAtivos(payload);
  applyEmpresaPlugnotasDocumentSelectionForPost(payload, docPost.selection);

  normalizePayloadEnderecoCodigoCidade(payload);

  try {
    const response = await requestJson('POST', '/empresa', payload);
    const data = toObject(response?.data);
    return {
      cnpj: typeof data.cnpj === 'string' ? data.cnpj : cnpj,
      message: typeof response?.message === 'string' ? response.message : 'Empresa cadastrada no serviço de emissão fiscal.',
      operation: 'created',
      raw: response
    };
  } catch (createError) {
    if (!isConflictLikeError(createError)) {
      throw createError;
    }

    const updateResult = await tryUpdateEmpresa(cnpj, payload);
    if (updateResult.response) {
      const data = toObject(updateResult.response?.data);
      const fallbackMessage = `Empresa atualizada no serviço de emissão (${updateResult.attempt.method} ${updateResult.attempt.path}).`;
      return {
        cnpj: typeof data.cnpj === 'string' ? data.cnpj : cnpj,
        message: typeof updateResult.response?.message === 'string'
          ? updateResult.response.message
          : fallbackMessage,
        operation: 'updated',
        raw: updateResult.response
      };
    }

    return {
      cnpj,
      message: 'Empresa já cadastrada no serviço de emissão. Atualização automática não confirmada, mas o fluxo seguirá como sucesso operacional.',
      operation: 'existing',
      raw: {
        status: 'existing_without_update',
        conflictMessage: createError instanceof Error ? createError.message : String(createError || ''),
        updateMessage: updateResult.lastError instanceof Error
          ? updateResult.lastError.message
          : String(updateResult.lastError || ''),
        attemptedEndpoints: buildUpdateAttempts(cnpj, payload)
          .map((attempt) => `${attempt.method} ${attempt.path}`)
      }
    };
  }
};
