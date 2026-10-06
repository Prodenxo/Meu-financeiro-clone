import { badRequest } from '../utils/errors.js';
import { asaasRequest, isAsaasConfigured } from './asaas-api.service.js';
import { resolveOpenFinancePlan } from './open-finance-billing-pricing.js';
import { listUserPluggyItemIds } from './openFinancePluggy.service.js';
import { getStripe } from './stripe-billing.service.js';

const CACHE_TTL_MS = 60 * 1000;
const PAID_STATUSES = new Set(['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH']);
const OPEN_STATUSES = new Set(['PENDING', 'OVERDUE']);

const NO_BILLING = { status: 'none', nextDueDate: null, amountCents: null, paymentId: null };

/**
 * @typedef {{ status: 'active' | 'overdue' | 'none', nextDueDate: string | null, amountCents: number | null, paymentId: string | null }} OfBilling
 * @typedef {{ slots: number, source: string | null, billing: OfBilling, failed: boolean }} PaidState
 */

/** @type {Map<string, { at: number, value: PaidState }>} */
const cache = new Map();

export function invalidateOpenFinanceEntitlement(userId) {
  cache.delete(String(userId));
}

function slotsFromAsaasReference(ref) {
  const [prefix, planId] = String(ref || '').split(':');
  if (prefix !== 'of') return 0;
  return resolveOpenFinancePlan(planId)?.slots || 0;
}

function earliestOpenPayment(payments) {
  return payments
    .filter((p) => OPEN_STATUSES.has(String(p.status)))
    .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)))[0] || null;
}

/** @returns {Promise<{ slots: number, billing: OfBilling }>} */
async function asaasState(userId) {
  if (!isAsaasConfigured()) return { slots: 0, billing: NO_BILLING };
  const customers = await asaasRequest(`/customers?externalReference=${encodeURIComponent(userId)}&limit=10`);
  let best = { slots: 0, billing: NO_BILLING };
  for (const customer of customers?.data || []) {
    const subs = await asaasRequest(
      `/subscriptions?customer=${encodeURIComponent(customer.id)}&status=ACTIVE&limit=20`,
    );
    for (const sub of subs?.data || []) {
      const slots = slotsFromAsaasReference(sub.externalReference);
      if (!slots) continue;
      const payments = await asaasRequest(`/payments?subscription=${encodeURIComponent(sub.id)}&limit=24`);
      const list = payments?.data || [];
      const paid = list.some((p) => PAID_STATUSES.has(String(p.status)));
      if (!paid) continue;
      const overdue = list.some((p) => String(p.status) === 'OVERDUE');
      const open = earliestOpenPayment(list);
      const billing = {
        status: overdue ? 'overdue' : 'active',
        nextDueDate: open?.dueDate || sub.nextDueDate || null,
        amountCents: Math.round(Number(open?.value ?? sub.value) * 100) || null,
        paymentId: open?.id || null,
      };
      if (!overdue && slots > best.slots) best = { slots, billing };
      else if (overdue && best.billing.status === 'none') best = { slots: 0, billing };
    }
  }
  return best;
}

async function stripeSlots(userId) {
  let stripe;
  try {
    stripe = getStripe();
  } catch {
    return 0;
  }
  const result = await stripe.subscriptions.search({
    query: `metadata['user_id']:'${String(userId).replace(/'/g, '')}' AND metadata['product']:'open_finance' AND status:'active'`,
    limit: 20,
  });
  return (result?.data || []).reduce(
    (max, sub) => Math.max(max, Number(sub.metadata?.of_slots) || 0),
    0,
  );
}

/** @returns {Promise<PaidState>} */
async function resolvePaidState(userId) {
  const key = String(userId);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;

  let failed = false;
  const [fromAsaas, fromStripe] = await Promise.all([
    asaasState(userId).catch((err) => {
      failed = true;
      console.warn('[of-entitlement] asaas', err?.message || err);
      return { slots: 0, billing: NO_BILLING };
    }),
    stripeSlots(userId).catch((err) => {
      failed = true;
      console.warn('[of-entitlement] stripe', err?.message || err);
      return 0;
    }),
  ]);

  let value = { slots: 0, source: null, billing: fromAsaas.billing, failed };
  if (fromAsaas.slots >= fromStripe && fromAsaas.slots > 0) {
    value = { slots: fromAsaas.slots, source: 'asaas', billing: fromAsaas.billing, failed };
  } else if (fromStripe > 0) {
    value = { slots: fromStripe, source: 'stripe', billing: NO_BILLING, failed };
  }

  if (!failed) cache.set(key, { at: Date.now(), value });
  return value;
}

/** Slots = bancos (itens Pluggy) que o usuário pode conectar com o plano pago. */
export async function getOpenFinanceEntitlement(userId, accessToken) {
  const [{ slots, source, billing }, itemIds] = await Promise.all([
    resolvePaidState(userId),
    listUserPluggyItemIds(userId, accessToken),
  ]);
  const used = itemIds.length;
  return {
    licensed: slots > 0,
    source,
    slots,
    used,
    available: Math.max(0, slots - used),
    canConnect: slots - used > 0,
    billing,
  };
}

export const OPEN_FINANCE_SYNC_PAUSED_MESSAGE =
  'Sincronização pausada: sua assinatura da sincronização automática não está ativa. Pague o PIX em "Conectar meu banco" para voltar a atualizar suas contas.';

/**
 * Sincronização só roda com assinatura em dia. Se o gateway falhar na consulta,
 * não pausa (evita derrubar todo mundo por instabilidade do Asaas/Stripe).
 */
export async function isOpenFinanceSyncPaused(userId) {
  const state = await resolvePaidState(userId);
  return !state.failed && state.slots <= 0;
}

export async function assertOpenFinanceSyncAllowed(userId) {
  if (await isOpenFinanceSyncPaused(userId)) {
    throw badRequest(OPEN_FINANCE_SYNC_PAUSED_MESSAGE, { code: 'OF_SYNC_PAUSED' });
  }
}

export async function assertCanConnectNewBank(userId, accessToken) {
  const ent = await getOpenFinanceEntitlement(userId, accessToken);
  if (!ent.licensed) {
    throw badRequest(
      ent.billing?.status === 'overdue'
        ? OPEN_FINANCE_SYNC_PAUSED_MESSAGE
        : 'Para conectar um banco, ative a sincronização automática (a partir de R$ 19,90/mês). Depois do pagamento, conecte aqui.',
      { code: 'OF_LICENSE_REQUIRED' },
    );
  }
  if (!ent.canConnect) {
    throw badRequest(
      `Sua assinatura inclui ${ent.slots === 1 ? '1 conta' : `${ent.slots} contas`} e todas já estão conectadas. Adicione mais uma conta por R$ 9,90/mês.`,
      { code: 'OF_SLOTS_EXHAUSTED' },
    );
  }
  return ent;
}
