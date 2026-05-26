import { env } from '../config/env.js';

/**
 * Extrai telefone e texto do callback Z-API "Ao receber" (ReceivedCallback).
 * @param {unknown} raw
 * @returns {{
 *   ignored: true,
 *   reason: string
 * } | {
 *   ignored: false,
 *   phone: string,
 *   text: string,
 *   messageId: string | null,
 *   instanceId: string | null,
 *   isGroup: boolean
 * }}
 */
export const parseZapiInbound = (raw) => {
  const body = unwrapZapiBody(raw);
  if (!body || typeof body !== 'object') {
    return { ignored: true, reason: 'empty_body' };
  }

  const type = String(body.type || '').trim();
  if (type && type !== 'ReceivedCallback') {
    return { ignored: true, reason: `type_${type}` };
  }

  if (body.fromMe === true) {
    return { ignored: true, reason: 'from_me' };
  }

  if (body.isGroup === true) {
    return { ignored: true, reason: 'group' };
  }

  const phone = normalizeZapiPhone(body.phone);
  if (!phone) {
    return { ignored: true, reason: 'no_phone' };
  }

  let text = '';
  if (body.text && typeof body.text === 'object' && typeof body.text.message === 'string') {
    text = String(body.text.message).trim();
  }

  const hasAudio = Boolean(
    body.audio
    && typeof body.audio === 'object'
    && String(/** @type {Record<string, unknown>} */ (body.audio).audioUrl || '').trim(),
  );

  return {
    ignored: false,
    phone,
    text,
    hasAudio,
    messageId: body.messageId != null ? String(body.messageId) : null,
    instanceId: body.instanceId != null ? String(body.instanceId) : null,
    isGroup: Boolean(body.isGroup),
  };
};

/**
 * @param {unknown} raw
 * @returns {Record<string, unknown> | null}
 */
const unwrapZapiBody = (raw) => {
  if (raw == null) return null;
  if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === 'object') {
    return /** @type {Record<string, unknown>} */ (raw[0]);
  }
  if (typeof raw === 'object') {
    return /** @type {Record<string, unknown>} */ (raw);
  }
  return null;
};

/**
 * @param {unknown} value
 * @returns {string}
 */
const normalizeZapiPhone = (value) => {
  if (value == null) return '';
  return String(value).replace(/\D/g, '');
};

/**
 * Encaminha payload normalizado para n8n / OpenClaw / outro orquestrador (POST JSON).
 * @param {{ phone: string, text: string, messageId: string | null, instanceId: string | null }} normalized
 * @returns {Promise<void>}
 */
export const relayZapiInbound = async (normalized) => {
  const url = (env.OPENCLAW_ZAPI_RELAY_URL || '').trim();
  if (!url) return;

  const secret = (env.OPENCLAW_ZAPI_RELAY_SECRET || '').trim();
  const timeoutMs = Math.min(
    Math.max(Number(env.OPENCLAW_ZAPI_RELAY_TIMEOUT_MS || 8000) || 8000, 1000),
    60_000,
  );

  const payload = {
    source: 'zapi',
    phone: normalized.phone,
    text: normalized.text,
    messageId: normalized.messageId,
    instanceId: normalized.instanceId,
    receivedAt: new Date().toISOString(),
  };

  /** @type {Record<string, string>} */
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
  };
  if (secret) {
    headers.Authorization = `Bearer ${secret}`;
  }

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: ac.signal,
    });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      // eslint-disable-next-line no-console
      console.error('[ZAPI] relay HTTP', res.status, t.slice(0, 500));
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // eslint-disable-next-line no-console
    console.error('[ZAPI] relay falhou:', msg);
  } finally {
    clearTimeout(timer);
  }
};
