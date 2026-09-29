import { apiClient, downloadToFile } from '../lib/apiClient';

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
  /** Legado interno; Plugnotas usa unidadeComercial */
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
  /** Opcional — MEI/Simples Nacional: o backend não repassa alíquota ISS na NFS-e. */
  aliquota?: string | number;
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
  tomadorEndereco?: {
    logradouro?: string;
    numero?: string;
    codigoCidade?: string;
    cep?: string;
    complemento?: string;
    bairro?: string;
    estado?: string;
    descricaoCidade?: string;
  };
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

export const OPTIMISTIC_NOTA_ID_PREFIX = 'pending:';

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
  /** Offset para paginação (quando suportado pelo backend). */
  offset?: number;
  documentType?: DocumentType;
}

/** Corpo alinhado ao contrato partilhado web/mobile (campos do catálogo NFSe). */
export interface CriarCatalogoNfseClienteInput {
  documento: string;
  nome: string;
  email?: string;
  documentType?: DocumentType;
  metadata_json?: Record<string, unknown> | null;
}

export interface AtualizarCatalogoNfseClienteInput {
  documento?: string;
  nome?: string;
  email?: string;
  documentType?: DocumentType;
  metadata_json?: Record<string, unknown> | null;
}

/** Catálogo serviços/produtos NFSe (API alinhada ao modelo `NfseCatalogProduto`). */
export interface CriarCatalogoNfseProdutoInput {
  codigo: string;
  cnae: string;
  discriminacao: string;
  aliquota: number | string;
  valor_sugerido?: number | string | null;
  documentType?: DocumentType;
}

export interface AtualizarCatalogoNfseProdutoInput {
  codigo?: string;
  cnae?: string;
  discriminacao?: string;
  aliquota?: number | string;
  valor_sugerido?: number | string | null;
  documentType?: DocumentType;
}

export interface ListarNotasInput {
  includeArchived?: boolean;
  documentType?: DocumentType;
}

export interface CadastrarPlugNotasCertificadoInput {
  /** React Native: use { uri, name, type } from document picker */
  arquivo: { uri: string; name: string; type?: string } | Blob;
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
    ...(typeof options.offset === 'number' &&
    Number.isFinite(options.offset) &&
    Math.trunc(options.offset) > 0
      ? { offset: String(Math.trunc(options.offset)) }
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
  if ('uri' in input.arquivo) {
    // @ts-expect-error React Native FormData accepts file-like object
    formData.append('arquivo', {
      uri: input.arquivo.uri,
      name: input.arquivo.name,
      type: input.arquivo.type || 'application/x-pkcs12'
    });
  } else {
    formData.append('arquivo', input.arquivo);
  }
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

/** Atualiza dados da empresa cadastrada no PlugNotas. PATCH aceita payload parcial. */
export async function atualizarPlugNotasEmpresa(
  payload: Record<string, unknown>
): Promise<CadastrarPlugNotasEmpresaResponse> {
  return await apiClient.patch<CadastrarPlugNotasEmpresaResponse>(
    '/mei-notas/setup/plugnotas/empresa',
    { payload }
  );
}

export interface EmpresaFiscalEndereco {
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  codigoCidade?: string | null;
  descricaoCidade?: string | null;
  estado?: string | null;
  cep?: string | null;
}

export interface EmpresaFiscalData {
  cpfCnpj?: string | null;
  razaoSocial?: string | null;
  nomeFantasia?: string | null;
  email?: string | null;
  telefone?: { ddd?: string | null; numero?: string | null } | string | null;
  inscricaoMunicipal?: string | null;
  inscricaoEstadual?: string | null;
  endereco?: EmpresaFiscalEndereco | null;
  nfse?: { ativo?: boolean } | null;
  nfe?: { ativo?: boolean } | null;
  nfce?: { ativo?: boolean } | null;
}

export async function consultarEmpresaFiscal(cnpj: string): Promise<EmpresaFiscalData> {
  return await apiClient.get<EmpresaFiscalData>(
    `/mei-notas/setup/plugnotas/empresa?cpfCnpj=${encodeURIComponent(cnpj)}`
  );
}

export interface CnpjLookupCnae {
  codigo: string;
  descricao: string | null;
}

export interface CnpjLookupData {
  cpfCnpj: string;
  razaoSocial: string | null;
  nomeFantasia: string | null;
  email: string | null;
  telefone: { ddd: string; numero: string } | null;
  inscricaoMunicipal: string | null;
  inscricaoEstadual: string | null;
  endereco: EmpresaFiscalEndereco;
  situacaoCadastral: string | null;
  porte: string | null;
  capitalSocial: number | null;
  opcaoSimples: boolean | null;
  opcaoMei: boolean | null;
  cnaePrincipal: CnpjLookupCnae | null;
  raw?: Record<string, unknown>;
}

/** Consulta dados cadastrais de um CNPJ via backend (evita CORS/rate-limit da BrasilAPI no browser). */
export async function lookupCnpj(cnpj: string): Promise<CnpjLookupData> {
  const digits = String(cnpj || '').replace(/\D/g, '');
  if (digits.length !== 14) {
    throw new Error('CNPJ inválido. Informe 14 dígitos.');
  }
  return await apiClient.get<CnpjLookupData>(`/users/empresas/cnpj-lookup/${digits}`);
}

export function isOptimisticNotaRecord(record: Pick<NfseRecord, 'id'>): boolean {
  return String(record.id || '').startsWith(OPTIMISTIC_NOTA_ID_PREFIX);
}

const normalizeNotaClienteKey = (value: unknown): string => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .toLowerCase();

const valorNotaToCents = (value: unknown): number | null => {
  const n = Number(typeof value === 'string' ? value.replace(',', '.') : value);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
};

/** Identifica mesma emissão entre card otimista (app) e registro real (backend). */
export const notaEmitFingerprint = (record: NfseRecord): {
  documentType: string;
  clienteKey: string;
  valorCents: number | null;
  createdAtMs: number;
} => {
  const documentType = String(record.document_type || 'NFSE').toUpperCase();
  const createdAtMs = Date.parse(record.created_at || '') || 0;

  if (isOptimisticNotaRecord(record)) {
    const meta = record.metadata_json || {};
    return {
      documentType,
      clienteKey: normalizeNotaClienteKey(meta.clienteLabel),
      valorCents: valorNotaToCents(meta.valorReais),
      createdAtMs,
    };
  }

  const payload = record.payload_json;
  const payloadObj = payload && typeof payload === 'object' && !Array.isArray(payload)
    ? payload as Record<string, unknown>
    : null;
  const tomador = payloadObj?.tomador as Record<string, unknown> | undefined;
  const servico = payloadObj?.servico as Record<string, unknown> | undefined;
  const clienteKey = normalizeNotaClienteKey(
    tomador?.razaoSocial
    || payloadObj?.tomadorRazaoSocial
    || payloadObj?.destinatarioRazaoSocial,
  );
  const valorCents = valorNotaToCents(
    servico?.valorServico ?? payloadObj?.valorServico ?? payloadObj?.valorTotal,
  );

  return { documentType, clienteKey, valorCents, createdAtMs };
};

export const optimisticNotaMatchesServerRecord = (
  optimistic: NfseRecord,
  server: NfseRecord,
): boolean => {
  if (!isOptimisticNotaRecord(optimistic)) return false;
  const status = String(server.status || '').toLowerCase();
  if (!status.includes('process')) return false;

  const a = notaEmitFingerprint(optimistic);
  const b = notaEmitFingerprint(server);
  if (a.documentType !== b.documentType) return false;
  if (a.valorCents != null && b.valorCents != null && a.valorCents !== b.valorCents) return false;
  if (a.clienteKey && b.clienteKey && a.clienteKey !== b.clienteKey) return false;
  if (a.createdAtMs && b.createdAtMs && Math.abs(b.createdAtMs - a.createdAtMs) > 10 * 60 * 1000) {
    return false;
  }
  return true;
};

export function buildOptimisticNotaRecord(input: {
  userId: string;
  documentType: DocumentType;
  clienteLabel?: string;
  valorReais?: number;
}): NfseRecord {
  return {
    id: `${OPTIMISTIC_NOTA_ID_PREFIX}${Date.now()}`,
    user_id: input.userId,
    document_type: input.documentType,
    status: 'processando',
    created_at: new Date().toISOString(),
    protocol: 'Enviando para emissão…',
    metadata_json: {
      optimistic: true,
      clienteLabel: input.clienteLabel || null,
      valorReais: input.valorReais ?? null,
    },
  };
}

export function prependNotaRecord(list: NfseRecord[], nota: NfseRecord): NfseRecord[] {
  return [nota, ...list.filter((item) => item.id !== nota.id)];
}

export function replaceOptimisticNotaRecord(
  list: NfseRecord[],
  optimisticId: string,
  real: NfseRecord,
): NfseRecord[] {
  const without = list.filter(
    (item) => item.id !== optimisticId
      && item.id !== real.id
      && !(isOptimisticNotaRecord(item) && optimisticNotaMatchesServerRecord(item, real)),
  );
  return prependNotaRecord(without, real);
}

export function mergeNotasPreservingOptimistic(
  optimistic: NfseRecord[],
  serverList: NfseRecord[],
): NfseRecord[] {
  const serverIds = new Set(serverList.map((item) => item.id));
  const pending = optimistic.filter((item) => {
    if (serverIds.has(item.id)) return false;
    return !serverList.some((server) => optimisticNotaMatchesServerRecord(item, server));
  });
  const merged = [...pending, ...serverList];
  const seen = new Set<string>();
  const deduped = merged.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
  return deduped.sort(
    (a, b) => Date.parse(b.created_at || '') - Date.parse(a.created_at || ''),
  );
}

/**
 * Indica se o backend pode consultar o emissor (`GET /mei-notas/:id?sync=true`).
 */
export function notaFiscalPodeSincronizarEstadoEmissor(record: NfseRecord): boolean {
  if (isOptimisticNotaRecord(record)) return false;
  if (record.plugnotas_id) return true;
  if (record.protocol) return true;
  if (record.id_integracao && record.cnpj_prestador) {
    const digits = String(record.cnpj_prestador).replace(/\D/g, '');
    return digits.length >= 11;
  }
  return false;
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

export async function baixarNotaPdf(id: string): Promise<{ localUri: string; filename: string }> {
  return downloadToFile(`/mei-notas/${encodeURIComponent(id)}/pdf`, `nota-${id}.pdf`);
}

export async function baixarNfsePdf(id: string): Promise<{ localUri: string; filename: string }> {
  return await baixarNotaPdf(id);
}

export async function baixarNotaXml(id: string): Promise<{ localUri: string; filename: string }> {
  return downloadToFile(`/mei-notas/${encodeURIComponent(id)}/xml`, `nota-${id}.xml`);
}

export async function baixarNfseXml(id: string): Promise<{ localUri: string; filename: string }> {
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

/** Cria cliente no catálogo (`POST /mei-notas/catalogo/clientes`). */
export async function criarCatalogoNfseCliente(
  input: CriarCatalogoNfseClienteInput
): Promise<NfseCatalogCliente> {
  return await apiClient.post<NfseCatalogCliente>('/mei-notas/catalogo/clientes', input);
}

/** Atualiza cliente (`PATCH /mei-notas/catalogo/clientes/:id`). */
export async function atualizarCatalogoNfseCliente(
  id: string,
  input: AtualizarCatalogoNfseClienteInput
): Promise<NfseCatalogCliente> {
  return await apiClient.patch<NfseCatalogCliente>(
    `/mei-notas/catalogo/clientes/${encodeURIComponent(id)}`,
    input
  );
}

/** Remove cliente com confirmação na UI (`DELETE /mei-notas/catalogo/clientes/:id`). */
export async function excluirCatalogoNfseCliente(id: string): Promise<void> {
  await apiClient.delete<unknown>(`/mei-notas/catalogo/clientes/${encodeURIComponent(id)}`);
}

export async function listarCatalogoNfseProdutos(
  options: ListarCatalogoNfseInput = {}
): Promise<NfseCatalogProduto[]> {
  const suffix = buildCatalogSuffix(options);
  return await apiClient.get<NfseCatalogProduto[]>(`/mei-notas/catalogo/produtos${suffix}`);
}

/** Cria item no catálogo (`POST /mei-notas/catalogo/produtos`). */
export async function criarCatalogoNfseProduto(
  input: CriarCatalogoNfseProdutoInput
): Promise<NfseCatalogProduto> {
  return await apiClient.post<NfseCatalogProduto>('/mei-notas/catalogo/produtos', input);
}

/** Atualiza item (`PATCH /mei-notas/catalogo/produtos/:id`). */
export async function atualizarCatalogoNfseProduto(
  id: string,
  input: AtualizarCatalogoNfseProdutoInput
): Promise<NfseCatalogProduto> {
  return await apiClient.patch<NfseCatalogProduto>(
    `/mei-notas/catalogo/produtos/${encodeURIComponent(id)}`,
    input
  );
}

/** Remove item com confirmação na UI (`DELETE /mei-notas/catalogo/produtos/:id`). */
export async function excluirCatalogoNfseProduto(id: string): Promise<void> {
  await apiClient.delete<unknown>(`/mei-notas/catalogo/produtos/${encodeURIComponent(id)}`);
}
