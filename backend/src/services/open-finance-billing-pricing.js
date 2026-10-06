/**
 * Sincronização bancária automática (contas conectadas via Pluggy).
 * Preço: 1ª conta R$ 19,90/mês + R$ 9,90/mês por conta adicional.
 * Cobrança: Stripe (cartão/boleto) ou Asaas (assinatura PIX mensal).
 */
export const OPEN_FINANCE_BASE_CENTS = 1990;
export const OPEN_FINANCE_EXTRA_CENTS = 990;
export const OPEN_FINANCE_MAX_SLOTS = 10;

export const OPEN_FINANCE_PLAN_IDS = Array.from({ length: OPEN_FINANCE_MAX_SLOTS }, (_, i) => `of_${i + 1}`);

export function openFinancePriceCents(slots) {
  const n = Math.floor(Number(slots));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return OPEN_FINANCE_BASE_CENTS + OPEN_FINANCE_EXTRA_CENTS * (n - 1);
}

export function resolveOpenFinancePlan(planId) {
  const id = String(planId || '').trim();
  const match = /^of_(\d+)$/.exec(id);
  const slots = match ? Number(match[1]) : 0;
  if (!slots || slots > OPEN_FINANCE_MAX_SLOTS) return null;
  const label = slots === 1 ? '1 conta conectada' : `${slots} contas conectadas`;
  return {
    id,
    slots,
    amountCents: openFinancePriceCents(slots),
    label,
    name: `Meu Financeiro+ — ${label}`,
  };
}

export function listOpenFinancePlans() {
  return OPEN_FINANCE_PLAN_IDS.map((id) => resolveOpenFinancePlan(id)).filter(Boolean);
}
