import { apiClient } from './apiClient';
import type { EmpresaCadastroRuntimeDecision } from '../types/empresaCadastroRuntimeDecision';

export type { EmpresaCadastroRuntimeDecision };

export type DocumentType = 'NFSE' | 'NFE' | 'NFCE' | 'CTE';

export interface NfeEmitenteDestinatarioInput {
  cpfCnpj: string;
  razaoSocial?: string;
  email?: string;
  /** SEFAZ indIEDest: 1 contribuinte, 2 isento, 9 não contribuinte */
  indIEDest?: '1' | '2' | '9' | string;
  inscricaoEstadual?: string;
  endereco?: {
    cep: string;
    logradouro: string;
    numero: string;
    bairro: string;
    codigoCidade: string;
    descricaoCidade: string;
    estado: string;
    complemento?: string;
  };
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
  unidade?: string;
  unidadeComercial?: string;
  quantidade?: string | number | { comercial: number; tributavel?: number };
  quantidadeComercial?: string | number;
  valorUnitario?: string | number | { comercial: number; tributavel?: number };
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
  consumidorFinal?: boolean;
  emitente: NfeEmitenteDestinatarioInput;
  destinatario?: NfeEmitenteDestinatarioInput;
  itens: NfeItemInput[];
  pagamentos?: Array<{ meio: string; valor: number; descricaoMeio?: string }>;
  informacoesComplementares?: string;
  config?: Record<string, unknown>;
}

export interface NfseServicoInput {
  codigo: string;
  discriminacao: string;
  cnae: string;
  /** Nomenclatura Brasileira de Serviços (9 dígitos) — NFS-e Nacional / PlugNotas `servico.codigoNbs`. */
  codigoNbs?: string;
  /** Não usar para MEI no Simples Nacional — o backend não repassa alíquota ISS. */
  aliquota?: string | number;
  valorServico: string | number;
}

export interface EmitirNfseInput {
  prestadorCpfCnpj: string;
  prestadorRazaoSocial?: string;
  prestadorEmail?: string;
  prestadorInscricaoMunicipal?: string;
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
  /** Coluna DB `payload_json`; em alguns clientes pode vir como `payloadJson`. */
  payload_json?: Record<string, unknown> | unknown[] | string | null;
  payloadJson?: Record<string, unknown> | unknown[] | string | null;
  response_json?: Record<string, unknown> | unknown[] | string | null;
  responseJson?: Record<string, unknown> | unknown[] | string | null;
  pdf_url?: string | null;
  xml_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Indica se o backend pode consultar o emissor para actualizar estado (`GET /mei-notas/:id?sync=true`),
 * alinhado a `refreshWithPlugNotas` (NFSE/NFE/NFCE).
 */
export function notaFiscalPodeSincronizarEstadoEmissor(record: NfseRecord): boolean {
  if (record.plugnotas_id) return true;
  if (record.protocol) return true;
  if (record.id_integracao && record.cnpj_prestador) {
    const digits = String(record.cnpj_prestador).replace(/\D/g, '');
    return digits.length >= 11;
  }
  return false;
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
  /** Limite de linhas (backend: 1–1000, omissão ≈ 500). Necessário para somatório limite MEI no ano. */
  limit?: number;
}

export interface CadastrarEmissaoNfCertificadoInput {
  arquivo: File;
  senha: string;
  email?: string;
  /** CNPJ (14 dígitos) ajuda o backend a obter o ID do certificado quando o Plugnotas responde 409. */
  cpfCnpj?: string;
}

export interface CadastrarEmissaoNfCertificadoResponse {
  id: string | null;
  message: string | null;
  raw: Record<string, unknown>;
}

export interface CadastrarEmissaoNfEmpresaResponse {
  cnpj: string | null;
  message: string | null;
  operation?: 'created' | 'updated' | 'existing';
  raw: Record<string, unknown>;
  runtimeDecision?: EmpresaCadastroRuntimeDecision;
}

/** Resposta bruta do provedor na consulta GET empresa (formato pode variar). */
export type ConsultarEmissaoNfEmpresaResponse = Record<string, unknown>;

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
    ...(options.documentType ? { documentType: options.documentType } : {}),
    ...(typeof options.limit === 'number' && Number.isFinite(options.limit)
      ? { limit: String(Math.trunc(options.limit)) }
      : {})
  });
  const text = query.toString();
  return text ? `?${text}` : '';
};

const normalizeCnpjDigits = (value: string) => String(value || '').replace(/\D/g, '');

export interface CriarCatalogoNfseClienteInput {
  nome: string;
  /** CPF ou CNPJ (com ou sem máscara; o backend normaliza). */
  documento: string;
  email?: string | null;
  documentType?: DocumentType;
  metadata_json?: Record<string, unknown> | null;
}

export interface AtualizarCatalogoNfseClienteInput {
  nome?: string;
  email?: string | null;
  metadata_json?: Record<string, unknown> | null;
}

export interface CriarCatalogoNfseProdutoInput {
  /** Obrigatório no backend. */
  discriminacao: string;
  codigo?: string | null;
  cnae?: string | null;
  aliquota?: number | null;
  valor_sugerido?: number | null;
  documentType?: DocumentType;
  metadata_json?: Record<string, unknown> | null;
}

export interface AtualizarCatalogoNfseProdutoInput {
  discriminacao?: string;
  codigo?: string | null;
  cnae?: string | null;
  aliquota?: number | null;
  valor_sugerido?: number | null;
  metadata_json?: Record<string, unknown> | null;
}

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

export async function cadastrarCertificadoEmissaoNf(
  input: CadastrarEmissaoNfCertificadoInput
): Promise<CadastrarEmissaoNfCertificadoResponse> {
  const formData = new FormData();
  formData.append('arquivo', input.arquivo);
  formData.append('senha', input.senha);
  if (input.email?.trim()) {
    formData.append('email', input.email.trim());
  }
  const cnpjDigits = normalizeCnpjDigits(input.cpfCnpj || '');
  if (cnpjDigits.length === 14) {
    formData.append('cpfCnpj', cnpjDigits);
  }
  return await apiClient.postForm<CadastrarEmissaoNfCertificadoResponse>(
    '/mei-notas/setup/emissao-fiscal/certificado',
    formData
  );
}

export async function cadastrarEmpresaEmissaoNf(
  payload: Record<string, unknown>
): Promise<CadastrarEmissaoNfEmpresaResponse> {
  return await apiClient.post<CadastrarEmissaoNfEmpresaResponse>(
    '/mei-notas/setup/emissao-fiscal/empresa',
    { payload }
  );
}

export async function consultarEmpresaEmissaoNf(
  cpfCnpj: string
): Promise<ConsultarEmissaoNfEmpresaResponse> {
  const digits = normalizeCnpjDigits(cpfCnpj);
  const query = new URLSearchParams({ cpfCnpj: digits });
  return await apiClient.get<ConsultarEmissaoNfEmpresaResponse>(
    `/mei-notas/setup/emissao-fiscal/empresa?${query.toString()}`
  );
}

export async function atualizarEmpresaEmissaoNf(
  payload: Record<string, unknown>
): Promise<CadastrarEmissaoNfEmpresaResponse> {
  return await apiClient.patch<CadastrarEmissaoNfEmpresaResponse>(
    '/mei-notas/setup/emissao-fiscal/empresa',
    { payload }
  );
}

export async function listarNotas(options: ListarNotasInput = {}): Promise<NfseRecord[]> {
  const suffix = buildListSuffix(options);
  return await apiClient.get<NfseRecord[]>(`/mei-notas${suffix}`);
}

export interface LimiteFaturamentoMeiResponse {
  anoCivil: number;
  totalUtilizadoReais: number;
  notasConsideradas: number;
}

export async function fetchLimiteFaturamentoMei(options?: {
  year?: number;
}): Promise<LimiteFaturamentoMeiResponse> {
  const params = new URLSearchParams();
  if (options?.year != null) params.set('year', String(options.year));
  const q = params.toString();
  return await apiClient.get<LimiteFaturamentoMeiResponse>(
    `/mei-notas/limite-faturamento${q ? `?${q}` : ''}`
  );
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

/** Endereço fiscal retornado por GET /mei-notas/cep-lookup/:cep (BrasilAPI + ViaCEP + tabela IBGE). */
export interface NfseTomadorEnderecoLookup {
  cep?: string;
  logradouro?: string | null;
  numero?: string | null;
  bairro?: string | null;
  codigoCidade?: string | null;
  descricaoCidade?: string | null;
  estado?: string | null;
  complemento?: string | null;
}

export async function lookupNfseEnderecoPorCep(cep: string): Promise<NfseTomadorEnderecoLookup> {
  const digits = String(cep || '').replace(/\D/g, '').slice(0, 8);
  if (digits.length !== 8) {
    throw new Error('CEP deve ter 8 dígitos.');
  }
  return await apiClient.get<NfseTomadorEnderecoLookup>(`/mei-notas/cep-lookup/${digits}`);
}

export async function listarCatalogoNfseProdutos(
  options: ListarCatalogoNfseInput = {}
): Promise<NfseCatalogProduto[]> {
  const suffix = buildCatalogSuffix(options);
  return await apiClient.get<NfseCatalogProduto[]>(`/mei-notas/catalogo/produtos${suffix}`);
}

/** Linha da tabela nacional `codigosservicos` (referência NFS-e). */
export interface CodigoServicoReferencia {
  codigo: string;
  descricao: string;
  /** Sugestão NBS (Anexo VIII) quando disponível no backend. */
  codigo_nbs?: string | null;
}

export interface ListarCodigosServicoReferenciaInput {
  q?: string;
  limit?: number;
}

const buildCodigosServicosSuffix = (options: ListarCodigosServicoReferenciaInput = {}) => {
  const query = new URLSearchParams({
    ...(options.q !== undefined && options.q !== '' ? { q: options.q } : {}),
    ...(typeof options.limit === 'number' && Number.isFinite(options.limit)
      ? { limit: String(Math.trunc(options.limit)) }
      : {})
  });
  const text = query.toString();
  return text ? `?${text}` : '';
};

export async function listarCodigosServicosReferencia(
  options: ListarCodigosServicoReferenciaInput = {}
): Promise<CodigoServicoReferencia[]> {
  const suffix = buildCodigosServicosSuffix(options);
  return await apiClient.get<CodigoServicoReferencia[]>(
    `/mei-notas/catalogo/codigos-servicos${suffix}`
  );
}

export async function criarCatalogoNfseCliente(
  input: CriarCatalogoNfseClienteInput
): Promise<NfseCatalogCliente> {
  const documento = normalizeCnpjDigits(input.documento);
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
  return await apiClient.post<NfseCatalogCliente>('/mei-notas/catalogo/clientes', body);
}

export async function atualizarCatalogoNfseCliente(
  id: string,
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
  return await apiClient.patch<NfseCatalogCliente>(
    `/mei-notas/catalogo/clientes/${encodeURIComponent(id)}`,
    body
  );
}

/** DELETE catálogo cliente — 204 sem corpo (CAT-MEI-06). */
export async function eliminarCatalogoNfseCliente(id: string): Promise<void> {
  await apiClient.delete<unknown>(`/mei-notas/catalogo/clientes/${encodeURIComponent(id)}`);
}

export async function criarCatalogoNfseProduto(
  input: CriarCatalogoNfseProdutoInput
): Promise<NfseCatalogProduto> {
  const body: Record<string, unknown> = {
    discriminacao: input.discriminacao.trim(),
    codigo: String(input.codigo ?? '').trim(),
    cnae: String(input.cnae ?? '').trim(),
    documentType: input.documentType ?? 'NFSE'
  };
  if (input.aliquota !== undefined && input.aliquota !== null) {
    body.aliquota = input.aliquota;
  }
  if (input.valor_sugerido !== undefined && input.valor_sugerido !== null) {
    body.valor_sugerido = input.valor_sugerido;
  }
  if (input.metadata_json !== undefined) {
    body.metadata_json = input.metadata_json;
  }
  return await apiClient.post<NfseCatalogProduto>('/mei-notas/catalogo/produtos', body);
}

export async function atualizarCatalogoNfseProduto(
  id: string,
  input: AtualizarCatalogoNfseProdutoInput
): Promise<NfseCatalogProduto> {
  const body: Record<string, unknown> = {};
  if (input.discriminacao !== undefined) {
    body.discriminacao = input.discriminacao.trim();
  }
  if (input.codigo !== undefined) {
    body.codigo = String(input.codigo ?? '').trim();
  }
  if (input.cnae !== undefined) {
    body.cnae = String(input.cnae ?? '').trim();
  }
  if (input.aliquota !== undefined) {
    body.aliquota = input.aliquota;
  }
  if (input.valor_sugerido !== undefined) {
    body.valor_sugerido = input.valor_sugerido;
  }
  if (input.metadata_json !== undefined) {
    body.metadata_json = input.metadata_json;
  }
  return await apiClient.patch<NfseCatalogProduto>(
    `/mei-notas/catalogo/produtos/${encodeURIComponent(id)}`,
    body
  );
}

/** DELETE catálogo produto/serviço — 204 sem corpo (CAT-MEI-06). */
export async function eliminarCatalogoNfseProduto(id: string): Promise<void> {
  await apiClient.delete<unknown>(`/mei-notas/catalogo/produtos/${encodeURIComponent(id)}`);
}
