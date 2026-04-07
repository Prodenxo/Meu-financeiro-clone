// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const fetchCategoriesMock = vi.fn();
const fetchCategoryBudgetsSummaryMock = vi.fn();
const removeCategoryBudgetPlanningMock = vi.fn();
const saveCategoryBudgetMock = vi.fn();
const duplicateMonthlyBudgetsMock = vi.fn();

vi.mock('../store/authStore', () => ({
  useAuthStore: () => ({ userId: 'user-orc-test' })
}));

vi.mock('../components/orcamentos/DreBudgetPanel', () => ({
  default: function DreBudgetPanelMock({ matrixDataRevision = 0 }: { matrixDataRevision?: number }) {
    return (
      <div
        data-testid="dre-budget-panel-mock"
        data-matrix-data-revision={String(matrixDataRevision)}
      />
    );
  }
}));

vi.mock('../services/categoryService', () => ({
  fetchCategories: (...args: unknown[]) => fetchCategoriesMock(...args),
  fetchCategoryBudgetsSummary: (...args: unknown[]) => fetchCategoryBudgetsSummaryMock(...args),
  removeCategoryBudgetPlanning: (...args: unknown[]) => removeCategoryBudgetPlanningMock(...args),
  saveCategoryBudget: (...args: unknown[]) => saveCategoryBudgetMock(...args),
  duplicateMonthlyBudgets: (...args: unknown[]) => duplicateMonthlyBudgetsMock(...args)
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock('../lib/toast', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
    info: vi.fn()
  }
}));

import Orcamentos from './Orcamentos';
import { ORCAMENTO_REMOVE_PLANNING_ERROR_TOAST } from '../copy/orcamentosRemovePlanning';

describe('Orcamentos — ações por linha (remover planejamento)', () => {
  let matchMediaRestore: (() => void) | undefined;

  afterEach(() => {
    matchMediaRestore?.();
    matchMediaRestore = undefined;
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    fetchCategoriesMock.mockResolvedValue([
      { id: 1, nome: 'Salário', tipo: 'entrada', user_id: 'user-orc-test' }
    ]);
    fetchCategoryBudgetsSummaryMock.mockResolvedValue([
      {
        categorias_id: 1,
        valor_orcado: 2900,
        valor_gasto: 0,
        valor_recebido: 2200
      }
    ]);
    duplicateMonthlyBudgetsMock.mockResolvedValue({ targetMonthStart: '2026-04-01', duplicated: 0 });
    saveCategoryBudgetMock.mockResolvedValue(undefined);
    removeCategoryBudgetPlanningMock.mockImplementation(async () => {
      fetchCategoryBudgetsSummaryMock.mockResolvedValueOnce([
        {
          categorias_id: 1,
          valor_orcado: null,
          valor_gasto: 0,
          valor_recebido: 2200
        }
      ]);
      return { categorias_id: 1, valor_orcado: null };
    });
  });

  it('abre diálogo de confirmação; Cancelar não chama removeCategoryBudgetPlanning', async () => {
    render(
      <MemoryRouter>
        <Orcamentos />
      </MemoryRouter>
    );

    await screen.findByText('Salário');
    const removeBtn = screen.getByRole('button', { name: /Remover planejamento de Salário em/i });
    fireEvent.click(removeBtn);

    const dlg = await screen.findByTestId('orcamento-remove-planning-confirm');
    expect(within(dlg).getByRole('heading', { name: /Remover planejamento deste mês/i })).toBeTruthy();
    expect(within(dlg).getByText(/não são apagados/i)).toBeTruthy();

    fireEvent.click(within(dlg).getByRole('button', { name: /^Cancelar$/i }));

    await waitFor(() => expect(screen.queryByTestId('orcamento-remove-planning-confirm')).toBeNull());
    expect(removeCategoryBudgetPlanningMock).not.toHaveBeenCalled();
  });

  it('confirmar chama removeCategoryBudgetPlanning com null e date YYYY-MM-DD; toast de sucesso', async () => {
    render(
      <MemoryRouter>
        <Orcamentos />
      </MemoryRouter>
    );

    await screen.findByText('Salário');
    fireEvent.click(screen.getByRole('button', { name: /Remover planejamento de Salário em/i }));

    const dlg = await screen.findByTestId('orcamento-remove-planning-confirm');
    fireEvent.click(within(dlg).getByRole('button', { name: /^Remover planejamento$/i }));

    await waitFor(() => expect(removeCategoryBudgetPlanningMock).toHaveBeenCalledTimes(1));
    const call = removeCategoryBudgetPlanningMock.mock.calls[0];
    expect(call[0]).toBe('user-orc-test');
    expect(call[1]).toBe(1);
    expect(call[2]).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('Planejamento removido.'));
    await waitFor(() => expect(screen.queryByTestId('orcamento-remove-planning-confirm')).toBeNull());
  });

  it('FR-ORC-ACT-10 / QA: após remover planejamento com sucesso, matrixDataRevision incrementa (wiring Orcamentos → DRE)', async () => {
    render(
      <MemoryRouter>
        <Orcamentos />
      </MemoryRouter>
    );

    await screen.findByText('Salário');
    const drePanel = screen.getByTestId('dre-budget-panel-mock');
    expect(drePanel.getAttribute('data-matrix-data-revision')).toBe('0');

    fireEvent.click(screen.getByRole('button', { name: /Remover planejamento de Salário em/i }));
    const dlg = await screen.findByTestId('orcamento-remove-planning-confirm');
    fireEvent.click(within(dlg).getByRole('button', { name: /^Remover planejamento$/i }));

    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('Planejamento removido.'));
    await waitFor(() =>
      expect(screen.getByTestId('dre-budget-panel-mock').getAttribute('data-matrix-data-revision')).toBe('1')
    );
  });

  it('com modal Novo Orçamento aberto, botões de ação da tabela ficam desabilitados', async () => {
    render(
      <MemoryRouter>
        <Orcamentos />
      </MemoryRouter>
    );

    await screen.findByText('Salário');
    fireEvent.click(screen.getByRole('button', { name: /^Novo Orçamento$/i }));

    expect(screen.getByRole('heading', { name: /Novo Orçamento/i })).toBeTruthy();

    const editBtn = screen.getByRole('button', { name: /Editar planejamento de Salário/i });
    const removeBtn = screen.getByRole('button', { name: /Remover planejamento de Salário em/i });
    expect((editBtn as HTMLButtonElement).disabled).toBe(true);
    expect((removeBtn as HTMLButtonElement).disabled).toBe(true);
  });

  it('FR-ORC-ACT-07: falha ao remover mantém diálogo, alerta, toast.error e linha', async () => {
    removeCategoryBudgetPlanningMock.mockRejectedValueOnce(new Error('network'));

    render(
      <MemoryRouter>
        <Orcamentos />
      </MemoryRouter>
    );

    await screen.findByText('Salário');
    fireEvent.click(screen.getByRole('button', { name: /Remover planejamento de Salário em/i }));

    const dlg = await screen.findByTestId('orcamento-remove-planning-confirm');
    fireEvent.click(within(dlg).getByRole('button', { name: /^Remover planejamento$/i }));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith(ORCAMENTO_REMOVE_PLANNING_ERROR_TOAST));

    expect(screen.getByTestId('orcamento-remove-planning-confirm')).toBeTruthy();
    expect(within(dlg).getByRole('alert').textContent).toContain('Não foi possível remover');
    expect(screen.getAllByText('Salário').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId('dre-budget-panel-mock').getAttribute('data-matrix-data-revision')).toBe('0');
  });

  it('FR-ORC-ACT-02: Editar chama focus (e select com pointer: fine) no input Planejado', async () => {
    const focusSpy = vi.spyOn(HTMLInputElement.prototype, 'focus').mockImplementation(() => {});
    const selectSpy = vi.spyOn(HTMLInputElement.prototype, 'select').mockImplementation(() => {});
    const prevMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(pointer: fine)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    })) as typeof window.matchMedia;
    matchMediaRestore = () => {
      window.matchMedia = prevMatchMedia;
    };

    render(
      <MemoryRouter>
        <Orcamentos />
      </MemoryRouter>
    );

    await screen.findByText('Salário');
    fireEvent.click(screen.getByRole('button', { name: /Editar planejamento de Salário/i }));

    await waitFor(() => {
      expect(focusSpy).toHaveBeenCalled();
      expect(selectSpy).toHaveBeenCalled();
    });

    focusSpy.mockRestore();
    selectSpy.mockRestore();
  });

  it('FR-ORC-ACT-08: durante saveCategoryBudget pendente, ícones Editar/Remover da linha desabilitados', async () => {
    saveCategoryBudgetMock.mockImplementation(
      () =>
        new Promise(() => {
          /* nunca resolve — mantém savingBudgetByCategory */
        })
    );

    render(
      <MemoryRouter>
        <Orcamentos />
      </MemoryRouter>
    );

    await screen.findByText('Salário');
    const input = screen.getByRole('textbox', { name: /Orçamento da categoria Salário/i });
    fireEvent.change(input, { target: { value: 'R$ 3.000,00' } });
    fireEvent.blur(input);

    await waitFor(() => {
      const editBtn = screen.getByRole('button', { name: /Editar planejamento de Salário/i });
      const removeBtn = screen.getByRole('button', { name: /Remover planejamento de Salário em/i });
      expect((editBtn as HTMLButtonElement).disabled).toBe(true);
      expect((removeBtn as HTMLButtonElement).disabled).toBe(true);
    });
  });
});
