import { apiClient } from './apiClient';

export interface NfseServicoInput {
  codigo: string;
  discriminacao: string;
  cnae: string;
  aliquota: string | number;
  valorServico: string | number;
}

export interface EmitirNfseInput {
  prestadorCpfCnpj: string;
  prestadorInscricaoMunicipal?: string;
  prestadorRazaoSocial?: string;
  prestadorEmail?: string;
  tomadorCpfCnpj?: string;
  tomadorRazaoSocial?: string;
  tomadorEmail?: string;
  servico: NfseServicoInput;
  cidadePrestacao?: {
    codigo?: string;
    descricao?: string;
    estado?: string;
  };
  idIntegracao?: string;
  enviarEmail?: boolean;
  descricao?: string;
  informacoesComplementares?: string;
}

export interface NfseRecord {
  id: string;
  user_id: string;
  plugnotas_id?: string | null;
  protocol?: string | null;
  id_integracao?: string | null;
  status?: string | null;
  cnpj_prestador?: string | null;
  cnpj_tomador?: string | null;
  payload_json?: Record<string, unknown> | unknown[] | null;
  response_json?: Record<string, unknown> | unknown[] | null;
  pdf_url?: string | null;
  xml_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export async function emitirNfse(input: EmitirNfseInput): Promise<NfseRecord> {
  return await apiClient.post<NfseRecord>('/mei-notas/emitir', input);
}

export async function listarNfse(): Promise<NfseRecord[]> {
  return await apiClient.get<NfseRecord[]>('/mei-notas');
}

export async function obterNfse(id: string, sync = false): Promise<NfseRecord> {
  const query = new URLSearchParams({ ...(sync ? { sync: 'true' } : {}) });
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return await apiClient.get<NfseRecord>(`/mei-notas/${encodeURIComponent(id)}${suffix}`);
}

export async function baixarNfsePdf(id: string): Promise<{ blob: Blob; filename: string | null }> {
  return await apiClient.requestBlob(`/mei-notas/${encodeURIComponent(id)}/pdf`, { method: 'GET' });
}

export async function baixarNfseXml(id: string): Promise<{ blob: Blob; filename: string | null }> {
  return await apiClient.requestBlob(`/mei-notas/${encodeURIComponent(id)}/xml`, { method: 'GET' });
}
