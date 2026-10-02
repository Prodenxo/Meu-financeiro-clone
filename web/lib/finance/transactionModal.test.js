import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildRecurrenceRow,
  monthlyRecurrenceRule,
  parseRecurrenceQuantity,
  recurrenceTotalLabel,
} from './transactionModal.js';

describe('transactionModal — recorrência', () => {
  it('quantidade inclui o lançamento atual', () => {
    assert.equal(recurrenceTotalLabel(12).includes('incluindo este'), true);
    assert.equal(recurrenceTotalLabel(12).includes('pendentes'), true);
  });

  it('valida quantidade entre 1 e 1200', () => {
    assert.equal(parseRecurrenceQuantity('12'), 12);
    assert.equal(parseRecurrenceQuantity(''), null);
    assert.ok(Number.isNaN(parseRecurrenceQuantity('0')));
  });

  it('template de recorrência usa status pendente', () => {
    const row = buildRecurrenceRow({
      tipo: 'saida',
      valor: 100,
      classificacao: 'Energia',
      data: '2026-01-31',
      obs: null,
      maxOcorrencias: 6,
    });
    assert.equal(row.status, 'a_pagar');
    assert.equal(row.dia_do_mes, 31);
    assert.equal(row.max_ocorrencias, 6);
  });

  it('RRULE mensal com COUNT total', () => {
    assert.equal(monthlyRecurrenceRule(12), 'RRULE:FREQ=MONTHLY;COUNT=12');
    assert.equal(monthlyRecurrenceRule(null), 'RRULE:FREQ=MONTHLY');
  });
});
