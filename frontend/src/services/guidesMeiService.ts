import { apiClient } from './apiClient';

export interface CreateMeiGuideInput {
  cnpj: string;
  periodoApuracao: string;
  contribuinte: {
    numero: string;
    tipo: number;
  };
}

export interface MeiGuideResponse {
  id: string;
  status: string;
  downloadUrl?: string | null;
  pdfBase64?: string | null;
  filename?: string | null;
}

export interface MeiPeriod {
  competencia: string;
  status: 'pago' | 'a_pagar' | 'erro';
  guideId?: string | null;
  errorMessage?: string | null;
}

export interface MeiCertificateStatus {
  hasUserCertificate: boolean;
  hasEnvCertificate: boolean;
  documento?: string | null;
  certValidFrom?: string | null;
  certValidTo?: string | null;
}

export interface MeiValidationResult {
  valid: boolean;
  message?: string | null;
}

export interface ParcelamentoItem {
  numero?: string;
  dataPedido?: string;
  situacao?: string;
  dataSituacao?: string;
  modalidade?: string;
}

export interface ParcelamentosResponse {
  parcelamentos: ParcelamentoItem[];
  modalidadesConsultadas?: number;
  resumoPorModalidade?: Record<string, number>;
}

export async function fetchParcelamentos(
  cnpj?: string,
  contribuinte?: { numero: string; tipo: number }
): Promise<ParcelamentosResponse> {
  const params: Record<string, string> = {};
  if (cnpj) params.cnpj = cnpj;
  if (contribuinte) {
    params.contribuinteNumero = contribuinte.numero;
    params.contribuinteTipo = String(contribuinte.tipo);
  }
  const query = new URLSearchParams(params);
  return await apiClient.get<ParcelamentosResponse>(`/mei-guide/parcelamentos?${query.toString()}`);
}

export async function createMeiGuide(input: CreateMeiGuideInput): Promise<MeiGuideResponse> {
  return await apiClient.post<MeiGuideResponse>('/mei-guide', input);
}

export async function fetchMeiPeriods(
  cnpj: string,
  contribuinte?: { numero: string; tipo: number }
): Promise<MeiPeriod[]> {
  const query = new URLSearchParams({
    cnpj,
    ...(contribuinte ? {
      contribuinteNumero: contribuinte.numero,
      contribuinteTipo: String(contribuinte.tipo)
    } : {})
  });
  return await apiClient.get<MeiPeriod[]>(`/mei-guide/periods?${query.toString()}`);
}

export async function fetchMeiPeriodsByCnpj(cnpj: string): Promise<MeiPeriod[]> {
  const query = new URLSearchParams({ cnpj });
  return await apiClient.get<MeiPeriod[]>(`/mei-guide/periods-by-cnpj?${query.toString()}`);
}

export async function downloadMeiGuide(
  cnpj: string | undefined,
  periodoApuracao: string,
  contribuinte?: { numero: string; tipo: number }
): Promise<{ blob: Blob; filename: string | null }> {
  const query = new URLSearchParams({
    ...(cnpj ? { cnpj } : {}),
    ...(contribuinte ? {
      contribuinteNumero: contribuinte.numero,
      contribuinteTipo: String(contribuinte.tipo)
    } : {})
  });
  return await apiClient.requestBlob(`/mei-guide/${encodeURIComponent(periodoApuracao)}/download?${query.toString()}`, {
    method: 'GET'
  });
}

export async function fetchMeiCertificateStatus(): Promise<MeiCertificateStatus> {
  return await apiClient.get<MeiCertificateStatus>('/mei-guide/certificate/status');
}

export async function uploadMeiCertificate(
  file: File,
  password: string
): Promise<MeiCertificateStatus> {
  const formData = new FormData();
  formData.append('certificate', file);
  formData.append('password', password);
  return await apiClient.postForm<MeiCertificateStatus>('/mei-guide/certificate', formData);
}

export async function removeMeiCertificate(): Promise<MeiCertificateStatus> {
  return await apiClient.delete<MeiCertificateStatus>('/mei-guide/certificate');
}

export async function validateMeiGuide(
  cnpj: string,
  periodoApuracao: string
): Promise<MeiValidationResult> {
  return await apiClient.post<MeiValidationResult>('/mei-guide/validate', {
    cnpj,
    periodoApuracao
  });
}

export async function downloadParcelamentoPdf(
  numero: string,
  cnpj?: string,
  modalidade?: string,
  contribuinte?: { numero: string; tipo: number }
): Promise<{ blob: Blob; filename: string | null }> {
  const params: Record<string, string> = {};
  if (cnpj) params.cnpj = cnpj;
  if (modalidade) params.modalidade = modalidade;
  if (contribuinte) {
    params.contribuinteNumero = contribuinte.numero;
    params.contribuinteTipo = String(contribuinte.tipo);
  }
  const query = new URLSearchParams(params);
  return await apiClient.requestBlob(
    `/mei-guide/parcelamentos/${encodeURIComponent(numero)}/pdf?${query.toString()}`,
    { method: 'GET' }
  );
}
