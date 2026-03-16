import { env } from '../../config/env.js';
import { badRequest, forbidden, notFound, unauthorized } from '../../utils/errors.js';

const normalizeBaseUrl = (value) => String(value || '').replace(/\/$/, '');

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

const buildHeaders = (accept = 'application/json') => ({
  Accept: accept,
  'Content-Type': 'application/json',
  'x-api-key': env.PLUGNOTAS_API_KEY
});

const RESERVED_ERROR_KEYS = new Set([
  'field',
  'campo',
  'reason',
  'error',
  'motivo',
  'message',
  'mensagem',
  'description',
  'descricao',
  'details',
  'detalhes',
  'errors',
  'erros',
  'validationErrors'
]);

const withFieldContext = (field, text) => {
  const safeField = String(field || '').trim();
  const safeText = String(text || '').trim();
  if (!safeText) return '';
  return safeField ? `${safeField}: ${safeText}` : safeText;
};

const collectErrorMessages = (value, fieldContext = '') => {
  if (value === null || value === undefined) return [];
  if (typeof value === 'string') {
    const text = withFieldContext(fieldContext, value);
    return text ? [text] : [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => collectErrorMessages(item, fieldContext));
  }
  if (typeof value === 'object') {
    const entries = [];
    const field = String(value.field || value.campo || fieldContext || '').trim();
    const reason = String(value.reason || value.error || value.motivo || '').trim();
    if (reason) {
      const text = withFieldContext(field, reason);
      if (text) entries.push(text);
    }
    entries.push(
      ...collectErrorMessages(value.message),
      ...collectErrorMessages(value.mensagem),
      ...collectErrorMessages(value.description),
      ...collectErrorMessages(value.descricao),
      ...collectErrorMessages(value.details),
      ...collectErrorMessages(value.detalhes),
      ...collectErrorMessages(value.errors),
      ...collectErrorMessages(value.erros),
      ...collectErrorMessages(value.validationErrors)
    );

    Object.entries(value).forEach(([key, item]) => {
      if (RESERVED_ERROR_KEYS.has(key)) return;
      const nextField = fieldContext ? `${fieldContext}.${key}` : key;
      entries.push(...collectErrorMessages(item, nextField));
    });

    return entries;
  }
  return [];
};

const parseErrorMessage = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const payload = await response.json();
    const baseMessage = String(
      payload?.error?.message
      || payload?.message
      || (typeof payload?.error === 'string' ? payload.error : '')
      || response.statusText
      || ''
    ).trim();
    const detailMessages = [
      ...collectErrorMessages(payload?.error?.details),
      ...collectErrorMessages(payload?.error?.errors),
      ...collectErrorMessages(payload?.details),
      ...collectErrorMessages(payload?.errors),
      ...collectErrorMessages(payload?.erros)
    ].filter(Boolean);
    const details = [...new Set(detailMessages)].join(' | ');
    if (baseMessage && details && !baseMessage.includes(details)) {
      return `${baseMessage}: ${details}`;
    }
    return baseMessage || details || response.statusText;
  }
  const text = await response.text();
  return text || response.statusText;
};

const requestJson = async (method, path, body) => {
  ensureConfigured();
  const timeoutMs = Number(env.PLUGNOTAS_TIMEOUT_MS || 15000);
  const { controller, timeout } = withTimeout(timeoutMs);
  const baseUrl = normalizeBaseUrl(env.PLUGNOTAS_API_BASE_URL);

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: buildHeaders(),
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: controller.signal
    });

    if (!response.ok) {
      const message = await parseErrorMessage(response);
      if (response.status === 401) throw unauthorized(message || 'Token PlugNotas inválido');
      if (response.status === 403) throw forbidden(message || 'Acesso negado pela PlugNotas');
      if (response.status === 404) throw notFound(message || 'Registro NFC-e não encontrado');
      throw badRequest(message || 'Erro na API PlugNotas');
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
};

const requestDownload = async (path, accept, notFoundMessage) => {
  ensureConfigured();
  const timeoutMs = Number(env.PLUGNOTAS_TIMEOUT_MS || 15000);
  const { controller, timeout } = withTimeout(timeoutMs);
  const baseUrl = normalizeBaseUrl(env.PLUGNOTAS_API_BASE_URL);

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method: 'GET',
      headers: buildHeaders(accept),
      signal: controller.signal
    });

    if (!response.ok) {
      const message = await parseErrorMessage(response);
      if (response.status === 401) throw unauthorized(message || 'Token PlugNotas inválido');
      if (response.status === 403) throw forbidden(message || 'Acesso negado pela PlugNotas');
      if (response.status === 404) throw notFound(message || notFoundMessage);
      throw badRequest(message || 'Erro ao baixar arquivo da PlugNotas');
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const payload = await response.json();
      throw badRequest(payload?.message || payload?.error?.message || 'Erro ao baixar arquivo da PlugNotas');
    }

    const arrayBuffer = await response.arrayBuffer();
    return {
      buffer: Buffer.from(arrayBuffer),
      contentType: contentType || accept
    };
  } finally {
    clearTimeout(timeout);
  }
};

const normalizeDoc = (value) => String(value || '').replace(/\D/g, '');

const collectCandidates = (response) => {
  if (Array.isArray(response)) return response;
  if (!response || typeof response !== 'object') return [response];
  const list = [response];
  if (Array.isArray(response.documents)) list.push(...response.documents);
  if (Array.isArray(response.documentos)) list.push(...response.documentos);
  return list;
};

const extractId = (response) => {
  const candidates = collectCandidates(response);
  for (const candidate of candidates) {
    if (candidate?.id) return candidate.id;
  }
  return null;
};

const resolveCancelPath = (id) => {
  const template = String(env.PLUGNOTAS_NFCE_CANCEL_PATH || '/nfce/:id/cancelamento').trim();
  const safeId = encodeURIComponent(id);
  if (!template.includes(':id')) {
    return `${template.replace(/\/$/, '')}/${safeId}`;
  }
  return template.replace(':id', safeId);
};

export const emitirNfce = async (payload) => {
  return await requestJson('POST', '/nfce', [payload]);
};

export const consultarNfce = async (idOrChaveOrProtocol) => {
  if (!idOrChaveOrProtocol) throw badRequest('ID da NFC-e é obrigatório');
  return await requestJson('GET', `/nfce/${encodeURIComponent(idOrChaveOrProtocol)}/resumo`);
};

export const consultarNfcePorIntegracao = async (idIntegracao, cnpj) => {
  if (!idIntegracao || !cnpj) {
    throw badRequest('ID integração e CNPJ são obrigatórios');
  }
  const cleanCnpj = normalizeDoc(cnpj);
  return await requestJson(
    'GET',
    `/nfce/${encodeURIComponent(cleanCnpj)}/${encodeURIComponent(idIntegracao)}/resumo`
  );
};

export const consultarNfcePorIdOuProtocolo = async (idOrProtocol) => {
  if (!idOrProtocol) throw badRequest('ID ou protocolo é obrigatório');
  return await requestJson('GET', `/nfce/${encodeURIComponent(idOrProtocol)}/resumo`);
};

export const cancelarNfce = async (id, { reason } = {}) => {
  if (!id) throw badRequest('ID da NFC-e é obrigatório');
  const payload = reason ? { justificativa: reason, reason } : {};
  return await requestJson('POST', resolveCancelPath(id), payload);
};

export const downloadNfcePdf = async (id) => {
  if (!id) throw badRequest('ID da NFC-e é obrigatório');
  return await requestDownload(
    `/nfce/${encodeURIComponent(id)}/pdf`,
    'application/pdf',
    'PDF da NFC-e não encontrado'
  );
};

export const downloadNfcePdfPorIntegracao = async (idIntegracao, cnpj) => {
  const resumo = await consultarNfcePorIntegracao(idIntegracao, cnpj);
  const id = extractId(resumo);
  if (!id) throw notFound('NFC-e não encontrada para gerar PDF');
  return await downloadNfcePdf(id);
};

export const downloadNfceXml = async (id) => {
  if (!id) throw badRequest('ID da NFC-e é obrigatório');
  return await requestDownload(
    `/nfce/${encodeURIComponent(id)}/xml`,
    'application/xml',
    'XML da NFC-e não encontrado'
  );
};

export const downloadNfceXmlPorIntegracao = async (idIntegracao, cnpj) => {
  const resumo = await consultarNfcePorIntegracao(idIntegracao, cnpj);
  const id = extractId(resumo);
  if (!id) throw notFound('NFC-e não encontrada para gerar XML');
  return await downloadNfceXml(id);
};
