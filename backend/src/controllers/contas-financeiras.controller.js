import * as contasFinanceirasService from '../services/contas-financeiras.service.js';
import { sendSuccess } from '../utils/response.js';

/** Contas do usuário do token (ativas e inativas) — mesmas linhas que o site lê de `contas_financeiras`. */
export const listContasFinanceiras = async (req, res, next) => {
  try {
    const data = await contasFinanceirasService.listContasFinanceiras(req.user.id, { activeOnly: false });
    return sendSuccess(res, data, 'Contas listadas');
  } catch (error) {
    return next(error);
  }
};
