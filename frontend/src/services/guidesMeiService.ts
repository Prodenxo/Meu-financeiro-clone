import { apiClient } from './apiClient';
import type { NfEmissionCompanyForm } from '../utils/nfEmissionCompany';

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
  status: 'pago' | 'a_pagar' | 'erro' | 'indisponivel';
  guideId?: string | null;
  errorMessage?: string | null;
}

/** Competências indisponíveis (antes da abertura MEI, futuro, etc.) não entram na lista da UI. */
export function filterMeiPeriodsForDisplay(periods: MeiPeriod[]): MeiPeriod[] {
  return periods.filter((period) => period.status !== 'indisponivel');
}

/** Dados mínimos NFS-e persistidos em `user_mei_certificates` (espelho do formulário + documento opcional). */
export type NfseEmitenteSnapshot = Pick<
  NfEmissionCompanyForm,
  | 'razaoSocial'
  | 'nomeFantasia'
  | 'email'
  | 'inscricaoMunicipal'
  | 'regimeTributario'
  | 'simplesNacional'
  | 'cep'
  | 'tipoLogradouro'
  | 'logradouro'
  | 'numero'
  | 'complemento'
  | 'bairro'
  | 'codigoCidade'
  | 'descricaoCidade'
  | 'estado'
  | 'rpsLote'
  | 'rpsNumero'
  | 'rpsSerie'
> & {
  /** `cert_document` no backend — só dígitos (FR-AP-01). */
  certDocument?: string;
};

/** Espelho local em `user_mei_certificates.documentos_ativos` (P1). */
export type DocumentosAtivosMirror = {
  nfse: boolean;
  nfe: boolean;
  nfce: boolean;
};

export interface MeiCertificateStatus {
  hasUserCertificate: boolean;
  hasEnvCertificate: boolean;
  documento?: string | null;
  certValidFrom?: string | null;
  certValidTo?: string | null;
  nfseEmitente?: NfseEmitenteSnapshot | null;
  /** Precedência na UI: GET empresa > este espelho > default PRD. */
  documentosAtivos?: DocumentosAtivosMirror | null;
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

export type ParcelamentoParcelaSituacao = 'pago' | 'a_pagar' | 'liberada' | 'indisponivel';

export interface ParcelamentoParcelaOption {
  periodoApuracao: string;
  label: string;
  pago?: boolean;
  emAberto?: boolean;
  liberadaParaImpressao?: boolean;
  situacaoParcela?: ParcelamentoParcelaSituacao;
  valor?: number;
  dataArrecadacao?: string;
}

export interface ParcelamentoParcelasResponse {
  parcelas: ParcelamentoParcelaOption[];
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

export async function regenerateMeiGuide(
  periodoApuracao: string,
  input: CreateMeiGuideInput
): Promise<MeiGuideResponse> {
  return await apiClient.post<MeiGuideResponse>(
    `/mei-guide/${encodeURIComponent(periodoApuracao)}/regenerate`,
    input
  );
}

export async function fetchMeiPeriods(
  cnpj: string,
  contribuinte?: { numero: string; tipo: number },
  options?: { refresh?: boolean }
): Promise<MeiPeriod[]> {
  const params: Record<string, string> = { cnpj };
  if (contribuinte) {
    params.contribuinteNumero = contribuinte.numero;
    params.contribuinteTipo = String(contribuinte.tipo);
  }
  if (options?.refresh) params.refresh = 'true';
  const query = new URLSearchParams(params);
  return await apiClient.get<MeiPeriod[]>(`/mei-guide/periods?${query.toString()}`);
}

export async function fetchMeiPeriodsByCnpj(
  cnpj: string,
  options?: { refresh?: boolean }
): Promise<MeiPeriod[]> {
  const params: Record<string, string> = { cnpj };
  if (options?.refresh) params.refresh = 'true';
  const query = new URLSearchParams(params);
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

export function appendNfseEmitenteToFormData(
  formData: FormData,
  emitente: NfEmissionCompanyForm
): void {
  formData.append('razaoSocial', emitente.razaoSocial);
  formData.append('nomeFantasia', emitente.nomeFantasia);
  formData.append('email', emitente.email);
  formData.append('inscricaoMunicipal', emitente.inscricaoMunicipal ?? '');
  formData.append('regimeTributario', String(emitente.regimeTributario || '1'));
  formData.append('cep', emitente.cep);
  formData.append('tipoLogradouro', emitente.tipoLogradouro);
  formData.append('logradouro', emitente.logradouro);
  formData.append('numero', emitente.numero);
  formData.append('complemento', emitente.complemento);
  formData.append('bairro', emitente.bairro);
  formData.append('codigoCidade', emitente.codigoCidade);
  formData.append('descricaoCidade', emitente.descricaoCidade);
  formData.append('estado', emitente.estado);
  formData.append('simplesNacional', emitente.simplesNacional ? 'true' : 'false');
}

export async function uploadMeiCertificate(
  file: File,
  password: string,
  emitente?: NfEmissionCompanyForm
): Promise<MeiCertificateStatus> {
  const formData = new FormData();
  formData.append('certificate', file);
  formData.append('password', password);
  if (emitente) {
    appendNfseEmitenteToFormData(formData, emitente);
  }
  return await apiClient.postForm<MeiCertificateStatus>('/mei-guide/certificate', formData);
}

export async function patchMeiCertificateEmitenteNfse(
  body: Record<string, unknown>
): Promise<MeiCertificateStatus> {
  return await apiClient.patch<MeiCertificateStatus>('/mei-guide/certificate/emitente-nfse', body);
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

export async function fetchParcelamentoParcelas(
  numero: string,
  cnpj?: string,
  modalidade?: string,
  contribuinte?: { numero: string; tipo: number }
): Promise<ParcelamentoParcelasResponse> {
  const params: Record<string, string> = {};
  if (cnpj) params.cnpj = cnpj;
  if (modalidade) params.modalidade = modalidade;
  if (contribuinte) {
    params.contribuinteNumero = contribuinte.numero;
    params.contribuinteTipo = String(contribuinte.tipo);
  }
  const query = new URLSearchParams(params);
  return apiClient.get<ParcelamentoParcelasResponse>(
    `/mei-guide/parcelamentos/${encodeURIComponent(numero)}/parcelas?${query.toString()}`
  );
}

export async function downloadParcelamentoPdf(
  numero: string,
  cnpj?: string,
  modalidade?: string,
  contribuinte?: { numero: string; tipo: number },
  parcela?: string
): Promise<{ blob: Blob; filename: string | null }> {
  const params: Record<string, string> = {};
  if (cnpj) params.cnpj = cnpj;
  if (modalidade) params.modalidade = modalidade;
  if (parcela) params.parcela = parcela;
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
