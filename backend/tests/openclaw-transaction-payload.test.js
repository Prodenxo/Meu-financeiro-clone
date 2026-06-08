import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeOpenclawTransactionPayload,
  normalizeOpenclawTransactionUpdate,
  resolveOpenclawTransactionId,
} from '../src/services/openclaw-transaction-payload.js';

const categories = [
  { id: 1, nome: 'Salário', tipo: 'entrada' },
  { id: 2, nome: 'Alimentação', tipo: 'saida' },
];

test('normaliza ingresso → entrada, hoje → ISO, salario → Salário', () => {
  const r = normalizeOpenclawTransactionPayload(
    {
      tipo: 'ingresso',
      valor: 2500,
      classificacao: 'salario',
      data: 'hoje',
    },
    { categories },
  );
  assert.equal(r.tipo, 'entrada');
  assert.equal(r.valor, 2500);
  assert.equal(r.classificacao, 'Salário');
  assert.match(r.data, /^\d{4}-\d{2}-\d{2}$/);
});

test('rejeita código numérico inventado (ex.: 1110)', () => {
  assert.throws(
    () =>
      normalizeOpenclawTransactionPayload(
        { tipo: 'entrada', valor: 100, classificacao: '1110', data: 'hoje' },
        { categories },
      ),
    /classificacao/,
  );
});

test('resolveOpenclawTransactionId aceita id e transactionId', () => {
  const uuid = '72838e46-b426-410e-93bf-034617b9a89c';
  assert.equal(resolveOpenclawTransactionId({ id: uuid }), uuid);
  assert.equal(resolveOpenclawTransactionId({ transactionId: uuid }), uuid);
  assert.equal(resolveOpenclawTransactionId({}), null);
});

test('parse valor pt-BR', () => {
  const r = normalizeOpenclawTransactionPayload(
    {
      tipo: 'entrada',
      valor: '2.500,00',
      classificacao: 'Salário',
      data: '2026-06-02',
    },
    { categories },
  );
  assert.equal(r.valor, 2500);
});

test('resolve carteira padrão Meu Financeiro no create_transaction', () => {
  const contas = [
    { id: 'uuid-nubank', nome: 'Nubank', tipo: 'corrente', ativo: true },
    { id: 'uuid-padrao', nome: 'Meu Financeiro', tipo: 'dinheiro', ativo: true },
  ];
  const r = normalizeOpenclawTransactionPayload(
    {
      tipo: 'saida',
      valor: 50,
      classificacao: 'Alimentação',
      data: 'hoje',
    },
    { categories, contas },
  );
  assert.equal(r.conta_id, 'uuid-padrao');
  assert.equal(r.conta_nome, 'Meu Financeiro');
});

test('resolve carteira explícita no payload', () => {
  const contas = [
    { id: 'uuid-nubank', nome: 'Nubank', tipo: 'corrente', ativo: true },
    { id: 'uuid-padrao', nome: 'Meu Financeiro', tipo: 'dinheiro', ativo: true },
  ];
  const r = normalizeOpenclawTransactionPayload(
    {
      tipo: 'entrada',
      valor: 100,
      classificacao: 'Salário',
      data: '2026-06-02',
      carteira: 'Nubank',
    },
    { categories, contas },
  );
  assert.equal(r.conta_id, 'uuid-nubank');
  assert.equal(r.conta_nome, 'Nubank');
});

test('update_transaction — patch parcial com valor e carteira', () => {
  const uuid = '72838e46-b426-410e-93bf-034617b9a89c';
  const contas = [
    { id: 'uuid-nubank', nome: 'Nubank', tipo: 'corrente', ativo: true },
    { id: 'uuid-padrao', nome: 'Meu Financeiro', tipo: 'dinheiro', ativo: true },
  ];
  const r = normalizeOpenclawTransactionUpdate(
    { id: uuid, valor: '150,50', carteira: 'Nubank' },
    { contas },
  );
  assert.equal(r.id, uuid);
  assert.equal(r.valor, 150.5);
  assert.equal(r.conta_id, 'uuid-nubank');
  assert.equal(r.tipo, undefined);
});

test('update_transaction — exige id e pelo menos um campo', () => {
  assert.throws(
    () => normalizeOpenclawTransactionUpdate({ valor: 10 }, {}),
    /ID da transação/,
  );
  assert.throws(
    () => normalizeOpenclawTransactionUpdate({ id: 'x' }, {}),
    /Nenhum campo/,
  );
});
