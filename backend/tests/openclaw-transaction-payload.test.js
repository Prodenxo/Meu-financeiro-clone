import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeOpenclawTransactionPayload } from '../src/services/openclaw-transaction-payload.js';

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
