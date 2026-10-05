import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildLancamentoFromPluggyTransaction,
  mapPluggyTransactionTipo,
  mapPluggyTransactionValor,
} from '../src/services/pluggyTransactionMapper.js';

describe('pluggyTransactionMapper', () => {
  it('mapeia crédito como entrada', () => {
    assert.equal(mapPluggyTransactionTipo({ type: 'CREDIT', amount: 10 }), 'entrada');
    assert.equal(mapPluggyTransactionTipo({ amount: 50 }), 'entrada');
  });

  it('mapeia débito como saída', () => {
    assert.equal(mapPluggyTransactionTipo({ type: 'DEBIT', amount: -20 }), 'saida');
    assert.equal(mapPluggyTransactionValor({ amount: -20 }), 20);
  });

  it('monta lançamento com vínculo pluggy', () => {
    const row = buildLancamentoFromPluggyTransaction(
      { id: 'tx-1', amount: -15.5, date: '2026-10-01', description: 'PIX' },
      { userId: 'u1', contaId: 'c1' },
    );
    assert.equal(row.tipo, 'saida');
    assert.equal(row.valor, 15.5);
    assert.equal(row.conta_id, 'c1');
    assert.equal(row.of_external_id, 'tx-1');
    assert.equal(row.data, '2026-10-01');
  });
});
