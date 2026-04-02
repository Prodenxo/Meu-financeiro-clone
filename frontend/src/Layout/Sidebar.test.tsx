// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import Sidebar from './Sidebar';

const { useAuthStoreMock, authState } = vi.hoisted(() => {
  const state = {
    role: 'usuario' as 'superadmin' | 'admin' | 'usuario',
    mei: true
  };
  const hook = Object.assign(() => state, { getState: () => state });
  return { useAuthStoreMock: hook, authState: state };
});

vi.mock('../store/authStore', () => ({
  useAuthStore: useAuthStoreMock
}));

function renderSidebar(pathname: string) {
  return render(
    <MemoryRouter
      initialEntries={[pathname]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Sidebar expanded />
    </MemoryRouter>
  );
}

describe('Sidebar (Mei Infinito)', () => {
  beforeEach(() => {
    authState.role = 'usuario';
    authState.mei = true;
  });

  afterEach(() => {
    cleanup();
  });

  it('com canAccessMeiArea mostra Mei Infinito e não lista catálogo na barra lateral', () => {
    renderSidebar('/');

    expect(screen.getByRole('link', { name: /Mei Infinito/i }).getAttribute('href')).toBe('/guias-mei');
    expect(screen.queryByRole('link', { name: /Catálogo — clientes/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /Catálogo — serviços/i })).toBeNull();
  });

  it('sem canAccessMeiArea (usuario mei=false) oculta Mei Infinito', () => {
    authState.mei = false;

    renderSidebar('/');

    expect(screen.queryByRole('link', { name: /Mei Infinito/i })).toBeNull();
  });

  it('em /mei-catalogo/clientes Mei Infinito não fica ativo (rota fora do item da sidebar)', () => {
    renderSidebar('/mei-catalogo/clientes');

    const meiInfinitoLink = screen.getByRole('link', { name: /Mei Infinito/i });
    expect(meiInfinitoLink.className).not.toMatch(/bg-blue-600/);
  });

  it('em /guias-mei Mei Infinito fica ativo', () => {
    renderSidebar('/guias-mei');

    const meiInfinitoLink = screen.getByRole('link', { name: /Mei Infinito/i });
    expect(meiInfinitoLink.className).toMatch(/bg-blue-600/);
  });
});
