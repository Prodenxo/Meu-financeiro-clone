import { env } from '../config/env.js';
import { badRequest, serviceUnavailable } from '../utils/errors.js';

const USER_AGENT = 'MeuFinanceiro/1.0';

export function resolveAsaasApiBaseUrl() {
  const explicit = String(env.ASAAS_API_BASE_URL || '').trim();
  if (explicit) return explicit.replace(/\/$/, '');
  const key = String(env.ASAAS_API_KEY || '');
  if (env.ASAAS_SANDBOX || key.includes('_hmlg_')) {
    return 'https://api-sandbox.asaas.com/v3';
  }
  return 'https://api.asaas.com/v3';
}

export function isAsaasConfigured() {
  return Boolean(String(env.ASAAS_API_KEY || '').trim());
}

export function assertAsaasConfigured() {
  if (!isAsaasConfigured()) {
    throw serviceUnavailable('Asaas não configurado (ASAAS_API_KEY).', { code: 'ASAAS_NOT_CONFIGURED' });
  }
}

/** @param {string} path — ex.: `/customers` ou `/payments/id/pixQrCode` */
export async function asaasRequest(path, { method = 'GET', body } = {}) {
  assertAsaasConfigured();
  const base = resolveAsaasApiBaseUrl();
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
  const response = await fetch(url, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': USER_AGENT,
      access_token: String(env.ASAAS_API_KEY).trim(),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg =
      json?.errors?.[0]?.description
      || json?.error
      || json?.message
      || `Asaas HTTP ${response.status}`;
    throw badRequest(msg, { code: 'ASAAS_API_ERROR', status: response.status });
  }
  return json;
}
