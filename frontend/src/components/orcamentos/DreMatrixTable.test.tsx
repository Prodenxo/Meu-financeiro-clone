// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { Category, DreMatrixCell } from '../../services/categoryService';
import type { DreMatrixViewModel } from '../../utils/dreMatrix';
import { buildDreMatrixViewModel, formatDreCurrency } from '../../utils/dreMatrix';
import DreMatrixTable from './DreMatrixTable';

const TOOLTIPS = {
  atingimento: 'tip atingimento',
  pctReceita: 'tip pct'
};

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function vm(
  resultadoRealizado: number,
  receitaRealizado = 80
): DreMatrixViewModel {
  const sub = {
    planejado: 100,
    realizado: receitaRealizado,
    atingimentoLabel: '80,0 %',
    pctReceitaLabel: '100,0 %',
    highlightRealizado: 'none' as const,
    highlightAtingimento: 'none' as const
  };
  return {
    periodLabel: 'm',
    isEmpty: false,
    receitas: {
      rows: [
        {
          categorias_id: 1,
          nome: 'Salário',
          planejado: 100,
          realizado: receitaRealizado,
          atingimentoLabel: '80,0 %',
          pctReceitaLabel: '100,0 %',
          highlightRealizado: 'none',
          highlightAtingimento: 'none'
        }
      ],
      subtotal: { ...sub }
    },
    despesas: {
      rows: [],
      subtotal: {
        planejado: 0,
        realizado: 0,
        atingimentoLabel: '—',
        pctReceitaLabel: '—',
        highlightRealizado: 'none',
        highlightAtingimento: 'none'
      }
    },
    resultadoRealizado
  };
}

describe('DreMatrixTable — modo compare (QA: thead / colSpan / resultado)', () => {
  afterEach(() => {
    cleanup();
  });

  it('expõe título com id e tabela com aria-describedby', () => {
    const { container } = render(
      <DreMatrixTable
        variant="compare"
        models={[vm(100), vm(200)]}
        tableTitle="Comparando 2 meses: Janeiro, Março."
        tableDescriptionId="dre-compare-desc"
        tooltips={TOOLTIPS}
        monthNames={MESES}
        year={2026}
        compareMonths={[1, 3]}
        density="completo"
      />
    );
    const heading = container.querySelector('#dre-compare-desc');
    expect(heading).not.toBeNull();
    expect(heading?.textContent).toContain('Comparando 2 meses');
    const table = container.querySelector('table');
    expect(table?.getAttribute('aria-describedby')).toBe('dre-compare-desc');
  });

  it('thead: grupos por mês com scope colgroup e colSpan 3; segunda linha com 6 colunas de métricas', () => {
    const { container } = render(
      <DreMatrixTable
        variant="compare"
        models={[vm(10), vm(20)]}
        tableTitle="Comparando 2 meses: Janeiro, Março."
        tableDescriptionId="dre-compare-desc"
        tooltips={TOOLTIPS}
        monthNames={MESES}
        year={2026}
        compareMonths={[1, 3]}
        density="completo"
      />
    );
    const thead = container.querySelector('thead');
    expect(thead).not.toBeNull();
    const colgroups = thead!.querySelectorAll('tr:first-child th[scope="colgroup"]');
    expect(colgroups.length).toBe(2);
    colgroups.forEach((th) => {
      expect(th.getAttribute('colspan')).toBe('3');
    });
    expect(colgroups[0].textContent).toContain('Janeiro');
    expect(colgroups[0].textContent).toContain('2026');
    expect(colgroups[1].textContent).toContain('Março');

    const metricHeaders = thead!.querySelectorAll('tr:nth-child(2) th[scope="col"]');
    expect(metricHeaders.length).toBe(6);
  });

  it('cabeçalhos de secção Receitas/Despesas usam colSpan 1+3N (N=2 → 7)', () => {
    render(
      <DreMatrixTable
        variant="compare"
        models={[vm(1), vm(2)]}
        tableTitle="t"
        tooltips={TOOLTIPS}
        monthNames={MESES}
        year={2026}
        compareMonths={[1, 2]}
        density="completo"
      />
    );
    const receitasToggle = screen.getByRole('button', { name: /Receitas/i });
    const receitasTh = receitasToggle.closest('th');
    expect(receitasTh?.getAttribute('colspan')).toBe('7');
    const despesasToggle = screen.getByRole('button', { name: /Despesas/i });
    const despesasTh = despesasToggle.closest('th');
    expect(despesasTh?.getAttribute('colspan')).toBe('7');
  });

  it('linha Resultado: monetário por mês só em Realizado; restantes "—"', () => {
    const r1 = 350;
    const r2 = -120;
    render(
      <DreMatrixTable
        variant="compare"
        models={[vm(r1, 400), vm(r2, 50)]}
        tableTitle="Comparando 2 meses."
        tooltips={TOOLTIPS}
        monthNames={MESES}
        year={2026}
        compareMonths={[4, 5]}
        density="completo"
      />
    );
    const resultadoLabel = screen.getByText('Resultado (realizado)');
    const row = resultadoLabel.closest('tr');
    expect(row).not.toBeNull();
    const tds = within(row!).queryAllByRole('cell');
    expect(tds.length).toBe(6);
    expect(tds[0].textContent?.trim()).toBe(formatDreCurrency(r1));
    expect(tds[1].textContent?.trim()).toBe('—');
    expect(tds[2].textContent?.trim()).toBe('—');
    expect(tds[3].textContent?.trim()).toBe(formatDreCurrency(r2));
    expect(tds[4].textContent?.trim()).toBe('—');
    expect(tds[5].textContent?.trim()).toBe('—');
  });

  it('FR-DRE-MUL-08: realces diferentes por mês na mesma linha (despesa acima do plano só na coluna certa)', () => {
    const categories: Category[] = [{ id: 10, nome: 'Luz', tipo: 'saida', user_id: 'u' }];
    const cells: DreMatrixCell[] = [
      { categorias_id: 10, month: 1, valor_orcado: 100, valor_gasto: 160, valor_recebido: 0 },
      { categorias_id: 10, month: 2, valor_orcado: 100, valor_gasto: 50, valor_recebido: 0 }
    ];
    const m1 = buildDreMatrixViewModel(categories, cells, 2026, { kind: 'month', month: 1 }, MESES);
    const m2 = buildDreMatrixViewModel(categories, cells, 2026, { kind: 'month', month: 2 }, MESES);
    expect(m1.despesas.rows[0].highlightRealizado).toBe('rose');
    expect(m2.despesas.rows[0].highlightRealizado).toBe('none');

    render(
      <DreMatrixTable
        variant="compare"
        models={[m1, m2]}
        tableTitle="Comparando 2 meses."
        tooltips={TOOLTIPS}
        monthNames={MESES}
        year={2026}
        compareMonths={[1, 2]}
        density="completo"
      />
    );
    const row = screen.getByText('Luz').closest('tr');
    expect(row).not.toBeNull();
    const tds = row!.querySelectorAll('td');
    expect(tds[0].className).toContain('text-rose-600');
    expect(tds[3].className).not.toContain('text-rose-600');
  });
});

describe('DreMatrixTable — modo single', () => {
  afterEach(() => {
    cleanup();
  });

  it('uma única linha de cabeçalho de métricas (4 colunas)', () => {
    const { container } = render(
      <DreMatrixTable
        variant="single"
        models={[vm(99)]}
        tableTitle="Março 2026"
        tooltips={TOOLTIPS}
        monthNames={MESES}
        year={2026}
        compareMonths={[3]}
        density="completo"
      />
    );
    const theadRows = container.querySelectorAll('thead tr');
    expect(theadRows.length).toBe(1);
    const headers = theadRows[0].querySelectorAll('th[scope="col"]');
    expect(headers.length).toBe(4);
  });

  it('resultado negativo: célula Realizado com estilo rose (P1 UX)', () => {
    render(
      <DreMatrixTable
        variant="single"
        models={[vm(-75)]}
        tableTitle="t"
        tooltips={TOOLTIPS}
        monthNames={MESES}
        year={2026}
        compareMonths={[1]}
        density="completo"
      />
    );
    const tr = screen.getByText('Resultado (realizado)').closest('tr');
    expect(tr).not.toBeNull();
    const tds = tr!.querySelectorAll('td');
    expect(tds[0].className).toContain('text-rose-600');
    expect(tds[0].getAttribute('title')).toContain('negativo');
  });
});

describe('DreMatrixTable — densidade Simples (FR-DRE-CMP)', () => {
  afterEach(() => {
    cleanup();
  });

  it('modo single Simples: duas colunas (Categoria, Realizado)', () => {
    const { container } = render(
      <DreMatrixTable
        variant="single"
        density="simples"
        models={[vm(99)]}
        tableTitle="Março 2026"
        tooltips={TOOLTIPS}
        monthNames={MESES}
        year={2026}
        compareMonths={[3]}
      />
    );
    const headers = container.querySelectorAll('thead tr th[scope="col"]');
    expect(headers.length).toBe(2);
    expect(screen.queryByRole('columnheader', { name: /Atingimento/i })).toBeNull();
  });

  it('modo compare Simples: colSpan 1 por mês; subtotal Receitas com colSpan 3 (1+N)', () => {
    const { container } = render(
      <DreMatrixTable
        variant="compare"
        density="simples"
        models={[vm(10), vm(20)]}
        tableTitle="Comparando 2 meses."
        tooltips={TOOLTIPS}
        monthNames={MESES}
        year={2026}
        compareMonths={[1, 3]}
      />
    );
    const thead = container.querySelector('thead');
    expect(thead).not.toBeNull();
    const colgroups = thead!.querySelectorAll('tr:first-child th[scope="colgroup"]');
    expect(colgroups.length).toBe(2);
    colgroups.forEach((th) => {
      expect(th.getAttribute('colspan')).toBe('1');
    });
    const metricHeaders = thead!.querySelectorAll('tr:nth-child(2) th[scope="col"]');
    expect(metricHeaders.length).toBe(2);

    const receitasToggle = screen.getByRole('button', { name: /Receitas/i });
    expect(receitasToggle.closest('th')?.getAttribute('colspan')).toBe('3');
  });

  it('modo compare Simples: linha Resultado com 2 células (realizado por mês)', () => {
    const r1 = 100;
    const r2 = 200;
    render(
      <DreMatrixTable
        variant="compare"
        density="simples"
        models={[vm(r1, 400), vm(r2, 50)]}
        tableTitle="Comparando 2 meses."
        tooltips={TOOLTIPS}
        monthNames={MESES}
        year={2026}
        compareMonths={[4, 5]}
      />
    );
    const resultadoLabel = screen.getByText('Resultado (realizado)');
    const row = resultadoLabel.closest('tr');
    expect(row).not.toBeNull();
    const tds = within(row!).queryAllByRole('cell');
    expect(tds.length).toBe(2);
    expect(tds[0].textContent?.trim()).toBe(formatDreCurrency(r1));
    expect(tds[1].textContent?.trim()).toBe(formatDreCurrency(r2));
  });
});
