import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildBudgetHistory,
  buildBudgetItems,
  buildBudgetTotals,
  buildMonthTrend,
  buildOrcamentosModel,
  budgetValuesForMonth,
  chartEndKey,
  filterBudgetItems,
  normalizeBudgetRow,
  sortBudgetItems,
} from './orcamentos.js';
import { normalizeLancamentoRow } from './normalize.js';

const userId = 'u1';
const selectedMonth = { year: 2026, month: 9 };
const today = new Date('2026-09-29T12:00:00');

const categories = [
  { id: '10', nome: 'Água', tipo: 'saida' },
  { id: '11', nome: 'Energia elétrica', tipo: 'saida' },
  { id: '12', nome: 'Salário', tipo: 'entrada' },
  { id: '13', nome: 'Lazer', tipo: 'saida' },
];

const budgetRows = [
  { id: 1, categorias_id: 10, 'valor_orçado': 100, user_id: userId, date: '2026-09-01' },
  { id: 2, categorias_id: 11, 'valor_orçado': '1500', user_id: userId, date: '2026-09-01' },
  { id: 3, categorias_id: 12, 'valor_orçado': 5000, user_id: null, date: '2026-09-01' }, // global
  { id: 4, categorias_id: 13, 'valor_orçado': null, user_id: userId, date: '2026-09-01' }, // placeholder
  { id: 5, categorias_id: 10, 'valor_orçado': 80, user_id: userId, date: '2026-08-01' }, // outro mês
  { id: 6, categorias_id: 12, 'valor_orçado': 1, user_id: 'outro', date: '2026-09-01' }, // outro usuário
].map(normalizeBudgetRow);

const tx = (id, tipo, valor, classificacao, data, status) =>
  normalizeLancamentoRow({ id, user_id: userId, tipo, valor, classificacao, data, status, criado_em: `${data}T12:00:00Z` });

const transactions = [
  tx(1, 'saída', 4000, 'Água', '2026-09-10', 'a_pagar'), // pendente conta como gasto (regra do app)
  tx(2, 'saída', 50, 'água ', '2026-09-20', 'pago'), // casa por nome normalizado
  tx(3, 'saída', 300, 'Energia elétrica', '2026-08-30', 'pago'), // fora do mês
  tx(4, 'entrada', 3000, 'Salário', '2026-09-05', 'recebido'),
  tx(5, 'entrada', 2000, 'Salário', '2026-09-25', 'a_receber'), // pendente NÃO conta em receita
  tx(6, 'saída', 900, 'Lazer', '2026-09-12', 'pago'), // categoria sem orçamento
];

describe('limites do mês', () => {
  it('usa linha do usuário, aceita global e ignora nulos/outros meses/outros usuários', () => {
    const limits = budgetValuesForMonth(budgetRows, userId, selectedMonth);
    assert.deepEqual([...limits.entries()].sort(), [
      ['10', 100],
      ['11', 1500],
      ['12', 5000],
    ]);
  });
});

describe('itens e totais', () => {
  const items = buildBudgetItems({ budgetRows, transactions, categories, userId, selectedMonth });

  it('calcula realizado por regra de tipo e status', () => {
    const agua = items.find((i) => i.nome === 'Água');
    assert.equal(agua.realizado, 4050);
    assert.equal(agua.disponivel, -3950);
    assert.equal(agua.status.label, 'Acima do limite');
    assert.equal(agua.barPct, 100);
    assert.equal(Math.round(agua.percentual), 4050);

    const energia = items.find((i) => i.nome === 'Energia elétrica');
    assert.equal(energia.realizado, 0);
    assert.equal(energia.status.label, 'Dentro do limite');

    const salario = items.find((i) => i.nome === 'Salário');
    assert.equal(salario.realizado, 3000);
    assert.equal(salario.status.label, 'Em andamento');
    assert.equal(items.some((i) => i.nome === 'Lazer'), false);
  });

  it('totais e filtros/ordenação', () => {
    const totals = buildBudgetTotals(items);
    assert.equal(totals.orcado, 6600);
    assert.equal(totals.realizado, 7050);
    assert.equal(totals.diferenca, -450);
    assert.equal(totals.count, 3);
    assert.equal(totals.overCount, 1);

    assert.deepEqual(filterBudgetItems(items, 'over').map((i) => i.nome), ['Água']);
    assert.deepEqual(filterBudgetItems(items, 'entrada').map((i) => i.nome), ['Salário']);
    assert.deepEqual(sortBudgetItems(items, 'uso').map((i) => i.nome), ['Água', 'Salário', 'Energia elétrica']);
    assert.deepEqual(sortBudgetItems(items, 'disponivel').map((i) => i.nome), ['Água', 'Energia elétrica', 'Salário']);
  });
});

describe('gráficos', () => {
  it('fim da janela: hoje no mês atual, último dia nos outros', () => {
    assert.equal(chartEndKey(selectedMonth, today), '2026-09-29');
    assert.equal(chartEndKey(selectedMonth, '2026-09-29'), '2026-09-29'); // a página passa a chave do dia como texto
    assert.equal(chartEndKey({ year: 2026, month: 8 }, today), '2026-08-31');
  });

  it('acumula por categoria na janela', () => {
    const items = buildBudgetItems({ budgetRows, transactions, categories, userId, selectedMonth });
    const h = buildBudgetHistory({ items, transactions, categories, selectedMonth, today, range: '30d' });
    assert.equal(h.series.length, 30);
    assert.equal(h.series[0].dayKey, '2026-08-31');
    assert.equal(h.series.at(-1)['10'], 4050);
    assert.equal(h.series.at(-1)['12'], 3000);
    assert.equal(h.series[0]['11'], 0);
    assert.equal(h.categories.find((c) => c.id === '10').color, 'var(--mf-danger)');
  });

  it('tendência do mês = total acumulado por dia', () => {
    const items = buildBudgetItems({ budgetRows, transactions, categories, userId, selectedMonth });
    const trend = buildMonthTrend(items, transactions, categories, selectedMonth);
    assert.equal(trend.length, 30);
    assert.equal(trend[4], 3000); // dia 5
    assert.equal(trend[9], 7000); // dia 10
    assert.equal(trend.at(-1), 7050);
  });
});

describe('modelo', () => {
  it('lista categorias ainda sem orçamento para o modal', () => {
    const m = buildOrcamentosModel({ budgetRows, transactions, categories, userId, selectedMonth, today });
    assert.deepEqual(m.availableCategories.map((c) => c.nome), ['Lazer']);
    assert.equal(m.attention[0].nome, 'Água');
  });
});
