import { sendSuccess } from '../utils/response.js';
import {
  getRatesToBrlDetailed,
  listFrankfurterCurrencies,
} from '../services/frankfurter.service.js';

export const listCurrencies = async (_req, res, next) => {
  try {
    const currencies = await listFrankfurterCurrencies();
    return sendSuccess(res, { currencies });
  } catch (error) {
    return next(error);
  }
};

export const getCotacoes = async (req, res, next) => {
  try {
    const raw = String(req.query?.codes || req.query?.moedas || '').trim();
    const codes = raw
      ? raw.split(/[,\s]+/).map((c) => c.trim()).filter(Boolean)
      : ['USD', 'EUR'];
    const { rates, sources, missing } = await getRatesToBrlDetailed(codes);
    return sendSuccess(res, { base: 'BRL', rates, sources, missing, updatedAt: new Date().toISOString() });
  } catch (error) {
    return next(error);
  }
};
