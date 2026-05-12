import * as hermesBotService from '../services/hermes-bot.service.js';
import { sendSuccess } from '../utils/response.js';
import { badRequest } from '../utils/errors.js';

export const postHermesAction = async (req, res, next) => {
  try {
    const body = req.body || {};
    const phone = body.phone;
    if (!phone && body.action !== 'ping') {
      throw badRequest('phone é obrigatório (exceto na action ping)');
    }
    const result = await hermesBotService.runHermesAction({
      phone,
      action: body.action,
      payload: body.payload,
    });
    return sendSuccess(res, result.data, result.message);
  } catch (error) {
    return next(error);
  }
};
