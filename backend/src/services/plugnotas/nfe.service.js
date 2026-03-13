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

const parseErrorMessage = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const payload = await response.json();
    return payload?.error?.message || payload?.message || payload?.error || response.statusText;
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
      if (response.status === 404) throw notFound(message || 'Registro NF-e não encontrado');
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
  const template = String(env.PLUGNOTAS_NFE_CANCEL_PATH || '/nfe/:id/cancelamento').trim();
  const safeId = encodeURIComponent(id);
  if (!template.includes(':id')) {
    return `${template.replace(/\/$/, '')}/${safeId}`;
  }
  return template.replace(':id', safeId);
};

export const emitirNfe = async (payload) => {
  return await requestJson('POST', '/nfe', [payload]);
};

export const consultarNfe = async (idOrChaveOrProtocol) => {
  if (!idOrChaveOrProtocol) throw badRequest('ID da NF-e é obrigatório');
  return await requestJson('GET', `/nfe/${encodeURIComponent(idOrChaveOrProtocol)}/resumo`);
};

export const consultarNfePorIntegracao = async (idIntegracao, cnpj) => {
  if (!idIntegracao || !cnpj) {
    throw badRequest('ID integração e CNPJ são obrigatórios');
  }
  const cleanCnpj = normalizeDoc(cnpj);
  return await requestJson(
    'GET',
    `/nfe/${encodeURIComponent(cleanCnpj)}/${encodeURIComponent(idIntegracao)}/resumo`
  );
};

export const consultarNfePorIdOuProtocolo = async (idOrProtocol) => {
  if (!idOrProtocol) throw badRequest('ID ou protocolo é obrigatório');
  return await requestJson('GET', `/nfe/${encodeURIComponent(idOrProtocol)}/resumo`);
};

export const cancelarNfe = async (id, { reason } = {}) => {
  if (!id) throw badRequest('ID da NF-e é obrigatório');
  const payload = reason ? { justificativa: reason, reason } : {};
  return await requestJson('POST', resolveCancelPath(id), payload);
};

export const downloadNfePdf = async (id) => {
  if (!id) throw badRequest('ID da NF-e é obrigatório');
  return await requestDownload(
    `/nfe/${encodeURIComponent(id)}/pdf`,
    'application/pdf',
    'PDF da NF-e não encontrado'
  );
};

export const downloadNfePdfPorIntegracao = async (idIntegracao, cnpj) => {
  const resumo = await consultarNfePorIntegracao(idIntegracao, cnpj);
  const id = extractId(resumo);
  if (!id) throw notFound('NF-e não encontrada para gerar PDF');
  return await downloadNfePdf(id);
};

export const downloadNfeXml = async (id) => {
  if (!id) throw badRequest('ID da NF-e é obrigatório');
  return await requestDownload(
    `/nfe/${encodeURIComponent(id)}/xml`,
    'application/xml',
    'XML da NF-e não encontrado'
  );
};

export const downloadNfeXmlPorIntegracao = async (idIntegracao, cnpj) => {
  const resumo = await consultarNfePorIntegracao(idIntegracao, cnpj);
  const id = extractId(resumo);
  if (!id) throw notFound('NF-e não encontrada para gerar XML');
  return await downloadNfeXml(id);
};

export const relatorioNfe = async (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    query.set(key, String(value));
  });
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return await requestJson('GET', `/nfe/relatorio${suffix}`);
};
