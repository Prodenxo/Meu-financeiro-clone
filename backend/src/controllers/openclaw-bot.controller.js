import * as openclawBotService from '../services/openclaw-bot.service.js';
import { sendSuccess } from '../utils/response.js';
import { badRequest } from '../utils/errors.js';

export const postOpenclawAction = async (req, res, next) => {
  try {
    const body = req.body || {};
    const phone = body.phone;
    if (!phone && body.action !== 'ping') {
      throw badRequest('phone é obrigatório (exceto na action ping)');
    }
    const result = await openclawBotService.runOpenclawAction({
      phone,
      action: body.action,
      payload: body.payload,
    });
    return sendSuccess(res, result.data, result.message);
  } catch (error) {
    return next(error);
  }
};
