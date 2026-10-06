import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MANY_MANUAL_THRESHOLD,
  dueInLabel,
  formatDueDate,
  renewalNotice,
  syncPlanId,
  syncPriceCents,
  syncPromoVariant,
} from './syncPricing.js';

test('renewalNotice avisa só nos últimos 5 dias antes do vencimento', () => {
  const today = new Date(2026, 9, 6, 12);
  const base = { status: 'active', paymentId: 'pay_1', amountCents: 1990 };
  assert.equal(renewalNotice({ ...base, nextDueDate: '2026-10-20' }, today), null);
  assert.deepEqual(renewalNotice({ ...base, nextDueDate: '2026-10-09' }, today), {
    kind: 'due-soon',
    daysLeft: 3,
    dueDate: '2026-10-09',
    amountCents: 1990,
  });
  assert.equal(renewalNotice({ ...base, paymentId: null, nextDueDate: '2026-10-09' }, today), null);
  assert.equal(renewalNotice({ status: 'none' }, today), null);
});

test('renewalNotice marca pausa quando a mensalidade venceu', () => {
  const out = renewalNotice({ status: 'overdue', nextDueDate: '2026-10-01', amountCents: 1990 });
  assert.equal(out.kind, 'paused');
});

test('formatDueDate e dueInLabel', () => {
  assert.equal(formatDueDate('2026-11-07'), '07/11');
  assert.equal(dueInLabel(0), 'hoje');
  assert.equal(dueInLabel(1), 'amanhã');
  assert.equal(dueInLabel(4), 'em 4 dias');
});

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
