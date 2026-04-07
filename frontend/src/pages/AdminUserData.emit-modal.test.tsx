// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import AdminUserData from './AdminUserData';

const globalWithActFlag = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
globalWithActFlag.IS_REACT_ACT_ENVIRONMENT = true;

const testUser = {
  id: 'u-admin-emit-1',
  email: 'cliente@test.local',
  displayName: 'Cliente Teste',
  phone: null as string | null,
  role: 'usuario' as const,
  empresaId: null as string | null,
  mei: true
};

const { useAuthStoreMock, authState } = vi.hoisted(() => {
  const state = {
    role: 'admin' as 'superadmin' | 'admin' | 'usuario' | 'outsider',
    empresaId: null as string | null
  };
  const hook = Object.assign(
    () => ({
      role: state.role,
      empresaId: state.empresaId
    }),
    { getState: () => state }
  );
  return { useAuthStoreMock: hook, authState: state };
});

vi.mock('../store/authStore', () => ({
  useAuthStore: useAuthStoreMock
}));

vi.mock('../services/usersService', () => ({
  listUsers: vi.fn(async () => [testUser])
}));

const emptyDasSummary = {
  competencia: '2024-01',
  totalClientes: 0,
  pendentes: 0,
  items: [] as []
};

vi.mock('../services/adminUserDataService', () => ({
  downloadAdminMeiGuide: vi.fn(async () => ({ blob: new Blob(), filename: 'guia.pdf' })),
  downloadAdminUserParcelamentoPdf: vi.fn(async () => ({ blob: new Blob(), filename: 'p.pdf' })),
  emitirNotaAsAdmin: vi.fn(async () => ({ id: 'nf-1' })),
  fetchAdminDasStatus: vi.fn(async () => emptyDasSummary),
  fetchAdminMeiCertificateStatus: vi.fn(async () => ({
    hasUserCertificate: false,
    hasEnvCertificate: false,
    documento: null
  })),
  fetchAdminMeiPeriods: vi.fn(async () => []),
  fetchAdminMeiPeriodsByCnpj: vi.fn(async () => []),
  fetchAdminUserBalance: vi.fn(async () => ({ balance: 0, totalEntradas: 0, totalSaidas: 0 })),
  fetchAdminUserBudgetSummary: vi.fn(async () => []),
  fetchAdminUserCategories: vi.fn(async () => []),
  fetchAdminUserMeiNfse: vi.fn(async () => []),
  fetchAdminUserParcelamentos: vi.fn(async () => ({ parcelamentos: [] })),
  fetchAdminUserTransactions: vi.fn(async () => []),
  sendAdminMeiGuideWhatsapp: vi.fn(async () => ({ sent: true }))
}));

vi.mock('../components/admin/AdminMeiCatalogClienteCombobox', () => ({
  AdminMeiCatalogClienteCombobox: () => null
}));

vi.mock('../components/admin/AdminMeiCatalogProdutoCombobox', () => ({
  AdminMeiCatalogProdutoCombobox: () => null
}));

describe('AdminUserData — modal emitir nota fiscal (FR-GUIA-FISC P2)', () => {
  beforeEach(() => {
    authState.role = 'admin';
    authState.empresaId = null;
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('não mostra o botão Emitir nota fiscal sem utilizador seleccionado na área Mei Infinito', async () => {
    render(<AdminUserData />);

    const searchInput = await screen.findByPlaceholderText(/digite para filtrar/i);
    expect((searchInput as HTMLInputElement).disabled).toBe(false);

    expect(screen.queryByRole('button', { name: /emitir nota fiscal/i })).toBeNull();
    expect(
      screen.getByText(/selecione um usuário para visualizar os dados da área mei infinito/i)
    ).toBeTruthy();
  });

  it(
    'com utilizador seleccionado: abre modal, mostra seletor NFS-e/NF-e/NFC-e e texto contextual NFC-e',
    async () => {
    render(<AdminUserData />);

    await screen.findByPlaceholderText(/digite para filtrar/i);

    fireEvent.click(screen.getByRole('button', { name: 'Alternar lista de usuários' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Cliente Teste/i })).toBeTruthy();
    });

    fireEvent.mouseDown(screen.getByRole('button', { name: /Cliente Teste/i }));

    const emitirBtn = await screen.findByRole('button', { name: /emitir nota fiscal/i });
    fireEvent.click(emitirBtn);

    const dialog = await screen.findByRole('dialog');

    expect(within(dialog).getByRole('radio', { name: 'NFS-e' })).toBeTruthy();
    expect(within(dialog).getByRole('radio', { name: 'NF-e' })).toBeTruthy();
    expect(within(dialog).getByRole('radio', { name: 'NFC-e' })).toBeTruthy();

    expect(dialog.textContent).toMatch(/em nome do utilizador/i);
    expect(dialog.textContent).toMatch(/seleccionado no painel/i);

    fireEvent.click(within(dialog).getByRole('radio', { name: 'NFC-e' }));

    await waitFor(() => {
      expect(within(dialog).getByText(/consumidor final/i)).toBeTruthy();
    });

    const submitEmitir = within(dialog).getByRole('button', { name: 'Emitir' });
    expect((submitEmitir as HTMLButtonElement).disabled).toBe(true);
  },
    15_000
  );
});
