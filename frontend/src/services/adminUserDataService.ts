import { apiClient } from './apiClient';
import type { Transaction } from './transactionService';
import type { Category, CategoryBudgetSummary, CategoryBudgetYearly } from './categoryService';
import type {
  AtualizarCatalogoNfseClienteInput,
  CriarCatalogoNfseClienteInput,
  EmitirNotaInput,
  NfseCatalogCliente,
  NfseCatalogProduto,
  NfseRecord
} from './meiNotasService';

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
  certValidFrom?: string | null;
  certValidTo?: string | null;
  documentosAtivos?: {
    nfse: boolean;
    nfe: boolean;
    nfce: boolean;
  } | null;
}

export interface AdminMeiPeriod {
  competencia: string;
  status: 'pago' | 'a_pagar' | 'erro';
  guideId?: string | null;
  errorMessage?: string | null;
}

export interface AdminMeiWhatsappResult {
  sent: boolean;
  webhook?: { status?: number; body?: unknown };
}

export interface AdminParcelamentoItem {
  numero?: string;
  dataPedido?: string;
  situacao?: string;
  dataSituacao?: string;
  modalidade?: string;
}

export interface AdminParcelamentosResponse {
  parcelamentos: AdminParcelamentoItem[];
  resumoPorModalidade?: Record<string, number>;
  modalidadesConsultadas?: number;
}

export interface AdminMeiNfseItem {
  id: string;
  user_id: string;
  document_type: string;
  provider?: string;
  status: string | null;
  plugnotas_id: string | null;
  id_integracao: string | null;
  protocol: string | null;
  pdf_url: string | null;
  xml_url: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
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

export async function fetchAdminMeiPeriods(
  userId: string,
  cnpj?: string,
  options?: { refresh?: boolean }
): Promise<AdminMeiPeriod[]> {
  const params = new URLSearchParams();
  if (cnpj) params.set('cnpj', cnpj);
  if (options?.refresh) params.set('refresh', 'true');
  const query = params.toString();
  return apiClient.get<AdminMeiPeriod[]>(
    `/admin/mei-guide/${userId}/periods${query ? `?${query}` : ''}`
  );
}

export async function fetchAdminMeiPeriodsByCnpj(
  userId: string,
  cnpj: string,
  options?: { refresh?: boolean }
): Promise<AdminMeiPeriod[]> {
  const params = new URLSearchParams({ cnpj });
  if (options?.refresh) params.set('refresh', 'true');
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

export async function fetchAdminUserParcelamentos(
  userId: string,
  cnpj?: string
): Promise<AdminParcelamentosResponse> {
  const params = new URLSearchParams();
  if (cnpj) params.set('cnpj', cnpj.replace(/\D/g, ''));
  const query = params.toString();
  return apiClient.get<AdminParcelamentosResponse>(
    `/admin/mei-guide/${userId}/parcelamentos${query ? `?${query}` : ''}`
  );
}

export async function downloadAdminUserParcelamentoPdf(
  userId: string,
  numero: string,
  options?: { cnpj?: string; modalidade?: string }
): Promise<{ blob: Blob; filename: string | null }> {
  const params = new URLSearchParams();
  if (options?.cnpj) params.set('cnpj', options.cnpj.replace(/\D/g, ''));
  if (options?.modalidade) params.set('modalidade', options.modalidade);
  const query = params.toString();
  return apiClient.requestBlob(
    `/admin/mei-guide/${userId}/parcelamentos/${encodeURIComponent(numero)}/pdf${query ? `?${query}` : ''}`,
    { method: 'GET' }
  );
}

export async function fetchAdminUserMeiNfse(
  userId: string,
  options?: { limit?: number; documentType?: string; includeArchived?: boolean }
): Promise<AdminMeiNfseItem[]> {
  const params = new URLSearchParams();
  if (options?.limit != null) params.set('limit', String(options.limit));
  if (options?.documentType) params.set('documentType', options.documentType);
  if (options?.includeArchived === false) params.set('includeArchived', 'false');
  const query = params.toString();
  return apiClient.get<AdminMeiNfseItem[]>(
    `/admin/users/${userId}/mei-nfse${query ? `?${query}` : ''}`
  );
}

export async function emitirNotaAsAdmin(userId: string, payload: EmitirNotaInput): Promise<NfseRecord> {
  return apiClient.post<NfseRecord>(`/admin/users/${userId}/mei-nfse/emitir`, payload);
}

export async function fetchAdminMeiCatalogoClientes(
  userId: string,
  options?: { q?: string; limit?: number; documentType?: string }
): Promise<NfseCatalogCliente[]> {
  const params = new URLSearchParams();
  if (options?.q != null && options.q !== '') params.set('q', options.q);
  if (options?.limit != null) params.set('limit', String(options.limit));
  if (options?.documentType) params.set('documentType', options.documentType);
  const query = params.toString();
  return apiClient.get<NfseCatalogCliente[]>(
    `/admin/users/${userId}/mei-catalogo/clientes${query ? `?${query}` : ''}`
  );
}

export async function fetchAdminMeiCatalogoProdutos(
  userId: string,
  options?: { q?: string; limit?: number; documentType?: string }
): Promise<NfseCatalogProduto[]> {
  const params = new URLSearchParams();
  if (options?.q != null && options.q !== '') params.set('q', options.q);
  if (options?.limit != null) params.set('limit', String(options.limit));
  if (options?.documentType) params.set('documentType', options.documentType);
  const query = params.toString();
  return apiClient.get<NfseCatalogProduto[]>(
    `/admin/users/${userId}/mei-catalogo/produtos${query ? `?${query}` : ''}`
  );
}

const normalizeCatalogDocumento = (value: string) => String(value || '').replace(/\D/g, '');

export async function createAdminMeiCatalogoCliente(
  userId: string,
  input: CriarCatalogoNfseClienteInput
): Promise<NfseCatalogCliente> {
  const documento = normalizeCatalogDocumento(input.documento);
  const body: Record<string, unknown> = {
    nome: input.nome.trim(),
    documento
  };
  if (input.email !== undefined && input.email !== null && String(input.email).trim()) {
    body.email = String(input.email).trim();
  } else if (input.email === null) {
    body.email = null;
  }
  if (input.documentType) {
    body.documentType = input.documentType;
  }
  if (input.metadata_json !== undefined) {
    body.metadata_json = input.metadata_json;
  }
  return apiClient.post<NfseCatalogCliente>(
    `/admin/users/${encodeURIComponent(userId)}/mei-catalogo/clientes`,
    body
  );
}

export async function updateAdminMeiCatalogoCliente(
  userId: string,
  clienteId: string,
  input: AtualizarCatalogoNfseClienteInput
): Promise<NfseCatalogCliente> {
  const body: Record<string, unknown> = {};
  if (input.nome !== undefined) {
    body.nome = input.nome.trim();
  }
  if (input.email !== undefined) {
    body.email = input.email === null || input.email === '' ? null : String(input.email).trim();
  }
  if (input.metadata_json !== undefined) {
    body.metadata_json = input.metadata_json;
  }
  return apiClient.patch<NfseCatalogCliente>(
    `/admin/users/${encodeURIComponent(userId)}/mei-catalogo/clientes/${encodeURIComponent(clienteId)}`,
    body
  );
}

export async function deleteAdminMeiCatalogoCliente(userId: string, clienteId: string): Promise<void> {
  await apiClient.delete<unknown>(
    `/admin/users/${encodeURIComponent(userId)}/mei-catalogo/clientes/${encodeURIComponent(clienteId)}`
  );
}
