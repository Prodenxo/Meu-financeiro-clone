/** Sincronização bancária automática: 1ª conta R$ 19,90/mês + R$ 9,90/mês por conta adicional. */
export const SYNC_BASE_CENTS = 1990;
export const SYNC_EXTRA_CENTS = 990;
export const SYNC_MAX_ACCOUNTS = 10;

/** A partir deste volume de lançamentos manuais nos últimos 30 dias, o convite fala em economizar tempo. */
export const MANY_MANUAL_THRESHOLD = 20;

export function syncPriceCents(accounts) {
  const n = Math.floor(Number(accounts));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return SYNC_BASE_CENTS + SYNC_EXTRA_CENTS * (n - 1);
}

export function syncPlanId(accounts) {
  return `of_${Math.min(SYNC_MAX_ACCOUNTS, Math.max(1, Math.floor(Number(accounts) || 1)))}`;
}

export function formatCentsBrl(cents) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(cents || 0) / 100);
}

export function accountsLabel(n) {
  return n === 1 ? '1 conta conectada' : `${n} contas conectadas`;
}

export function isSyncedConta(conta) {
  return conta?.of_provider === 'pluggy' && Boolean(conta?.of_external_id);
}

/**
 * Qual convite de sincronização mostrar (ou nenhum).
 * @returns {'none' | 'many-manual' | 'default'}
 */
export function syncPromoVariant({ contas = [], transactions = [], today = new Date() }) {
  if (contas.some(isSyncedConta)) return 'none';
  const since = new Date(today);
  since.setDate(since.getDate() - 30);
  const sinceKey = since.toISOString().slice(0, 10);
  const manual = transactions.filter((t) => !t?.of_external_id && String(t?.data || '').slice(0, 10) >= sinceKey).length;
  return manual >= MANY_MANUAL_THRESHOLD ? 'many-manual' : 'default';
}
