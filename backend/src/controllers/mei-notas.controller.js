import { env } from '../config/env.js';
import * as meiNotasService from '../services/mei-notas.service.js';
import { unauthorized } from '../utils/errors.js';
import { sendSuccess } from '../utils/response.js';

const firstValue = (value) => (Array.isArray(value) ? value[0] : value);
const toToken = (value) => String(firstValue(value) || '').trim();
const stripBearer = (value) => String(value || '').replace(/^Bearer\s+/i, '').trim();
const parseLimit = (value, fallback = 20, max = 50) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const normalized = Math.trunc(parsed);
  if (normalized <= 0) return fallback;
  return Math.min(normalized, max);
};

const ensureWebhookToken = (req) => {
  const expectedToken = String(env.PLUGNOTAS_WEBHOOK_TOKEN || '').trim();
  if (!expectedToken) {
    if (env.NODE_ENV === 'production') {
      throw unauthorized('Webhook token não configurado');
    }
    return;
  }

  const rawToken = req.headers['x-webhook-token']
    || req.headers['x-api-key']
    || req.query?.token
    || '';
  const token = stripBearer(toToken(rawToken));

  if (!token || token !== expectedToken) {
    throw unauthorized('Webhook não autorizado');
  }
};

export const emitir = async (req, res, next) => {
  try {
    const data = await meiNotasService.emitirNota(req.user.id, req.body);
    return sendSuccess(res, data, 'NFSe enviada para emissão');
  } catch (error) {
    return next(error);
  }
};

export const listar = async (req, res, next) => {
  try {
    const includeArchived = String(req.query?.includeArchived || '').toLowerCase() === 'true';
    const data = await meiNotasService.listarNotas(req.user.id, { includeArchived });
    return sendSuccess(res, data, 'NFSe listadas');
  } catch (error) {
    return next(error);
  }
};

export const listarCatalogoClientes = async (req, res, next) => {
  try {
    const q = String(req.query?.q || '').trim();
    const limit = parseLimit(req.query?.limit);
    const documentType = String(req.query?.documentType || '').trim() || undefined;
    const data = await meiNotasService.listarCatalogoClientes(req.user.id, { q, limit, documentType });
    return sendSuccess(res, data, 'Catálogo de clientes listado');
  } catch (error) {
    return next(error);
  }
};

export const listarCatalogoProdutos = async (req, res, next) => {
  try {
    const q = String(req.query?.q || '').trim();
    const limit = parseLimit(req.query?.limit);
    const documentType = String(req.query?.documentType || '').trim() || undefined;
    const data = await meiNotasService.listarCatalogoProdutos(req.user.id, { q, limit, documentType });
    return sendSuccess(res, data, 'Catálogo de produtos listado');
  } catch (error) {
    return next(error);
  }
};

export const atualizar = async (req, res, next) => {
  try {
    const data = await meiNotasService.atualizarNota(req.user.id, req.params.id, req.body);
    return sendSuccess(res, data, 'NFSe atualizada');
  } catch (error) {
    return next(error);
  }
};

export const cancelar = async (req, res, next) => {
  try {
    const data = await meiNotasService.cancelarNota(req.user.id, req.params.id, req.body);
    return sendSuccess(res, data, 'Cancelamento da NFSe processado');
  } catch (error) {
    return next(error);
  }
};

export const arquivar = async (req, res, next) => {
  try {
    const data = await meiNotasService.arquivarNota(req.user.id, req.params.id, req.body);
    return sendSuccess(res, data, 'Arquivamento da NFSe atualizado');
  } catch (error) {
    return next(error);
  }
};

export const detalhar = async (req, res, next) => {
  try {
    const sync = String(req.query?.sync || '').toLowerCase() === 'true';
    const data = await meiNotasService.obterNota(req.user.id, req.params.id, { sync });
    return sendSuccess(res, data, 'NFSe obtida');
  } catch (error) {
    return next(error);
  }
};

export const downloadPdf = async (req, res, next) => {
  try {
    const file = await meiNotasService.baixarPdf(req.user.id, req.params.id);
    res.setHeader('Content-Type', file.contentType || 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="nfse-${req.params.id}.pdf"`);
    return res.send(file.buffer);
  } catch (error) {
    return next(error);
  }
};

export const downloadXml = async (req, res, next) => {
  try {
    const file = await meiNotasService.baixarXml(req.user.id, req.params.id);
    res.setHeader('Content-Type', file.contentType || 'application/xml');
    res.setHeader('Content-Disposition', `attachment; filename="nfse-${req.params.id}.xml"`);
    return res.send(file.buffer);
  } catch (error) {
    return next(error);
  }
};

export const webhook = async (req, res, next) => {
  try {
    ensureWebhookToken(req);
    const data = await meiNotasService.processarWebhook(req.body);
    return sendSuccess(res, data, 'Webhook processado');
  } catch (error) {
    return next(error);
  }
};
