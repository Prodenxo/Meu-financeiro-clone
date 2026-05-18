import * as openclawBotService from '../services/openclaw-bot.service.js';
import { sendSuccess } from '../utils/response.js';
import { badRequest } from '../utils/errors.js';

export const postOpenclawAction = async (req, res, next) => {
  try {
    const body = req.body || {};
    const phone = body.phone;
    const actionName = String(body.action || '').trim();
    const phoneOptional =
      actionName === 'ping' || actionName === 'list_roles';
    if (!phone && !phoneOptional) {
      throw badRequest(
        'phone é obrigatório (exceto em ping e list_roles)',
      );
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
