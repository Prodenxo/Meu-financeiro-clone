import * as transactionsService from '../services/transactions.service.js';
import * as categoriesService from '../services/categories.service.js';
import * as usersService from '../services/users.service.js';
import * as meiDasService from '../services/mei-das.service.js';
import * as meiGuideService from '../services/mei-guide.service.js';
import * as meiGuideDasBase64Service from '../services/mei-guide-das-base64.service.js';
import * as n8nWhatsappService from '../services/n8n-whatsapp.service.js';
import { badRequest, forbidden } from '../utils/errors.js';
import { sendSuccess } from '../utils/response.js';

let meiDasServiceRef = meiDasService;
let meiGuideServiceRef = meiGuideService;
let meiGuideDasBase64ServiceRef = meiGuideDasBase64Service;
let n8nWhatsappServiceRef = n8nWhatsappService;
let usersServiceRef = usersService;

export const __setMeiDasServiceForTests = (service) => {
  meiDasServiceRef = service || meiDasService;
};

export const __setMeiGuideServiceForTests = (service) => {
  meiGuideServiceRef = service || meiGuideService;
};

export const __setMeiGuideDasBase64ServiceForTests = (service) => {
  meiGuideDasBase64ServiceRef = service || meiGuideDasBase64Service;
};

export const __setN8nWhatsappServiceForTests = (service) => {
  n8nWhatsappServiceRef = service || n8nWhatsappService;
};

export const __setUsersServiceForTests = (service) => {
  usersServiceRef = service || usersService;
};

const ensureCanViewUser = async (accessToken, targetUserId) => {
  const allowed = await usersServiceRef.canViewUser(accessToken, targetUserId);
  if (!allowed) throw forbidden();
};

const ensureMeiEnabledForUser = async (accessToken, targetUserId) => {
  if (typeof usersServiceRef.listUsers !== 'function') {
    return { mei: true };
  }
  const user = await resolveAdminUserContext(accessToken, targetUserId);
  if (user?.mei === false) {
    throw forbidden('Acesso MEI desabilitado para este usuário');
  }
  return user;
};

const resolveAdminUserContext = async (accessToken, targetUserId) => {
  const { users } = await usersServiceRef.listUsers(accessToken);
  const user = (users || []).find((item) => item.id === targetUserId);
  if (!user) {
    throw badRequest('Usuário não encontrado no escopo');
  }
  return user;
};

const toCompetencia = (periodoApuracao) => {
  const digits = String(periodoApuracao || '').replace(/\D/g, '');
  if (digits.length !== 6) return null;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}`;
};

export const listUserTransactions = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    await ensureCanViewUser(req.accessToken, userId);
    const data = await transactionsService.listTransactions(userId);
    return sendSuccess(res, data, 'Transações do usuário listadas');
  } catch (error) {
    return next(error);
  }
};

export const listUserCategories = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    await ensureCanViewUser(req.accessToken, userId);
    const data = await categoriesService.listCategories(userId, req.query?.type);
    return sendSuccess(res, data, 'Categorias do usuário listadas');
  } catch (error) {
    return next(error);
  }
};

export const listUserBudgetsSummary = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    await ensureCanViewUser(req.accessToken, userId);
    const year = req.query?.year ? Number(req.query.year) : undefined;
    const month = req.query?.month ? Number(req.query.month) : undefined;
    const data = await categoriesService.listCategoryBudgetsSummary(userId, { year, month });
    return sendSuccess(res, data, 'Resumo de orçamento do usuário');
  } catch (error) {
    return next(error);
  }
};

export const listUserBudgetsYearly = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    await ensureCanViewUser(req.accessToken, userId);
    const year = Number(req.query?.year);
    const data = await categoriesService.listCategoryBudgetsYearly(userId, year);
    return sendSuccess(res, data, 'Orçamentos anuais do usuário');
  } catch (error) {
    return next(error);
  }
};

export const getUserBalance = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    await ensureCanViewUser(req.accessToken, userId);

    const transactions = await transactionsService.listTransactions(userId);
    let totalEntradas = 0;
    let totalSaidas = 0;

    (transactions || []).forEach((transaction) => {
      const valor = Number(transaction?.valor ?? 0);
      if (Number.isNaN(valor)) return;
      const tipo = String(transaction?.tipo || '').toLowerCase();
      if (tipo === 'entrada') {
        totalEntradas += valor;
      } else {
        totalSaidas += valor;
      }
    });

    const balance = totalEntradas - totalSaidas;
    return sendSuccess(res, { balance, totalEntradas, totalSaidas }, 'Saldo do usuário');
  } catch (error) {
    return next(error);
  }
};

export const listPendingDas = async (req, res, next) => {
  try {
    const competencia = req.query?.competencia;
    const data = await meiDasServiceRef.listAdminCompanyPendingDas(req.accessToken, competencia);
    return sendSuccess(res, data, 'Pendências DAS listadas');
  } catch (error) {
    return next(error);
  }
};

export const listDasStatus = async (req, res, next) => {
  try {
    const data = await meiDasServiceRef.listAdminCompanyDasStatus(req.accessToken, {
      competencia: req.query?.competencia,
      status: req.query?.status,
      q: req.query?.q
    });
    return sendSuccess(res, data, 'Status DAS listados');
  } catch (error) {
    return next(error);
  }
};

export const reprocessDas = async (req, res, next) => {
  try {
    const data = await meiDasServiceRef.reprocessDasForAdmin(req.accessToken, {
      userId: req.body?.userId,
      competencia: req.body?.competencia
    });
    return sendSuccess(res, data, 'Reprocessamento DAS concluído');
  } catch (error) {
    return next(error);
  }
};

export const getAdminMeiCertificateStatus = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    await ensureCanViewUser(req.accessToken, userId);
    await ensureMeiEnabledForUser(req.accessToken, userId);
    const data = await meiGuideServiceRef.getCertificateStatus(userId);
    return sendSuccess(res, data, 'Status do certificado obtido');
  } catch (error) {
    return next(error);
  }
};

export const listAdminMeiPeriods = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    await ensureCanViewUser(req.accessToken, userId);
    await ensureMeiEnabledForUser(req.accessToken, userId);
    const data = await meiGuideServiceRef.listPeriods(userId, {
      cnpj: req.query?.cnpj
    });
    return sendSuccess(res, data, 'Períodos MEI listados');
  } catch (error) {
    return next(error);
  }
};

export const listAdminMeiPeriodsByCnpj = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    await ensureCanViewUser(req.accessToken, userId);
    await ensureMeiEnabledForUser(req.accessToken, userId);
    const data = await meiGuideServiceRef.listPeriodsByCnpj(userId, {
      cnpj: req.query?.cnpj
    });
    return sendSuccess(res, data, 'Períodos MEI listados');
  } catch (error) {
    return next(error);
  }
};

export const downloadAdminMeiGuide = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const periodoApuracao = req.params.periodoApuracao;
    await ensureCanViewUser(req.accessToken, userId);
    await ensureMeiEnabledForUser(req.accessToken, userId);
    const file = await meiGuideServiceRef.downloadGuide({
      userId,
      cnpj: req.query?.cnpj,
      periodoApuracao
    });
    await meiGuideDasBase64ServiceRef.upsertDasBase64({
      userId,
      periodoApuracao,
      pdfBase64: file.buffer.toString('base64')
    });
    res.setHeader('Content-Type', file.contentType || 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename || 'guia-mei.pdf'}"`);
    return res.send(file.buffer);
  } catch (error) {
    return next(error);
  }
};

export const sendAdminMeiWhatsapp = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const periodoApuracao = req.body?.periodoApuracao;
    if (!periodoApuracao) {
      throw badRequest('Período de apuração é obrigatório');
    }
    await ensureCanViewUser(req.accessToken, userId);
    const user = await ensureMeiEnabledForUser(req.accessToken, userId);
    if (!user?.phone) {
      throw badRequest('Telefone do usuário não encontrado para envio');
    }

    const certStatus = await meiGuideServiceRef.getCertificateStatus(userId);
    const cnpj = req.body?.cnpj || certStatus?.documento || null;
    const competencia = req.body?.competencia || toCompetencia(periodoApuracao) || periodoApuracao;

    let pdfBase64 = await meiGuideDasBase64ServiceRef.getDasBase64({
      userId,
      periodoApuracao
    });
    if (!pdfBase64) {
      const file = await meiGuideServiceRef.downloadGuide({
        userId,
        cnpj,
        periodoApuracao
      });
      pdfBase64 = file.buffer.toString('base64');
      await meiGuideDasBase64ServiceRef.upsertDasBase64({
        userId,
        periodoApuracao,
        pdfBase64
      });
    }
    const displayName = user.displayName || user.email || 'Cliente';
    const message = `Olá ${displayName}, segue a guia DAS MEI da competência ${competencia}.`;
    const payload = {
      userId,
      displayName,
      email: user.email || null,
      phone: user.phone || null,
      empresaId: user.empresaId || null,
      empresaName: user.empresaName || null,
      competencia,
      periodoApuracao,
      cnpj,
      pdfBase64,
      fileName: `das-mei-${periodoApuracao}.pdf`,
      source: 'admin_mei_mirror',
      message
    };
    const webhook = await n8nWhatsappServiceRef.sendWhatsappMessage(payload);
    return sendSuccess(res, { sent: true, webhook }, 'Envio para WhatsApp solicitado');
  } catch (error) {
    return next(error);
  }
};
