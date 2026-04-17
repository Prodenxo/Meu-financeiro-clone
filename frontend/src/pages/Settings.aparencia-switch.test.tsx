// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useThemeStore } from '../store/themeStore';
import Settings from './Settings';

vi.mock('../lib/google-calendar', () => ({
  checkGoogleAuth: vi.fn().mockResolvedValue({ authenticated: false })
}));

vi.mock('../lib/google-auth-flow', () => ({
  initiateGoogleAuthFlow: vi.fn()
}));

vi.mock('../store/authStore', () => ({
  useAuthStore: () => ({
    user: { id: 'settings-test-user' },
    userId: 'settings-test-user',
    phone: '',
    displayName: 'Tester',
    updatePhone: vi.fn(),
    updateDisplayName: vi.fn(),
    signOut: vi.fn(),
    role: null
  })
}));

describe('Settings — Aparência (STORY-VIS-THEME-05)', () => {
  afterEach(() => {
    cleanup();
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('financas-pessoais-theme');
    useThemeStore.setState({ isDarkMode: false, initialized: true });
  });

  beforeEach(() => {
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('financas-pessoais-theme');
    useThemeStore.setState({ isDarkMode: false, initialized: true });
  });

  it('expõe interruptor com role=switch, aria-checked e aria-label (verificação /settings)', () => {
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    );

    const sw = screen.getByRole('switch', { name: /Modo escuro desativado/i });
    expect(sw).toBeTruthy();
    expect(sw.getAttribute('aria-checked')).toBe('false');
    expect(sw.className).toMatch(/min-h-11/);
    expect(sw.className).toMatch(/min-w-11/);
  });

  it('alterna tema: aria-checked e aria-label seguem isDarkMode (useThemeStore)', () => {
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    );

    const sw = screen.getByRole('switch');
    expect(sw.getAttribute('aria-checked')).toBe('false');

    fireEvent.click(sw);
    expect(sw.getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('switch', { name: /Modo escuro ativado/i })).toBeTruthy();
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    fireEvent.click(sw);
    expect(sw.getAttribute('aria-checked')).toBe('false');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('trilho: estado off — borda token + bg-slate-300; estado on — bg-blue-600 (FR-VIS-THEME-08)', () => {
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    );

    const sw = screen.getByRole('switch');
    const track = sw.querySelector('[aria-hidden="true"]');
    expect(track).toBeTruthy();
    const cn = track!.className;
    expect(cn).toMatch(/bg-slate-300/);
    expect(cn).toMatch(/color-surface-border/);

    fireEvent.click(sw);
    expect(track!.className).toMatch(/bg-blue-600/);
  });

  it('foco: switch é focável (tabIndex nativo do botão); anel focus-visible vem de index.css', () => {
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    );

    const sw = screen.getByRole('switch');
    sw.focus();
    expect(document.activeElement).toBe(sw);
  });
});
