import { sendCreated, sendSuccess } from '../utils/response.js';
import { badRequest } from '../utils/errors.js';
import { isAsaasConfigured } from '../services/asaas-api.service.js';
import {
  createOpenFinanceAsaasPixCheckout,
  getOpenFinanceAsaasPendingPix,
} from '../services/open-finance-asaas.service.js';
import {
  getOpenFinanceEntitlement,
  invalidateOpenFinanceEntitlement,
} from '../services/open-finance-entitlement.service.js';
import * as ofBilling from '../services/open-finance-billing.service.js';
import {
  OPEN_FINANCE_BASE_CENTS,
  OPEN_FINANCE_EXTRA_CENTS,
} from '../services/open-finance-billing-pricing.js';

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
        pricing: { baseCents: OPEN_FINANCE_BASE_CENTS, extraCents: OPEN_FINANCE_EXTRA_CENTS },
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

export const postOpenFinancePayPending = async (req, res, next) => {
  try {
    const data = await getOpenFinanceAsaasPendingPix(req.user.id);
    return sendSuccess(res, data, 'PIX da mensalidade em aberto');
  } catch (error) {
    return next(error);
  }
};

export const postOpenFinanceCheckout = async (req, res, next) => {
  try {
    const provider = String(req.body?.provider || 'stripe').trim().toLowerCase();
    const isAsaas = provider === 'asaas' || provider === 'pix';
    const entitlement = await getOpenFinanceEntitlement(req.user.id, req.accessToken);
    if (entitlement.licensed && (!isAsaas || entitlement.source !== 'asaas')) {
      return next(
        badRequest(
          'Para adicionar contas à sua assinatura atual, fale com o suporte.',
          { code: 'OF_UPGRADE_UNSUPPORTED' },
        ),
      );
    }
    if (isAsaas) {
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
