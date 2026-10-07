import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CATEGORY_NAME_MAX,
  findDuplicateCategory,
  isSameCategoryName,
  parseCategoryInput,
} from '../src/services/categories.service.js';
import { fetchAllPages } from '../src/services/transactions.service.js';

const fieldErrors = (fn) => {
  try {
    fn();
  } catch (error) {
    return error.errors;
  }
  assert.fail('deveria ter recusado');
};

test('parseCategoryInput: apara o nome e normaliza "saída"', () => {
  assert.deepEqual(parseCategoryInput({ nome: '  Lazer ', tipo: 'Saída' }), { nome: 'Lazer', tipo: 'saida' });
  assert.deepEqual(parseCategoryInput({ nome: 'Salário', tipo: 'entrada' }), { nome: 'Salário', tipo: 'entrada' });
});

test('parseCategoryInput: recusa nome vazio, longo demais e tipo desconhecido', () => {
  assert.ok(fieldErrors(() => parseCategoryInput({ nome: '   ', tipo: 'saida' })).nome);
  assert.ok(fieldErrors(() => parseCategoryInput({ nome: 'x'.repeat(CATEGORY_NAME_MAX + 1), tipo: 'saida' })).nome);
  assert.ok(fieldErrors(() => parseCategoryInput({ nome: 'Lazer', tipo: 'transferencia' })).tipo);
  assert.ok(fieldErrors(() => parseCategoryInput({ nome: 'Lazer' })).tipo);
});

test('parseCategoryInput parcial: tipo pode faltar na edição', () => {
  assert.deepEqual(parseCategoryInput({ nome: 'Lazer' }, { partial: true }), { nome: 'Lazer', tipo: null });
});

test('findDuplicateCategory: mesmo nome sem acento/caixa e mesmo tipo, ignorando a própria', () => {
  const list = [
    { id: 1, nome: 'Alimentação', tipo: 'saida' },
    { id: 2, nome: 'Alimentação', tipo: 'entrada' },
  ];
  assert.equal(findDuplicateCategory(list, 'alimentacao', 'saida')?.id, 1);
  assert.equal(findDuplicateCategory(list, 'ALIMENTAÇÃO', 'entrada')?.id, 2);
  assert.equal(findDuplicateCategory(list, 'Alimentação', 'saida', 1), null);
  assert.equal(findDuplicateCategory(list, 'Lazer', 'saida'), null);
});

test('isSameCategoryName: compara sem acento, caixa e espaços', () => {
  assert.equal(isSameCategoryName(' Outros ', 'outros'), true);
  assert.equal(isSameCategoryName('Saúde', 'saude'), true);
  assert.equal(isSameCategoryName('Lazer', 'Viagem'), false);
});

test('fetchAllPages: junta todas as páginas até vir uma incompleta', async () => {
  const all = Array.from({ length: 2503 }, (_, i) => i);
  const calls = [];
  const rows = await fetchAllPages(async (from, to) => {
    calls.push([from, to]);
    return { data: all.slice(from, to + 1), error: null };
  });
  assert.equal(rows.length, 2503);
  assert.deepEqual(calls, [[0, 999], [1000, 1999], [2000, 2999]]);
});

test('fetchAllPages: página exata faz mais uma leitura vazia e para', async () => {
  const all = Array.from({ length: 1000 }, (_, i) => i);
  let reads = 0;
  const rows = await fetchAllPages(async (from, to) => {
    reads += 1;
    return { data: all.slice(from, to + 1), error: null };
  });
  assert.equal(rows.length, 1000);
  assert.equal(reads, 2);
});

test('fetchAllPages: erro do banco vira 400 (nunca lista parcial)', async () => {
  await assert.rejects(
    fetchAllPages(async () => ({ data: null, error: { message: 'falhou' } })),
    (error) => error.status === 400 || error.statusCode === 400,
  );
});
