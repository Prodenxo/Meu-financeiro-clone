// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Register from './Register';

const globalWithActFlag = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
globalWithActFlag.IS_REACT_ACT_ENVIRONMENT = true;

const validateMock = vi.fn();
const acceptMock = vi.fn();

vi.mock('../services/invitesService', async () => {
  const actual = await vi.importActual<typeof import('../services/invitesService')>('../services/invitesService');
  return {
    ...actual,
    validateInviteTokenPublic: (...args: unknown[]) => validateMock(...args),
    acceptInviteRequest: (...args: unknown[]) => acceptMock(...args)
  };
});

const signUpMock = vi.fn();
const signInMock = vi.fn();
const initAuthMock = vi.fn();

vi.mock('../store/authStore', () => ({
  useAuthStore: (selector: (s: unknown) => unknown) =>
    selector({
      signUp: signUpMock,
      signIn: signInMock,
      initAuth: initAuthMock
    })
}));

vi.mock('../store/themeStore', () => ({
  useThemeStore: () => ({ isDarkMode: false })
}));

async function flushMicrotasks() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('Register — convite (US-INV-05)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateMock.mockResolvedValue({ status: 'valid' });
    acceptMock.mockResolvedValue({});
    signUpMock.mockResolvedValue(undefined);
    signInMock.mockResolvedValue(undefined);
    initAuthMock.mockResolvedValue(undefined);
  });

  it('sem query convite não chama validate público', async () => {
    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );
    });
    await flushMicrotasks();

    expect(validateMock).not.toHaveBeenCalled();
    expect(container.textContent).toContain('Acesso Restrito');

    await act(async () => {
      root.unmount();
    });
  });

  it('com ?convite= chama validate e mostra formulário quando válido', async () => {
    validateMock.mockResolvedValueOnce({ status: 'valid' });

    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/register?convite=secret-token']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );
    });
    await flushMicrotasks();

    expect(validateMock).toHaveBeenCalledWith('secret-token');
    expect(container.textContent).toContain('Criar conta com convite');
    expect(container.textContent).toContain('Cadastrar');
    expect(container.textContent).toContain('Pelo menos 8 caracteres');

    await act(async () => {
      root.unmount();
    });
  });

  it('convite expirado mostra mensagem sem formulário de cadastro', async () => {
    validateMock.mockResolvedValueOnce({ status: 'expired' });

    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/register?convite=x']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );
    });
    await flushMicrotasks();

    expect(container.textContent).toContain('expirou');
    expect(container.textContent).not.toContain('Cadastrar');

    await act(async () => {
      root.unmount();
    });
  });

  it('convite revogado mostra mensagem sem formulário de cadastro', async () => {
    validateMock.mockResolvedValueOnce({ status: 'revoked' });

    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/register?convite=x']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );
    });
    await flushMicrotasks();

    expect(container.textContent).toContain('cancelado');
    expect(container.textContent).not.toContain('Cadastrar');

    await act(async () => {
      root.unmount();
    });
  });

  it('convite já usado mostra mensagem sem formulário de cadastro', async () => {
    validateMock.mockResolvedValueOnce({ status: 'used' });

    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/register?convite=x']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );
    });
    await flushMicrotasks();

    expect(container.textContent).toContain('já foi utilizado');
    expect(container.textContent).not.toContain('Cadastrar');

    await act(async () => {
      root.unmount();
    });
  });

  it('convite inválido mostra mensagem sem formulário de cadastro', async () => {
    validateMock.mockResolvedValueOnce({ status: 'invalid' });

    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/register?convite=x']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );
    });
    await flushMicrotasks();

    expect(container.textContent).toContain('inválido');
    expect(container.textContent).not.toContain('Cadastrar');

    await act(async () => {
      root.unmount();
    });
  });
});
