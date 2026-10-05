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

export async function openFinancePlansAction() {
  const session = await requireUser();
  const token = await getAccessToken(session.supabase);
  if (!token) return { ok: false, error: 'Sessão expirada.' };
  try {
    const data = await backendFetch('/billing/open-finance/plans', { token });
    return { ok: true, plans: data?.plans ?? [], stripeConfigured: Boolean(data?.stripeConfigured) };
  } catch (e) {
    return { ok: false, error: e.message || 'Não foi possível carregar os planos.' };
  }
}

export async function openFinanceCheckoutAction(planId) {
  const session = await requireUser();
  const token = await getAccessToken(session.supabase);
  if (!token) return { ok: false, error: 'Sessão expirada.' };
  const origin = await siteOrigin();
  try {
    const data = await backendFetch('/billing/open-finance/checkout', {
      method: 'POST',
      token,
      body: {
        planId: String(planId),
        successUrl: `${origin}/contas?of_paid=1&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${origin}/contas`,
      },
    });
    return { ok: true, checkoutUrl: data?.checkoutUrl };
  } catch (e) {
    return { ok: false, error: e.message || 'Não foi possível abrir o pagamento.' };
  }
}
