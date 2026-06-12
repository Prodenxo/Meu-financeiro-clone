import test from 'node:test';
import assert from 'node:assert/strict';

import {
  empresaPlugnotasTemRpsCadastrado,
  ensureEmpresaPlugnotasRpsForNfseEmit
} from '../src/services/plugnotas/plugnotas-empresa-rps-heal.js';

test('empresaPlugnotasTemRpsCadastrado reconhece rps válido no GET empresa', () => {
  assert.equal(
    empresaPlugnotasTemRpsCadastrado({
      cpfCnpj: '12345678000199',
      rps: { lote: 1, numeracao: [{ numero: 1, serie: '1' }] }
    }),
    true
  );
  assert.equal(
    empresaPlugnotasTemRpsCadastrado({
      cpfCnpj: '12345678000199',
      rps: { lote: 1 }
    }),
    false
  );
});

test('ensureEmpresaPlugnotasRpsForNfseEmit faz PATCH só quando rps ausente', async () => {
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (String(url).includes('/empresa/12345678000199') && options.method === 'GET') {
      return new Response(JSON.stringify({
        cpfCnpj: '12345678000199',
        nfse: { ativo: true }
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (String(url).includes('/empresa/12345678000199') && options.method === 'PATCH') {
      return new Response(JSON.stringify({ message: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return new Response(JSON.stringify({ message: 'unexpected' }), { status: 500 });
  };

  try {
    await ensureEmpresaPlugnotasRpsForNfseEmit('12.345.678/0001-99');
    const patchCall = calls.find((c) => c.options.method === 'PATCH');
    assert.ok(patchCall);
    const body = JSON.parse(patchCall.options.body);
    assert.deepEqual(body.rps, {
      lote: 1,
      numeracao: [{ numero: 1, serie: '1' }]
    });
    assert.deepEqual(body.nfse.config.rps, { serie: '1', numero: 1, lote: 1 });
  } finally {
    global.fetch = originalFetch;
  }
});
