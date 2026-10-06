import { env } from '../config/env.js';
import { badRequest } from '../utils/errors.js';
import { isAsaasConfigured } from './asaas-api.service.js';
import { getStripe } from './stripe-billing.service.js';
import { listOpenFinancePlans, resolveOpenFinancePlan } from './open-finance-billing-pricing.js';

export { listOpenFinancePlans };

export const OPEN_FINANCE_CHECKOUT_DISABLED_MESSAGE =
  'A compra de contas Open Finance ainda não está disponível. Estamos finalizando o checkout — fale com o suporte se precisar conectar bancos agora.';

export function isOpenFinanceCheckoutEnabled() {
  const raw = String(process.env.OPEN_FINANCE_CHECKOUT_ENABLED ?? '').trim().toLowerCase();
  if (raw === 'false' || raw === '0' || raw === 'no') return false;
  if (env.OPEN_FINANCE_CHECKOUT_ENABLED === true) return true;
  return isAsaasConfigured() || isOpenFinanceBillingConfigured();
}

export function assertOpenFinanceCheckoutEnabled() {
  if (!isOpenFinanceCheckoutEnabled()) {
    throw badRequest(OPEN_FINANCE_CHECKOUT_DISABLED_MESSAGE, { code: 'OF_CHECKOUT_DISABLED' });
  }
}

export function isOpenFinanceBillingConfigured() {
  try {
    getStripe();
    return true;
  } catch {
    return false;
  }
}

/** Checkout Stripe (assinatura mensal) para pacote Open Finance do usuário. */
export async function createOpenFinanceCheckoutSession(userId, { planId, successUrl, cancelUrl }) {
  assertOpenFinanceCheckoutEnabled();
  const plan = resolveOpenFinancePlan(planId);
  if (!plan) throw badRequest('Plano Open Finance inválido.');

  const okSuccess = String(successUrl || '').includes('{CHECKOUT_SESSION_ID}');
  if (!okSuccess) {
    throw badRequest('successUrl deve conter {CHECKOUT_SESSION_ID}');
  }
  if (!cancelUrl) throw badRequest('cancelUrl é obrigatório.');

  const stripe = getStripe();
  /** Assinatura Stripe no BR: cartão e boleto. PIX recorrente não entra aqui — use gateway BR (Asaas/MP) se PIX for obrigatório. */
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card', 'boleto'],
    client_reference_id: String(userId),
    line_items: [
      {
        price_data: {
          currency: 'brl',
          unit_amount: plan.amountCents,
          recurring: { interval: 'month' },
          product_data: {
            name: plan.name,
            metadata: { product: 'open_finance', plan_id: plan.id, of_slots: String(plan.slots) },
          },
        },
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      product: 'open_finance',
      user_id: String(userId),
      plan_id: plan.id,
      of_slots: String(plan.slots),
    },
    subscription_data: {
      metadata: {
        product: 'open_finance',
        user_id: String(userId),
        plan_id: plan.id,
        of_slots: String(plan.slots),
      },
    },
  });

  if (!session.url) throw badRequest('Stripe não devolveu URL de checkout.');
  return { checkoutUrl: session.url, sessionId: session.id, plan };
}
