import { describe, expect, it } from 'vitest';
import {
  aggregateBpoMonths,
  buildBpoMatrixViewModel,
  computeBpoVariacao,
  filterBpoRowsBySearch,
  formatBpoMetricValue
} from './bpoMatrix';
import type { Category, DreMatrixCell } from '../services/categoryService';

const categories: Category[] = [
  { id: 1, nome: 'Vendas', tipo: 'entrada', user_id: 'u1' },
  { id: 2, nome: 'Aluguel', tipo: 'saida', user_id: 'u1' }
];

const cells: DreMatrixCell[] = [
  { categorias_id: 1, month: 1, valor_orcado: 1000, valor_gasto: 0, valor_recebido: 800 },
  { categorias_id: 2, month: 1, valor_orcado: 500, valor_gasto: 600, valor_recebido: 0 }
];

describe('bpoMatrix — variação e agregação', () => {
  it('calcula variação como realizado − orçado', () => {
    expect(computeBpoVariacao(1000, 800)).toBe(-200);
    expect(computeBpoVariacao(null, 800)).toBeNull();
  });

  it('agrega meses no total anual', () => {
    const months = [
      { orcado: 100, previsto: 10, realizado: 90, variacao: -10 },
      { orcado: 200, previsto: 0, realizado: 250, variacao: 50 }
    ];
    const total = aggregateBpoMonths(months);
    expect(total.orcado).toBe(300);
    expect(total.realizado).toBe(340);
    expect(total.variacao).toBe(40);
  });
});

describe('bpoMatrix — view model', () => {
  it('monta receitas, despesas e resultado', () => {
    const model = buildBpoMatrixViewModel(categories, cells, [], 2026);
    expect(model.receitas).toHaveLength(1);
    expect(model.despesas).toHaveLength(1);
    expect(model.resultado[0].realizado).toBe(200);
  });

  it('inclui previsto de transações pendentes', () => {
    const model = buildBpoMatrixViewModel(categories, cells, [
      {
        classificacao: 'Vendas',
        tipo: 'entrada',
        status: 'a_receber',
        valor: 150,
        data: '2026-01-15'
      }
    ], 2026);
    expect(model.receitas[0].byMonth[0].previsto).toBe(150);
  });

  it('filtra categorias pela busca', () => {
    const model = buildBpoMatrixViewModel(categories, cells, [], 2026);
    const filtered = filterBpoRowsBySearch(model.receitas, 'vend');
    expect(filtered).toHaveLength(1);
    expect(filterBpoRowsBySearch(model.receitas, 'xyz')).toHaveLength(0);
  });
});

describe('bpoMatrix — formatação', () => {
  it('exibe traço quando não há orçado ou variação', () => {
    expect(formatBpoMetricValue('orcado', { orcado: null, previsto: 0, realizado: 0, variacao: null })).toBe('—');
    expect(formatBpoMetricValue('variacao', { orcado: null, previsto: 0, realizado: 100, variacao: null })).toBe('—');
  });
});
