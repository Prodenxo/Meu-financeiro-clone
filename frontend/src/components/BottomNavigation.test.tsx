// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import BottomNavigation from './BottomNavigation';
import type { UserRole } from '../lib/roles';

vi.mock('../store/themeStore', () => ({
  useThemeStore: () => ({ isDarkMode: false }),
}));

const { useAuthStoreMock, authState } = vi.hoisted(() => {
  const state = { role: 'usuario' as UserRole, mei: true as boolean | null };
  const hook = Object.assign(() => state, { getState: () => state });
  return { useAuthStoreMock: hook, authState: state };
});

vi.mock('../store/authStore', () => ({
  useAuthStore: useAuthStoreMock,
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

describe('BottomNavigation (Meu MEI mobile)', () => {
  beforeEach(() => {
    authState.role = 'usuario';
    authState.mei = true;
  });

  afterEach(() => {
    cleanup();
  });

  it('com acesso MEI mostra Meu MEI em vez de Categorias', () => {
    renderBottomNav('/');
    expect(screen.getByRole('link', { name: /Meu MEI — notas e guias/i }).getAttribute('href')).toBe(
      '/guias-mei'
    );
    expect(screen.queryByRole('link', { name: 'Categorias' })).toBeNull();
  });

  it('sem acesso MEI (mei=false) mantém Categorias e oculta Meu MEI', () => {
    authState.mei = false;
    renderBottomNav('/');
    expect(screen.getByRole('link', { name: 'Categorias' }).getAttribute('href')).toBe('/categorias');
    expect(screen.queryByRole('link', { name: /Meu MEI/i })).toBeNull();
  });

  it('em /guias-mei Meu MEI fica ativo (aria-current)', () => {
    renderBottomNav('/guias-mei');
    const mei = screen.getByRole('link', { name: /Meu MEI — notas e guias/i });
    expect(mei.getAttribute('aria-current')).toBe('page');
  });
});

describe('BottomNavigation (UX-GLOBAL-03)', () => {
  beforeEach(() => {
    authState.role = 'usuario';
    authState.mei = true;
  });

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

describe('BottomNavigation (Painel Admin mobile — SA-P1)', () => {
  beforeEach(() => {
    authState.role = 'usuario';
    authState.mei = true;
  });

  afterEach(() => {
    cleanup();
  });

  it('admin vê atalho Painel com destino /settings/usuarios-dados e nome acessível Painel Admin', () => {
    authState.role = 'admin';
    renderBottomNav('/transacoes');

    const painel = screen.getByRole('link', { name: /^Painel Admin$/i });
    expect(painel.getAttribute('href')).toBe('/settings/usuarios-dados');
    expect(painel.textContent).toContain('Painel');
  });

  it('superadmin vê o mesmo atalho', () => {
    authState.role = 'superadmin';
    renderBottomNav('/');

    expect(screen.getByRole('link', { name: /^Painel Admin$/i }).getAttribute('href')).toBe(
      '/settings/usuarios-dados'
    );
  });

  it('utilizador não admin não vê o atalho Painel', () => {
    authState.role = 'usuario';
    renderBottomNav('/');

    expect(screen.queryByRole('link', { name: /^Painel Admin$/i })).toBeNull();
  });

  it('outsider não vê o atalho Painel', () => {
    authState.role = 'outsider';
    renderBottomNav('/');

    expect(screen.queryByRole('link', { name: /^Painel Admin$/i })).toBeNull();
  });

  it('em /settings/usuarios-dados Painel tem aria-current e Mais não', () => {
    authState.role = 'admin';
    renderBottomNav('/settings/usuarios-dados');

    const painel = screen.getByRole('link', { name: /^Painel Admin$/i });
    const mais = screen.getByRole('link', { name: /Mais — conta, tema e outras opções/i });
    expect(painel.getAttribute('aria-current')).toBe('page');
    expect(mais.getAttribute('aria-current')).toBeNull();
  });

  it('admin: seis links na barra (grelha 6 colunas)', () => {
    authState.role = 'admin';
    renderBottomNav('/orcamentos');
    const nav = screen.getByRole('navigation', { name: /Navegação principal \(mobile\)/i });
    expect(nav.querySelectorAll('a[href]')).toHaveLength(6);
  });

  it('não-admin: cinco links na barra', () => {
    authState.role = 'usuario';
    renderBottomNav('/');
    const nav = screen.getByRole('navigation', { name: /Navegação principal \(mobile\)/i });
    expect(nav.querySelectorAll('a[href]')).toHaveLength(5);
  });
});
