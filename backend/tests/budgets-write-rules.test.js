import test from 'node:test';
import assert from 'node:assert/strict';
import { formatLocalDate, monthStartFromInput, parseValorOrcado } from '../src/services/categories.service.js';

test('monthStartFromInput lê "AAAA-MM-DD" sem depender do fuso do servidor', () => {
  assert.equal(monthStartFromInput('2026-10-01'), '2026-10-01');
  assert.equal(monthStartFromInput('2026-10-17'), '2026-10-01');
  assert.equal(monthStartFromInput('2026-01-01T12:00:00'), '2026-01-01');
  assert.equal(monthStartFromInput('2026-12-31T23:59:59Z'), '2026-12-01');
});

test('monthStartFromInput aceita Date e recusa data inválida', () => {
  assert.equal(monthStartFromInput(new Date(2026, 1, 15, 12)), '2026-02-01');
  assert.throws(() => monthStartFromInput('não é data'), /Mês inválido/);
});

test('formatLocalDate usa a data civil local', () => {
  assert.equal(formatLocalDate(new Date(2026, 8, 1)), '2026-09-01');
  assert.equal(formatLocalDate(new Date(2026, 11, 31)), '2026-12-31');
});

test('parseValorOrcado: vazio vira nulo (remove o limite), número válido arredonda em centavos', () => {
  assert.equal(parseValorOrcado(null), null);
  assert.equal(parseValorOrcado(''), null);
  assert.equal(parseValorOrcado(0), 0);
  assert.equal(parseValorOrcado('1500,5'), 1500.5);
  assert.equal(parseValorOrcado(10.005), 10.01);
});

test('parseValorOrcado recusa negativo, texto e infinito', () => {
  for (const bad of [-1, 'abc', Infinity, '1e400']) {
    assert.throws(() => parseValorOrcado(bad), (err) => err.status === 400 && Boolean(err.errors?.valor_orcado));
  }
});
