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

describe('DrePeriodSidebar (a11y QA — roving tabindex + setas)', () => {
  beforeEach(() => {
    setMatchMedia(true);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('roving tabindex: apenas um botão com tabIndex 0 alinhado ao período selecionado', () => {
    render(<DrePeriodSidebar period={{ kind: 'month', month: 3 }} onPeriodChange={() => {}} />);
    const buttons = screen.getAllByRole('button');
    const tabStops = buttons.filter((b) => b.tabIndex === 0);
    expect(tabStops).toHaveLength(1);
    expect(tabStops[0].textContent).toBe('Março');
  });

  it('layout desktop (lg): ArrowDown move o foco para o mês seguinte', async () => {
    render(<DrePeriodSidebar period={{ kind: 'month', month: 3 }} onPeriodChange={() => {}} />);
    const marco = screen.getByRole('button', { name: 'Março' });
    marco.focus();
    fireEvent.keyDown(marco, { key: 'ArrowDown' });
    await waitFor(() => {
      expect(document.activeElement?.textContent).toBe('Abril');
    });
  });

  it('layout mobile: ArrowRight move o foco para o período seguinte', async () => {
    setMatchMedia(false);
    render(<DrePeriodSidebar period={{ kind: 'month', month: 1 }} onPeriodChange={() => {}} />);
    const jan = screen.getByRole('button', { name: 'Janeiro' });
    jan.focus();
    fireEvent.keyDown(jan, { key: 'ArrowRight' });
    await waitFor(() => {
      expect(document.activeElement?.textContent).toBe('Fevereiro');
    });
  });

  it('Home e End movem o foco para primeiro e último período', async () => {
    render(<DrePeriodSidebar period={{ kind: 'month', month: 6 }} onPeriodChange={() => {}} />);
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
});
