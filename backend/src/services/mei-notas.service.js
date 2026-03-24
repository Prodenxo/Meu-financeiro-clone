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
import {
  cancelarNfe,
  consultarNfe,
  consultarNfePorIdOuProtocolo,
  consultarNfePorIntegracao,
  downloadNfePdf,
  downloadNfePdfPorIntegracao,
  downloadNfeXml,
  downloadNfeXmlPorIntegracao,
  emitirNfe,
  relatorioNfe
} from './plugnotas/nfe.service.js';
import {
  cancelarNfce,
  consultarNfce,
  consultarNfcePorIdOuProtocolo,
  consultarNfcePorIntegracao,
  downloadNfcePdf,
  downloadNfcePdfPorIntegracao,
  downloadNfceXml,
  downloadNfceXmlPorIntegracao,
  emitirNfce
} from './plugnotas/nfce.service.js';
import { isPlugnotasDebugExplicitlyEnabled } from './plugnotas/plugnotas-debug-env.js';

const TABLE = 'mei_nfse';
const CLIENTS_TABLE = 'mei_nfse_clientes';
const PRODUCTS_TABLE = 'mei_nfse_produtos';
const DOCUMENT_TYPE_NFSE = 'NFSE';
const DOCUMENT_TYPE_NFE = 'NFE';
const DOCUMENT_TYPE_NFCE = 'NFCE';

/**
 * Tamanho mínimo do código de serviço NFSe após normalização "sem máscara" (Plugnotas).
 * @see docs/prd/PRD-nfse-servico-codigo-validacao-minima.md
 */
export const NFSE_SERVICO_CODIGO_MIN_LENGTH = 6;

/**
 * Produz o valor usado para medir comprimento do código de serviço NFSe: apenas caracteres
 * alfanuméricos ASCII (remove pontos, traços, espaços e demais símbolos de máscara).
 * Deve permanecer alinhado ao frontend (Story 6.6).
 * @see docs/prd/PRD-nfse-servico-codigo-validacao-minima.md
 */
export const normalizeNfseServicoCodigoForLength = (raw) => (
  String(raw ?? '').replace(/[^0-9A-Za-z]/g, '')
);

/**
 * Garante que cada `servico[].codigo` preenchido tenha comprimento normalizado >= mínimo.
 * @throws {HttpError} 400 se algum código violar a regra
 */
export const assertNfseServicoCodigosMinLength = (payload) => {
  const servicos = Array.isArray(payload?.servico) ? payload.servico : [];
  servicos.forEach((item, index) => {
    const codigoRaw = item?.codigo;
    if (codigoRaw === undefined || codigoRaw === null) return;
    const trimmed = String(codigoRaw).trim();
    if (!trimmed) return;
    const normalized = normalizeNfseServicoCodigoForLength(trimmed);
    if (normalized.length < NFSE_SERVICO_CODIGO_MIN_LENGTH) {
      const pos = index + 1;
      throw badRequest(
        `Código do serviço (NFSe) deve ter pelo menos ${NFSE_SERVICO_CODIGO_MIN_LENGTH} caracteres alfanuméricos após remover máscaras (serviço ${pos}). Informe o código válido conforme o município ou a lista de serviços.`
      );
    }
  });
};
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

const parseBooleanLike = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  const text = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'sim'].includes(text)) return true;
  if (['0', 'false', 'no', 'nao', 'não'].includes(text)) return false;
  return fallback;
};

const normalizeWebhookDocumentType = (value) => {
  const text = String(value || '').trim().toLowerCase();
  if (text === 'nfse') return DOCUMENT_TYPE_NFSE;
  if (text === 'nfe') return DOCUMENT_TYPE_NFE;
  if (text === 'nfce') return DOCUMENT_TYPE_NFCE;
  if (!text) return null;
  return null;
};

const resolveInputDocumentType = (input = {}) => {
  return normalizeDocumentType(input?.documentType || input?.document_type || DOCUMENT_TYPE_NFSE);
};

const getAdapterByDocumentType = (documentType) => {
  const normalized = normalizeDocumentType(documentType);
  if (normalized === DOCUMENT_TYPE_NFSE) {
    return {
      emitir: emitirNfse,
      consultar: consultarNfse,
      consultarPorIdOuProtocolo: consultarNfsePorIdOuProtocolo,
      consultarPorIntegracao: consultarNfsePorIntegracao,
      cancelar: cancelarNfse,
      downloadPdf: downloadNfsePdf,
      downloadPdfPorIntegracao: downloadNfsePdfPorIntegracao,
      downloadXml: downloadNfseXml,
      downloadXmlPorIntegracao: downloadNfseXmlPorIntegracao
    };
  }
  if (normalized === DOCUMENT_TYPE_NFE) {
    return {
      emitir: emitirNfe,
      consultar: consultarNfe,
      consultarPorIdOuProtocolo: consultarNfePorIdOuProtocolo,
      consultarPorIntegracao: consultarNfePorIntegracao,
      cancelar: cancelarNfe,
      downloadPdf: downloadNfePdf,
      downloadPdfPorIntegracao: downloadNfePdfPorIntegracao,
      downloadXml: downloadNfeXml,
      downloadXmlPorIntegracao: downloadNfeXmlPorIntegracao
    };
  }
  if (normalized === DOCUMENT_TYPE_NFCE) {
    return {
      emitir: emitirNfce,
      consultar: consultarNfce,
      consultarPorIdOuProtocolo: consultarNfcePorIdOuProtocolo,
      consultarPorIntegracao: consultarNfcePorIntegracao,
      cancelar: cancelarNfce,
      downloadPdf: downloadNfcePdf,
      downloadPdfPorIntegracao: downloadNfcePdfPorIntegracao,
      downloadXml: downloadNfceXml,
      downloadXmlPorIntegracao: downloadNfceXmlPorIntegracao
    };
  }
  throw badRequest('documentType sem suporte operacional');
};

const collectResponseCandidates = (response) => {
  if (Array.isArray(response)) return response;
  if (!response || typeof response !== 'object') return [response];
  const list = [response];
  if (Array.isArray(response.documents)) list.push(...response.documents);
  if (Array.isArray(response.documentos)) list.push(...response.documentos);
  if (response.data !== undefined && response.data !== null) {
    if (Array.isArray(response.data)) list.push(...response.data);
    else if (typeof response.data === 'object') list.push(response.data);
  }
  if (response.nfse && typeof response.nfse === 'object') list.push(response.nfse);
  if (response.documento && typeof response.documento === 'object') list.push(response.documento);
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
  const issSource = input.iss && typeof input.iss === 'object' ? { ...input.iss } : {};
  delete issSource.aliquota;
  const valor = input.valor || {};
  const codigo = input.codigo || input.codigoServico || null;
  const discriminacao = input.discriminacao || input.descricaoServico || null;
  const cnae = input.cnae || null;
  const valorServico = input.valorServico ?? valor.servico;

  // MEI optante pelo Simples Nacional: não informar alíquota ISS no JSON (regra fiscal / prefeitura).
  return prune({
    id: input.id || null,
    codigo,
    discriminacao,
    cnae,
    iss: prune(issSource),
    valor: prune({
      ...valor,
      ...(valorServico !== undefined ? { servico: toNumber(valorServico) } : {})
    })
  });
};

const estadoToUf = (estado) => {
  const s = estado ? String(estado).trim().toUpperCase() : '';
  return s.length >= 2 ? s.slice(0, 2) : s || null;
};

const buildPrestadorEnderecoFromInput = (input) => {
  const enderecoInput = (
    input?.prestadorEndereco
    && typeof input.prestadorEndereco === 'object'
    && !Array.isArray(input.prestadorEndereco)
      ? input.prestadorEndereco
      : (
          input?.prestador?.endereco
          && typeof input.prestador.endereco === 'object'
          && !Array.isArray(input.prestador.endereco)
            ? input.prestador.endereco
            : {}
        )
  );

  const estadoNorm = enderecoInput?.estado ? String(enderecoInput.estado).trim().toUpperCase() : null;
  const uf = estadoToUf(estadoNorm || enderecoInput?.uf);
  const cepRaw = enderecoInput?.cep ? normalizeDoc(enderecoInput.cep).slice(0, 8) : null;
  const codigoCidadeRaw = enderecoInput?.codigoCidade;
  const codigoCidade =
    codigoCidadeRaw !== undefined && codigoCidadeRaw !== null && codigoCidadeRaw !== ''
      ? String(codigoCidadeRaw).trim()
      : null;

  return prune({
    ...enderecoInput,
    logradouro: enderecoInput?.logradouro || null,
    numero: enderecoInput?.numero || null,
    codigoCidade: codigoCidade,
    cep: cepRaw ? String(cepRaw) : null,
    complemento: enderecoInput?.complemento || null,
    bairro: enderecoInput?.bairro || null,
    estado: estadoNorm,
    uf: uf,
    descricaoCidade: enderecoInput?.descricaoCidade || null
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
  const prestadorEndereco = buildPrestadorEnderecoFromInput(input);

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
      email: input?.prestador?.email || input?.prestadorEmail || null,
      endereco: prestadorEndereco
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

const buildNfeLikePayloadFromInput = (input, userId, { defaultModel = '55' } = {}) => {
  const idIntegracao = input?.idIntegracao || `mei-${userId}-${Date.now()}`;
  const emitenteDoc = normalizeDoc(
    input?.emitente?.cpfCnpj
      || input?.emitenteCpfCnpj
      || input?.prestadorCpfCnpj
      || input?.cnpj
      || ''
  );
  const destinatarioDoc = normalizeDoc(
    input?.destinatario?.cpfCnpj
      || input?.destinatarioCpfCnpj
      || input?.tomadorCpfCnpj
      || ''
  );
  const itensInput = Array.isArray(input?.itens)
    ? input.itens
    : (input?.item ? [input.item] : []);

  const payload = prune({
    idIntegracao,
    ...(input?.payload && typeof input.payload === 'object' ? input.payload : {}),
    modelo: input?.modelo || defaultModel,
    natureza: input?.natureza || input?.descricao || 'VENDA',
    emitente: prune({
      ...(input?.emitente || {}),
      cpfCnpj: emitenteDoc || input?.emitente?.cpfCnpj || null,
      razaoSocial: input?.emitente?.razaoSocial || input?.emitenteRazaoSocial || null,
      inscricaoEstadual: input?.emitente?.inscricaoEstadual || input?.emitenteInscricaoEstadual || null
    }),
    destinatario: prune({
      ...(input?.destinatario || {}),
      cpfCnpj: destinatarioDoc || input?.destinatario?.cpfCnpj || null,
      razaoSocial: input?.destinatario?.razaoSocial || input?.destinatarioRazaoSocial || null,
      email: input?.destinatario?.email || input?.destinatarioEmail || null
    }),
    itens: itensInput,
    ...(input?.config && typeof input.config === 'object'
      ? { config: { ...input.config } }
      : {})
  }) || {};

  if (payload?.config && payload.config.producao === undefined) {
    payload.config.producao = parseBooleanLike(input?.producao, false);
  }

  return { payload, prestadorDoc: emitenteDoc, tomadorDoc: destinatarioDoc };
};

const validatePayload = (payload) => {
  const prestadorDoc = normalizeDoc(payload?.prestador?.cpfCnpj || '');
  if (!prestadorDoc) {
    throw badRequest('CNPJ do prestador é obrigatório');
  }
  if (!isValidCnpj(prestadorDoc)) {
    throw badRequest('CNPJ do prestador deve ter 14 dígitos');
  }
  const prestadorEndereco = payload?.prestador?.endereco;
  const prestadorLogradouro = String(prestadorEndereco?.logradouro || '').trim();
  if (!prestadorLogradouro) {
    throw badRequest('Logradouro do prestador é obrigatório');
  }
  const prestadorNumero = String(prestadorEndereco?.numero || '').trim();
  if (!prestadorNumero) {
    throw badRequest('Número do endereço do prestador é obrigatório');
  }
  const prestadorCodigoCidade = String(prestadorEndereco?.codigoCidade || '').trim();
  if (!prestadorCodigoCidade) {
    throw badRequest('Código IBGE da cidade do prestador é obrigatório');
  }
  const prestadorCep = normalizeDoc(prestadorEndereco?.cep || '');
  if (prestadorCep.length !== 8) {
    throw badRequest('CEP do prestador deve ter 8 dígitos');
  }

  const tomadorDoc = normalizeDoc(payload?.tomador?.cpfCnpj || '');
  if (!tomadorDoc) {
    throw badRequest('CPF/CNPJ do tomador é obrigatório');
  }
  if (!isValidCpfOrCnpj(tomadorDoc)) {
    throw badRequest('CPF/CNPJ do tomador inválido');
  }
  const tomadorRazaoSocial = String(payload?.tomador?.razaoSocial || '').trim();
  if (!tomadorRazaoSocial) {
    throw badRequest('Razão social do tomador é obrigatória');
  }

  const servicos = Array.isArray(payload?.servico) ? payload.servico : [];
  if (!servicos.length) {
    throw badRequest('Serviço da NFSe é obrigatório');
  }

  const hasValidService = servicos.some((item) => {
    if (item?.id) return true;
    const valorServico = toNumber(item?.valor?.servico);

    return Boolean(
      item?.codigo
      && item?.discriminacao
      && item?.cnae
      && valorServico !== null
      && valorServico > 0
    );
  });

  if (!hasValidService) {
    throw badRequest('Serviço da NFSe está incompleto');
  }

  assertNfseServicoCodigosMinLength(payload);
};

const validateNfeLikePayload = (payload, { label = 'NF-e' } = {}) => {
  const emitenteDoc = normalizeDoc(payload?.emitente?.cpfCnpj || '');
  if (!emitenteDoc) {
    throw badRequest(`CNPJ do emitente da ${label} é obrigatório`);
  }
  if (!isValidCnpj(emitenteDoc)) {
    throw badRequest(`CNPJ do emitente da ${label} deve ter 14 dígitos`);
  }

  const destinatarioDoc = normalizeDoc(payload?.destinatario?.cpfCnpj || '');
  if (!destinatarioDoc) {
    throw badRequest(`CPF/CNPJ do destinatário da ${label} é obrigatório`);
  }
  if (!isValidCpfOrCnpj(destinatarioDoc)) {
    throw badRequest(`CPF/CNPJ do destinatário da ${label} inválido`);
  }
  const destinatarioNome = String(payload?.destinatario?.razaoSocial || '').trim();
  if (!destinatarioNome) {
    throw badRequest(`Razão social do destinatário da ${label} é obrigatória`);
  }

  const itens = Array.isArray(payload?.itens) ? payload.itens : [];
  if (!itens.length) {
    throw badRequest(`Itens da ${label} são obrigatórios`);
  }

  itens.forEach((item, index) => {
    const itemPos = index + 1;
    const codigo = String(item?.codigo || item?.sku || '').trim();
    if (!codigo) {
      throw badRequest(`Item ${itemPos} da ${label}: código é obrigatório`);
    }

    const descricao = String(item?.descricao || '').trim();
    if (!descricao) {
      throw badRequest(`Item ${itemPos} da ${label}: descrição é obrigatória`);
    }

    const ncm = normalizeDoc(item?.ncm || '');
    if (ncm.length !== 8) {
      throw badRequest(`Item ${itemPos} da ${label}: NCM deve ter 8 dígitos`);
    }

    const cfop = normalizeDoc(item?.cfop || '');
    if (cfop.length !== 4) {
      throw badRequest(`Item ${itemPos} da ${label}: CFOP deve ter 4 dígitos`);
    }

    const unidade = String(item?.unidade || item?.unidadeComercial || '').trim();
    if (!unidade) {
      throw badRequest(`Item ${itemPos} da ${label}: unidade é obrigatória`);
    }

    const quantidade = toNumber(item?.quantidade ?? item?.quantidadeComercial);
    if (quantidade === null || quantidade <= 0) {
      throw badRequest(`Item ${itemPos} da ${label}: quantidade deve ser maior que zero`);
    }

    const valorUnitario = toNumber(item?.valorUnitario ?? item?.valor ?? item?.valorUnitarioComercial);
    if (valorUnitario === null || valorUnitario <= 0) {
      throw badRequest(`Item ${itemPos} da ${label}: valor unitário deve ser maior que zero`);
    }

    const tributos = toObject(item?.tributos);
    const icms = toObject(tributos?.icms);
    const pis = toObject(tributos?.pis);
    const cofins = toObject(tributos?.cofins);
    const hasIcmsCode = String(icms?.cst || '').trim() || String(icms?.csosn || '').trim();
    if (!hasIcmsCode) {
      throw badRequest(`Item ${itemPos} da ${label}: informe CST ou CSOSN do ICMS`);
    }
    if (!String(pis?.cst || '').trim()) {
      throw badRequest(`Item ${itemPos} da ${label}: CST do PIS é obrigatório`);
    }
    if (!String(cofins?.cst || '').trim()) {
      throw badRequest(`Item ${itemPos} da ${label}: CST do COFINS é obrigatório`);
    }
  });
};

const normalizeNfeLikeModel = (payload, documentType) => {
  const expected = documentType === DOCUMENT_TYPE_NFE ? '55' : '65';
  const label = documentType === DOCUMENT_TYPE_NFE ? 'NF-e' : 'NFC-e';
  const rawModel = payload?.modelo;
  const parsedModel = String(rawModel || '').trim();
  if (!parsedModel) {
    payload.modelo = expected;
    return payload;
  }
  if (parsedModel !== expected) {
    throw badRequest(`Modelo inválido para ${label}. Informe ${expected}`);
  }
  payload.modelo = expected;
  return payload;
};

const buildPayloadByDocumentType = (input, userId, documentType) => {
  const payloadBase = input?.payload && typeof input.payload === 'object'
    ? normalizePayloadShape(prune(input.payload))
    : null;

  if (documentType === DOCUMENT_TYPE_NFSE) {
    if (payloadBase) {
      return {
        payload: payloadBase,
        prestadorDoc: normalizeDoc(payloadBase?.prestador?.cpfCnpj || ''),
        tomadorDoc: normalizeDoc(payloadBase?.tomador?.cpfCnpj || '')
      };
    }
    return buildPayloadFromInput(input, userId);
  }

  if (payloadBase) {
    if (documentType === DOCUMENT_TYPE_NFE || documentType === DOCUMENT_TYPE_NFCE) {
      normalizeNfeLikeModel(payloadBase, documentType);
    }
    return {
      payload: payloadBase,
      prestadorDoc: normalizeDoc(payloadBase?.emitente?.cpfCnpj || ''),
      tomadorDoc: normalizeDoc(payloadBase?.destinatario?.cpfCnpj || '')
    };
  }

  if (documentType === DOCUMENT_TYPE_NFE) {
    return buildNfeLikePayloadFromInput(input, userId, { defaultModel: '55' });
  }
  if (documentType === DOCUMENT_TYPE_NFCE) {
    return buildNfeLikePayloadFromInput(input, userId, { defaultModel: '65' });
  }

  throw badRequest(`documentType ${documentType} sem suporte de payload`);
};

const validatePayloadByDocumentType = (payload, documentType) => {
  if (documentType === DOCUMENT_TYPE_NFSE) {
    validatePayload(payload);
    return;
  }
  if (documentType === DOCUMENT_TYPE_NFE) {
    normalizeNfeLikeModel(payload, documentType);
    validateNfeLikePayload(payload, { label: 'NF-e' });
    return;
  }
  if (documentType === DOCUMENT_TYPE_NFCE) {
    normalizeNfeLikeModel(payload, documentType);
    validateNfeLikePayload(payload, { label: 'NFC-e' });
    return;
  }
  throw badRequest(`documentType ${documentType} sem suporte de validação`);
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
  if (!id) throw badRequest('ID da nota fiscal é obrigatório');
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
    throw badRequest('Informe ao menos um campo editável para atualizar a nota fiscal');
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

const buildClienteCatalogEntry = (payload, { documentType = DOCUMENT_TYPE_NFSE } = {}) => {
  const normalizedType = normalizeDocumentType(documentType);
  const tomador = normalizedType === DOCUMENT_TYPE_NFSE
    ? toObject(payload?.tomador)
    : toObject(payload?.destinatario);
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

const buildProdutoCatalogEntries = (payload, { documentType = DOCUMENT_TYPE_NFSE } = {}) => {
  const normalizedType = normalizeDocumentType(documentType);
  if (normalizedType !== DOCUMENT_TYPE_NFSE) {
    const itens = Array.isArray(payload?.itens) ? payload.itens : [];
    return itens
      .map((item) => {
        const codigo = String(item?.codigo || item?.sku || '').trim();
        const cnae = String(item?.ncm || item?.cfop || '').trim();
        const discriminacao = String(item?.descricao || '').trim();
        const discriminacaoNorm = normalizeText(discriminacao);
        const aliquota = toNumber(
          item?.tributos?.icms?.aliquota
            ?? item?.tributos?.pis?.aliquota
            ?? item?.tributos?.cofins?.aliquota
        );
        const valorSugerido = toNumber(item?.valor || item?.valorUnitario?.comercial);
        const aliquotaKey = aliquota === null ? '' : aliquota.toFixed(4);

        if (!codigo && !cnae && !discriminacaoNorm) return null;

        return {
          dedupe_key: `item:${normalizeText(codigo)}|${normalizeText(cnae)}|${discriminacaoNorm}|${aliquotaKey}`,
          codigo,
          cnae,
          discriminacao,
          aliquota,
          valor_sugerido: valorSugerido
        };
      })
      .filter(Boolean);
  }
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
  if (!data) throw notFound('Nota fiscal não encontrada');
  return data;
};

const upsertClienteCatalogo = async (userId, payload, { documentType = DOCUMENT_TYPE_NFSE } = {}) => {
  const normalizedType = normalizeDocumentType(documentType);
  const entry = buildClienteCatalogEntry(payload, { documentType: normalizedType });
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
  const entries = buildProdutoCatalogEntries(payload, { documentType: normalizedType });
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

export const extractPlugNotasId = (response) => {
  const candidates = collectResponseCandidates(response);
  return pickCandidateValue(candidates, (candidate) => candidate?.id);
};

export const extractIntegracaoId = (response) => {
  const candidates = collectResponseCandidates(response);
  return pickCandidateValue(candidates, (candidate) => candidate?.idIntegracao);
};

const extractProtocol = (response) => {
  const candidates = collectResponseCandidates(response);
  return pickCandidateValue(candidates, (candidate) => candidate?.protocol || candidate?.protocolo);
};

const refreshWithPlugNotas = async (record) => {
  const documentType = normalizeDocumentType(record?.document_type || DOCUMENT_TYPE_NFSE);
  const adapter = getAdapterByDocumentType(documentType);
  if (record?.plugnotas_id) return await adapter.consultar(record.plugnotas_id);
  if (record?.protocol && adapter.consultarPorIdOuProtocolo) {
    return await adapter.consultarPorIdOuProtocolo(record.protocol);
  }
  if (record?.id_integracao && record?.cnpj_prestador && adapter.consultarPorIntegracao) {
    return await adapter.consultarPorIntegracao(record.id_integracao, record.cnpj_prestador);
  }
  return null;
};

export const emitirNota = async (userId, input) => {
  const documentType = resolveInputDocumentType(input);
  const adapter = getAdapterByDocumentType(documentType);
  const { payload, prestadorDoc, tomadorDoc } = buildPayloadByDocumentType(input, userId, documentType);
  const metadata = sanitizeMetadata(input?.metadata);

  if (!payload?.idIntegracao) {
    payload.idIntegracao = `mei-${userId}-${Date.now()}`;
  }

  validatePayloadByDocumentType(payload, documentType);

  const response = await adapter.emitir(payload);
  const plugnotasId = extractPlugNotasId(response);
  const idIntegracao = extractIntegracaoId(response) || payload.idIntegracao;
  const status = extractPlugNotasStatus(response);
  const protocol = extractProtocol(response);

  if (isPlugnotasDebugExplicitlyEnabled()) {
    const hasData = response && typeof response === 'object' && 'data' in response;
    const dataIsArray = hasData && Array.isArray(response.data);
    console.log('[mei-notas] emissão resposta', {
      responseIsArray: Array.isArray(response),
      hasData,
      dataIsArray,
      plugnotasId: plugnotasId ? 'presente' : 'ausente',
      idIntegracao: idIntegracao ? 'presente' : 'ausente'
    });
  }

  const created = await insertRecord(userId, {
    plugnotas_id: plugnotasId,
    protocol,
    id_integracao: idIntegracao,
    status,
    document_type: documentType,
    provider: PROVIDER_PLUGNOTAS,
    cnpj_prestador: prestadorDoc
      || normalizeDoc(payload?.prestador?.cpfCnpj || payload?.emitente?.cpfCnpj || ''),
    cnpj_tomador: tomadorDoc
      || normalizeDoc(payload?.tomador?.cpfCnpj || payload?.destinatario?.cpfCnpj || ''),
    payload_json: payload,
    response_json: response,
    metadata_json: Object.keys(metadata).length ? metadata : null
  });

  try {
    await upsertClienteCatalogo(userId, payload, { documentType });
    await upsertProdutosCatalogo(userId, payload, { documentType });
  } catch (error) {
    console.warn(
      `[mei-notas] Falha ao atualizar catalogo ${documentType}`,
      error instanceof Error ? error.message : error
    );
  }

  return created;
};

export const listarNotas = async (
  userId,
  { includeArchived = false, documentType } = {}
) => {
  const dbClient = getDb();
  let query = dbClient
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (documentType) {
    query = query.eq('document_type', normalizeDocumentType(documentType));
  }
  if (!includeArchived) {
    query = query.is('archived_at', null);
  }
  const { data, error } = await query;
  if (error) throw badRequest(error.message);
  return data || [];
};

/**
 * Lista notas fiscais do usuário por userId (uso admin). Usa service role.
 * @param {string} userId - ID do usuário alvo
 * @param {{ limit?: number, documentType?: string, includeArchived?: boolean }} [options]
 * @returns {Promise<Array>}
 */
export const listNotasByUserId = async (userId, options = {}) => {
  const {
    limit = 100,
    documentType,
    includeArchived = true
  } = options;
  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 200);
  const dbClient = getDb();
  let query = dbClient
    .from(TABLE)
    .select('id, user_id, document_type, provider, status, plugnotas_id, id_integracao, protocol, pdf_url, xml_url, created_at, updated_at, archived_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(safeLimit);
  if (documentType) {
    query = query.eq('document_type', normalizeDocumentType(documentType));
  }
  if (!includeArchived) {
    query = query.is('archived_at', null);
  }
  const { data, error } = await query;
  if (error) throw badRequest(error.message);
  return data || [];
};

export const listarRelatorioNfe = async (_userId, filters = {}) => {
  return await relatorioNfe(filters);
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
    throw badRequest('Nota fiscal arquivada não permite edição');
  }

  const status = normalizeStatus(record?.status);
  if (!EDITABLE_STATUSES.has(status)) {
    throw badRequest('Nota fiscal no status atual não permite edição');
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
  const documentType = normalizeDocumentType(record?.document_type || DOCUMENT_TYPE_NFSE);
  const adapter = getAdapterByDocumentType(documentType);
  const statusAtual = normalizeStatus(record?.status);
  if (statusAtual === 'cancelado') {
    return record;
  }

  const reason = sanitizeReason(input?.reason);
  let providerResponse = null;
  let providerError = null;
  let nextStatus = 'cancelado';
  let providerId = record?.plugnotas_id || record?.protocol || null;
  if (!providerId && record?.id_integracao && record?.cnpj_prestador && adapter.consultarPorIntegracao) {
    try {
      const providerLookup = await adapter.consultarPorIntegracao(record.id_integracao, record.cnpj_prestador);
      providerId = extractPlugNotasId(providerLookup) || providerId;
    } catch (_error) {
      // Mantém comportamento de fallback local quando não for possível resolver o ID remoto.
    }
  }
  if (providerId) {
    try {
      providerResponse = await adapter.cancelar(providerId, { reason });
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
      mode: providerId ? 'provider' : 'local',
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
  const documentType = normalizeDocumentType(record?.document_type || DOCUMENT_TYPE_NFSE);
  const adapter = getAdapterByDocumentType(documentType);
  if (record?.plugnotas_id) {
    const file = await adapter.downloadPdf(record.plugnotas_id);
    return { ...file, documentType };
  }
  if (record?.id_integracao && record?.cnpj_prestador && adapter.downloadPdfPorIntegracao) {
    const file = await adapter.downloadPdfPorIntegracao(record.id_integracao, record.cnpj_prestador);
    return { ...file, documentType };
  }
  throw notFound('PDF da nota fiscal não disponível');
};

export const baixarXml = async (userId, id) => {
  const record = await findRecord(userId, id);
  const documentType = normalizeDocumentType(record?.document_type || DOCUMENT_TYPE_NFSE);
  const adapter = getAdapterByDocumentType(documentType);
  if (record?.plugnotas_id) {
    const file = await adapter.downloadXml(record.plugnotas_id);
    return { ...file, documentType };
  }
  if (record?.id_integracao && record?.cnpj_prestador && adapter.downloadXmlPorIntegracao) {
    const file = await adapter.downloadXmlPorIntegracao(record.id_integracao, record.cnpj_prestador);
    return { ...file, documentType };
  }
  throw notFound('XML da nota fiscal não disponível');
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
  const documentType = normalizeWebhookDocumentType(
    payload?.documento
      || payload?.document
      || payload?.tipoDocumento
      || payload?.documentoTipo
      || payload?.documents?.[0]?.documento
      || payload?.documentos?.[0]?.documento
  );
  const status = extractPlugNotasStatus(payload);
  const protocol = extractProtocol(payload);

  if (!plugnotasId && !idIntegracao) {
    throw badRequest('Webhook sem identificadores da nota fiscal');
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
  if (documentType) {
    updates.document_type = documentType;
  }

  // FR-01: Processamento determinístico — no máximo um registro atualizado por evento.
  // Em caso de duplicidade de identificador, falha explícita e auditável.
  const resolveSingleRecordByField = async (field, value) => {
    if (!value) return null;
    let query = dbClient
      .from(TABLE)
      .select('id')
      .eq(field, value)
      .limit(2);
    if (documentType) {
      query = query.eq('document_type', documentType);
    }
    const { data, error } = await query;
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

  // Compatibilidade com webhooks legados sem campo "documento"
  if (!data && !documentType && plugnotasId) {
    const record = await resolveSingleRecordByField('plugnotas_id', plugnotasId);
    data = await updateById(record?.id);
  }
  if (!data && !documentType && idIntegracao) {
    const record = await resolveSingleRecordByField('id_integracao', idIntegracao);
    data = await updateById(record?.id);
  }

  if (!data) {
    throw notFound('Nota fiscal referente ao webhook não encontrada');
  }

  return data;
};
