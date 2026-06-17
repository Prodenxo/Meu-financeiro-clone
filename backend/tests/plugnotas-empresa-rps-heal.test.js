import test from 'node:test';
import assert from 'node:assert/strict';

import {
  advancePlugnotasNfseRpsAfterEmit,
  applyPlugnotasNfseEmitRpsFromEmpresaConfig,
  empresaPlugnotasTemRpsCadastrado,
  ensureEmpresaPlugnotasRpsForNfseEmit,
  readPlugnotasNfseNextRpsFromEmpresa,
  readRpsFromNfseEmitPayload,
  readRpsNumeroFromNfseHistoryRow,
  resolveNextNfseRpsNumero
} from '../src/services/plugnotas/plugnotas-empresa-rps-heal.js';

test('resolveNextNfseRpsNumero usa o maior entre PlugNotas e histórico local', () => {
  assert.equal(resolveNextNfseRpsNumero(5, 7), 8);
  assert.equal(resolveNextNfseRpsNumero(10, 3), 10);
  assert.equal(resolveNextNfseRpsNumero(1, null), 1);
});

test('readRpsFromNfseEmitPayload lê numeracao do payload de emissão', () => {
  assert.deepEqual(
    readRpsFromNfseEmitPayload({ rps: { lote: 1, numeracao: [{ serie: '1', numero: 12 }] } }),
    { serie: '1', numero: 12, lote: 1 }
  );
});

test('readRpsNumeroFromNfseHistoryRow lê número do payload ou da resposta PlugNotas', () => {
  assert.equal(
    readRpsNumeroFromNfseHistoryRow({
      payload_json: { rps: { lote: 1, numeracao: [{ serie: '1', numero: 9 }] } }
    }),
    9
  );
  assert.equal(
    readRpsNumeroFromNfseHistoryRow({
      payload_json: {},
      response_json: { rps: { lote: 1, numeracao: [{ serie: '1', numero: 11 }] } }
    }),
    11
  );
  assert.equal(readRpsNumeroFromNfseHistoryRow({}), null);
});

test('applyPlugnotasNfseEmitRpsFromEmpresaConfig usa histórico local se GET empresa falhar', async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => {
    throw new Error('plugnotas indisponível');
  };

  try {
    const payload = { idIntegracao: 'x' };
    await applyPlugnotasNfseEmitRpsFromEmpresaConfig(payload, '12.345.678/0001-99', {
      localMaxRpsNumero: 12
    });
    assert.deepEqual(payload.rps, {
      lote: 1,
      numeracao: [{ serie: '1', numero: 13 }]
    });
  } finally {
    global.fetch = originalFetch;
  }
});

test('applyPlugnotasNfseEmitRpsFromEmpresaConfig avança número com localMaxRpsNumero', async () => {
  const originalFetch = global.fetch;

  global.fetch = async (url, options = {}) => {
    if (String(url).includes('/empresa/12345678000199') && options.method === 'GET') {
      return new Response(JSON.stringify({
        cpfCnpj: '12345678000199',
        nfse: { config: { rps: { numeracao: [{ serie: '1', numero: 5 }], lote: 1 } } }
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ message: 'unexpected' }), { status: 500 });
  };

  try {
    const payload = { idIntegracao: 'x' };
    await applyPlugnotasNfseEmitRpsFromEmpresaConfig(payload, '12.345.678/0001-99', {
      localMaxRpsNumero: 7
    });
    assert.deepEqual(payload.rps, {
      lote: 1,
      numeracao: [{ serie: '1', numero: 8 }]
    });
  } finally {
    global.fetch = originalFetch;
  }
});

test('advancePlugnotasNfseRpsAfterEmit faz PATCH quando contador PlugNotas está atrás', async () => {
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (String(url).includes('/empresa/12345678000199') && options.method === 'GET') {
      return new Response(JSON.stringify({
        cpfCnpj: '12345678000199',
        nfse: { ativo: true, config: { rps: { numeracao: [{ serie: '1', numero: 5 }], lote: 1 } } }
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
    await advancePlugnotasNfseRpsAfterEmit('12.345.678/0001-99', { serie: '1', numero: 8, lote: 1 });
    const patchCall = calls.find((c) => c.options.method === 'PATCH');
    assert.ok(patchCall);
    const body = JSON.parse(patchCall.options.body);
    assert.equal(body.nfse.config.rps.numero, 9);
    assert.equal(body.rps.numeracao[0].numero, 9);
  } finally {
    global.fetch = originalFetch;
  }
});

test('readPlugnotasNfseNextRpsFromEmpresa lê numeracao em nfse.config.rps', () => {
  assert.deepEqual(
    readPlugnotasNfseNextRpsFromEmpresa({
      cpfCnpj: '12345678000199',
      nfse: { config: { rps: { numeracao: [{ serie: '1', numero: 4 }], lote: 1 } } }
    }),
    { serie: '1', numero: 4, lote: 1 }
  );
});

test('applyPlugnotasNfseEmitRpsFromEmpresaConfig injeta rps explícito quando ausente', async () => {
  const originalFetch = global.fetch;

  global.fetch = async (url, options = {}) => {
    if (String(url).includes('/empresa/12345678000199') && options.method === 'GET') {
      return new Response(JSON.stringify({
        cpfCnpj: '12345678000199',
        nfse: { config: { rps: { numeracao: [{ serie: '1', numero: 5 }], lote: 1 } } }
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ message: 'unexpected' }), { status: 500 });
  };

  try {
    const payload = { idIntegracao: 'x' };
    await applyPlugnotasNfseEmitRpsFromEmpresaConfig(payload, '12.345.678/0001-99');
    assert.deepEqual(payload.rps, {
      lote: 1,
      numeracao: [{ serie: '1', numero: 5 }]
    });
  } finally {
    global.fetch = originalFetch;
  }
});

test('applyPlugnotasNfseEmitRpsFromEmpresaConfig substitui rps obsoleto pelo próximo número seguro', async () => {
  const originalFetch = global.fetch;

  global.fetch = async (url, options = {}) => {
    if (String(url).includes('/empresa/12345678000199') && options.method === 'GET') {
      return new Response(JSON.stringify({
        cpfCnpj: '12345678000199',
        nfse: { config: { rps: { numeracao: [{ serie: '1', numero: 5 }], lote: 1 } } }
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ message: 'unexpected' }), { status: 500 });
  };

  try {
    const payload = { rps: { serie: '1', numero: 9, lote: 1 } };
    await applyPlugnotasNfseEmitRpsFromEmpresaConfig(payload, '12.345.678/0001-99', {
      localMaxRpsNumero: 7
    });
    assert.deepEqual(payload.rps, {
      lote: 1,
      numeracao: [{ serie: '1', numero: 8 }]
    });
  } finally {
    global.fetch = originalFetch;
  }
});

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

test('ensureEmpresaPlugnotasRpsForNfseEmit não faz PATCH quando numeracao já existe em nfse.config.rps', async () => {
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (String(url).includes('/empresa/12345678000199') && options.method === 'GET') {
      return new Response(JSON.stringify({
        cpfCnpj: '12345678000199',
        nfse: {
          ativo: true,
          config: { rps: { lote: 1, numeracao: [{ serie: '1', numero: 4 }] } }
        }
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ message: 'unexpected' }), { status: 500 });
  };

  try {
    await ensureEmpresaPlugnotasRpsForNfseEmit('12.345.678/0001-99');
    assert.equal(calls.filter((c) => c.options.method === 'PATCH').length, 0);
  } finally {
    global.fetch = originalFetch;
  }
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
