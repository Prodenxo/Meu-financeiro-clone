import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  aggregateBpoMonths,
  buildBpoChartSeries,
  buildBpoMatrixViewModel,
  buildBpoTable,
  computeBpoVariacao,
  formatBpoMetricValue,
  parseBpoYear,
  toggleBpoColumn,
} from './bpo.js';

const categories = [
  { id: 1, nome: 'Vendas', tipo: 'entrada' },
  { id: 2, nome: 'Aluguel', tipo: 'saida' },
  { id: 3, nome: 'Água', tipo: 'saída' },
];

const cells = [
  { categorias_id: 1, month: 1, valor_orcado: 1000, valor_gasto: 0, valor_recebido: 800 },
  { categorias_id: 2, month: 1, valor_orcado: 500, valor_gasto: 600, valor_recebido: 0 },
  { categorias_id: 3, month: 5, valor_orcado: null, valor_gasto: 0, valor_recebido: 0 },
];

test('variação é realizado menos orçado, e some quando não há orçamento', () => {
  assert.equal(computeBpoVariacao(1000, 800), -200);
  assert.equal(computeBpoVariacao(null, 800), null);
  assert.equal(computeBpoVariacao(0, 0), 0);
});

test('resultado do mês e o total do ano seguem o painel antigo', () => {
  const model = buildBpoMatrixViewModel(categories, cells);
  const table = buildBpoTable(model, '');
  assert.deepEqual(model.receitas.map((r) => r.nome), ['Vendas']);
  assert.deepEqual(model.despesas.map((r) => r.nome), ['Aluguel']);
  assert.equal(table.resultado[0].realizado, 200);
  assert.equal(table.resultado[0].orcado, 500);
  assert.equal(table.resultado[0].variacao, -300);
  assert.equal(aggregateBpoMonths(table.resultado).realizado, 200);
  assert.equal(formatBpoMetricValue('orcado', table.receitaSubtotal[4]), '—');
  assert.equal(formatBpoMetricValue('realizado', table.receitaSubtotal[4]), formatBpoMetricValue('realizado', { realizado: 0 }));
});

test('filtro por categoria refaz subtotal e resultado', () => {
  const model = buildBpoMatrixViewModel(categories, cells);
  const filtrada = buildBpoTable(model, '2');
  assert.equal(filtrada.receitas.length, 0);
  assert.equal(filtrada.despesas.length, 1);
  assert.equal(filtrada.resultado[0].realizado, -600);
  assert.equal(buildBpoTable(model, '').receitas.length, 1);
  assert.equal(buildBpoTable(model, '999').isEmpty, true);
});

test('gráficos usam os subtotais da matriz, com orçado ausente em null', () => {
  const model = buildBpoMatrixViewModel(categories, cells);
  const series = buildBpoChartSeries(model, 2026);
  assert.equal(series[0].label, 'Jan/26');
  assert.equal(series[0].receitas, 800);
  assert.equal(series[0].despesas, 600);
  assert.equal(series[0].orcado, 1500);
  assert.equal(series[0].realizado, 1400);
  assert.equal(series[4].orcado, null);
  assert.equal(series[4].realizado, 0);
});

test('não desliga a última coluna e o ano fica entre 2020 e o ano atual', () => {
  assert.deepEqual(toggleBpoColumn(['orcado'], 'orcado'), ['orcado']);
  assert.deepEqual(toggleBpoColumn(['orcado', 'realizado', 'variacao'], 'variacao'), ['orcado', 'realizado']);
  assert.equal(parseBpoYear('1990', 2026), 2020);
  assert.equal(parseBpoYear('2030', 2026), 2026);
  assert.equal(parseBpoYear('abc', 2026), 2026);
});
