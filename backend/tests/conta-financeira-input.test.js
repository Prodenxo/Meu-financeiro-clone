import test from 'node:test';
import assert from 'node:assert/strict';

import { parseMoneyInput, validateContaInput } from '../src/services/conta-financeira-input.js';

const base = {
  bank_mode: 'catalog',
  instituicao_id: 'nubank',
  nome: 'Nubank',
  tipo: 'corrente',
  saldo_inicial: 1500.5,
  cor: '#820AD1',
};

test('aceita conta de banco do catálogo e zera campos de cartão', () => {
  const { errors, payload } = validateContaInput({ ...base, limite_credito: 100, dia_fechamento: 5 });
  assert.equal(errors, null);
  assert.deepEqual(payload, {
    nome: 'Nubank',
    tipo: 'corrente',
    saldo_inicial: 1500.5,
    limite_credito: null,
    dia_fechamento: null,
    dia_vencimento: null,
    cor: '#820AD1',
    instituicao_id: 'nubank',
    ativo: true,
  });
});

test('conta personalizada não grava instituição', () => {
  const { payload } = validateContaInput({ ...base, bank_mode: 'custom', instituicao_id: 'nubank', nome: 'Carteira' });
  assert.equal(payload.instituicao_id, null);
  assert.equal(payload.nome, 'Carteira');
});

test('cartão mantém limite e dias; saldo negativo é permitido', () => {
  const { errors, payload } = validateContaInput({
    ...base,
    tipo: 'cartao_credito',
    saldo_inicial: '-1.227,00',
    limite_credito: '5.000,00',
    dia_fechamento: '5',
    dia_vencimento: 12,
  });
  assert.equal(errors, null);
  assert.equal(payload.saldo_inicial, -1227);
  assert.equal(payload.limite_credito, 5000);
  assert.equal(payload.dia_fechamento, 5);
  assert.equal(payload.dia_vencimento, 12);
});

test('devolve as mesmas mensagens por campo do site', () => {
  const { errors, payload } = validateContaInput({
    bank_mode: '',
    nome: '  ',
    tipo: 'investimento',
    saldo_inicial: '',
    cor: 'roxo',
  });
  assert.equal(payload, null);
  assert.deepEqual(errors, {
    bank: 'Escolha um banco ou "Outra conta".',
    nome: 'Informe um nome para a conta.',
    tipo: 'Escolha o tipo da conta.',
    saldo_inicial: 'Informe um saldo válido.',
    cor: 'Escolha uma cor.',
  });
});

test('valida limite e dias só para cartão', () => {
  const { errors } = validateContaInput({
    ...base,
    tipo: 'cartao_credito',
    limite_credito: '-10',
    dia_fechamento: '0',
    dia_vencimento: '32',
  });
  assert.deepEqual(errors, {
    limite_credito: 'Informe um limite válido.',
    dia_fechamento: 'Dia entre 1 e 31.',
    dia_vencimento: 'Dia entre 1 e 31.',
  });
});

test('banco do catálogo com id inválido é recusado', () => {
  const { errors } = validateContaInput({ ...base, instituicao_id: '../x' });
  assert.equal(errors.bank, 'Banco não encontrado. Escolha novamente.');
});

test('parseMoneyInput entende formato brasileiro e recusa vazio', () => {
  assert.equal(parseMoneyInput('R$ 138.953,90'), 138953.9);
  assert.equal(parseMoneyInput('10,5'), 10.5);
  assert.equal(parseMoneyInput(0), 0);
  assert.ok(Number.isNaN(parseMoneyInput('')));
  assert.ok(Number.isNaN(parseMoneyInput('abc')));
});
