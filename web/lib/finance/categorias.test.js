import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ORPHAN_ID,
  amountForCategory,
  buildCategoriasModel,
  buildCategoryRows,
  buildDistribution,
  buildRecentMovements,
  mergeCategoriesByName,
  monthTransactions,
} from './categorias.js';
import { normalizeLancamentoRow } from './normalize.js';

const userId = 'u1';
const selectedMonth = { year: 2026, month: 9 };

const categories = [
  { id: 10, nome: 'Água', tipo: 'saida', user_id: userId },
  { id: 11, nome: 'Alimentação', tipo: 'saída', user_id: userId },
  { id: 12, nome: 'Aluguel', tipo: 'saida', user_id: userId },
  { id: 20, nome: 'Salário', tipo: 'entrada', user_id: userId },
  { id: 99, nome: 'água', tipo: 'saida', user_id: null }, // global duplicada → perde para a do usuário
];

const tx = (id, tipo, valor, classificacao, data, status) =>
  normalizeLancamentoRow({ id, user_id: userId, tipo, valor, classificacao, data, status, criado_em: `${data}T12:00:00Z` });

const transactions = [
  tx(1, 'saída', 3700, 'Água', '2026-09-10', 'a_pagar'),
  tx(2, 'saída', 300, 'água ', '2026-09-22', 'pago'),
  tx(3, 'saída', 4000, 'Alimentação', '2026-09-20', 'pago'),
  tx(4, 'saída', 4300, 'PIX', '2026-09-05', 'pago'), // sem categoria cadastrada
  tx(5, 'entrada', 500, 'PIX', '2026-09-16', 'recebido'),
  tx(6, 'entrada', 9000, 'Salário', '2026-09-01', 'a_receber'), // pendente
  tx(7, 'saída', 800, 'Aluguel', '2026-08-30', 'pago'), // outro mês
];

describe('categorias do mês', () => {
  it('só considera lançamentos do mês e mescla duplicatas nome/tipo', () => {
    assert.equal(monthTransactions(transactions, selectedMonth).length, 6);
    const merged = mergeCategoriesByName(categories);
    assert.equal(merged.length, 4);
    assert.equal(merged.find((c) => c.nome === 'Água').user_id, userId);
  });

  it('soma saídas com qualquer status; entradas só recebidas, caindo para todas se nada recebido', () => {
    const monthTxs = monthTransactions(transactions, selectedMonth);
    assert.equal(amountForCategory(monthTxs, 'Água', 'saida'), 4000);
    assert.equal(amountForCategory(monthTxs, 'Salário', 'entrada'), 9000); // sem recebido → usa todos
  });

  it('cria linha "Sem categoria", ordena por valor e busca por nome', () => {
    const monthTxs = monthTransactions(transactions, selectedMonth);
    const rows = buildCategoryRows({ categories: mergeCategoriesByName(categories), monthTxs, viewTipo: 'saida' });
    assert.deepEqual(
      rows.map((r) => [r.nome, r.amount, r.count]),
      [
        ['Sem categoria', 4300, 1],
        ['Água', 4000, 2],
        ['Alimentação', 4000, 1],
        ['Aluguel', 0, 0],
      ],
    );
    assert.equal(rows[0].id, ORPHAN_ID);
    const found = buildCategoryRows({ categories: mergeCategoriesByName(categories), monthTxs, viewTipo: 'saida', search: 'alu' });
    assert.deepEqual(found.map((r) => r.nome), ['Aluguel']);
  });

  it('distribuição: maiores + "Outras"; total e contagens do modelo', () => {
    const model = buildCategoriasModel({ categories, transactions, selectedMonth, viewTipo: 'saida' });
    assert.equal(model.total, 12300);
    assert.deepEqual(model.counts, { total: 4, ofTipo: 3, active: 3 });
    assert.deepEqual(
      model.distribution.map((s) => [s.nome, Math.round(s.pct)]),
      [
        ['Sem categoria', 35],
        ['Água', 33],
        ['Alimentação', 33],
      ],
    );
    const withOthers = buildDistribution(model.rows, model.total, { limit: 1 });
    assert.equal(withOthers.at(-1).nome, 'Outras');
    assert.equal(withOthers.at(-1).valor, 8000);
  });

  it('últimas movimentações do mês, mais recentes primeiro, todos os tipos', () => {
    const recent = buildRecentMovements(monthTransactions(transactions, selectedMonth));
    assert.deepEqual(
      recent.map((r) => [r.title, r.dateLabel, r.tipo]),
      [
        ['água', '22 set. 2026', 'saida'],
        ['Alimentação', '20 set. 2026', 'saida'],
        ['PIX', '16 set. 2026', 'entrada'],
        ['Água', '10 set. 2026', 'saida'],
      ],
    );
  });
});
