import { badRequest } from '../utils/errors.js';
import { getStripe } from './stripe-billing.service.js';
import { listOpenFinancePlans, resolveOpenFinancePlan } from './open-finance-billing-pricing.js';

export { listOpenFinancePlans };

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
