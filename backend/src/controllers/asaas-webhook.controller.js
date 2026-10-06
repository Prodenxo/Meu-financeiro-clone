import { env } from '../config/env.js';
import { sendSuccess } from '../utils/response.js';
import { unauthorized } from '../utils/errors.js';
import { asaasRequest } from '../services/asaas-api.service.js';
import { invalidateOpenFinanceEntitlement } from '../services/open-finance-entitlement.service.js';

async function resolveUserIdFromPayment(payment) {
  const [prefix, , userId] = String(payment?.externalReference || '').split(':');
  if (prefix === 'of' && userId) return userId;
  if (!payment?.customer) return null;
  try {
    const customer = await asaasRequest(`/customers/${encodeURIComponent(payment.customer)}`);
    return customer?.externalReference || null;
  } catch {
    return null;
  }
}

/** Webhook Asaas — a licença OF é lida do Asaas; aqui só invalidamos o cache do usuário. */
export const postAsaasWebhook = async (req, res, next) => {
  try {
    const expected = String(env.ASAAS_WEBHOOK_ACCESS_TOKEN || '').trim();
    if (expected) {
      const token = String(req.headers['asaas-access-token'] || req.headers['asaasaccesstoken'] || '').trim();
      if (token !== expected) return next(unauthorized('Webhook Asaas não autorizado.'));
    }

    const event = req.body?.event || req.body?.type || '';
    const payment = req.body?.payment || {};
    console.info('[asaas-webhook]', event, {
      payment: payment.id,
      subscription: payment.subscription || req.body?.subscription?.id,
    });

    if (String(event).startsWith('PAYMENT_')) {
      const userId = await resolveUserIdFromPayment(payment);
      if (userId) invalidateOpenFinanceEntitlement(userId);
    }

    return sendSuccess(res, { received: true }, 'Webhook Asaas');
  } catch (error) {
    return next(error);
  }
};
