// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import BottomNavigation from './BottomNavigation';

vi.mock('../store/themeStore', () => ({
  useThemeStore: () => ({ isDarkMode: false }),
}));

function renderBottomNav(pathname = '/') {
  return render(
    <MemoryRouter
      initialEntries={[pathname]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <BottomNavigation />
    </MemoryRouter>
  );
}

describe('BottomNavigation (UX-GLOBAL-03)', () => {
  afterEach(() => {
    cleanup();
  });

  it('rótulo canónico Início na rota / com href correcto', () => {
    renderBottomNav('/');
    const inicio = screen.getByRole('link', { name: 'Início' });
    expect(inicio.getAttribute('href')).toBe('/');
  });

  it('Mais: texto visível, destino /settings e nome acessível descritivo', () => {
    renderBottomNav('/');
    const mais = screen.getByRole('link', {
      name: /Mais — conta, tema e outras opções/i,
    });
    expect(mais.getAttribute('href')).toBe('/settings');
    expect(mais.textContent).toContain('Mais');
  });

  it('landmark nav com etiqueta acessível e rota ativa com aria-current (M007 / UX-GLOBAL-07)', () => {
    renderBottomNav('/transacoes');
    const nav = screen.getByRole('navigation', { name: /Navegação principal \(mobile\)/i });
    expect(nav).toBeTruthy();
    const tx = screen.getByRole('link', { name: 'Transações' });
    expect(tx.getAttribute('aria-current')).toBe('page');
    const inicio = screen.getByRole('link', { name: 'Início' });
    expect(inicio.getAttribute('aria-current')).toBeNull();
  });
});
