import { sendCreated, sendSuccess } from '../utils/response.js';
import * as ofBilling from '../services/open-finance-billing.service.js';

export const getOpenFinancePlans = async (_req, res, next) => {
  try {
    return sendSuccess(
      res,
      {
        plans: ofBilling.listOpenFinancePlans(),
        stripeConfigured: ofBilling.isOpenFinanceBillingConfigured(),
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
