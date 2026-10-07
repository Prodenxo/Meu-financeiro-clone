import { badRequest, serviceUnavailable } from '../utils/errors.js';

const FRANKFURTER_BASE = 'https://api.frankfurter.dev';
const EXCHANGE_RATE_API_URL = 'https://open.er-api.com/v6/latest/BRL';
const CACHE_TTL_MS = 60 * 60 * 1000;

/** @type {{ at: number, data: Record<string, string> } | null} */
let currenciesCache = null;

/** @type {Map<string, { at: number, rate: number }>} */
const rateCache = new Map();

const normalizeCode = (code) => String(code || '').trim().toUpperCase();

const fetchJson = async (url) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw badRequest('Serviço de câmbio indisponível no momento.');
    }
    return await res.json();
  } catch (err) {
    if (err?.status) throw err;
    throw serviceUnavailable('Não foi possível consultar cotações. Tente novamente em instantes.');
  } finally {
    clearTimeout(timeout);
  }
};

export const listFrankfurterCurrencies = async () => {
  const now = Date.now();
  if (currenciesCache && now - currenciesCache.at < CACHE_TTL_MS) {
    return currenciesCache.data;
  }
  const json = await fetchJson(`${FRANKFURTER_BASE}/v1/currencies`);
  if (!json || typeof json !== 'object') {
    throw serviceUnavailable('Lista de moedas indisponível.');
  }
  const data = Object.fromEntries(
    Object.keys(json).map((code) => [normalizeCode(code), normalizeCode(code)]),
  );
  currenciesCache = { at: now, data };
  return data;
};

export const SOURCE_FRANKFURTER = 'Frankfurter (BCE)';
export const SOURCE_EXCHANGE_RATE_API = 'ExchangeRate-API';

/** "Tue, 30 Sep 2026 00:02:31 +0000" | "2026-09-30" → "AAAA-MM-DD" (data informada pelo provedor) ou null. */
export const toIsoDay = (raw) => {
  if (!raw) return null;
  const s = String(raw);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
};

/**
 * Taxas + de onde vieram. 1 unidade de `code` = X BRL (base BRL + inversão, uma chamada para várias moedas).
 * `sources[].date` = data da cotação segundo o provedor (não a hora da consulta).
 */
export const getRatesToBrlDetailed = async (codesInput) => {
  const codes = [...new Set((codesInput || []).map(normalizeCode).filter(Boolean))];
  const rates = {};
  const meta = {};
  const now = Date.now();

  for (const code of codes) {
    if (code === 'BRL') rates.BRL = 1;
  }

  const foreign = codes.filter((c) => c !== 'BRL');
  const needFetch = foreign.filter((code) => {
    const cached = rateCache.get(code);
    if (cached && now - cached.at < CACHE_TTL_MS) {
      rates[code] = cached.rate;
      meta[code] = { source: cached.source || null, date: cached.date || null };
      return false;
    }
    return true;
  });

  const store = (code, unitsPerBrlRaw, source, date) => {
    const unitsPerBrl = Number(unitsPerBrlRaw);
    if (!Number.isFinite(unitsPerBrl) || unitsPerBrl <= 0) return;
    const rate = 1 / unitsPerBrl;
    rateCache.set(code, { at: now, rate, source, date });
    rates[code] = rate;
    meta[code] = { source, date };
  };

  if (needFetch.length > 0) {
    const symbols = needFetch.map(encodeURIComponent).join(',');
    let primaryError = null;
    try {
      const json = await fetchJson(`${FRANKFURTER_BASE}/v1/latest?base=BRL&symbols=${symbols}`);
      const date = toIsoDay(json?.date);
      for (const code of needFetch) store(code, json?.rates?.[code], SOURCE_FRANKFURTER, date);
    } catch (err) {
      primaryError = err;
    }

    const stillMissing = needFetch.filter((code) => rates[code] == null);
    if (stillMissing.length > 0) {
      try {
        const fallbackJson = await fetchJson(EXCHANGE_RATE_API_URL);
        const fallbackDate = toIsoDay(fallbackJson?.time_last_update_utc);
        for (const code of stillMissing) store(code, fallbackJson?.rates?.[code], SOURCE_EXCHANGE_RATE_API, fallbackDate);
      } catch {
        // mantém só as cotações já obtidas
      }
    }

    if (primaryError && needFetch.every((code) => rates[code] == null)) throw primaryError;
  }

  const bySource = new Map();
  for (const code of foreign) {
    const m = meta[code];
    if (!m?.source) continue;
    const key = `${m.source}|${m.date || ''}`;
    if (!bySource.has(key)) bySource.set(key, { name: m.source, date: m.date || null, codes: [] });
    bySource.get(key).codes.push(code);
  }

  return {
    rates,
    sources: [...bySource.values()],
    missing: foreign.filter((code) => rates[code] == null),
  };
};

/**
 * Taxa: 1 unidade de `code` = X BRL.
 * Usa base BRL + inversão (uma chamada para várias moedas).
 */
export const getRatesToBrl = async (codesInput) => (await getRatesToBrlDetailed(codesInput)).rates;

export const __clearRateCacheForTests = () => rateCache.clear();

/** @deprecated Use getRatesToBrl — mantido para compatibilidade. */
export const getRateToBrl = async (codeInput) => {
  const code = normalizeCode(codeInput);
  const rates = await getRatesToBrl([code]);
  const rate = rates[code];
  if (rate == null) {
    throw badRequest(`Cotação indisponível para ${code}.`);
  }
  return rate;
};
