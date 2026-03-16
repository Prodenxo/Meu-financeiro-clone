import { forbidden } from '../utils/errors.js';
import { getRequesterContext } from '../services/users.service.js';

let getRequesterContextRef = getRequesterContext;

export const __setGetRequesterContextForTests = (resolver) => {
  getRequesterContextRef = resolver || getRequesterContext;
};

export const requireMeiEnabled = async (req, _res, next) => {
  try {
    const context = await getRequesterContextRef(req.accessToken);
    const isAdminRole = context?.role === 'admin' || context?.role === 'superadmin';
    if (!isAdminRole && context?.mei === false) {
      return next(forbidden('Acesso MEI desabilitado'));
    }
    req.requesterContext = context;
    return next();
  } catch (error) {
    return next(error);
  }
};
