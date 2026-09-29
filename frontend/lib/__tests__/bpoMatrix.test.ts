import {
  aggregateBpoMonths,
  buildBpoMatrixViewModel,
  computeBpoVariacao,
} from '../bpoMatrix';
import type { DreMatrixCell } from '../categoryService';

describe('bpoMatrix', () => {
  it('calcula variação e resultado', () => {
    const categories = [
      { id: 1, nome: 'Vendas', tipo: 'entrada' },
      { id: 2, nome: 'Aluguel', tipo: 'saida' },
    ];
    const cells: DreMatrixCell[] = [
      { categorias_id: 1, month: 1, valor_orcado: 1000, valor_gasto: 0, valor_recebido: 800 },
      { categorias_id: 2, month: 1, valor_orcado: 500, valor_gasto: 600, valor_recebido: 0 },
    ];
    const model = buildBpoMatrixViewModel(categories, cells, [], 2026);
    expect(model.resultado[0].realizado).toBe(200);
    expect(computeBpoVariacao(1000, 800)).toBe(-200);
    expect(aggregateBpoMonths(model.resultado).realizado).toBe(200);
  });
});
