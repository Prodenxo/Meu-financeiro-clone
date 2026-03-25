// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

import ManageUsers from './ManageUsers';
import * as invitesService from '../services/invitesService';

const globalWithActFlag = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
globalWithActFlag.IS_REACT_ACT_ENVIRONMENT = true;

const { useAuthStoreMock, authState } = vi.hoisted(() => {
  const state = {
    role: 'usuario' as 'superadmin' | 'admin' | 'usuario' | 'outsider'
  };
  const hook = Object.assign(
    () => ({
      role: state.role
    }),
    { getState: () => state }
  );
  return { useAuthStoreMock: hook, authState: state };
});

vi.mock('../store/authStore', () => ({
  useAuthStore: useAuthStoreMock
}));

vi.mock('../lib/toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}));

vi.mock('../services/usersService', () => ({
  banUser: vi.fn(),
  createEmpresaLimits: vi.fn(),
  createUser: vi.fn(),
  deleteUser: vi.fn(),
  listEmpresas: vi.fn(async () => [
    { id: 'emp-1', empresa: 'Acme Ltda', max_mei: 0, max_usuarios_nao_mei: 0 }
  ]),
  listUsers: vi.fn(async () => []),
  resetUserPassword: vi.fn(),
  unbanUser: vi.fn(),
  updateEmpresaLimits: vi.fn(),
  updateUser: vi.fn()
}));

vi.mock('../services/invitesService', () => ({
  createInvite: vi.fn(),
  listPendingInvites: vi.fn(async () => ({ invites: [] })),
  revokeInvite: vi.fn()
}));

const createInviteMock = vi.mocked(invitesService.createInvite);
const listPendingInvitesMock = vi.mocked(invitesService.listPendingInvites);
const revokeInviteMock = vi.mocked(invitesService.revokeInvite);

async function flushMicrotasks() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('ManageUsers — convites (US-INV-04)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.role = 'usuario';
    listPendingInvitesMock.mockResolvedValue({ invites: [] });
    createInviteMock.mockResolvedValue({
      inviteUrl: 'https://app.test/register?convite=abc',
      invite: {
        id: 'inv-1',
        empresas_id: 'emp-1',
        expires_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        invited_email: null
      }
    });
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
  });

  it('usuário sem permissão vê mensagem de acesso negado e não vê convites', async () => {
    authState.role = 'usuario';

    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(<ManageUsers />);
    });
    await flushMicrotasks();

    expect(container.textContent).toContain('Você não tem permissão');
    expect(container.textContent).not.toContain('Convites por link');
    expect(listPendingInvitesMock).not.toHaveBeenCalled();

    await act(async () => {
      root.unmount();
    });
  });

  it('admin vê a seção de convites e lista pendentes ao montar', async () => {
    authState.role = 'admin';

    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(<ManageUsers />);
    });
    await flushMicrotasks();

    expect(container.textContent).toContain('Convites por link');
    expect(container.textContent).toContain('Gerar link');
    expect(listPendingInvitesMock).toHaveBeenCalledWith();

    await act(async () => {
      root.unmount();
    });
  });

  it('admin: gerar link e copiar usa inviteUrl da API e clipboard', async () => {
    authState.role = 'admin';

    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(<ManageUsers />);
    });
    await flushMicrotasks();

    const gerar = [...container.querySelectorAll('button')].find((b) =>
      b.textContent?.trim().includes('Gerar link')
    );
    expect(gerar).toBeTruthy();

    await act(async () => {
      gerar!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await flushMicrotasks();

    expect(createInviteMock).toHaveBeenCalledWith({});

    const copiar = [...container.querySelectorAll('button')].find(
      (b) => b.getAttribute('aria-label') === 'Copiar link de convite'
    );
    expect(copiar).toBeTruthy();
    expect((copiar as HTMLButtonElement).disabled).toBe(false);

    await act(async () => {
      copiar!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await flushMicrotasks();

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://app.test/register?convite=abc');

    await act(async () => {
      root.unmount();
    });
  });

  it('superadmin: gerar link envia createInvite com empresas_id após escolher empresa', async () => {
    authState.role = 'superadmin';

    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(<ManageUsers />);
    });
    await flushMicrotasks();

    const inviteSection = [...container.querySelectorAll('section.admin-section-card')].find((s) =>
      s.querySelector('h2.admin-section-title')?.textContent?.includes('Convites por link')
    );
    expect(inviteSection).toBeTruthy();

    const listarEmpresasConvite = inviteSection!.querySelector(
      'button[aria-label="Listar empresas para convite"]'
    ) as HTMLButtonElement | null;
    expect(listarEmpresasConvite).toBeTruthy();

    await act(async () => {
      listarEmpresasConvite!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const opcaoAcme = [...inviteSection!.querySelectorAll('button.admin-dropdown-option')].find((b) =>
      b.textContent?.includes('Acme Ltda')
    );
    expect(opcaoAcme).toBeTruthy();

    await act(async () => {
      opcaoAcme!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });
    await flushMicrotasks();

    const gerar = [...inviteSection!.querySelectorAll('button')].find((b) =>
      b.textContent?.trim().includes('Gerar link')
    );
    expect(gerar).toBeTruthy();
    expect((gerar as HTMLButtonElement).disabled).toBe(false);

    await act(async () => {
      gerar!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await flushMicrotasks();

    expect(createInviteMock).toHaveBeenCalledWith({ empresas_id: 'emp-1' });

    await act(async () => {
      root.unmount();
    });
  });

  it('admin: Revogar chama revokeInvite após confirm', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    revokeInviteMock.mockResolvedValue({
      id: 'to-revoke',
      revoked_at: '2026-01-05T12:00:00.000Z'
    });
    listPendingInvitesMock.mockResolvedValue({
      invites: [
        {
          id: 'to-revoke',
          empresas_id: 'emp-1',
          created_at: '2026-01-01T10:00:00.000Z',
          expires_at: '2026-01-10T10:00:00.000Z',
          created_by: 'user-1',
          invited_email: null
        }
      ]
    });
    authState.role = 'admin';

    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(<ManageUsers />);
    });
    await flushMicrotasks();

    const revogar = [...container.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Revogar');
    expect(revogar).toBeTruthy();

    await act(async () => {
      revogar!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await flushMicrotasks();

    expect(confirmSpy).toHaveBeenCalled();
    expect(revokeInviteMock).toHaveBeenCalledWith('to-revoke');

    confirmSpy.mockRestore();

    await act(async () => {
      root.unmount();
    });
  });

  it('admin: Revogar não chama API quando confirm cancela', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    listPendingInvitesMock.mockResolvedValue({
      invites: [
        {
          id: 'keep',
          empresas_id: 'emp-1',
          created_at: '2026-01-01T10:00:00.000Z',
          expires_at: '2026-01-10T10:00:00.000Z',
          created_by: 'user-1',
          invited_email: null
        }
      ]
    });
    authState.role = 'admin';

    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(<ManageUsers />);
    });
    await flushMicrotasks();

    const revogar = [...container.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Revogar');
    await act(async () => {
      revogar!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await flushMicrotasks();

    expect(revokeInviteMock).not.toHaveBeenCalled();

    confirmSpy.mockRestore();

    await act(async () => {
      root.unmount();
    });
  });
});
