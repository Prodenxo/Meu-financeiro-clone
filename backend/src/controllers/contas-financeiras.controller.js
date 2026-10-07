import * as contasFinanceirasService from '../services/contas-financeiras.service.js';
import { sendCreated, sendSuccess } from '../utils/response.js';

export const createContaFinanceira = async (req, res, next) => {
  try {
    const data = await contasFinanceirasService.createContaFinanceiraApp(req.user.id, req.body);
    return sendCreated(res, data, 'Conta cadastrada');
  } catch (error) {
    return next(error);
  }
};

export const updateContaFinanceira = async (req, res, next) => {
  try {
    const data = await contasFinanceirasService.updateContaFinanceiraById(req.user.id, req.params.id, req.body);
    return sendSuccess(res, data, 'Conta atualizada');
  } catch (error) {
    return next(error);
  }
};

export const deleteContaFinanceira = async (req, res, next) => {
  try {
    const data = await contasFinanceirasService.deleteContaFinanceiraById(req.user.id, req.params.id);
    return sendSuccess(res, data, 'Conta excluída');
  } catch (error) {
    return next(error);
  }
};

/** Contas do usuário do token (ativas e inativas) — mesmas linhas que o site lê de `contas_financeiras`. */
export const listContasFinanceiras = async (req, res, next) => {
  try {
    const data = await contasFinanceirasService.listContasFinanceiras(req.user.id, { activeOnly: false });
    return sendSuccess(res, data, 'Contas listadas');
  } catch (error) {
    return next(error);
  }
};
