// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import Sidebar from './Sidebar';
import type { UserRole } from '../lib/roles';

const { useAuthStoreMock, authState } = vi.hoisted(() => {
  const state = {
    role: 'usuario' as UserRole,
    mei: true
  };
  const hook = Object.assign(() => state, { getState: () => state });
  return { useAuthStoreMock: hook, authState: state };
});

vi.mock('../store/authStore', () => ({
  useAuthStore: useAuthStoreMock
}));

function renderSidebar(pathname: string, expanded = true) {
  return render(
    <MemoryRouter
      initialEntries={[pathname]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Sidebar expanded={expanded} />
    </MemoryRouter>
  );
}

describe('Sidebar (Meu MEI)', () => {
  beforeEach(() => {
    authState.role = 'usuario';
    authState.mei = true;
  });

  afterEach(() => {
    cleanup();
  });

  it('com canAccessMeiArea mostra Meu MEI e não lista catálogo na barra lateral', () => {
    renderSidebar('/');

    expect(screen.getByRole('link', { name: /Meu MEI/i }).getAttribute('href')).toBe('/guias-mei');
    expect(screen.queryByRole('link', { name: /Catálogo — clientes/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /Catálogo — serviços/i })).toBeNull();
  });

  it('sem canAccessMeiArea (usuario mei=false) oculta Meu MEI', () => {
    authState.mei = false;

    renderSidebar('/');

    expect(screen.queryByRole('link', { name: /Meu MEI/i })).toBeNull();
  });

  it('em /mei-catalogo/clientes Meu MEI não fica ativo (rota fora do item da sidebar)', () => {
    renderSidebar('/mei-catalogo/clientes');

    const meiLink = screen.getByRole('link', { name: /Meu MEI/i });
    expect(meiLink.className).not.toMatch(/bg-blue-600/);
  });

  it('em /guias-mei Meu MEI fica ativo', () => {
    renderSidebar('/guias-mei');

    const meiLink = screen.getByRole('link', { name: /Meu MEI/i });
    expect(meiLink.className).toMatch(/bg-blue-600/);
  });
});

describe('Sidebar (Painel Admin)', () => {
  beforeEach(() => {
    authState.role = 'usuario';
    authState.mei = true;
  });

  afterEach(() => {
    cleanup();
  });

  it('admin vê Painel Admin primeiro, com destino /settings/usuarios-dados', () => {
    authState.role = 'admin';
    renderSidebar('/transacoes');

    const painel = screen.getByRole('link', { name: /^Painel Admin$/i });
    expect(painel.getAttribute('href')).toBe('/settings/usuarios-dados');
    const links = screen.getAllByRole('link');
    expect(links[0]).toBe(painel);
  });

  it('superadmin vê o mesmo item Painel Admin', () => {
    authState.role = 'superadmin';
    renderSidebar('/');

    expect(screen.getByRole('link', { name: /^Painel Admin$/i }).getAttribute('href')).toBe(
      '/settings/usuarios-dados'
    );
  });

  it('utilizador não admin não vê Painel Admin', () => {
    authState.role = 'usuario';
    renderSidebar('/');

    expect(screen.queryByRole('link', { name: /^Painel Admin$/i })).toBeNull();
  });

  it('em /settings/usuarios-dados o item Painel Admin fica ativo e Configurações não', () => {
    authState.role = 'admin';
    renderSidebar('/settings/usuarios-dados');

    const painel = screen.getByRole('link', { name: /^Painel Admin$/i });
    const config = screen.getByRole('link', { name: /^Configurações$/i });
    expect(painel.className).toMatch(/bg-blue-600/);
    expect(config.className).not.toMatch(/bg-blue-600/);
  });

  it('outsider não vê Painel Admin (FR-SIDEBAR-ADMIN-03)', () => {
    authState.role = 'outsider';
    renderSidebar('/');

    expect(screen.queryByRole('link', { name: /^Painel Admin$/i })).toBeNull();
  });

  it('sidebar colapsada: Painel Admin continua acessível por nome, primeiro link do menu (UX §8 cenário 5)', () => {
    authState.role = 'admin';
    renderSidebar('/orcamentos', false);

    const painel = screen.getByRole('link', { name: /^Painel Admin$/i });
    expect(painel.getAttribute('aria-label')).toBe('Painel Admin');
    expect(painel.getAttribute('title')).toBe('Painel Admin');
    const menu = screen.getByLabelText('Menu lateral');
    const links = menu.querySelectorAll('a[href]');
    expect(links[0]).toBe(painel);
  });

  it('subcaminho /settings/usuarios-dados/* mantém Painel Admin activo (FR-SIDEBAR-ADMIN-04)', () => {
    authState.role = 'admin';
    renderSidebar('/settings/usuarios-dados/detalhe');

    const painel = screen.getByRole('link', { name: /^Painel Admin$/i });
    expect(painel.className).toMatch(/bg-blue-600/);
  });
});
