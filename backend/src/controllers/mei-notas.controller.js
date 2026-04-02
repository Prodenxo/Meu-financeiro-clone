import { env } from '../config/env.js';
import * as meiNotasService from '../services/mei-notas.service.js';
import {
  atualizarEmpresaPlugNotas,
  cadastrarCertificadoPlugNotas,
  cadastrarEmpresaPlugNotas,
  consultarEmpresaPlugNotas
} from '../services/plugnotas/empresa.service.js';
import { unauthorized } from '../utils/errors.js';
import { parseCatalogLimit } from '../utils/mei-catalog-query.js';
import { sendSuccess } from '../utils/response.js';

const firstValue = (value) => (Array.isArray(value) ? value[0] : value);
const toToken = (value) => String(firstValue(value) || '').trim();
const stripBearer = (value) => String(value || '').replace(/^Bearer\s+/i, '').trim();
const parseBooleanLike = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  const text = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'sim'].includes(text)) return true;
  if (['0', 'false', 'no', 'nao', 'não'].includes(text)) return false;
  return fallback;
};

const ensureWebhookToken = (req) => {
  const requireToken = parseBooleanLike(env.PLUGNOTAS_WEBHOOK_REQUIRE_TOKEN, env.NODE_ENV !== 'development');
  const allowQueryToken = parseBooleanLike(env.PLUGNOTAS_WEBHOOK_ALLOW_QUERY_TOKEN, false);
  const expectedToken = String(env.PLUGNOTAS_WEBHOOK_TOKEN || '').trim();
  if (!expectedToken) {
    if (requireToken) {
      throw unauthorized('Webhook token não configurado');
    }
    return;
  }

  const rawToken = req.headers['x-webhook-token']
    || req.headers['x-api-key']
    || (allowQueryToken ? req.query?.token : '')
    || '';
  const token = stripBearer(toToken(rawToken));

  if (!token || token !== expectedToken) {
    throw unauthorized('Webhook não autorizado');
  }
};

export const emitir = async (req, res, next) => {
  try {
    const data = await meiNotasService.emitirNota(req.user.id, req.body);
    return sendSuccess(res, data, 'Nota fiscal enviada para emissão');
  } catch (error) {
    return next(error);
  }
};

export const listar = async (req, res, next) => {
  try {
    const includeArchived = String(req.query?.includeArchived || '').toLowerCase() === 'true';
    const documentType = String(req.query?.documentType || '').trim() || undefined;
    const limitRaw = req.query?.limit;
    const limit =
      limitRaw !== undefined && limitRaw !== null && String(limitRaw).trim() !== ''
        ? Number(limitRaw)
        : undefined;
    const data = await meiNotasService.listarNotas(req.user.id, {
      includeArchived,
      documentType,
      limit
    });
    return sendSuccess(res, data, 'Notas fiscais listadas');
  } catch (error) {
    return next(error);
  }
};

export const limiteFaturamento = async (req, res, next) => {
  try {
    const raw = req.query?.year ?? req.query?.ano;
    const defaultYear = new Date().getFullYear();
    const anoCivil =
      raw !== undefined && raw !== null && String(raw).trim() !== ''
        ? Number(raw)
        : defaultYear;
    const data = await meiNotasService.agregarLimiteFaturamento(req.user.id, anoCivil);
    return sendSuccess(res, data, 'Limite de faturamento agregado');
  } catch (error) {
    return next(error);
  }
};

export const relatorioNfe = async (req, res, next) => {
  try {
    const filters = {
      cpfCnpj: String(req.query?.cpfCnpj || '').trim() || undefined,
      dataInicial: String(req.query?.dataInicial || '').trim() || undefined,
      dataFinal: String(req.query?.dataFinal || '').trim() || undefined
    };
    const data = await meiNotasService.listarRelatorioNfe(req.user.id, filters);
    return sendSuccess(res, data, 'Relatório de NF-e listado');
  } catch (error) {
    return next(error);
  }
};

export const cadastrarPlugNotasCertificado = async (req, res, next) => {
  try {
    const file = req.file;
    const senha = String(req.body?.senha || '').trim();
    const email = String(req.body?.email || '').trim();
    const cpfCnpj = String(req.body?.cpfCnpj || req.body?.cnpj || '').trim();
    const data = await cadastrarCertificadoPlugNotas({
      fileBuffer: file?.buffer,
      fileName: file?.originalname,
      mimeType: file?.mimetype,
      password: senha,
      ...(email ? { email } : {}),
      ...(cpfCnpj ? { cpfCnpj } : {})
    });
    return sendSuccess(res, data, 'Certificado cadastrado no serviço de emissão fiscal');
  } catch (error) {
    return next(error);
  }
};

export const cadastrarPlugNotasEmpresa = async (req, res, next) => {
  try {
    const payload = req.body?.payload && typeof req.body.payload === 'object'
      ? req.body.payload
      : req.body;
    const data = await cadastrarEmpresaPlugNotas(payload);
    return sendSuccess(res, data, 'Empresa configurada no serviço de emissão fiscal');
  } catch (error) {
    return next(error);
  }
};

export const consultarPlugNotasEmpresa = async (req, res, next) => {
  try {
    const cpfCnpj = String(req.query?.cpfCnpj || req.query?.cnpj || '').trim();
    const data = await consultarEmpresaPlugNotas(cpfCnpj);
    return sendSuccess(res, data, 'Empresa consultada no serviço de emissão fiscal');
  } catch (error) {
    return next(error);
  }
};

export const atualizarPlugNotasEmpresa = async (req, res, next) => {
  try {
    const payload = req.body?.payload && typeof req.body.payload === 'object'
      ? req.body.payload
      : req.body;
    const data = await atualizarEmpresaPlugNotas(payload);
    return sendSuccess(res, data, 'Empresa atualizada no serviço de emissão fiscal');
  } catch (error) {
    return next(error);
  }
};

export const listarCatalogoClientes = async (req, res, next) => {
  try {
    const q = String(req.query?.q || '').trim();
    const limit = parseCatalogLimit(req.query?.limit);
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
    const limit = parseCatalogLimit(req.query?.limit);
    const documentType = String(req.query?.documentType || '').trim() || undefined;
    const data = await meiNotasService.listarCatalogoProdutos(req.user.id, { q, limit, documentType });
    return sendSuccess(res, data, 'Catálogo de produtos listado');
  } catch (error) {
    return next(error);
  }
};

const sendCreated = (res, data, message) => res.status(201).json({
  success: true,
  data,
  message,
  errors: null
});

export const criarCatalogoCliente = async (req, res, next) => {
  try {
    const data = await meiNotasService.criarCatalogoCliente(req.user.id, req.body);
    return sendCreated(res, data, 'Cliente do catálogo registado');
  } catch (error) {
    return next(error);
  }
};

export const atualizarCatalogoCliente = async (req, res, next) => {
  try {
    const data = await meiNotasService.atualizarCatalogoCliente(req.user.id, req.params.id, req.body);
    return sendSuccess(res, data, 'Cliente do catálogo atualizado');
  } catch (error) {
    return next(error);
  }
};

export const criarCatalogoProduto = async (req, res, next) => {
  try {
    const data = await meiNotasService.criarCatalogoProduto(req.user.id, req.body);
    return sendCreated(res, data, 'Item do catálogo registado');
  } catch (error) {
    return next(error);
  }
};

export const atualizarCatalogoProduto = async (req, res, next) => {
  try {
    const data = await meiNotasService.atualizarCatalogoProduto(req.user.id, req.params.id, req.body);
    return sendSuccess(res, data, 'Item do catálogo atualizado');
  } catch (error) {
    return next(error);
  }
};

export const eliminarCatalogoCliente = async (req, res, next) => {
  try {
    await meiNotasService.eliminarCatalogoCliente(req.user.id, req.params.id);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

export const eliminarCatalogoProduto = async (req, res, next) => {
  try {
    await meiNotasService.eliminarCatalogoProduto(req.user.id, req.params.id);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

export const atualizar = async (req, res, next) => {
  try {
    const data = await meiNotasService.atualizarNota(req.user.id, req.params.id, req.body);
    return sendSuccess(res, data, 'Nota fiscal atualizada');
  } catch (error) {
    return next(error);
  }
};

export const cancelar = async (req, res, next) => {
  try {
    const data = await meiNotasService.cancelarNota(req.user.id, req.params.id, req.body);
    return sendSuccess(res, data, 'Cancelamento da nota fiscal processado');
  } catch (error) {
    return next(error);
  }
};

export const arquivar = async (req, res, next) => {
  try {
    const data = await meiNotasService.arquivarNota(req.user.id, req.params.id, req.body);
    return sendSuccess(res, data, 'Arquivamento da nota fiscal atualizado');
  } catch (error) {
    return next(error);
  }
};

export const detalhar = async (req, res, next) => {
  try {
    const sync = String(req.query?.sync || '').toLowerCase() === 'true';
    const data = await meiNotasService.obterNota(req.user.id, req.params.id, { sync });
    return sendSuccess(res, data, 'Nota fiscal obtida');
  } catch (error) {
    return next(error);
  }
};

export const downloadPdf = async (req, res, next) => {
  try {
    const file = await meiNotasService.baixarPdf(req.user.id, req.params.id);
    const prefix = String(file?.documentType || 'nota').toLowerCase();
    res.setHeader('Content-Type', file.contentType || 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${prefix}-${req.params.id}.pdf"`);
    return res.send(file.buffer);
  } catch (error) {
    return next(error);
  }
};

export const downloadXml = async (req, res, next) => {
  try {
    const file = await meiNotasService.baixarXml(req.user.id, req.params.id);
    const prefix = String(file?.documentType || 'nota').toLowerCase();
    res.setHeader('Content-Type', file.contentType || 'application/xml');
    res.setHeader('Content-Disposition', `attachment; filename="${prefix}-${req.params.id}.xml"`);
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
