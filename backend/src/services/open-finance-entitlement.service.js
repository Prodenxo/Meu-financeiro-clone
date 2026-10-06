import { badRequest } from '../utils/errors.js';
import { asaasRequest, isAsaasConfigured } from './asaas-api.service.js';
import { resolveOpenFinancePlan } from './open-finance-billing-pricing.js';
import { listUserPluggyItemIds } from './openFinancePluggy.service.js';
import { getStripe } from './stripe-billing.service.js';

const CACHE_TTL_MS = 60 * 1000;
const PAID_STATUSES = new Set(['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH']);
/** @type {Map<string, { at: number, value: { slots: number, source: string | null } }>} */
const cache = new Map();

export function invalidateOpenFinanceEntitlement(userId) {
  cache.delete(String(userId));
}

function slotsFromAsaasReference(ref) {
  const [prefix, planId] = String(ref || '').split(':');
  if (prefix !== 'of') return 0;
  return resolveOpenFinancePlan(planId)?.slots || 0;
}

async function asaasSlots(userId) {
  if (!isAsaasConfigured()) return 0;
  const customers = await asaasRequest(`/customers?externalReference=${encodeURIComponent(userId)}&limit=10`);
  let best = 0;
  for (const customer of customers?.data || []) {
    const subs = await asaasRequest(
      `/subscriptions?customer=${encodeURIComponent(customer.id)}&status=ACTIVE&limit=20`,
    );
    for (const sub of subs?.data || []) {
      const slots = slotsFromAsaasReference(sub.externalReference);
      if (!slots || slots <= best) continue;
      const payments = await asaasRequest(`/payments?subscription=${encodeURIComponent(sub.id)}&limit=24`);
      const list = payments?.data || [];
      const paid = list.some((p) => PAID_STATUSES.has(String(p.status)));
      const overdue = list.some((p) => String(p.status) === 'OVERDUE');
      if (paid && !overdue) best = slots;
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

async function resolvePaidSlots(userId) {
  const key = String(userId);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;

  let value = { slots: 0, source: null };
  const [fromAsaas, fromStripe] = await Promise.all([
    asaasSlots(userId).catch((err) => {
      console.warn('[of-entitlement] asaas', err?.message || err);
      return 0;
    }),
    stripeSlots(userId).catch((err) => {
      console.warn('[of-entitlement] stripe', err?.message || err);
      return 0;
    }),
  ]);
  if (fromAsaas >= fromStripe && fromAsaas > 0) value = { slots: fromAsaas, source: 'asaas' };
  else if (fromStripe > 0) value = { slots: fromStripe, source: 'stripe' };

  cache.set(key, { at: Date.now(), value });
  return value;
}

/** Slots = bancos (itens Pluggy) que o usuário pode conectar com o plano pago. */
export async function getOpenFinanceEntitlement(userId, accessToken) {
  const [{ slots, source }, itemIds] = await Promise.all([
    resolvePaidSlots(userId),
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
  };
}

export async function assertCanConnectNewBank(userId, accessToken) {
  const ent = await getOpenFinanceEntitlement(userId, accessToken);
  if (!ent.licensed) {
    throw badRequest(
      'Para conectar um banco, ative a sincronização automática (a partir de R$ 19,90/mês). Depois do pagamento, conecte aqui.',
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
