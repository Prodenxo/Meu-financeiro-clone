import { describe, expect, it } from 'vitest';
import type { Category, DreMatrixCell } from '../services/categoryService';
import {
  aggregateCategoryPeriod,
  buildDreMatrixViewModel,
  computeAtingimentoPercent,
  computePctReceitaLine,
  formatAtingimento,
  formatPctReceita,
  isCategoryEligibleInYear,
  normalizeDreMonths,
  toggleMonthInSelection
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

describe('normalizeDreMonths', () => {
  it('ordena, remove duplicados e trunca a maxK', () => {
    expect(normalizeDreMonths([3, 1, 3, 2], 4)).toEqual([1, 2, 3]);
    expect(normalizeDreMonths([12, 1, 5, 7, 3], 2)).toEqual([1, 3]);
  });
});

describe('toggleMonthInSelection', () => {
  it('adiciona mês respeitando maxK e rejeita ao exceder', () => {
    expect(toggleMonthInSelection([1], 3, 4)).toEqual({ next: [1, 3], rejected: false });
    expect(toggleMonthInSelection([1, 2, 3, 4], 5, 4)).toEqual({ next: [1, 2, 3, 4], rejected: true });
  });

  it('não remove o último mês restante', () => {
    expect(toggleMonthInSelection([2], 2, 4)).toEqual({ next: [2], rejected: false });
  });

  it('remove mês quando há mais de um', () => {
    expect(toggleMonthInSelection([1, 2], 2, 4)).toEqual({ next: [1], rejected: false });
  });
});

describe('FR-DRE-MUL-08 — realce em subtotais (P1)', () => {
  it('subtotal despesas com realizado > planejado → rose', () => {
    const categories: Category[] = [{ id: 2, nome: 'Aluguel', tipo: 'saida', user_id: 'u' }];
    const cells: DreMatrixCell[] = [
      { categorias_id: 2, month: 1, valor_orcado: 200, valor_gasto: 350, valor_recebido: 0 }
    ];
    const view = buildDreMatrixViewModel(categories, cells, 2026, { kind: 'month', month: 1 }, MESES);
    expect(view.despesas.subtotal.highlightRealizado).toBe('rose');
    expect(view.despesas.subtotal.highlightAtingimento).toBe('rose');
  });

  it('subtotal receitas com realizado < planejado → amber', () => {
    const categories: Category[] = [{ id: 1, nome: 'Salário', tipo: 'entrada', user_id: 'u' }];
    const cells: DreMatrixCell[] = [
      { categorias_id: 1, month: 1, valor_orcado: 1000, valor_gasto: 0, valor_recebido: 400 }
    ];
    const view = buildDreMatrixViewModel(categories, cells, 2026, { kind: 'month', month: 1 }, MESES);
    expect(view.receitas.subtotal.highlightRealizado).toBe('amber');
    expect(view.receitas.subtotal.highlightAtingimento).toBe('amber');
  });

  it('subtotal receitas com realizado > planejado → emerald (QA follow-up §5.6)', () => {
    const categories: Category[] = [{ id: 1, nome: 'Extra', tipo: 'entrada', user_id: 'u' }];
    const cells: DreMatrixCell[] = [
      { categorias_id: 1, month: 1, valor_orcado: 500, valor_gasto: 0, valor_recebido: 720 }
    ];
    const view = buildDreMatrixViewModel(categories, cells, 2026, { kind: 'month', month: 1 }, MESES);
    expect(view.receitas.subtotal.highlightRealizado).toBe('emerald');
    expect(view.receitas.subtotal.highlightAtingimento).toBe('emerald');
  });
});

describe('AC-DRE-MUL-01 paridade coluna vs mês único', () => {
  it('realizado da categoria no mês 1 na comparação iguala vista só mês 1', () => {
    const categories: Category[] = [
      { id: 1, nome: 'Salário', tipo: 'entrada', user_id: 'u' },
      { id: 2, nome: 'Aluguel', tipo: 'saida', user_id: 'u' }
    ];
    const cells: DreMatrixCell[] = [
      { categorias_id: 1, month: 1, valor_orcado: 1000, valor_gasto: 0, valor_recebido: 900 },
      { categorias_id: 1, month: 3, valor_orcado: 800, valor_gasto: 0, valor_recebido: 700 },
      { categorias_id: 2, month: 1, valor_orcado: 400, valor_gasto: 350, valor_recebido: 0 },
      { categorias_id: 2, month: 3, valor_orcado: 400, valor_gasto: 400, valor_recebido: 0 }
    ];
    const solo = buildDreMatrixViewModel(categories, cells, 2026, { kind: 'month', month: 1 }, MESES);
    const m1 = buildDreMatrixViewModel(categories, cells, 2026, { kind: 'month', month: 1 }, MESES);
    const m3 = buildDreMatrixViewModel(categories, cells, 2026, { kind: 'month', month: 3 }, MESES);
    const salSolo = solo.receitas.rows.find((r) => r.categorias_id === 1);
    const salCompare = m1.receitas.rows.find((r) => r.categorias_id === 1);
    expect(salCompare?.realizado).toBe(salSolo?.realizado);
    expect(m3.receitas.rows.find((r) => r.categorias_id === 1)?.realizado).toBe(700);
  });
});
