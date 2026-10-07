import test from 'node:test';
import assert from 'node:assert/strict';
import {
  __clearRateCacheForTests,
  getRatesToBrl,
  getRatesToBrlDetailed,
  toIsoDay,
} from '../src/services/frankfurter.service.js';

const realFetch = globalThis.fetch;

const mockFetch = (handlers) => {
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    const handler = handlers.find(([match]) => String(url).includes(match));
    if (!handler) throw new Error(`URL inesperada: ${url}`);
    const body = handler[1];
    if (body instanceof Error) throw body;
    return { ok: true, json: async () => body };
  };
  return calls;
};

test.afterEach(() => {
  globalThis.fetch = realFetch;
  __clearRateCacheForTests();
});

test('toIsoDay lê a data do provedor', () => {
  assert.equal(toIsoDay('2026-10-06'), '2026-10-06');
  assert.equal(toIsoDay('Tue, 06 Oct 2026 00:02:31 +0000'), '2026-10-06');
  assert.equal(toIsoDay(null), null);
  assert.equal(toIsoDay('xx'), null);
});

test('Frankfurter + reserva: taxa completa (1/unidades), fonte e data de cada uma', async () => {
  mockFetch([
    ['frankfurter', { date: '2026-10-06', rates: { USD: 0.1923, EUR: 0.1692 } }],
    ['open.er-api', { time_last_update_utc: 'Tue, 07 Oct 2026 00:02:31 +0000', rates: { AED: 0.7062 } }],
  ]);
  const out = await getRatesToBrlDetailed(['usd', 'EUR', 'AED', 'BRL', 'XYZ']);
  assert.equal(out.rates.USD, 1 / 0.1923);
  assert.equal(out.rates.AED, 1 / 0.7062);
  assert.equal(out.rates.BRL, 1);
  assert.deepEqual(out.missing, ['XYZ']);
  assert.deepEqual(out.sources, [
    { name: 'Frankfurter (BCE)', date: '2026-10-06', codes: ['USD', 'EUR'] },
    { name: 'ExchangeRate-API', date: '2026-10-07', codes: ['AED'] },
  ]);
});

test('cache guarda a fonte e a data', async () => {
  const calls = mockFetch([['frankfurter', { date: '2026-10-06', rates: { USD: 0.2 } }]]);
  await getRatesToBrlDetailed(['USD']);
  const again = await getRatesToBrlDetailed(['USD']);
  assert.equal(calls.length, 1);
  assert.deepEqual(again.sources, [{ name: 'Frankfurter (BCE)', date: '2026-10-06', codes: ['USD'] }]);
});

test('Frankfurter fora do ar: usa a reserva', async () => {
  mockFetch([
    ['frankfurter', new Error('down')],
    ['open.er-api', { time_last_update_utc: '2026-10-07', rates: { USD: 0.2 } }],
  ]);
  const out = await getRatesToBrlDetailed(['USD']);
  assert.equal(out.rates.USD, 5);
  assert.equal(out.sources[0].name, 'ExchangeRate-API');
});

test('as duas fontes fora do ar: erro (não devolve taxa zero)', async () => {
  mockFetch([
    ['frankfurter', new Error('down')],
    ['open.er-api', new Error('down')],
  ]);
  await assert.rejects(() => getRatesToBrl(['USD']), (err) => err.status === 503);
});
