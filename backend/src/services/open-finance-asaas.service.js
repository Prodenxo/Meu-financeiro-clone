import { createSupabaseClient } from '../config/supabase.js';
import { isValidCpfOrCnpj, normalizeDocDigits } from '../utils/cpf-cnpj.js';
import { badRequest } from '../utils/errors.js';
import { asaasRequest } from './asaas-api.service.js';
import { assertOpenFinanceCheckoutEnabled } from './open-finance-billing.service.js';
import { resolveOpenFinancePlan } from './open-finance-billing-pricing.js';
import { invalidateOpenFinanceEntitlement } from './open-finance-entitlement.service.js';

const PAID_STATUSES = new Set(['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH']);
const OPEN_STATUSES = new Set(['PENDING', 'OVERDUE']);

function brDatePlusDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function brlFromCents(cents) {
  return Math.round(Number(cents)) / 100;
}

async function loadAuthUser(userId) {
  const admin = createSupabaseClient({ useServiceRole: true });
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data?.user) throw badRequest('Usuário não encontrado para cobrança.');
  const u = data.user;
  const meta = u.user_metadata || {};
  const name =
    meta.display_name
    || meta.full_name
    || meta.name
    || (u.email ? u.email.split('@')[0] : 'Cliente Meu Financeiro');
  const email = String(u.email || '').trim().toLowerCase();
  if (!email) throw badRequest('Usuário sem e-mail — necessário para cobrança Asaas.');
  return { name: String(name).slice(0, 120), email };
}

async function findCustomerByExternalReference(userId) {
  const json = await asaasRequest(`/customers?externalReference=${encodeURIComponent(userId)}&limit=1`);
  const list = json?.data || json?.customers || [];
  return list[0] || null;
}

async function ensureAsaasCustomer(userId, cpfCnpj) {
  const existing = await findCustomerByExternalReference(userId);
  if (!cpfCnpj && !isValidCpfOrCnpj(normalizeDocDigits(existing?.cpfCnpj))) {
    throw badRequest('Informe um CPF ou CNPJ válido para gerar a cobrança PIX.', { code: 'CPF_CNPJ_INVALID' });
  }
  if (existing?.id) {
    if (cpfCnpj && normalizeDocDigits(existing.cpfCnpj) !== cpfCnpj) {
      await asaasRequest(`/customers/${encodeURIComponent(existing.id)}`, {
        method: 'PUT',
        body: { cpfCnpj },
      });
    }
    return existing.id;
  }

  const { name, email } = await loadAuthUser(userId);
  const created = await asaasRequest('/customers', {
    method: 'POST',
    body: {
      name,
      email,
      cpfCnpj,
      externalReference: String(userId),
      notificationDisabled: false,
    },
  });
  const id = created?.id;
  if (!id) throw badRequest('Asaas não devolveu ID do cliente.');
  return id;
}

async function fetchFirstSubscriptionPayment(subscriptionId) {
  const json = await asaasRequest(
    `/payments?subscription=${encodeURIComponent(subscriptionId)}&limit=1&order=asc`,
  );
  const list = json?.data || [];
  return list[0] || null;
}

async function findUserSubscription(customerId, userId) {
  const json = await asaasRequest(
    `/subscriptions?customer=${encodeURIComponent(customerId)}&status=ACTIVE&limit=20`,
  );
  const suffix = `:${userId}`;
  const list = (json?.data || []).filter(
    (s) => !s.deleted && String(s.externalReference || '').startsWith('of:') && String(s.externalReference).endsWith(suffix),
  );
  return list[0] || null;
}

async function listSubscriptionPayments(subscriptionId) {
  const json = await asaasRequest(
    `/payments?subscription=${encodeURIComponent(subscriptionId)}&limit=24&order=asc`,
  );
  return json?.data || [];
}

async function fetchPixQrCode(paymentId) {
  try {
    return await asaasRequest(`/payments/${encodeURIComponent(paymentId)}/pixQrCode`);
  } catch (err) {
    if (/chave pix/i.test(String(err?.message || ''))) {
      throw badRequest(
        'Pagamento via PIX ainda não está disponível (conta de recebimento sem chave PIX). Tente cartão/boleto ou volte mais tarde.',
        { code: 'ASAAS_PIX_KEY_MISSING' },
      );
    }
    throw err;
  }
}

/**
 * Assinatura mensal PIX (Asaas). Se o usuário já tem assinatura, ajusta o valor/qtde de contas
 * nela mesma (cobrança nova a partir da próxima fatura) em vez de abrir outra.
 */
export async function createOpenFinanceAsaasPixCheckout(userId, { planId, cpfCnpj }) {
  assertOpenFinanceCheckoutEnabled();
  const plan = resolveOpenFinancePlan(planId);
  if (!plan) throw badRequest('Plano Open Finance inválido.');
  const document = normalizeDocDigits(cpfCnpj);
  if (document && !isValidCpfOrCnpj(document)) {
    throw badRequest('Informe um CPF ou CNPJ válido para gerar a cobrança PIX.', { code: 'CPF_CNPJ_INVALID' });
  }

  const customerId = await ensureAsaasCustomer(userId, document);
  const externalReference = `of:${plan.id}:${userId}`;
  const value = brlFromCents(plan.amountCents);

  let subscriptionId = null;
  let payment = null;

  const existing = await findUserSubscription(customerId, userId);
  if (existing?.id) {
    subscriptionId = existing.id;
    let payments = await listSubscriptionPayments(subscriptionId);
    const paid = payments.some((p) => PAID_STATUSES.has(String(p.status)));
    const currentSlots = resolveOpenFinancePlan(String(existing.externalReference).split(':')[1])?.slots || 0;
    if (paid && currentSlots >= plan.slots) {
      throw badRequest(
        `Sua assinatura já inclui ${currentSlots === 1 ? '1 conta' : `${currentSlots} contas`}.`,
        { code: 'OF_PLAN_ALREADY_COVERED' },
      );
    }
    if (existing.externalReference !== externalReference || Number(existing.value) !== value) {
      await asaasRequest(`/subscriptions/${encodeURIComponent(subscriptionId)}`, {
        method: 'PUT',
        body: { value, externalReference, description: plan.name, updatePendingPayments: true },
      });
      payments = await listSubscriptionPayments(subscriptionId);
    }
    invalidateOpenFinanceEntitlement(userId);
    const open = payments.find((p) => OPEN_STATUSES.has(String(p.status)));
    if (paid && !payments.some((p) => String(p.status) === 'OVERDUE')) {
      return { provider: 'asaas', upgraded: true, plan, subscriptionId };
    }
    payment = open || null;
  }

  if (!subscriptionId) {
    const subscription = await asaasRequest('/subscriptions', {
      method: 'POST',
      body: {
        customer: customerId,
        billingType: 'PIX',
        value: brlFromCents(plan.amountCents),
        nextDueDate: brDatePlusDays(1),
        cycle: 'MONTHLY',
        description: plan.name,
        externalReference,
      },
    });
    subscriptionId = subscription?.id;
    if (!subscriptionId) throw badRequest('Asaas não devolveu ID da assinatura.');
    payment = await fetchFirstSubscriptionPayment(subscriptionId);
  }

  if (!payment?.id) {
    throw badRequest(
      'Assinatura criada, mas a primeira cobrança PIX ainda não apareceu. Tente de novo em alguns segundos.',
    );
  }

  const pix = await fetchPixQrCode(payment.id);

  return {
    provider: 'asaas',
    plan,
    subscriptionId,
    paymentId: payment.id,
    pix: {
      payload: pix?.payload || '',
      encodedImage: pix?.encodedImage || '',
      expirationDate: pix?.expirationDate || null,
    },
  };
}
