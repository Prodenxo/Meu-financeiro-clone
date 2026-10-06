'use server';

import { headers } from 'next/headers';
import { requireUser } from '@/lib/auth/session';
import { backendFetch } from '@/lib/auth/backendApi';

async function getAccessToken(supabase) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token || null;
}

async function siteOrigin() {
  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host');
  const proto = h.get('x-forwarded-proto') || 'https';
  if (host) return `${proto}://${host}`;
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://meiinfinito.com.br').replace(/\/$/, '');
}

export async function openFinancePlansAction({ fresh = false } = {}) {
  const session = await requireUser();
  const token = await getAccessToken(session.supabase);
  if (!token) return { ok: false, error: 'Sessão expirada.' };
  try {
    const data = await backendFetch(`/billing/open-finance/plans${fresh ? '?fresh=1' : ''}`, { token });
    return {
      ok: true,
      entitlement: data?.entitlement ?? null,
      plans: data?.plans ?? [],
      stripeConfigured: Boolean(data?.stripeConfigured),
      asaasConfigured: Boolean(data?.asaasConfigured),
      paymentConfigured: Boolean(data?.paymentConfigured),
      checkoutEnabled: Boolean(data?.checkoutEnabled),
      checkoutDisabledMessage: data?.checkoutDisabledMessage || '',
    };
  } catch (e) {
    return { ok: false, error: e.message || 'Não foi possível carregar os planos.' };
  }
}

export async function openFinancePayPendingAction() {
  const session = await requireUser();
  const token = await getAccessToken(session.supabase);
  if (!token) return { ok: false, error: 'Sessão expirada.' };
  try {
    const data = await backendFetch('/billing/open-finance/pay-pending', { method: 'POST', token, body: {} });
    return { ok: true, pix: data?.pix || null, dueDate: data?.dueDate || null, amountCents: data?.amountCents ?? null };
  } catch (e) {
    return { ok: false, error: e.message || 'Não foi possível gerar o PIX da mensalidade.' };
  }
}

export async function openFinanceCheckoutAction(planId, provider = 'stripe', cpfCnpj = '') {
  const session = await requireUser();
  const token = await getAccessToken(session.supabase);
  if (!token) return { ok: false, error: 'Sessão expirada.' };
  const origin = await siteOrigin();
  const pay = String(provider || 'stripe').toLowerCase();
  try {
    const body = {
      planId: String(planId),
      provider: pay === 'pix' || pay === 'asaas' ? 'asaas' : 'stripe',
    };
    if (body.provider === 'stripe') {
      body.successUrl = `${origin}/contas?of_paid=1&session_id={CHECKOUT_SESSION_ID}`;
      body.cancelUrl = `${origin}/contas`;
    } else {
      body.cpfCnpj = String(cpfCnpj || '').replace(/\D/g, '');
    }
    const data = await backendFetch('/billing/open-finance/checkout', {
      method: 'POST',
      token,
      body,
    });
    if (data?.provider === 'asaas') {
      return {
        ok: true,
        provider: 'asaas',
        upgraded: Boolean(data.upgraded),
        pix: data.pix || null,
        subscriptionId: data.subscriptionId,
      };
    }
    return { ok: true, provider: 'stripe', checkoutUrl: data?.checkoutUrl };
  } catch (e) {
    return { ok: false, error: e.message || 'Não foi possível abrir o pagamento.' };
  }
}
