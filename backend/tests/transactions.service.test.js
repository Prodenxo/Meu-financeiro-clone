import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeTransactionStatus,
  parseDeleteScope,
  sanitizeTransactionPatch,
} from '../src/services/transactions.service.js';

test('sanitizeTransactionPatch: cliente não troca dono, id nem vínculo de recorrência', () => {
  const patch = sanitizeTransactionPatch({
    id: 'tx-1',
    user_id: 'outro-usuario',
    criado_em: '2020-01-01',
    recorrencia_id: 'rec-1',
    recorrencia_ano_mes: '2026-10',
    status: 'pago',
    valor: 10,
    conta_id: null,
  });
  assert.deepEqual(patch, { status: 'pago', valor: 10, conta_id: null });
});

test('parseDeleteScope: padrão é "este" e só aceita escopos conhecidos', () => {
  assert.equal(parseDeleteScope(undefined), 'este');
  assert.equal(parseDeleteScope(''), 'este');
  assert.equal(parseDeleteScope('Futuros'), 'futuros');
  assert.equal(parseDeleteScope('todos'), 'todos');
  assert.throws(() => parseDeleteScope('tudo'));
});

test('normalizeTransactionStatus: entrada lançada vira recebido', () => {
  assert.equal(normalizeTransactionStatus('entrada', 'pago'), 'recebido');
  assert.equal(normalizeTransactionStatus('entrada', ''), 'recebido');
  assert.equal(normalizeTransactionStatus('entrada', 'a_receber'), 'a_receber');
});

test('normalizeTransactionStatus: saída vira pago', () => {
  assert.equal(normalizeTransactionStatus('saida', 'recebido'), 'pago');
  assert.equal(normalizeTransactionStatus('saida', 'a_pagar'), 'a_pagar');
});
