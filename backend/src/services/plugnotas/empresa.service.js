import { env } from '../../config/env.js';
import { HttpError, badRequest, forbidden, unauthorized } from '../../utils/errors.js';

const normalizeBaseUrl = (value) => String(value || '').replace(/\/$/, '');
const normalizeDoc = (value) => String(value || '').replace(/\D/g, '');

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

const ensureConfigured = () => {
  if (!env.PLUGNOTAS_API_BASE_URL) {
    throw badRequest('PlugNotas não configurado');
  }
  if (!env.PLUGNOTAS_API_KEY) {
    throw badRequest('Token da PlugNotas não configurado');
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
  const baseUrl = normalizeBaseUrl(env.PLUGNOTAS_API_BASE_URL);

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
      const message = toMessage(payload, response.statusText);
      if (response.status === 401) throw unauthorized(message || 'Token PlugNotas inválido');
      if (response.status === 403) throw forbidden(message || 'Acesso negado pela PlugNotas');
      if (response.status === 404) throw new HttpError(404, message || 'Empresa não encontrada');
      if (response.status === 409) throw new HttpError(409, message || 'Empresa já cadastrada');
      throw new HttpError(response.status || 400, message || 'Erro na API PlugNotas');
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
  const baseUrl = normalizeBaseUrl(env.PLUGNOTAS_API_BASE_URL);

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
      const message = toMessage(payload, response.statusText);
      if (response.status === 401) throw unauthorized(message || 'Token PlugNotas inválido');
      if (response.status === 403) throw forbidden(message || 'Acesso negado pela PlugNotas');
      throw new HttpError(response.status || 400, message || 'Erro na API PlugNotas');
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

const buildUpdateAttempts = (cnpj, payload) => {
  const safeCnpj = encodeURIComponent(cnpj);
  return [
    { method: 'PUT', path: `/empresa/${safeCnpj}`, body: payload },
    { method: 'PATCH', path: `/empresa/${safeCnpj}`, body: payload },
    { method: 'PUT', path: '/empresa', body: payload },
    { method: 'PATCH', path: '/empresa', body: payload }
  ];
};

const tryUpdateEmpresa = async (cnpj, payload) => {
  const attempts = buildUpdateAttempts(cnpj, payload);
  let lastError = null;

  for (const attempt of attempts) {
    try {
      const response = await requestJson(attempt.method, attempt.path, attempt.body);
      return { response, attempt, lastError: null };
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        throw error;
      }
      lastError = error;
    }
  }

  return { response: null, attempt: null, lastError };
};

export const cadastrarCertificadoPlugNotas = async ({
  fileBuffer,
  fileName,
  mimeType,
  password,
  email
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

  const response = await requestFormData('POST', '/certificado', formData);
  const data = toObject(response?.data);

  return {
    id: typeof data.id === 'string' ? data.id : null,
    message: typeof response?.message === 'string' ? response.message : null,
    raw: response
  };
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
    throw badRequest('Certificado é obrigatório para emitir notas no PlugNotas');
  }

  payload.cpfCnpj = cnpj;
  delete payload.cnpj;

  try {
    const response = await requestJson('POST', '/empresa', payload);
    const data = toObject(response?.data);
    return {
      cnpj: typeof data.cnpj === 'string' ? data.cnpj : cnpj,
      message: typeof response?.message === 'string' ? response.message : 'Empresa cadastrada na PlugNotas.',
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
      const fallbackMessage = `Empresa atualizada na PlugNotas (${updateResult.attempt.method} ${updateResult.attempt.path}).`;
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
      message: 'Empresa já cadastrada na PlugNotas. Atualização automática não confirmada, mas o fluxo seguirá como sucesso operacional.',
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
