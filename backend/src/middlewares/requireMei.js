import { forbidden } from '../utils/errors.js';
import { getRequesterContext } from '../services/users.service.js';

export const requireMeiEnabled = async (req, _res, next) => {
  try {
    const context = await getRequesterContext(req.accessToken);
    if (context?.mei === false) {
      return next(forbidden('Acesso MEI desabilitado'));
    }
    req.requesterContext = context;
    return next();
  } catch (error) {
    return next(error);
  }
};
