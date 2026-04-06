import { describe, expect, it } from 'vitest';
import type { Category, DreMatrixCell } from '../services/categoryService';
import {
  aggregateCategoryPeriod,
  buildDreMatrixViewModel,
  computeAtingimentoPercent,
  computePctReceitaLine,
  formatAtingimento,
  formatPctReceita,
  isCategoryEligibleInYear
} from './dreMatrix';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

describe('dreMatrix — AC-DRE-05 atingimento', () => {
  it('planejado > 0 devolve percentagem realizado/planejado', () => {
    expect(computeAtingimentoPercent(100, 50)).toBeCloseTo(50, 5);
    expect(formatAtingimento(computeAtingimentoPercent(100, 50))).toBe('50,0 %');
  });

  it('planejado = 0 → null e exibição "—" (com ou sem realizado)', () => {
    expect(computeAtingimentoPercent(0, 0)).toBeNull();
    expect(computeAtingimentoPercent(0, 100)).toBeNull();
    expect(formatAtingimento(null)).toBe('—');
  });
});

describe('dreMatrix — AC-DRE-05 % receita', () => {
  it('receita total > 0 → peso da linha', () => {
    expect(computePctReceitaLine(250, 1000)).toBeCloseTo(25, 5);
    expect(formatPctReceita(computePctReceitaLine(250, 1000))).toBe('25,0 %');
  });

  it('receita total = 0 → null e "—" em todas as linhas', () => {
    expect(computePctReceitaLine(100, 0)).toBeNull();
    expect(formatPctReceita(null)).toBe('—');
  });
});

describe('dreMatrix — subtotais e resultado', () => {
  it('buildDreMatrixViewModel agrega receitas, despesas e resultado (realizado)', () => {
    const categories: Category[] = [
      { id: 1, nome: 'Salário', tipo: 'entrada', user_id: 'u' },
      { id: 2, nome: 'Aluguel', tipo: 'saida', user_id: 'u' }
    ];
    const cells: DreMatrixCell[] = [
      { categorias_id: 1, month: 3, valor_orcado: 1000, valor_gasto: 0, valor_recebido: 800 },
      { categorias_id: 2, month: 3, valor_orcado: 400, valor_gasto: 450, valor_recebido: 0 }
    ];
    const vm = buildDreMatrixViewModel(categories, cells, 2026, { kind: 'month', month: 3 }, MESES);
    expect(vm.isEmpty).toBe(false);
    expect(vm.receitas.rows).toHaveLength(1);
    expect(vm.despesas.rows).toHaveLength(1);
    expect(vm.receitas.subtotal.realizado).toBe(800);
    expect(vm.despesas.subtotal.realizado).toBe(450);
    expect(vm.resultadoRealizado).toBe(350);
    expect(vm.receitas.subtotal.pctReceitaLabel).toBe('100,0 %');
  });

  it('total anual soma 12 meses', () => {
    const categories: Category[] = [
      { id: 10, nome: 'Extra', tipo: 'entrada', user_id: 'u' }
    ];
    const cells: DreMatrixCell[] = [
      { categorias_id: 10, month: 1, valor_orcado: 100, valor_gasto: 0, valor_recebido: 50 },
      { categorias_id: 10, month: 2, valor_orcado: 100, valor_gasto: 0, valor_recebido: 60 }
    ];
    const vm = buildDreMatrixViewModel(categories, cells, 2026, { kind: 'annual' }, MESES);
    expect(vm.receitas.subtotal.planejado).toBe(200);
    expect(vm.receitas.subtotal.realizado).toBe(110);
  });
});

describe('isCategoryEligibleInYear', () => {
  it('exclui categoria sem movimento nem planejado positivo no ano', () => {
    const cells: DreMatrixCell[] = [
      { categorias_id: 1, month: 1, valor_orcado: null, valor_gasto: 0, valor_recebido: 0 }
    ];
    expect(isCategoryEligibleInYear(1, 'saida', cells)).toBe(false);
  });

  it('inclui com realizado ≠ 0', () => {
    const cells: DreMatrixCell[] = [
      { categorias_id: 1, month: 1, valor_orcado: null, valor_gasto: 10, valor_recebido: 0 }
    ];
    expect(isCategoryEligibleInYear(1, 'saida', cells)).toBe(true);
  });
});

describe('buildDreMatrixViewModel — tipos canónicos', () => {
  it('ignora categorias com tipo fora entrada/saída mesmo com células na matriz', () => {
    const categories: Category[] = [
      { id: 99, nome: 'Outro', tipo: 'investimento', user_id: 'u' }
    ];
    const cells: DreMatrixCell[] = [
      { categorias_id: 99, month: 1, valor_orcado: 10, valor_gasto: 5, valor_recebido: 0 }
    ];
    const vm = buildDreMatrixViewModel(categories, cells, 2026, { kind: 'month', month: 1 }, MESES);
    expect(vm.isEmpty).toBe(true);
  });
});

describe('aggregateCategoryPeriod', () => {
  it('mês único usa só células desse mês', () => {
    const cells: DreMatrixCell[] = [
      { categorias_id: 5, month: 1, valor_orcado: 10, valor_gasto: 3, valor_recebido: 0 },
      { categorias_id: 5, month: 2, valor_orcado: 99, valor_gasto: 99, valor_recebido: 0 }
    ];
    const m1 = aggregateCategoryPeriod(5, 'saida', { kind: 'month', month: 1 }, cells);
    expect(m1.planejado).toBe(10);
    expect(m1.realizado).toBe(3);
  });
});
