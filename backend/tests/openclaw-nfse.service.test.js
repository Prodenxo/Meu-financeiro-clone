import test from 'node:test';
import assert from 'node:assert/strict';
import { parseValorReais } from '../src/services/openclaw-nfse.service.js';

/** Valor da nota fiscal (emit_nfse), não lançamento financeiro. */
test('parseValorReais NFSe — número e formato BR', () => {
  assert.equal(parseValorReais(1200), 1200);
  assert.equal(parseValorReais('1200'), 1200);
  assert.equal(parseValorReais('1.200,00'), 1200);
  assert.equal(parseValorReais('1.200'), 1200);
});

test('parseValorReais NFSe — mil e milhão (valor da nota)', () => {
  assert.equal(parseValorReais('350 mil'), 350000);
  assert.equal(parseValorReais('1 milhão e 200 mil'), 1200000);
  assert.equal(parseValorReais('2 milhões'), 2000000);
});

test('parseValorReais NFSe — inválido', () => {
  assert.equal(parseValorReais(''), null);
  assert.equal(parseValorReais('abc'), null);
  assert.equal(parseValorReais(0), null);
});
