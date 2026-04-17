// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DreBudgetPanel from './DreBudgetPanel';

function setMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  });
}

vi.mock('../../hooks/useDreMatrix', () => ({
  useDreMatrix: () => ({
    categories: [{ id: 1, nome: 'Teste', tipo: 'entrada', user_id: 'u' }],
    cells: Array.from({ length: 12 }, (_, i) => ({
      categorias_id: 1,
      month: i + 1,
      valor_orcado: 100,
      valor_gasto: 0,
      valor_recebido: 50
    })),
    loading: false,
    error: null,
    refetch: vi.fn()
  })
}));

vi.mock('../../hooks/useMediaQueryMinLg', () => ({
  useMediaQueryMinLg: () => true
}));

describe('DreBudgetPanel — densidade DRE (FR-DRE-CMP)', () => {
  beforeEach(() => {
    localStorage.clear();
    setMatchMedia(true);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('expõe radiogroup Simples/Completo com dados na DRE', () => {
    render(
      <DreBudgetPanel
        userId="u1"
        year={2026}
        onYearChange={vi.fn()}
        yearOptions={[2025, 2026]}
        onGoToMonthTab={vi.fn()}
      />
    );
    expect(screen.getByRole('radiogroup', { name: /Densidade da tabela DRE/i })).not.toBeNull();
    expect(screen.getByRole('radio', { name: /^Simples$/ }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('radio', { name: /^Completo$/ }).getAttribute('aria-checked')).toBe('false');
  });

  it('anúncio de densidade em região aria-live separada do período (mitigação QA)', () => {
    render(
      <DreBudgetPanel
        userId="u1"
        year={2026}
        onYearChange={vi.fn()}
        yearOptions={[2025, 2026]}
        onGoToMonthTab={vi.fn()}
      />
    );
    const periodo = screen.getByRole('status', { name: /período e comparação de meses/i });
    const densidade = screen.getByRole('status', { name: /alterar vista Simples ou Completa/i });
    expect(periodo.textContent?.trim() ?? '').toBe('');
    expect(densidade.textContent?.trim() ?? '').toBe('');

    fireEvent.click(screen.getByRole('radio', { name: /^Completo$/ }));
    expect(densidade.textContent ?? '').toMatch(/DRE em modo Completo/i);
    expect(screen.getByRole('radio', { name: /^Completo$/ }).getAttribute('aria-checked')).toBe('true');
  });
});
