import test from 'node:test';
import assert from 'node:assert/strict';
import {
  listOpenFinancePlans,
  openFinancePriceCents,
  resolveOpenFinancePlan,
} from '../src/services/open-finance-billing-pricing.js';

test('openFinancePriceCents: 1ª conta 19,90 + 9,90 por adicional', () => {
  assert.equal(openFinancePriceCents(0), 0);
  assert.equal(openFinancePriceCents(1), 1990);
  assert.equal(openFinancePriceCents(2), 2980);
  assert.equal(openFinancePriceCents(3), 3970);
  assert.equal(openFinancePriceCents(4), 4960);
  assert.equal(openFinancePriceCents(5), 5950);
});

test('resolveOpenFinancePlan aceita of_N dentro do limite', () => {
  assert.deepEqual(
    { slots: resolveOpenFinancePlan('of_3').slots, amountCents: resolveOpenFinancePlan('of_3').amountCents },
    { slots: 3, amountCents: 3970 },
  );
  assert.equal(resolveOpenFinancePlan('of_0'), null);
  assert.equal(resolveOpenFinancePlan('of_11'), null);
  assert.equal(resolveOpenFinancePlan('xpto'), null);
});

test('listOpenFinancePlans vai de 1 a 10 contas', () => {
  const plans = listOpenFinancePlans();
  assert.equal(plans.length, 10);
  assert.equal(plans[0].id, 'of_1');
  assert.equal(plans[9].id, 'of_10');
});
