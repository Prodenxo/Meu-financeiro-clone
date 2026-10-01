import 'server-only';
import { buildCurrencyCatalog, normalizeMoedaCode } from '@/lib/finance/moedas';

/**
 * Cotações para a Conta global — mesma fonte e mesma conta do Expo/backend:
 * Frankfurter (base BRL, uma chamada para todas as moedas) → 1 unidade = 1 / unitsPerBrl reais;
 * o que faltar tenta no open.er-api.com. Cache de 1 h (igual ao `CACHE_TTL_MS` do backend).
 */
const FRANKFURTER_BASE = 'https://api.frankfurter.dev';
const EXCHANGE_RATE_API_URL = 'https://open.er-api.com/v6/latest/BRL';
const REVALIDATE_S = 60 * 60;
const TIMEOUT_MS = 6000;

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal, next: { revalidate: REVALIDATE_S } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function fromUnitsPerBrl(raw) {
  const units = Number(raw);
  return Number.isFinite(units) && units > 0 ? 1 / units : null;
}

/** "Tue, 30 Sep 2026 00:02:31 +0000" | "2026-09-30" → "AAAA-MM-DD" ou null. */
function toIsoDay(raw) {
  if (!raw) return null;
  const s = String(raw);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

/**
 * @param {string[]} codesInput
 * @returns {Promise<{ rates: Record<string, number>, sources: Array<{ name: string, date: string|null, codes: string[] }>, missing: string[], error: string|null }>}
 */
export async function fetchRatesToBrl(codesInput) {
  const codes = [...new Set((codesInput || []).map(normalizeMoedaCode).filter(Boolean))];
  const rates = {};
  const sources = [];
  let error = null;

  for (const code of codes) if (code === 'BRL') rates.BRL = 1;
  const foreign = codes.filter((c) => c !== 'BRL');
  if (foreign.length === 0) return { rates, sources, missing: [], error };

  try {
    const json = await fetchJson(`${FRANKFURTER_BASE}/v1/latest?base=BRL&symbols=${foreign.map(encodeURIComponent).join(',')}`);
    const got = [];
    for (const code of foreign) {
      const rate = fromUnitsPerBrl(json?.rates?.[code]);
      if (rate != null) {
        rates[code] = rate;
        got.push(code);
      }
    }
    if (got.length) sources.push({ name: 'Frankfurter (BCE)', date: toIsoDay(json?.date), codes: got });
  } catch (err) {
    error = 'Não foi possível consultar as cotações agora.';
    console.warn('[cotacoes] Frankfurter indisponível:', err?.message || err);
  }

  const stillMissing = foreign.filter((c) => rates[c] == null);
  if (stillMissing.length > 0) {
    try {
      const json = await fetchJson(EXCHANGE_RATE_API_URL);
      const got = [];
      for (const code of stillMissing) {
        const rate = fromUnitsPerBrl(json?.rates?.[code]);
        if (rate != null) {
          rates[code] = rate;
          got.push(code);
        }
      }
      if (got.length) {
        sources.push({ name: 'ExchangeRate-API', date: toIsoDay(json?.time_last_update_utc), codes: got });
        error = null;
      }
    } catch (err) {
      console.warn('[cotacoes] open.er-api indisponível:', err?.message || err);
    }
  }

  const missing = foreign.filter((c) => rates[c] == null);
  if (missing.length === 0) error = null;
  return { rates, sources, missing, error };
}

/** Catálogo `{ CODE: nome pt-BR }` — Frankfurter + lista mínima (como `fetchMoedasGlobaisCurrencies`). */
export async function fetchCurrencyCatalog() {
  try {
    const json = await fetchJson(`${FRANKFURTER_BASE}/v1/currencies`);
    return buildCurrencyCatalog(Object.keys(json || {}));
  } catch (err) {
    console.warn('[cotacoes] catálogo indisponível — usando lista mínima.', err?.message || err);
    return buildCurrencyCatalog([]);
  }
}
