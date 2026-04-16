import test from 'node:test';
import assert from 'node:assert/strict';

import {
  applyEmpresaPlugnotasRpsInicialForPost,
  EMPRESA_PLUGNOTAS_RPS_INICIAL_POST,
  stripRpsFromEmpresaPayload
} from '../src/services/plugnotas/plugnotas-empresa-rps-inicial.js';

test('applyEmpresaPlugnotasRpsInicialForPost é idempotente e canónico', () => {
  const payload = { x: 1 };
  applyEmpresaPlugnotasRpsInicialForPost(payload);
  assert.deepEqual(payload.rps, {
    lote: EMPRESA_PLUGNOTAS_RPS_INICIAL_POST.lote,
    numeracao: [{ numero: 1, serie: '1' }]
  });
  applyEmpresaPlugnotasRpsInicialForPost(payload);
  assert.deepEqual(payload.rps, {
    lote: 1,
    numeracao: [{ numero: 1, serie: '1' }]
  });
});

test('applyEmpresaPlugnotasRpsInicialForPost substitui rps pré-existente (FR-RPS-OVR-01)', () => {
  const payload = {
    rps: { lote: 99, numeracao: [{ numero: 5, serie: 'Z' }] }
  };
  applyEmpresaPlugnotasRpsInicialForPost(payload);
  assert.equal(payload.rps.lote, 1);
  assert.equal(payload.rps.numeracao[0].numero, 1);
  assert.equal(payload.rps.numeracao[0].serie, '1');
});

test('applyEmpresaPlugnotasRpsInicialForPost ignora não-objectos', () => {
  applyEmpresaPlugnotasRpsInicialForPost(null);
  applyEmpresaPlugnotasRpsInicialForPost(undefined);
  applyEmpresaPlugnotasRpsInicialForPost([]);
});

test('stripRpsFromEmpresaPayload remove rps e devolve o mesmo objecto', () => {
  const payload = { a: 1, rps: { lote: 1 } };
  const out = stripRpsFromEmpresaPayload(payload);
  assert.strictEqual(out, payload);
  assert.equal('rps' in payload, false);
});

test('stripRpsFromEmpresaPayload sem rps é no-op', () => {
  const payload = { a: 1 };
  stripRpsFromEmpresaPayload(payload);
  assert.deepEqual(payload, { a: 1 });
});
