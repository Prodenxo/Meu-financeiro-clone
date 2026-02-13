import { apiClient } from './apiClient';
import type { Transaction } from './transactionService';
import type { Category, CategoryBudgetSummary, CategoryBudgetYearly } from './categoryService';

export interface AdminBalance {
  balance: number;
  totalEntradas: number;
  totalSaidas: number;
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
