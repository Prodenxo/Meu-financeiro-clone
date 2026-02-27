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

export interface AdminMeiCertificateStatus {
  hasUserCertificate: boolean;
  hasEnvCertificate: boolean;
  documento?: string | null;
}

export interface AdminMeiPeriod {
  competencia: string;
  status: 'pago' | 'a_pagar';
  guideId?: string | null;
}

export interface AdminMeiWhatsappResult {
  sent: boolean;
  webhook?: { status?: number; body?: unknown };
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

export async function fetchAdminMeiCertificateStatus(userId: string): Promise<AdminMeiCertificateStatus> {
  return apiClient.get<AdminMeiCertificateStatus>(`/admin/mei-guide/${userId}/certificate/status`);
}

export async function fetchAdminMeiPeriods(userId: string, cnpj?: string): Promise<AdminMeiPeriod[]> {
  const params = new URLSearchParams();
  if (cnpj) params.set('cnpj', cnpj);
  const query = params.toString();
  return apiClient.get<AdminMeiPeriod[]>(
    `/admin/mei-guide/${userId}/periods${query ? `?${query}` : ''}`
  );
}

export async function fetchAdminMeiPeriodsByCnpj(userId: string, cnpj: string): Promise<AdminMeiPeriod[]> {
  const params = new URLSearchParams({ cnpj });
  return apiClient.get<AdminMeiPeriod[]>(
    `/admin/mei-guide/${userId}/periods-by-cnpj?${params.toString()}`
  );
}

export async function downloadAdminMeiGuide(
  userId: string,
  periodoApuracao: string,
  cnpj?: string
): Promise<{ blob: Blob; filename: string | null }> {
  const params = new URLSearchParams();
  if (cnpj) params.set('cnpj', cnpj);
  const query = params.toString();
  return apiClient.requestBlob(
    `/admin/mei-guide/${userId}/download/${encodeURIComponent(periodoApuracao)}${query ? `?${query}` : ''}`,
    { method: 'GET' }
  );
}

export async function sendAdminMeiGuideWhatsapp(
  userId: string,
  payload: { periodoApuracao: string; competencia?: string; cnpj?: string }
): Promise<AdminMeiWhatsappResult> {
  return apiClient.post<AdminMeiWhatsappResult>(`/admin/mei-guide/${userId}/send-whatsapp`, payload);
}
