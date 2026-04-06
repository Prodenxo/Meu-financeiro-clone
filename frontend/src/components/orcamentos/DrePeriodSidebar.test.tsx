// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DrePeriodSidebar from './DrePeriodSidebar';

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

describe('DrePeriodSidebar (a11y — roving tabindex + setas)', () => {
  beforeEach(() => {
    setMatchMedia(true);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('roving tabindex: um botão com tabIndex 0 no primeiro mês da seleção', () => {
    render(
      <DrePeriodSidebar
        selection={{ mode: 'months', months: [3] }}
        maxMonths={4}
        onToggleMonth={() => {}}
        onSelectAnnual={() => {}}
        onMonthFromAnnual={() => {}}
      />
    );
    const buttons = screen.getAllByRole('button');
    const tabStops = buttons.filter((b) => b.tabIndex === 0);
    expect(tabStops).toHaveLength(1);
    expect(tabStops[0].textContent).toBe('Março');
  });

  it('layout desktop (lg): ArrowDown move o foco para o mês seguinte', async () => {
    render(
      <DrePeriodSidebar
        selection={{ mode: 'months', months: [3] }}
        maxMonths={4}
        onToggleMonth={() => {}}
        onSelectAnnual={() => {}}
        onMonthFromAnnual={() => {}}
      />
    );
    const marco = screen.getByRole('button', { name: 'Março' });
    marco.focus();
    fireEvent.keyDown(marco, { key: 'ArrowDown' });
    await waitFor(() => {
      expect(document.activeElement?.textContent).toBe('Abril');
    });
  });

  it('layout mobile: ArrowRight move o foco para o período seguinte', async () => {
    setMatchMedia(false);
    render(
      <DrePeriodSidebar
        selection={{ mode: 'months', months: [1] }}
        maxMonths={2}
        onToggleMonth={() => {}}
        onSelectAnnual={() => {}}
        onMonthFromAnnual={() => {}}
      />
    );
    const jan = screen.getByRole('button', { name: 'Janeiro' });
    jan.focus();
    fireEvent.keyDown(jan, { key: 'ArrowRight' });
    await waitFor(() => {
      expect(document.activeElement?.textContent).toBe('Fevereiro');
    });
  });

  it('Home e End movem o foco para primeiro e último período', async () => {
    render(
      <DrePeriodSidebar
        selection={{ mode: 'months', months: [6] }}
        maxMonths={4}
        onToggleMonth={() => {}}
        onSelectAnnual={() => {}}
        onMonthFromAnnual={() => {}}
      />
    );
    const junho = screen.getByRole('button', { name: 'Junho' });
    junho.focus();
    fireEvent.keyDown(junho, { key: 'Home' });
    await waitFor(() => {
      expect(document.activeElement?.textContent).toBe('Janeiro');
    });
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'End' });
    await waitFor(() => {
      expect(document.activeElement?.textContent).toBe('Total anual');
    });
  });

  it('Total anual desabilitado com 2+ meses', () => {
    render(
      <DrePeriodSidebar
        selection={{ mode: 'months', months: [1, 3] }}
        maxMonths={4}
        onToggleMonth={() => {}}
        onSelectAnnual={() => {}}
        onMonthFromAnnual={() => {}}
      />
    );
    const anual = screen.getByRole('button', { name: 'Total anual' }) as HTMLButtonElement;
    expect(anual.disabled).toBe(true);
  });

  it('modo anual: roving no botão Total anual', () => {
    render(
      <DrePeriodSidebar
        selection={{ mode: 'annual' }}
        maxMonths={4}
        onToggleMonth={() => {}}
        onSelectAnnual={() => {}}
        onMonthFromAnnual={() => {}}
      />
    );
    const anual = screen.getByRole('button', { name: 'Total anual' });
    expect(anual.tabIndex).toBe(0);
    expect(anual.getAttribute('aria-pressed')).toBe('true');
  });
});
