import test from 'node:test';
import assert from 'node:assert/strict';
import { MANY_MANUAL_THRESHOLD, syncPlanId, syncPriceCents, syncPromoVariant } from './syncPricing.js';

test('syncPriceCents segue 19,90 + 9,90 por conta adicional', () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5].map(syncPriceCents), [0, 1990, 2980, 3970, 4960, 5950]);
});

test('syncPlanId limita entre 1 e 10', () => {
  assert.equal(syncPlanId(0), 'of_1');
  assert.equal(syncPlanId(3), 'of_3');
  assert.equal(syncPlanId(42), 'of_10');
});

test('syncPromoVariant some quando já existe conta sincronizada', () => {
  const contas = [{ of_provider: 'pluggy', of_external_id: 'x' }];
  assert.equal(syncPromoVariant({ contas, transactions: [] }), 'none');
});

test('syncPromoVariant destaca economia de tempo com muitos lançamentos manuais', () => {
  const today = new Date('2026-10-06T12:00:00Z');
  const recent = Array.from({ length: MANY_MANUAL_THRESHOLD }, () => ({ data: '2026-10-01' }));
  assert.equal(syncPromoVariant({ contas: [], transactions: recent, today }), 'many-manual');
  const old = recent.map(() => ({ data: '2026-01-01' }));
  assert.equal(syncPromoVariant({ contas: [], transactions: old, today }), 'default');
  const imported = recent.map((t) => ({ ...t, of_external_id: 'p' }));
  assert.equal(syncPromoVariant({ contas: [], transactions: imported, today }), 'default');
});
