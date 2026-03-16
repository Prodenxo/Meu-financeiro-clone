import { apiClient } from './apiClient';

export type DocumentType = 'NFSE' | 'NFE' | 'NFCE' | 'CTE';

export interface NfeEmitenteDestinatarioInput {
  cpfCnpj: string;
  razaoSocial?: string;
  email?: string;
  inscricaoEstadual?: string;
}

export interface NfeIcmsInput {
  origem?: string | number;
  cst?: string;
  csosn?: string;
  modalidadeBaseCalculo?: string | number;
  baseCalculo?: string | number;
  aliquota?: string | number;
  valor?: string | number;
}

export interface NfeIpiInput {
  cst?: string;
  codigoEnquadramentoLegal?: string;
  baseCalculo?: string | number;
  aliquota?: string | number;
  valor?: string | number;
}

export interface NfePisInput {
  cst?: string;
  baseCalculo?: string | number;
  aliquota?: string | number;
  valor?: string | number;
}

export interface NfeCofinsInput {
  cst?: string;
  baseCalculo?: string | number;
  aliquota?: string | number;
  valor?: string | number;
}

export interface NfeTributosInput {
  icms?: NfeIcmsInput;
  ipi?: NfeIpiInput;
  pis?: NfePisInput;
  cofins?: NfeCofinsInput;
}

export interface NfeItemInput {
  codigo: string;
  descricao: string;
  ncm: string;
  cfop: string;
  unidade: string;
  quantidade: string | number;
  valorUnitario: string | number;
  valor?: string | number;
  desconto?: string | number;
  cest?: string;
  sku?: string;
  tributos?: NfeTributosInput;
}

export interface NfeLikePayloadInput {
  idIntegracao?: string;
  modelo?: '55' | '65' | string;
  natureza?: string;
  emitente: NfeEmitenteDestinatarioInput;
  destinatario?: NfeEmitenteDestinatarioInput;
  itens: NfeItemInput[];
  informacoesComplementares?: string;
  config?: Record<string, unknown>;
}

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
  prestadorEndereco?: {
    logradouro?: string;
    numero?: string;
    codigoCidade?: string;
    cep?: string;
    complemento?: string;
    bairro?: string;
    estado?: string;
    descricaoCidade?: string;
  };
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
  metadata?: Record<string, unknown>;
}

export interface EmitirNotaInput extends Partial<EmitirNfseInput> {
  documentType?: DocumentType;
  payload?: Record<string, unknown> | NfeLikePayloadInput;
  emitenteCpfCnpj?: string;
  destinatarioCpfCnpj?: string;
  itens?: Record<string, unknown>[];
  config?: Record<string, unknown>;
}

export interface NfseRecord {
  id: string;
  user_id: string;
  document_type?: string | null;
  provider?: string | null;
  plugnotas_id?: string | null;
  protocol?: string | null;
  id_integracao?: string | null;
  status?: string | null;
  archived_at?: string | null;
  cnpj_prestador?: string | null;
  cnpj_tomador?: string | null;
  metadata_json?: Record<string, unknown> | null;
  payload_json?: Record<string, unknown> | unknown[] | null;
  response_json?: Record<string, unknown> | unknown[] | null;
  pdf_url?: string | null;
  xml_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AtualizarNfseInput {
  descricaoInterna?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface CancelarNfseInput {
  reason?: string;
}

export interface ArquivarNfseInput {
  archived?: boolean;
  reason?: string;
}

export interface NfseCatalogCliente {
  id: string;
  document_type?: string | null;
  documento?: string | null;
  nome?: string | null;
  email?: string | null;
  metadata_json?: Record<string, unknown> | null;
  last_used_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface NfseCatalogProduto {
  id: string;
  document_type?: string | null;
  codigo?: string | null;
  cnae?: string | null;
  discriminacao?: string | null;
  aliquota?: number | null;
  valor_sugerido?: number | null;
  metadata_json?: Record<string, unknown> | null;
  last_used_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ListarCatalogoNfseInput {
  q?: string;
  limit?: number;
  documentType?: DocumentType;
}

export interface ListarNotasInput {
  includeArchived?: boolean;
  documentType?: DocumentType;
}

export interface CadastrarPlugNotasCertificadoInput {
  arquivo: File;
  senha: string;
  email?: string;
}

export interface CadastrarPlugNotasCertificadoResponse {
  id: string | null;
  message: string | null;
  raw: Record<string, unknown>;
}

export interface CadastrarPlugNotasEmpresaResponse {
  cnpj: string | null;
  message: string | null;
  raw: Record<string, unknown>;
}

const buildCatalogSuffix = (options: ListarCatalogoNfseInput = {}) => {
  const query = new URLSearchParams({
    ...(options.q ? { q: options.q } : {}),
    ...(typeof options.limit === 'number' && Number.isFinite(options.limit)
      ? { limit: String(Math.trunc(options.limit)) }
      : {}),
    ...(options.documentType ? { documentType: options.documentType } : {})
  });
  const text = query.toString();
  return text ? `?${text}` : '';
};

const buildListSuffix = (options: ListarNotasInput = {}) => {
  const query = new URLSearchParams({
    ...(options.includeArchived ? { includeArchived: 'true' } : {}),
    ...(options.documentType ? { documentType: options.documentType } : {})
  });
  const text = query.toString();
  return text ? `?${text}` : '';
};

export async function emitirNota(input: EmitirNotaInput): Promise<NfseRecord> {
  return await apiClient.post<NfseRecord>('/mei-notas/emitir', input);
}

export async function emitirNfse(input: EmitirNfseInput): Promise<NfseRecord> {
  return await emitirNota({ documentType: 'NFSE', ...input });
}

export async function emitirNfe(payload: NfeLikePayloadInput): Promise<NfseRecord> {
  return await emitirNota({
    documentType: 'NFE',
    payload
  });
}

export async function emitirNfce(payload: NfeLikePayloadInput): Promise<NfseRecord> {
  return await emitirNota({
    documentType: 'NFCE',
    payload
  });
}

export async function cadastrarPlugNotasCertificado(
  input: CadastrarPlugNotasCertificadoInput
): Promise<CadastrarPlugNotasCertificadoResponse> {
  const formData = new FormData();
  formData.append('arquivo', input.arquivo);
  formData.append('senha', input.senha);
  if (input.email?.trim()) {
    formData.append('email', input.email.trim());
  }
  return await apiClient.postForm<CadastrarPlugNotasCertificadoResponse>(
    '/mei-notas/setup/plugnotas/certificado',
    formData
  );
}

export async function cadastrarPlugNotasEmpresa(
  payload: Record<string, unknown>
): Promise<CadastrarPlugNotasEmpresaResponse> {
  return await apiClient.post<CadastrarPlugNotasEmpresaResponse>(
    '/mei-notas/setup/plugnotas/empresa',
    { payload }
  );
}

export async function listarNotas(options: ListarNotasInput = {}): Promise<NfseRecord[]> {
  const suffix = buildListSuffix(options);
  return await apiClient.get<NfseRecord[]>(`/mei-notas${suffix}`);
}

export async function listarNfse(options: ListarNotasInput = {}): Promise<NfseRecord[]> {
  return await listarNotas(options);
}

export async function obterNota(id: string, sync = false): Promise<NfseRecord> {
  const query = new URLSearchParams({ ...(sync ? { sync: 'true' } : {}) });
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return await apiClient.get<NfseRecord>(`/mei-notas/${encodeURIComponent(id)}${suffix}`);
}

export async function obterNfse(id: string, sync = false): Promise<NfseRecord> {
  return await obterNota(id, sync);
}

export async function baixarNotaPdf(id: string): Promise<{ blob: Blob; filename: string | null }> {
  return await apiClient.requestBlob(`/mei-notas/${encodeURIComponent(id)}/pdf`, { method: 'GET' });
}

export async function baixarNfsePdf(id: string): Promise<{ blob: Blob; filename: string | null }> {
  return await baixarNotaPdf(id);
}

export async function baixarNotaXml(id: string): Promise<{ blob: Blob; filename: string | null }> {
  return await apiClient.requestBlob(`/mei-notas/${encodeURIComponent(id)}/xml`, { method: 'GET' });
}

export async function baixarNfseXml(id: string): Promise<{ blob: Blob; filename: string | null }> {
  return await baixarNotaXml(id);
}

export async function atualizarNota(id: string, input: AtualizarNfseInput): Promise<NfseRecord> {
  return await apiClient.patch<NfseRecord>(`/mei-notas/${encodeURIComponent(id)}`, input);
}

export async function atualizarNfse(id: string, input: AtualizarNfseInput): Promise<NfseRecord> {
  return await atualizarNota(id, input);
}

export async function cancelarNota(id: string, input: CancelarNfseInput = {}): Promise<NfseRecord> {
  return await apiClient.post<NfseRecord>(`/mei-notas/${encodeURIComponent(id)}/cancelar`, input);
}

export async function cancelarNfse(id: string, input: CancelarNfseInput = {}): Promise<NfseRecord> {
  return await cancelarNota(id, input);
}

export async function arquivarNota(id: string, input: ArquivarNfseInput = {}): Promise<NfseRecord> {
  return await apiClient.post<NfseRecord>(`/mei-notas/${encodeURIComponent(id)}/arquivar`, input);
}

export async function arquivarNfse(id: string, input: ArquivarNfseInput = {}): Promise<NfseRecord> {
  return await arquivarNota(id, input);
}

export async function listarCatalogoNfseClientes(
  options: ListarCatalogoNfseInput = {}
): Promise<NfseCatalogCliente[]> {
  const suffix = buildCatalogSuffix(options);
  return await apiClient.get<NfseCatalogCliente[]>(`/mei-notas/catalogo/clientes${suffix}`);
}

export async function listarCatalogoNfseProdutos(
  options: ListarCatalogoNfseInput = {}
): Promise<NfseCatalogProduto[]> {
  const suffix = buildCatalogSuffix(options);
  return await apiClient.get<NfseCatalogProduto[]>(`/mei-notas/catalogo/produtos${suffix}`);
}
