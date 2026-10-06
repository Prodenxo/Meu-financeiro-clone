import { sendCreated, sendSuccess } from '../utils/response.js';
import { badRequest } from '../utils/errors.js';
import { isAsaasConfigured } from '../services/asaas-api.service.js';
import { createOpenFinanceAsaasPixCheckout } from '../services/open-finance-asaas.service.js';
import {
  getOpenFinanceEntitlement,
  invalidateOpenFinanceEntitlement,
} from '../services/open-finance-entitlement.service.js';
import * as ofBilling from '../services/open-finance-billing.service.js';

export const getOpenFinancePlans = async (req, res, next) => {
  try {
    const stripeConfigured = ofBilling.isOpenFinanceBillingConfigured();
    const asaasConfigured = isAsaasConfigured();
    if (req.query?.fresh === '1') invalidateOpenFinanceEntitlement(req.user.id);
    const entitlement = await getOpenFinanceEntitlement(req.user.id, req.accessToken);
    return sendSuccess(
      res,
      {
        entitlement,
        plans: ofBilling.listOpenFinancePlans(),
        stripeConfigured,
        asaasConfigured,
        paymentConfigured: stripeConfigured || asaasConfigured,
        checkoutEnabled: ofBilling.isOpenFinanceCheckoutEnabled(),
        checkoutDisabledMessage: ofBilling.isOpenFinanceCheckoutEnabled()
          ? null
          : ofBilling.OPEN_FINANCE_CHECKOUT_DISABLED_MESSAGE,
      },
      'Planos Open Finance',
    );
  } catch (error) {
    return next(error);
  }
};

export const postOpenFinanceCheckout = async (req, res, next) => {
  try {
    const provider = String(req.body?.provider || 'stripe').trim().toLowerCase();
    if (provider === 'asaas' || provider === 'pix') {
      const data = await createOpenFinanceAsaasPixCheckout(req.user.id, {
        planId: req.body?.planId,
        cpfCnpj: req.body?.cpfCnpj,
      });
      return sendCreated(res, data, 'Assinatura PIX Open Finance (Asaas)');
    }
    if (provider !== 'stripe') {
      return next(badRequest('Forma de pagamento inválida. Use stripe ou asaas.'));
    }
    const data = await ofBilling.createOpenFinanceCheckoutSession(req.user.id, {
      planId: req.body?.planId,
      successUrl: req.body?.successUrl,
      cancelUrl: req.body?.cancelUrl,
    });
    return sendCreated(res, data, 'Checkout Open Finance criado');
  } catch (error) {
    return next(error);
  }
};
