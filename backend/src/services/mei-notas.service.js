import { createSupabaseClient } from '../config/supabase.js';
import { badRequest, notFound } from '../utils/errors.js';
import {
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

  return await insertRecord(userId, {
    plugnotas_id: plugnotasId,
    protocol,
    id_integracao: idIntegracao,
    status,
    cnpj_prestador: prestadorDoc || normalizeDoc(payload?.prestador?.cpfCnpj || ''),
    cnpj_tomador: tomadorDoc || normalizeDoc(payload?.tomador?.cpfCnpj || ''),
    payload_json: payload,
    response_json: response
  });
};

export const listarNotas = async (userId) => {
  const dbClient = getDb();
  const { data, error } = await dbClient
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
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
