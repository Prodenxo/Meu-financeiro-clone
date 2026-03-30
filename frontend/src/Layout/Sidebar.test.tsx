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

    const meuMei = screen.getByRole('link', { name: /Meu MEI/i });
    expect(meuMei.className).not.toMatch(/bg-blue-600/);
  });

  it('em /guias-mei Meu MEI fica ativo', () => {
    renderSidebar('/guias-mei');

    const meuMei = screen.getByRole('link', { name: /Meu MEI/i });
    expect(meuMei.className).toMatch(/bg-blue-600/);
  });
});
