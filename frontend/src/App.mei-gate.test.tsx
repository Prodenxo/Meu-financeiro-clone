import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react';
import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';

import { AppRoutes } from './App';

const globalWithActFlag = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
globalWithActFlag.IS_REACT_ACT_ENVIRONMENT = true;

const { useAuthStoreMock, authState } = vi.hoisted(() => {
  const state = {
    user: { id: 'user-1', email: 'user@test.com' },
    role: 'usuario',
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

  return { useAuthStoreMock: hook, authState: state };
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

vi.mock('./pages/Dashboard', async () => {
  const { useLocation } = await import('react-router-dom');
  const { AccessBlockedExplainer } = await import('./components/AccessBlockedExplainer');
  const { meiRequiredAccessBlockProps } = await import('./lib/accessBlockPresets');

  return {
    default: function MockDashboard() {
      const block = (useLocation().state as { accessBlock?: string } | null)?.accessBlock;
      return (
        <>
          {block === 'mei-required' ? (
            <AccessBlockedExplainer
              {...meiRequiredAccessBlockProps()}
              testId="access-block-mei-required"
              onDismiss={() => {}}
            />
          ) : null}
          <div>DASHBOARD_PAGE</div>
        </>
      );
    },
  };
});
vi.mock('./pages/GuidesMei', () => ({
  default: () => <div>GUIAS_MEI_PAGE</div>
}));
vi.mock('./pages/MeiCatalogoClientes', () => ({
  default: () => <div>MEI_CATALOGO_CLIENTES_PAGE</div>
}));
vi.mock('./pages/MeiCatalogoServicosProdutos', () => ({
  default: () => <div>MEI_CATALOGO_SERVICOS_PRODUTOS_PAGE</div>
}));
vi.mock('./pages/Transactions', () => ({ default: () => <div /> }));
vi.mock('./pages/Orcamentos', () => ({ default: () => <div /> }));
vi.mock('./pages/Categorias', () => ({ default: () => <div /> }));
vi.mock('./pages/Agenda', () => ({ default: () => <div /> }));
vi.mock('./pages/Settings', async () => {
  const { useLocation, useNavigate } = await import('react-router-dom');
  const { AccessBlockedExplainer } = await import('./components/AccessBlockedExplainer');
  const { adminSettingsRestrictedAccessBlockProps } = await import('./lib/accessBlockPresets');

  return {
    default: function MockSettings() {
      const loc = useLocation();
      const nav = useNavigate();
      const block = (loc.state as { accessBlock?: string } | null)?.accessBlock;
      return (
        <>
          {block === 'admin-settings-restricted' ? (
            <AccessBlockedExplainer
              {...adminSettingsRestrictedAccessBlockProps()}
              testId="access-block-admin-settings"
              onDismiss={() => {
                nav(loc.pathname, { replace: true, state: {} });
              }}
            />
          ) : null}
          <div>SETTINGS_PAGE</div>
        </>
      );
    },
  };
});
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
  beforeEach(() => {
    authState.role = 'usuario';
    authState.mei = false;
  });

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
    expect(container.textContent).toContain('Área Mei Infinito não disponível');

    await act(async () => {
      root.unmount();
    });
  });

  it('permite /guias-mei para superadmin mesmo com mei=false', async () => {
    authState.role = 'superadmin';
    authState.mei = false;

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

    expect(container.textContent).toContain('GUIAS_MEI_PAGE');
    expect(container.textContent).not.toContain('DASHBOARD_PAGE');

    await act(async () => {
      root.unmount();
    });
  });

  it('redireciona /guias-mei para / quando admin tem mei=false', async () => {
    authState.role = 'admin';
    authState.mei = false;

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
    expect(container.textContent).toContain('Área Mei Infinito não disponível');

    await act(async () => {
      root.unmount();
    });
  });

  it('redireciona /mei-catalogo/clientes para / quando mei=false', async () => {
    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <MemoryRouter
          initialEntries={['/mei-catalogo/clientes']}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <AppRoutes />
        </MemoryRouter>
      );
    });

    expect(container.textContent).toContain('DASHBOARD_PAGE');
    expect(container.textContent).not.toContain('MEI_CATALOGO_CLIENTES_PAGE');
    expect(container.textContent).toContain('Área Mei Infinito não disponível');

    await act(async () => {
      root.unmount();
    });
  });

  it('permite /mei-catalogo/clientes quando usuario tem mei=true', async () => {
    authState.mei = true;

    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <MemoryRouter
          initialEntries={['/mei-catalogo/clientes']}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <AppRoutes />
        </MemoryRouter>
      );
    });

    expect(container.textContent).toContain('MEI_CATALOGO_CLIENTES_PAGE');

    await act(async () => {
      root.unmount();
    });
  });

  it('redireciona /mei-catalogo/servicos-produtos para / quando mei=false', async () => {
    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <MemoryRouter
          initialEntries={['/mei-catalogo/servicos-produtos']}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <AppRoutes />
        </MemoryRouter>
      );
    });

    expect(container.textContent).toContain('DASHBOARD_PAGE');
    expect(container.textContent).not.toContain('MEI_CATALOGO_SERVICOS_PRODUTOS_PAGE');
    expect(container.textContent).toContain('Área Mei Infinito não disponível');

    await act(async () => {
      root.unmount();
    });
  });

  it('permite /mei-catalogo/servicos-produtos quando usuario tem mei=true', async () => {
    authState.mei = true;

    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <MemoryRouter
          initialEntries={['/mei-catalogo/servicos-produtos']}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <AppRoutes />
        </MemoryRouter>
      );
    });

    expect(container.textContent).toContain('MEI_CATALOGO_SERVICOS_PRODUTOS_PAGE');

    await act(async () => {
      root.unmount();
    });
  });

  it('permite /mei-catalogo/clientes para superadmin mesmo com mei=false', async () => {
    authState.role = 'superadmin';
    authState.mei = false;

    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <MemoryRouter
          initialEntries={['/mei-catalogo/clientes']}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <AppRoutes />
        </MemoryRouter>
      );
    });

    expect(container.textContent).toContain('MEI_CATALOGO_CLIENTES_PAGE');

    await act(async () => {
      root.unmount();
    });
  });

  it('redireciona /mei-catalogo/servicos-produtos para / quando admin tem mei=false', async () => {
    authState.role = 'admin';
    authState.mei = false;

    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <MemoryRouter
          initialEntries={['/mei-catalogo/servicos-produtos']}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <AppRoutes />
        </MemoryRouter>
      );
    });

    expect(container.textContent).toContain('DASHBOARD_PAGE');
    expect(container.textContent).not.toContain('MEI_CATALOGO_SERVICOS_PRODUTOS_PAGE');
    expect(container.textContent).toContain('Área Mei Infinito não disponível');

    await act(async () => {
      root.unmount();
    });
  });

  it('redireciona /settings/users para /settings com aviso quando utilizador não é admin', async () => {
    authState.role = 'usuario';

    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <MemoryRouter
          initialEntries={['/settings/users']}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <AppRoutes />
        </MemoryRouter>
      );
    });

    expect(container.textContent).toContain('SETTINGS_PAGE');
    expect(container.textContent).toContain('Acesso reservado a administradores');

    await act(async () => {
      root.unmount();
    });
  });

  it('redireciona /settings/usuarios-dados para /settings com aviso quando utilizador não é admin', async () => {
    authState.role = 'usuario';

    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <MemoryRouter
          initialEntries={['/settings/usuarios-dados']}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <AppRoutes />
        </MemoryRouter>
      );
    });

    expect(container.textContent).toContain('SETTINGS_PAGE');
    expect(container.textContent).toContain('Acesso reservado a administradores');

    await act(async () => {
      root.unmount();
    });
  });
});
