import * as usersService from '../services/users.service.js';
import { sendSuccess } from '../utils/response.js';

export const syncPhone = async (req, res, next) => {
  try {
    const result = await usersService.syncPhone(req.user.id, req.body.phone);
    return sendSuccess(res, result, 'Telefone sincronizado');
  } catch (error) {
    return next(error);
  }
};
