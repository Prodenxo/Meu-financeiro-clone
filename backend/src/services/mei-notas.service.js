import { createSupabaseClient } from '../config/supabase.js';
import { badRequest, notFound } from '../utils/errors.js';
import {
  cancelarNfse,
  consultarNfse,
  consultarNfsePorIdOuProtocolo,
  consultarNfsePorIntegracao,
  downloadNfsePdf,
  downloadNfsePdfPorIntegracao,
  downloadNfseXml,
  downloadNfseXmlPorIntegracao,
  emitirNfse
} from './plugnotas/nfse.service.js';

const TABLE = 'mei_nfse';
const CLIENTS_TABLE = 'mei_nfse_clientes';
const PRODUCTS_TABLE = 'mei_nfse_produtos';
const DOCUMENT_TYPE_NFSE = 'NFSE';
const SUPPORTED_DOCUMENT_TYPES = new Set(['NFSE', 'NFE', 'NFCE', 'CTE']);
const PROVIDER_PLUGNOTAS = 'plugnotas';
const EDITABLE_STATUSES = new Set(['processando', 'rejeitado', 'interrompido']);

const normalizeDoc = (value) => String(value || '').replace(/\D/g, '');
const isValidCnpj = (value) => normalizeDoc(value).length === 14;
const isValidCpfOrCnpj = (value) => {
  const digits = normalizeDoc(value);
  return !digits || digits.length === 11 || digits.length === 14;
};

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isNaN(parsed) ? null : parsed;
};

const normalizeText = (value) => String(value || '')
  .trim()
  .replace(/\s+/g, ' ')
  .toLowerCase();

const normalizeEmail = (value) => normalizeText(value);

const toCatalogLimit = (value, { defaultValue = 20, max = 50 } = {}) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return defaultValue;
  const normalized = Math.trunc(parsed);
  if (normalized <= 0) return defaultValue;
  return Math.min(normalized, max);
};

const sanitizeSearchTerm = (value) => String(value || '')
  .trim()
  .replace(/[,%()]/g, ' ')
  .replace(/\s+/g, ' ');

const normalizeDocumentType = (value = DOCUMENT_TYPE_NFSE) => {
  const normalized = String(value || DOCUMENT_TYPE_NFSE).trim().toUpperCase();
  if (!SUPPORTED_DOCUMENT_TYPES.has(normalized)) {
    throw badRequest('documentType inválido');
  }
  return normalized;
};

const collectResponseCandidates = (response) => {
  if (Array.isArray(response)) return response;
  if (!response || typeof response !== 'object') return [response];
  const list = [response];
  if (Array.isArray(response.documents)) list.push(...response.documents);
  if (Array.isArray(response.documentos)) list.push(...response.documentos);
  return list;
};

const pickCandidateValue = (candidates, accessor) => {
  for (const candidate of candidates) {
    const value = accessor(candidate);
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return null;
};

const normalizeStatus = (value) => {
  const text = String(value || '').toUpperCase();
  if (!text) return 'processando';
  if (text.includes('CONCLUIDO') || text.includes('AUTORIZ')) return 'concluido';
  if (text.includes('PROCESS')) return 'processando';
  if (text.includes('REJEIT')) return 'rejeitado';
  if (text.includes('CANCEL')) return 'cancelado';
  if (text.includes('INTERROMP')) return 'interrompido';
  return text.toLowerCase();
};

const prune = (value) => {
  if (Array.isArray(value)) {
    const list = value.map(prune).filter((item) => item !== undefined);
    return list.length ? list : undefined;
  }
  if (value && typeof value === 'object') {
    const next = {};
    Object.entries(value).forEach(([key, item]) => {
      const cleaned = prune(item);
      if (cleaned !== undefined) {
        next[key] = cleaned;
      }
    });
    return Object.keys(next).length ? next : undefined;
  }
  if (value === null || value === undefined || value === '') return undefined;
  return value;
};

const buildServicoFromInput = (input) => {
  if (!input || typeof input !== 'object') return null;
  const iss = input.iss || {};
  const valor = input.valor || {};
  const codigo = input.codigo || input.codigoServico || null;
  const discriminacao = input.discriminacao || input.descricaoServico || null;
  const cnae = input.cnae || null;
  const aliquota = input.aliquota ?? iss.aliquota;
  const valorServico = input.valorServico ?? valor.servico;

  return prune({
    id: input.id || null,
    codigo,
    discriminacao,
    cnae,
    iss: prune({
      ...iss,
      ...(aliquota !== undefined ? { aliquota: toNumber(aliquota) } : {})
    }),
    valor: prune({
      ...valor,
      ...(valorServico !== undefined ? { servico: toNumber(valorServico) } : {})
    })
  });
};

const buildPayloadFromInput = (input, userId) => {
  const idIntegracao = input?.idIntegracao || `mei-${userId}-${Date.now()}`;
  const prestadorDoc = normalizeDoc(
    input?.prestador?.cpfCnpj
      || input?.prestadorCpfCnpj
      || input?.cnpjPrestador
      || input?.cnpj
      || ''
  );
  const tomadorDoc = normalizeDoc(
    input?.tomador?.cpfCnpj
      || input?.tomadorCpfCnpj
      || input?.cnpjTomador
      || ''
  );
  const servicosInput = input?.servicos || input?.servico || null;
  const servicosList = Array.isArray(servicosInput)
    ? servicosInput.map(buildServicoFromInput).filter(Boolean)
    : [buildServicoFromInput(servicosInput)].filter(Boolean);

  const payload = prune({
    idIntegracao,
    enviarEmail: input?.enviarEmail ?? false,
    naturezaTributacao: input?.naturezaTributacao ?? null,
    descricao: input?.descricao ?? null,
    informacoesComplementares: input?.informacoesComplementares ?? null,
    prestador: prune({
      ...(input?.prestador || {}),
      cpfCnpj: prestadorDoc || input?.prestador?.cpfCnpj || null,
      inscricaoMunicipal: input?.prestador?.inscricaoMunicipal || input?.prestadorInscricaoMunicipal || null,
      razaoSocial: input?.prestador?.razaoSocial || input?.prestadorRazaoSocial || null,
      email: input?.prestador?.email || input?.prestadorEmail || null
    }),
    tomador: prune({
      ...(input?.tomador || {}),
      cpfCnpj: tomadorDoc || input?.tomador?.cpfCnpj || null,
      razaoSocial: input?.tomador?.razaoSocial || input?.tomadorRazaoSocial || null,
      email: input?.tomador?.email || input?.tomadorEmail || null
    }),
    rps: prune(input?.rps || null),
    cidadePrestacao: prune(input?.cidadePrestacao || null),
    servico: servicosList
  });

  return { payload, prestadorDoc, tomadorDoc };
};

const validatePayload = (payload) => {
  const prestadorDoc = normalizeDoc(payload?.prestador?.cpfCnpj || '');
  if (!prestadorDoc) {
    throw badRequest('CNPJ do prestador é obrigatório');
  }
  if (!isValidCnpj(prestadorDoc)) {
    throw badRequest('CNPJ do prestador deve ter 14 dígitos');
  }

  const tomadorDoc = normalizeDoc(payload?.tomador?.cpfCnpj || '');
  if (!isValidCpfOrCnpj(tomadorDoc)) {
    throw badRequest('CPF/CNPJ do tomador inválido');
  }

  const servicos = Array.isArray(payload?.servico) ? payload.servico : [];
  if (!servicos.length) {
    throw badRequest('Serviço da NFSe é obrigatório');
  }

  const hasValidService = servicos.some((item) => {
    if (item?.id) return true;
    const aliquota = toNumber(item?.iss?.aliquota);
    const valorServico = toNumber(item?.valor?.servico);

    return Boolean(
      item?.codigo
      && item?.discriminacao
      && item?.cnae
      && aliquota !== null
      && valorServico !== null
      && valorServico > 0
    );
  });

  if (!hasValidService) {
    throw badRequest('Serviço da NFSe está incompleto');
  }
};

const normalizePayloadShape = (payload) => {
  if (!payload || typeof payload !== 'object') return payload;
  const next = { ...payload };
  if (next.servico && !Array.isArray(next.servico)) {
    next.servico = [next.servico];
  }
  return next;
};

const ensureRecordId = (id) => {
  if (!id) throw badRequest('ID da NFSe é obrigatório');
};

const toObject = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value;
};

const sanitizeMetadata = (value) => {
  if (value === undefined || value === null) return {};
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw badRequest('metadata deve ser um objeto');
  }
  return prune(value) || {};
};

const sanitizeReason = (value, { required = false } = {}) => {
  const normalized = String(value || '').trim();
  if (!normalized) {
    if (required) throw badRequest('Informe o motivo da operação');
    return null;
  }
  if (normalized.length > 500) {
    throw badRequest('Motivo deve ter no máximo 500 caracteres');
  }
  return normalized;
};

const appendAuditEvent = (record, event) => {
  const current = toObject(record?.metadata_json);
  const history = Array.isArray(current.audit) ? current.audit : [];
  return prune({
    ...current,
    audit: [...history, event].slice(-50)
  }) || {};
};

const mergeResponsePayload = (record, extra) => {
  const current = record?.response_json;
  if (!current || typeof current !== 'object' || Array.isArray(current)) {
    return prune(extra) || null;
  }
  return prune({
    ...current,
    ...extra
  }) || null;
};

const parseUpdateInput = (input) => {
  const metadata = sanitizeMetadata(input?.metadata);
  const internalDescriptionRaw = input?.descricaoInterna;
  const hasDescription = internalDescriptionRaw !== undefined;
  const descricaoInterna = hasDescription ? String(internalDescriptionRaw || '').trim() : null;
  if (hasDescription && descricaoInterna.length > 500) {
    throw badRequest('Descrição interna deve ter no máximo 500 caracteres');
  }

  const rawTags = input?.tags;
  let tags;
  if (rawTags !== undefined) {
    if (!Array.isArray(rawTags)) {
      throw badRequest('tags deve ser uma lista');
    }
    tags = rawTags
      .map((item) => String(item || '').trim())
      .filter(Boolean)
      .slice(0, 20);
  }

  if (!Object.keys(metadata).length && !hasDescription && rawTags === undefined) {
    throw badRequest('Informe ao menos um campo editável para atualizar a NFSe');
  }

  return {
    metadata,
    ...(hasDescription ? { descricaoInterna } : {}),
    ...(rawTags !== undefined ? { tags } : {})
  };
};

const parseArchivedInput = (value) => {
  if (value === undefined) return true;
  if (typeof value === 'boolean') return value;
  const normalized = String(value || '').toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  throw badRequest('Campo archived deve ser booleano');
};

const buildClienteCatalogEntry = (payload) => {
  const tomador = toObject(payload?.tomador);
  const documento = normalizeDoc(tomador.cpfCnpj);
  const nome = String(tomador.razaoSocial || '').trim();
  const email = normalizeEmail(tomador.email);

  if (!documento && !nome && !email) return null;

  const fallbackKey = [normalizeText(nome), email].filter(Boolean).join('|');
  if (!documento && !fallbackKey) return null;

  return {
    dedupe_key: documento ? `doc:${documento}` : `fallback:${fallbackKey}`,
    documento: documento || null,
    nome: nome || null,
    email: email || null
  };
};

const buildProdutoCatalogEntries = (payload) => {
  const servicos = Array.isArray(payload?.servico) ? payload.servico : [];
  return servicos
    .map((item) => {
      const codigo = String(item?.codigo || '').trim();
      const cnae = String(item?.cnae || '').trim();
      const discriminacao = String(item?.discriminacao || '').trim();
      const discriminacaoNorm = normalizeText(discriminacao);
      const aliquota = toNumber(item?.iss?.aliquota);
      const valorSugerido = toNumber(item?.valor?.servico);
      const aliquotaKey = aliquota === null ? '' : aliquota.toFixed(4);

      if (!codigo && !cnae && !discriminacaoNorm) return null;

      return {
        dedupe_key: `servico:${normalizeText(codigo)}|${normalizeText(cnae)}|${discriminacaoNorm}|${aliquotaKey}`,
        codigo,
        cnae,
        discriminacao,
        aliquota,
        valor_sugerido: valorSugerido
      };
    })
    .filter(Boolean);
};

const applyCatalogSearch = (query, q, fields) => {
  const search = sanitizeSearchTerm(q);
  if (!search) return query;
  const like = `%${search}%`;
  const filters = fields.map((field) => `${field}.ilike.${like}`);
  return query.or(filters.join(','));
};

const getDb = () => createSupabaseClient({ useServiceRole: true });

const insertRecord = async (userId, data) => {
  const dbClient = getDb();
  const { data: created, error } = await dbClient
    .from(TABLE)
    .insert({
      ...data,
      user_id: userId,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
  if (error) throw badRequest(error.message);
  return created;
};

const updateRecord = async (userId, id, updates) => {
  const dbClient = getDb();
  const { data, error } = await dbClient
    .from(TABLE)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw badRequest(error.message);
  return data;
};

const findRecord = async (userId, id) => {
  const dbClient = getDb();
  const { data, error } = await dbClient
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw badRequest(error.message);
  if (!data) throw notFound('NFSe não encontrada');
  return data;
};

const upsertClienteCatalogo = async (userId, payload, { documentType = DOCUMENT_TYPE_NFSE } = {}) => {
  const normalizedType = normalizeDocumentType(documentType);
  const entry = buildClienteCatalogEntry(payload);
  if (!entry) return null;

  const now = new Date().toISOString();
  const dbClient = getDb();
  const { error } = await dbClient
    .from(CLIENTS_TABLE)
    .upsert({
      ...entry,
      user_id: userId,
      document_type: normalizedType,
      last_used_at: now,
      updated_at: now
    }, { onConflict: 'user_id,document_type,dedupe_key' });
  if (error) throw badRequest(error.message);
  return entry;
};

const upsertProdutosCatalogo = async (userId, payload, { documentType = DOCUMENT_TYPE_NFSE } = {}) => {
  const normalizedType = normalizeDocumentType(documentType);
  const entries = buildProdutoCatalogEntries(payload);
  if (!entries.length) return 0;

  const now = new Date().toISOString();
  const rows = entries.map((entry) => ({
    ...entry,
    user_id: userId,
    document_type: normalizedType,
    last_used_at: now,
    updated_at: now
  }));
  const dbClient = getDb();
  const { error } = await dbClient
    .from(PRODUCTS_TABLE)
    .upsert(rows, { onConflict: 'user_id,document_type,dedupe_key' });
  if (error) throw badRequest(error.message);
  return rows.length;
};

const extractPlugNotasStatus = (response) => {
  const candidates = collectResponseCandidates(response);
  return normalizeStatus(
    pickCandidateValue(candidates, (candidate) => (
      candidate?.status
        || candidate?.situacao
        || candidate?.message
        || candidate?.mensagem
    )) || ''
  );
};

const extractPlugNotasId = (response) => {
  const candidates = collectResponseCandidates(response);
  return pickCandidateValue(candidates, (candidate) => candidate?.id);
};

const extractIntegracaoId = (response) => {
  const candidates = collectResponseCandidates(response);
  return pickCandidateValue(candidates, (candidate) => candidate?.idIntegracao);
};

const extractProtocol = (response) => {
  const candidates = collectResponseCandidates(response);
  return pickCandidateValue(candidates, (candidate) => candidate?.protocol || candidate?.protocolo);
};

const refreshWithPlugNotas = async (record) => {
  if (record?.plugnotas_id) return await consultarNfse(record.plugnotas_id);
  if (record?.protocol) return await consultarNfsePorIdOuProtocolo(record.protocol);
  if (record?.id_integracao && record?.cnpj_prestador) {
    return await consultarNfsePorIntegracao(record.id_integracao, record.cnpj_prestador);
  }
  return null;
};

export const emitirNota = async (userId, input) => {
  const payloadBase = input?.payload && typeof input.payload === 'object'
    ? normalizePayloadShape(prune(input.payload))
    : null;
  const { payload, prestadorDoc, tomadorDoc } = payloadBase
    ? { payload: payloadBase, prestadorDoc: normalizeDoc(payloadBase?.prestador?.cpfCnpj || ''), tomadorDoc: normalizeDoc(payloadBase?.tomador?.cpfCnpj || '') }
    : buildPayloadFromInput(input, userId);

  if (!payload?.idIntegracao) {
    payload.idIntegracao = `mei-${userId}-${Date.now()}`;
  }

  validatePayload(payload);

  const response = await emitirNfse(payload);
  const plugnotasId = extractPlugNotasId(response);
  const idIntegracao = extractIntegracaoId(response) || payload.idIntegracao;
  const status = extractPlugNotasStatus(response);
  const protocol = extractProtocol(response);
  const metadata = sanitizeMetadata(input?.metadata);

  const created = await insertRecord(userId, {
    plugnotas_id: plugnotasId,
    protocol,
    id_integracao: idIntegracao,
    status,
    document_type: DOCUMENT_TYPE_NFSE,
    provider: PROVIDER_PLUGNOTAS,
    cnpj_prestador: prestadorDoc || normalizeDoc(payload?.prestador?.cpfCnpj || ''),
    cnpj_tomador: tomadorDoc || normalizeDoc(payload?.tomador?.cpfCnpj || ''),
    payload_json: payload,
    response_json: response,
    metadata_json: Object.keys(metadata).length ? metadata : null
  });

  try {
    await upsertClienteCatalogo(userId, payload, { documentType: DOCUMENT_TYPE_NFSE });
    await upsertProdutosCatalogo(userId, payload, { documentType: DOCUMENT_TYPE_NFSE });
  } catch (error) {
    console.warn(
      '[mei-notas] Falha ao atualizar catalogo NFSe',
      error instanceof Error ? error.message : error
    );
  }

  return created;
};

export const listarNotas = async (userId, { includeArchived = false } = {}) => {
  const dbClient = getDb();
  let query = dbClient
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (!includeArchived) {
    query = query.is('archived_at', null);
  }
  const { data, error } = await query;
  if (error) throw badRequest(error.message);
  return data || [];
};

export const listarCatalogoClientes = async (
  userId,
  { q = '', limit = 20, documentType = DOCUMENT_TYPE_NFSE } = {}
) => {
  const normalizedType = normalizeDocumentType(documentType);
  const safeLimit = toCatalogLimit(limit);
  const dbClient = getDb();
  let query = dbClient
    .from(CLIENTS_TABLE)
    .select('id, document_type, documento, nome, email, metadata_json, last_used_at, created_at, updated_at')
    .eq('user_id', userId)
    .eq('document_type', normalizedType)
    .order('last_used_at', { ascending: false })
    .limit(safeLimit);

  query = applyCatalogSearch(query, q, ['documento', 'nome', 'email']);

  const { data, error } = await query;
  if (error) throw badRequest(error.message);
  return data || [];
};

export const listarCatalogoProdutos = async (
  userId,
  { q = '', limit = 20, documentType = DOCUMENT_TYPE_NFSE } = {}
) => {
  const normalizedType = normalizeDocumentType(documentType);
  const safeLimit = toCatalogLimit(limit);
  const dbClient = getDb();
  let query = dbClient
    .from(PRODUCTS_TABLE)
    .select('id, document_type, codigo, cnae, discriminacao, aliquota, valor_sugerido, metadata_json, last_used_at, created_at, updated_at')
    .eq('user_id', userId)
    .eq('document_type', normalizedType)
    .order('last_used_at', { ascending: false })
    .limit(safeLimit);

  query = applyCatalogSearch(query, q, ['codigo', 'cnae', 'discriminacao']);

  const { data, error } = await query;
  if (error) throw badRequest(error.message);
  return data || [];
};

export const obterNota = async (userId, id, { sync = false } = {}) => {
  const record = await findRecord(userId, id);
  if (!sync) return record;

  const response = await refreshWithPlugNotas(record);
  if (!response) return record;

  const plugnotasId = extractPlugNotasId(response) || record.plugnotas_id;
  const idIntegracao = extractIntegracaoId(response) || record.id_integracao;
  const status = extractPlugNotasStatus(response);
  const protocol = extractProtocol(response) || record.protocol;

  return await updateRecord(userId, record.id, {
    plugnotas_id: plugnotasId,
    id_integracao: idIntegracao,
    protocol,
    status,
    response_json: response
  });
};

export const atualizarNota = async (userId, id, input) => {
  ensureRecordId(id);
  const updateInput = parseUpdateInput(input);
  const record = await findRecord(userId, id);
  if (record?.archived_at) {
    throw badRequest('NFSe arquivada não permite edição');
  }

  const status = normalizeStatus(record?.status);
  if (!EDITABLE_STATUSES.has(status)) {
    throw badRequest('NFSe no status atual não permite edição');
  }
  const metadata = prune({
    ...toObject(record?.metadata_json),
    ...updateInput.metadata,
    ...(updateInput.descricaoInterna !== undefined ? { descricaoInterna: updateInput.descricaoInterna } : {}),
    ...(updateInput.tags !== undefined ? { tags: updateInput.tags } : {}),
    updatedAt: new Date().toISOString()
  }) || {};

  const metadataWithAudit = appendAuditEvent({ metadata_json: metadata }, {
    type: 'update',
    at: new Date().toISOString()
  });

  return await updateRecord(userId, id, {
    metadata_json: metadataWithAudit
  });
};

export const cancelarNota = async (userId, id, input) => {
  ensureRecordId(id);
  const record = await findRecord(userId, id);
  const statusAtual = normalizeStatus(record?.status);
  if (statusAtual === 'cancelado') {
    return record;
  }

  const reason = sanitizeReason(input?.reason);
  let providerResponse = null;
  let providerError = null;
  let nextStatus = 'cancelado';

  if (record?.plugnotas_id) {
    try {
      providerResponse = await cancelarNfse(record.plugnotas_id, { reason });
      nextStatus = extractPlugNotasStatus(providerResponse) || 'cancelado';
    } catch (error) {
      providerError = error;
      nextStatus = 'cancelamento_pendente';
    }
  }

  const metadata = prune({
    ...toObject(record?.metadata_json),
    cancelamento: prune({
      requestedAt: new Date().toISOString(),
      reason,
      mode: record?.plugnotas_id ? 'provider' : 'local',
      ...(providerError ? { providerError: String(providerError?.message || providerError) } : {})
    })
  }) || {};
  const metadataWithAudit = appendAuditEvent({ metadata_json: metadata }, {
    type: 'cancel',
    at: new Date().toISOString(),
    ...(reason ? { reason } : {})
  });

  const updates = {
    status: nextStatus,
    metadata_json: metadataWithAudit
  };

  if (providerResponse) {
    updates.response_json = mergeResponsePayload(record, { cancelamento: providerResponse });
  } else if (providerError) {
    updates.response_json = mergeResponsePayload(record, {
      cancelamento: {
        status: 'erro',
        message: String(providerError?.message || providerError)
      }
    });
  }

  return await updateRecord(userId, id, updates);
};

export const arquivarNota = async (userId, id, input = {}) => {
  ensureRecordId(id);
  const record = await findRecord(userId, id);
  const archived = parseArchivedInput(input?.archived);
  const reason = sanitizeReason(input?.reason);

  if (Boolean(record?.archived_at) === archived) {
    return record;
  }

  const archivedAt = archived ? new Date().toISOString() : null;
  const metadata = prune({
    ...toObject(record?.metadata_json),
    arquivamento: prune({
      updatedAt: new Date().toISOString(),
      archived,
      reason
    })
  }) || {};
  const metadataWithAudit = appendAuditEvent({ metadata_json: metadata }, {
    type: archived ? 'archive' : 'unarchive',
    at: new Date().toISOString(),
    ...(reason ? { reason } : {})
  });

  return await updateRecord(userId, id, {
    archived_at: archivedAt,
    metadata_json: metadataWithAudit
  });
};

export const baixarPdf = async (userId, id) => {
  const record = await findRecord(userId, id);
  if (record?.plugnotas_id) {
    return await downloadNfsePdf(record.plugnotas_id);
  }
  if (record?.id_integracao && record?.cnpj_prestador) {
    return await downloadNfsePdfPorIntegracao(record.id_integracao, record.cnpj_prestador);
  }
  throw notFound('PDF da NFSe não disponível');
};

export const baixarXml = async (userId, id) => {
  const record = await findRecord(userId, id);
  if (record?.plugnotas_id) {
    return await downloadNfseXml(record.plugnotas_id);
  }
  if (record?.id_integracao && record?.cnpj_prestador) {
    return await downloadNfseXmlPorIntegracao(record.id_integracao, record.cnpj_prestador);
  }
  throw notFound('XML da NFSe não disponível');
};

export const processarWebhook = async (payload) => {
  const plugnotasId = payload?.id
    || payload?.documento?.id
    || payload?.documents?.[0]?.id
    || payload?.documentos?.[0]?.id
    || null;
  const idIntegracao = payload?.idIntegracao
    || payload?.documento?.idIntegracao
    || payload?.documents?.[0]?.idIntegracao
    || payload?.documentos?.[0]?.idIntegracao
    || null;
  const status = extractPlugNotasStatus(payload);
  const protocol = extractProtocol(payload);

  if (!plugnotasId && !idIntegracao) {
    throw badRequest('Webhook sem identificadores da NFSe');
  }

  const dbClient = getDb();
  const updates = {
    status,
    response_json: payload,
    updated_at: new Date().toISOString()
  };
  if (protocol) {
    updates.protocol = protocol;
  }
  if (plugnotasId) {
    updates.plugnotas_id = plugnotasId;
  }
  if (idIntegracao) {
    updates.id_integracao = idIntegracao;
  }

  const resolveSingleRecordByField = async (field, value) => {
    if (!value) return null;
    const { data, error } = await dbClient
      .from(TABLE)
      .select('id')
      .eq(field, value)
      .limit(2);
    if (error) throw badRequest(error.message);
    if (!data?.length) return null;
    if (data.length > 1) {
      throw badRequest(`Identificador duplicado para ${field}`);
    }
    return data[0];
  };

  const updateById = async (recordId) => {
    if (!recordId) return null;
    const { data, error } = await dbClient
      .from(TABLE)
      .update(updates)
      .eq('id', recordId)
      .select()
      .single();
    if (error) throw badRequest(error.message);
    return data || null;
  };

  let data = null;
  if (plugnotasId) {
    const record = await resolveSingleRecordByField('plugnotas_id', plugnotasId);
    data = await updateById(record?.id);
  }
  if (!data && idIntegracao) {
    const record = await resolveSingleRecordByField('id_integracao', idIntegracao);
    data = await updateById(record?.id);
  }

  if (!data) {
    throw notFound('NFSe referente ao webhook não encontrada');
  }

  return data;
};
