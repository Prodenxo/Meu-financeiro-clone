import * as transactionsService from '../services/transactions.service.js';
import * as categoriesService from '../services/categories.service.js';
import * as usersService from '../services/users.service.js';
import * as meiDasService from '../services/mei-das.service.js';
import { forbidden } from '../utils/errors.js';
import { sendSuccess } from '../utils/response.js';

let meiDasServiceRef = meiDasService;

export const __setMeiDasServiceForTests = (service) => {
  meiDasServiceRef = service || meiDasService;
};

const ensureCanViewUser = async (accessToken, targetUserId) => {
  const allowed = await usersService.canViewUser(accessToken, targetUserId);
  if (!allowed) throw forbidden();
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
