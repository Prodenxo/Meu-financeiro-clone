import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_CONTA_NOME,
  pickDefaultContaFinanceira,
  resolveContaIdFromPayload,
  matchContaByName,
} from '../src/services/conta-financeira-default.js';

const contas = [
  { id: 'a', nome: 'Nubank', tipo: 'corrente', ativo: true, criado_em: '2026-01-02' },
  { id: 'b', nome: 'Meu Financeiro', tipo: 'dinheiro', ativo: true, criado_em: '2026-01-01' },
  { id: 'c', nome: 'Carteira', tipo: 'dinheiro', ativo: true, criado_em: '2026-01-03' },
];

test('pickDefaultContaFinanceira prioriza Meu Financeiro', () => {
  const picked = pickDefaultContaFinanceira(contas);
  assert.equal(picked?.id, 'b');
  assert.equal(picked?.nome, DEFAULT_CONTA_NOME);
});

test('resolveContaIdFromPayload usa carteira por nome', () => {
  const id = resolveContaIdFromPayload(contas, { carteira: 'Nubank' });
  assert.equal(id, 'a');
});

test('resolveContaIdFromPayload cai no padrão sem carteira no payload', () => {
  const id = resolveContaIdFromPayload(contas, { tipo: 'entrada' });
  assert.equal(id, 'b');
});

test('matchContaByName aceita match parcial', () => {
  const m = matchContaByName(contas, 'nu');
  assert.equal(m?.nome, 'Nubank');
});
