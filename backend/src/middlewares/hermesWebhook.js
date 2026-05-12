import { env } from '../config/env.js';
import { unauthorized, serviceUnavailable } from '../utils/errors.js';

/**
 * Autenticação servidor-a-servidor (n8n → backend). Usa o mesmo estilo Bearer.
 */
export const requireHermesSecret = (req, _res, next) => {
  const secret = (env.HERMES_WEBHOOK_SECRET || '').trim();
  if (!secret) {
    return next(serviceUnavailable('Hermes desativado: defina HERMES_WEBHOOK_SECRET no ambiente.'));
  }

  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return next(unauthorized('Bearer obrigatório'));
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (token !== secret) {
    return next(unauthorized('Segredo inválido'));
  }

  return next();
};
