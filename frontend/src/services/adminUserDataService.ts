import { apiClient } from './apiClient';
import type { Transaction } from './transactionService';
import type { Category, CategoryBudgetSummary, CategoryBudgetYearly } from './categoryService';

export interface AdminBalance {
  balance: number;
  totalEntradas: number;
  totalSaidas: number;
}

export interface AdminDasPendingItem {
  userId: string;
  displayName: string;
  email: string | null;
  empresaId: string | null;
  empresaName: string | null;
  competencia: string;
  cnpj: string;
  status: 'pago' | 'pendente' | 'erro';
  pdfBucket?: string | null;
  pdfPath: string | null;
  hasPdf: boolean;
  generatedAt: string | null;
  errorMessage?: string | null;
}

export interface AdminDasPendingSummary {
  competencia: string;
  totalClientes: number;
  pendentes: number;
  items: AdminDasPendingItem[];
}

export interface AdminDasStatusFilters {
  competencia?: string;
  status?: 'pago' | 'pendente' | 'erro';
  q?: string;
}

const normalizeTipoFromApi = (tipo: Transaction['tipo']): Transaction['tipo'] => {
  if (tipo === 'saida') return 'saída';
  return tipo;
};

const normalizeTipoForQuery = (tipo: 'entrada' | 'saida' | 'saída') => {
  if (tipo === 'saída') return 'saida';
  return tipo;
};

export async function fetchAdminUserTransactions(userId: string): Promise<Transaction[]> {
  const data = await apiClient.get<Transaction[]>(`/admin/users/${userId}/transactions`);
  return (data || []).map((transaction) => ({
    ...transaction,
    tipo: normalizeTipoFromApi(transaction.tipo)
  }));
}

export async function fetchAdminUserCategories(
  userId: string,
  tipo?: 'entrada' | 'saida' | 'saída'
): Promise<Category[]> {
  const query = tipo ? `?type=${normalizeTipoForQuery(tipo)}` : '';
  const data = await apiClient.get<Category[]>(`/admin/users/${userId}/categories${query}`);
  return data || [];
}

export async function fetchAdminUserBudgetSummary(
  userId: string,
  filters?: { year?: number; month?: number }
): Promise<CategoryBudgetSummary[]> {
  const params = new URLSearchParams();
  if (filters?.year) params.set('year', String(filters.year));
  if (filters?.month) params.set('month', String(filters.month));
  const query = params.toString();
  const data = await apiClient.get<CategoryBudgetSummary[]>(
    `/admin/users/${userId}/budgets/summary${query ? `?${query}` : ''}`
  );
  return data || [];
}

export async function fetchAdminUserBudgetYearly(
  userId: string,
  year: number
): Promise<CategoryBudgetYearly[]> {
  const data = await apiClient.get<CategoryBudgetYearly[]>(
    `/admin/users/${userId}/budgets/yearly?year=${year}`
  );
  return data || [];
}

export async function fetchAdminUserBalance(userId: string): Promise<AdminBalance> {
  return apiClient.get<AdminBalance>(`/admin/users/${userId}/balance`);
}

export async function fetchAdminDasPending(competencia?: string): Promise<AdminDasPendingSummary> {
  const params = new URLSearchParams();
  if (competencia) params.set('competencia', competencia);
  return apiClient.get<AdminDasPendingSummary>(`/admin/das/pending${params.toString() ? `?${params.toString()}` : ''}`);
}

export async function fetchAdminDasStatus(filters?: AdminDasStatusFilters): Promise<AdminDasPendingSummary> {
  const params = new URLSearchParams();
  if (filters?.competencia) params.set('competencia', filters.competencia);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.q) params.set('q', filters.q);
  return apiClient.get<AdminDasPendingSummary>(`/admin/das/status${params.toString() ? `?${params.toString()}` : ''}`);
}

export async function reprocessAdminDas(userId: string, competencia: string): Promise<{
  userId: string;
  competencia: string;
  status: 'pago' | 'pendente' | 'erro';
  pdfPath: string | null;
}> {
  return apiClient.post('/admin/das/reprocess', { userId, competencia });
}
