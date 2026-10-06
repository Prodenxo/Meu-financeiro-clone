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

/** Quantos dias antes do vencimento o aviso de renovação aparece. */
export const RENEWAL_NOTICE_DAYS = 5;

function dayKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function daysBetweenKeys(fromKey, toKey) {
  const [fy, fm, fd] = fromKey.split('-').map(Number);
  const [ty, tm, td] = toKey.split('-').map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86400000);
}

/** `2026-11-07` → `07/11`. */
export function formatDueDate(key) {
  const [, m, d] = String(key || '').split('-');
  return m && d ? `${d}/${m}` : '';
}

/**
 * Situação da mensalidade para avisos.
 * @returns {{ kind: 'paused', dueDate: string | null, amountCents: number | null } |
 *   { kind: 'due-soon', daysLeft: number, dueDate: string, amountCents: number | null } | null}
 */
export function renewalNotice(billing, today = new Date()) {
  if (!billing) return null;
  if (billing.status === 'overdue') {
    return { kind: 'paused', dueDate: billing.nextDueDate || null, amountCents: billing.amountCents ?? null };
  }
  if (billing.status !== 'active' || !billing.paymentId || !billing.nextDueDate) return null;
  const daysLeft = daysBetweenKeys(dayKey(today), String(billing.nextDueDate).slice(0, 10));
  if (daysLeft < 0 || daysLeft > RENEWAL_NOTICE_DAYS) return null;
  return { kind: 'due-soon', daysLeft, dueDate: billing.nextDueDate, amountCents: billing.amountCents ?? null };
}

export function dueInLabel(daysLeft) {
  if (daysLeft <= 0) return 'hoje';
  if (daysLeft === 1) return 'amanhã';
  return `em ${daysLeft} dias`;
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
