import { describe, it, expect, vi } from 'vitest';
import { act } from 'react';
import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';

import { AppRoutes } from './App';

declare global {
  // React 18 testing flag to avoid act environment warnings.
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const { useAuthStoreMock } = vi.hoisted(() => {
  const state = {
    user: { id: 'user-1', email: 'user@test.com' },
    role: 'user',
    mei: false,
    sessionRestored: true,
    initAuth: vi.fn()
  };

  const hook = Object.assign(
    () => state,
    {
      getState: () => state
    }
  );

  return { useAuthStoreMock: hook };
});

vi.mock('./store/authStore', () => ({
  useAuthStore: useAuthStoreMock
}));

vi.mock('./lib/roles', () => ({
  hasRole: () => false
}));

vi.mock('./Layout/Layout', () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>
}));

vi.mock('./pages/Dashboard', () => ({
  default: () => <div>DASHBOARD_PAGE</div>
}));
vi.mock('./pages/GuidesMei', () => ({
  default: () => <div>GUIAS_MEI_PAGE</div>
}));
vi.mock('./pages/Transactions', () => ({ default: () => <div /> }));
vi.mock('./pages/Orcamentos', () => ({ default: () => <div /> }));
vi.mock('./pages/Categorias', () => ({ default: () => <div /> }));
vi.mock('./pages/Agenda', () => ({ default: () => <div /> }));
vi.mock('./pages/Settings', () => ({ default: () => <div /> }));
vi.mock('./pages/ManageUsers', () => ({ default: () => <div /> }));
vi.mock('./pages/AdminUserData', () => ({ default: () => <div /> }));
vi.mock('./pages/Login', () => ({ default: () => <div /> }));
vi.mock('./pages/LoginOnly', () => ({ default: () => <div /> }));
vi.mock('./pages/Register', () => ({ default: () => <div /> }));
vi.mock('./pages/ForgotPassword', () => ({ default: () => <div /> }));
vi.mock('./pages/ResetPassword', () => ({ default: () => <div /> }));
vi.mock('./lib/google-auth-flow', () => ({
  handleGoogleAuthCallback: vi.fn(async () => ({ success: true }))
}));

describe('AppRoutes mei gate', () => {
  it('redireciona /guias-mei para / quando mei=false', async () => {
    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <MemoryRouter
          initialEntries={['/guias-mei']}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <AppRoutes />
        </MemoryRouter>
      );
    });

    expect(container.textContent).toContain('DASHBOARD_PAGE');
    expect(container.textContent).not.toContain('GUIAS_MEI_PAGE');

    await act(async () => {
      root.unmount();
    });
  });
});
