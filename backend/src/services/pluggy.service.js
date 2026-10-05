import { env } from '../config/env.js';
import { badRequest, serviceUnavailable } from '../utils/errors.js';

const API_BASE = () => (env.PLUGGY_API_BASE_URL || 'https://api.pluggy.ai').replace(/\/$/, '');

let apiKeyCache = { key: null, expiresAt: 0 };

export function isPluggyConfigured() {
  return Boolean(env.PLUGGY_CLIENT_ID && env.PLUGGY_CLIENT_SECRET);
}

function assertPluggyConfigured() {
  if (!isPluggyConfigured()) {
    throw serviceUnavailable(
      'Open Finance (Pluggy) não configurado no servidor. Defina PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET.',
    );
  }
}

async function fetchPluggy(path, { method = 'GET', body, skipApiKey = false } = {}) {
  const url = `${API_BASE()}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (!skipApiKey) {
    headers['X-API-KEY'] = await getPluggyApiKey();
  }
  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { raw: text };
  }
  if (!res.ok) {
    const msg =
      payload?.message ||
      payload?.error ||
      payload?.code ||
      `Pluggy HTTP ${res.status}`;
    throw badRequest(String(msg));
  }
  return payload;
}

/** POST /auth — API key com cache até perto do vencimento. */
export async function getPluggyApiKey() {
  assertPluggyConfigured();
  const now = Date.now();
  if (apiKeyCache.key && apiKeyCache.expiresAt > now + 60_000) {
    return apiKeyCache.key;
  }
  const data = await fetchPluggy('/auth', {
    method: 'POST',
    skipApiKey: true,
    body: {
      clientId: env.PLUGGY_CLIENT_ID,
      clientSecret: env.PLUGGY_CLIENT_SECRET,
    },
  });
  const key = data?.apiKey;
  if (!key) throw badRequest('Pluggy não devolveu apiKey.');
  const expiresInMs = Number(data?.expiresIn ?? 3600) * 1000;
  apiKeyCache = { key, expiresAt: now + (Number.isFinite(expiresInMs) ? expiresInMs : 3_600_000) };
  return key;
}

/** POST /connect_token — token curto para o widget Pluggy Connect. */
export async function createPluggyConnectToken(clientUserId, { itemId } = {}) {
  assertPluggyConfigured();
  if (!clientUserId) throw badRequest('clientUserId obrigatório.');
  const body = {
    options: {
      clientUserId: String(clientUserId),
    },
  };
  if (itemId) body.itemId = String(itemId);
  if (env.PLUGGY_WEBHOOK_URL) {
    body.options.webhookUrl = env.PLUGGY_WEBHOOK_URL;
  }
  const data = await fetchPluggy('/connect_token', { method: 'POST', body });
  const accessToken = data?.accessToken;
  if (!accessToken) throw badRequest('Pluggy não devolveu connect token.');
  return { accessToken, expiresIn: data?.expiresIn ?? null };
}

export async function fetchPluggyItem(itemId) {
  if (!itemId) throw badRequest('itemId obrigatório.');
  return fetchPluggy(`/items/${encodeURIComponent(itemId)}`);
}

/** Pede atualização dos dados no banco antes de ler saldo/extrato (best-effort). */
export async function requestPluggyItemRefresh(itemId) {
  if (!itemId) return;
  try {
    await fetchPluggy(`/items/${encodeURIComponent(itemId)}/update`, { method: 'POST', body: {} });
  } catch {
    try {
      await fetchPluggy(`/items/${encodeURIComponent(itemId)}`, { method: 'PATCH', body: {} });
    } catch {
      /* conector ainda sincronizando ou endpoint indisponível */
    }
  }
}

export async function fetchPluggyAccountsByItem(itemId) {
  if (!itemId) throw badRequest('itemId obrigatório.');
  const data = await fetchPluggy(`/accounts?itemId=${encodeURIComponent(itemId)}`);
  const list = data?.results ?? data?.data ?? data;
  return Array.isArray(list) ? list : [];
}

function defaultSyncFromDate() {
  const d = new Date();
  d.setDate(d.getDate() - 90);
  return d.toISOString().slice(0, 10);
}

/** Lista transações de uma account Pluggy (GET /v2/transactions, cursor, até 90 dias). */
export async function fetchPluggyTransactionsForAccount(accountId, { from, to } = {}) {
  if (!accountId) throw badRequest('accountId obrigatório.');
  const fromDate = from || defaultSyncFromDate();
  const toDate = to || new Date().toISOString().slice(0, 10);
  const all = [];

  let path = `/v2/transactions?${new URLSearchParams({
    accountId: String(accountId),
    dateFrom: fromDate,
    dateTo: toDate,
  }).toString()}`;

  for (let page = 0; page < 100; page += 1) {
    const data = await fetchPluggy(path);
    const batch = data?.results ?? [];
    if (Array.isArray(batch) && batch.length) all.push(...batch);

    const next = data?.next;
    if (next == null || next === '') break;
    const nextQs = String(next).startsWith('?') ? String(next) : `?${next}`;
    path = `/v2/transactions${nextQs}`;
  }

  return all;
}

/** Limpa cache (testes). */
export function resetPluggyApiKeyCacheForTests() {
  apiKeyCache = { key: null, expiresAt: 0 };
}
