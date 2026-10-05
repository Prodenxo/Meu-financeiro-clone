/**
 * Planos Open Finance (contas conectadas via Pluggy).
 * Cobrança hoje: Stripe Checkout (assinatura — cartão/boleto no BR).
 * Para PIX recorrente ou Pix + assinatura nativa, integrar Asaas ou Mercado Pago (próxima etapa).
 */
export const OPEN_FINANCE_PLAN_IDS = ['of_1', 'of_3', 'of_10'];

const PLANS = {
  of_1: { slots: 1, amountCents: 990, label: '1 conta conectada' },
  of_3: { slots: 3, amountCents: 1990, label: 'Até 3 contas' },
  of_10: { slots: 10, amountCents: 3990, label: 'Até 10 contas' },
};

export function resolveOpenFinancePlan(planId) {
  const id = String(planId || '').trim();
  const plan = PLANS[id];
  if (!plan) return null;
  return { id, ...plan, name: `Open Finance — ${plan.label}` };
}

export function listOpenFinancePlans() {
  return OPEN_FINANCE_PLAN_IDS.map((id) => resolveOpenFinancePlan(id)).filter(Boolean);
}
