import { badRequest } from '../utils/errors.js';
import {
  getEmitenteNfseSnapshot,
  getPlugNotasCertId,
  hasCertificate,
  savePlugNotasCertId,
} from './mei-certificate-store.js';
import { resolverCertificadoIdPorCnpj } from './plugnotas/empresa.service.js';
import {
  emitirNota,
  listarCatalogoClientes,
  listarCatalogoProdutos,
  listarNotas,
  obterNota,
  NFSE_SERVICO_CODIGO_MIN_LENGTH,
} from './mei-notas.service.js';
import { lookupCnpjBrasilApi } from './cnpj-lookup.service.js';

const normalizeDoc = (value) => String(value || '').replace(/\D/g, '');

const firstNonEmpty = (...values) => {
  for (const v of values) {
    const s = v !== undefined && v !== null ? String(v).trim() : '';
    if (s) return s;
  }
  return '';
};

const stripDiacritics = (value) =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

/** Número em formato BR (1.200,50 / 1.200 / 1200). */
const parseBrNumericToken = (token) => {
  let t = String(token).trim().replace(/\s/g, '');
  if (!t) return NaN;
  if (t.includes(',')) {
    t = t.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(t)) {
    t = t.replace(/\./g, '');
  }
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
};

/**
 * Valor da NFSe em reais (texto ou número) — ex.: payload.valor no emit_nfse.
 * @param {unknown} raw
 * @returns {number|null}
 */
export const parseValorReais = (raw) => {
  if (raw === undefined || raw === null || raw === '') return null;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw > 0 ? raw : null;

  const s = stripDiacritics(String(raw).trim().toLowerCase());
  if (!s) return null;

  const milhaoMatch =
    /^(\d+(?:[.,]\d+)?)\s*milh(?:ao|oes?)\s*(?:e\s+(\d+(?:[.,]\d+)?)\s*mil)?$/.exec(s);
  if (milhaoMatch) {
    const base = parseBrNumericToken(milhaoMatch[1]) * 1_000_000;
    const extra = milhaoMatch[2] ? parseBrNumericToken(milhaoMatch[2]) * 1_000 : 0;
    const total = base + extra;
    return Number.isFinite(total) && total > 0 ? total : null;
  }

  const milMatch = /^(\d+(?:[.,]\d+)?)\s*mil$/.exec(s);
  if (milMatch) {
    const n = parseBrNumericToken(milMatch[1]) * 1_000;
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  const n = parseBrNumericToken(s);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const buildPrestadorLogradouro = (emitente) => {
  const tipo = String(emitente?.tipoLogradouro || '').trim();
  const log = String(emitente?.logradouro || '').trim();
  if (!log) return '';
  if (tipo && !log.toLowerCase().startsWith(tipo.toLowerCase())) {
    return `${tipo} ${log}`.trim();
  }
  return log;
};

const emitenteToPrestadorInput = (emitente) => {
  if (!emitente?.certDocument || normalizeDoc(emitente.certDocument).length !== 14) {
    throw badRequest('CNPJ do prestador não configurado. Complete o cadastro MEI na app.', {
      code: 'NFSE_PRESTADOR_CNPJ_MISSING',
      botHint: 'Oriente a abrir Meu Financeiro → MEI → Certificado / dados fiscais.',
    });
  }
  const logradouro = buildPrestadorLogradouro(emitente);
  const endereco = {
    logradouro,
    numero: String(emitente.numero || '').trim(),
    codigoCidade: String(emitente.codigoCidade || '').trim(),
    cep: normalizeDoc(emitente.cep).slice(0, 8),
    complemento: String(emitente.complemento || '').trim(),
    bairro: String(emitente.bairro || '').trim(),
    estado: String(emitente.estado || '').trim().toUpperCase().slice(0, 2),
    descricaoCidade: String(emitente.descricaoCidade || '').trim(),
  };
  return {
    prestadorCpfCnpj: normalizeDoc(emitente.certDocument),
    prestadorRazaoSocial: String(emitente.razaoSocial || emitente.nomeFantasia || '').trim(),
    prestadorEmail: String(emitente.email || '').trim() || undefined,
    prestadorInscricaoMunicipal: String(emitente.inscricaoMunicipal || '').trim() || undefined,
    prestadorEndereco: endereco,
  };
};

const resolveServicoDefaults = async (userId, payload, emitente) => {
  const discriminacao = firstNonEmpty(
    payload?.discriminacao,
    payload?.descricaoServico,
    payload?.descricao,
    payload?.servico,
    'Prestação de serviços',
  );

  let codigo = firstNonEmpty(payload?.codigoServico, payload?.codigo);
  let cnae = firstNonEmpty(payload?.cnae);
  let aliquotaRaw = payload?.aliquota ?? payload?.aliquotaIss;

  const produtos = await listarCatalogoProdutos(userId, { limit: 1 });
  const ultimo = produtos?.[0];
  if (!codigo && ultimo?.codigo) codigo = String(ultimo.codigo);
  if (!cnae && ultimo?.cnae) cnae = String(ultimo.cnae);
  if ((aliquotaRaw === undefined || aliquotaRaw === null || aliquotaRaw === '') && ultimo?.aliquota != null) {
    aliquotaRaw = ultimo.aliquota;
  }

  if (!codigo) {
    throw badRequest(
      `Informe o código do serviço municipal (mín. ${NFSE_SERVICO_CODIGO_MIN_LENGTH} caracteres) ou cadastre um serviço na app.`,
      {
        code: 'NFSE_CODIGO_SERVICO_MISSING',
        botHint: 'Pergunte o código LC116/municipal ou oriente cadastro em MEI → Notas → catálogo.',
      },
    );
  }

  const codigoNorm = normalizeDoc(codigo) || String(codigo).replace(/\s/g, '');
  if (codigoNorm.length < NFSE_SERVICO_CODIGO_MIN_LENGTH) {
    throw badRequest(
      `Código do serviço inválido (mín. ${NFSE_SERVICO_CODIGO_MIN_LENGTH} caracteres).`,
      { code: 'NFSE_CODIGO_SERVICO_INVALID' },
    );
  }

  if (!cnae) {
    throw badRequest('Informe o CNAE do serviço ou cadastre um serviço padrão na app.', {
      code: 'NFSE_CNAE_MISSING',
      botHint: 'CNAE de 7 dígitos (ex.: 6201500 para TI).',
    });
  }

  const cnaeNorm = normalizeDoc(cnae).slice(0, 7);
  if (cnaeNorm.length !== 7) {
    throw badRequest('CNAE deve ter 7 dígitos.', { code: 'NFSE_CNAE_INVALID' });
  }

  let aliquota = 0;
  if (aliquotaRaw !== undefined && aliquotaRaw !== null && aliquotaRaw !== '') {
    const parsed = parseValorReais(aliquotaRaw);
    aliquota = parsed !== null ? parsed : Number(aliquotaRaw);
    if (!Number.isFinite(aliquota) || aliquota < 0) {
      throw badRequest('Alíquota ISS inválida.', { code: 'NFSE_ALIQUOTA_INVALID' });
    }
  } else if (!emitente?.simplesNacional) {
    aliquota = 2;
  }

  return {
    codigo: codigoNorm.length >= NFSE_SERVICO_CODIGO_MIN_LENGTH ? codigoNorm : String(codigo).trim(),
    discriminacao,
    cnae: cnaeNorm,
    aliquota,
  };
};

const findClienteCatalogo = async (userId, { documento, nome }) => {
  const doc = normalizeDoc(documento);
  if (doc) {
    const rows = await listarCatalogoClientes(userId, { q: doc, limit: 5 });
    const hit = (rows || []).find((r) => normalizeDoc(r.documento) === doc);
    if (hit) return hit;
  }
  const nomeQ = String(nome || '').trim();
  if (!nomeQ) return null;
  const rows = await listarCatalogoClientes(userId, { q: nomeQ, limit: 10 });
  const lower = nomeQ.toLowerCase();
  return (rows || []).find((r) => String(r.nome || '').toLowerCase().includes(lower)) || rows?.[0] || null;
};

const resolveTomador = async (userId, payload) => {
  const tomadorDoc = normalizeDoc(
    payload?.tomadorCpfCnpj
      || payload?.tomadorCnpj
      || payload?.cnpjTomador
      || payload?.cnpj
      || payload?.cpfCnpj,
  );
  if (!tomadorDoc) {
    throw badRequest('CPF ou CNPJ do tomador é obrigatório.', {
      code: 'NFSE_TOMADOR_DOC_MISSING',
      botHint: 'Peça CPF (11 dígitos) ou CNPJ (14 dígitos) do cliente.',
    });
  }
  if (tomadorDoc.length !== 11 && tomadorDoc.length !== 14) {
    throw badRequest('CPF/CNPJ do tomador inválido.', { code: 'NFSE_TOMADOR_DOC_INVALID' });
  }

  let razaoSocial = firstNonEmpty(
    payload?.tomadorRazaoSocial,
    payload?.tomadorNome,
    payload?.razaoSocial,
    payload?.nomeTomador,
    payload?.cliente,
  );

  const catalogo = await findClienteCatalogo(userId, {
    documento: tomadorDoc,
    nome: payload?.tomadorNome || payload?.cliente,
  });
  if (!razaoSocial && catalogo?.nome) razaoSocial = String(catalogo.nome).trim();
  if (!razaoSocial && catalogo?.metadata_json?.razaoSocial) {
    razaoSocial = String(catalogo.metadata_json.razaoSocial).trim();
  }

  if (!razaoSocial && tomadorDoc.length === 14) {
    try {
      const lookup = await lookupCnpjBrasilApi(tomadorDoc);
      razaoSocial = String(lookup?.razaoSocial || lookup?.nomeFantasia || '').trim();
    } catch {
      /* segue sem razão social */
    }
  }

  if (!razaoSocial) {
    throw badRequest('Razão social ou nome do tomador é obrigatório.', {
      code: 'NFSE_TOMADOR_NOME_MISSING',
      botHint: 'Para CPF, peça o nome completo; para CNPJ pode consultar Receita se a API estiver disponível.',
    });
  }

  return {
    tomadorCpfCnpj: tomadorDoc,
    tomadorRazaoSocial: razaoSocial,
    tomadorEmail: firstNonEmpty(payload?.tomadorEmail, catalogo?.email) || undefined,
  };
};

/**
 * Monta input de emissão NFSe para o bot (validação sem chamar Plugnotas).
 * @param {string} userId
 * @param {object} payload
 */
export const buildOpenclawNfseEmitInput = async (userId, payload = {}) => {
  const emitente = await getEmitenteNfseSnapshot(userId);
  if (!emitente) {
    throw badRequest('Dados fiscais do prestador incompletos. Configure na app Meu Financeiro → MEI.', {
      code: 'NFSE_EMITENTE_MISSING',
      botHint: 'Certificado A1 + endereço fiscal na app.',
    });
  }

  const valorServico = parseValorReais(
    payload?.valorServico ?? payload?.valor ?? payload?.valorReais,
  );
  if (valorServico === null) {
    throw badRequest('Valor do serviço inválido ou ausente.', {
      code: 'NFSE_VALOR_MISSING',
      botHint: 'Ex.: 1200 ou "1.200,00".',
    });
  }

  const servicoBase = await resolveServicoDefaults(userId, payload, emitente);
  const tomador = await resolveTomador(userId, payload);
  const prestador = emitenteToPrestadorInput(emitente);

  return {
    documentType: 'NFSE',
    ...prestador,
    ...tomador,
    servico: {
      ...servicoBase,
      valorServico,
    },
    metadata: {
      source: 'openclaw_whatsapp',
      ...(payload?.metadata && typeof payload.metadata === 'object' ? payload.metadata : {}),
    },
  };
};

/**
 * Estado de prontidão para emitir NFSe pelo WhatsApp.
 */
export const getOpenclawNfseSetupStatus = async (userId) => {
  const [certOk, plugIdLocal, emitente] = await Promise.all([
    hasCertificate(userId),
    getPlugNotasCertId(userId),
    getEmitenteNfseSnapshot(userId),
  ]);

  let plugnotasCertId = plugIdLocal;
  /** @type {'local_db'|'plugnotas_api'|'prior_nfse_emission'|null} */
  let plugnotasCertSource = plugIdLocal ? 'local_db' : null;

  if (!plugnotasCertId && emitente?.certDocument) {
    const cnpj = normalizeDoc(emitente.certDocument);
    if (cnpj.length === 14) {
      try {
        const resolved = await resolverCertificadoIdPorCnpj(cnpj);
        if (resolved) {
          plugnotasCertId = resolved;
          plugnotasCertSource = 'plugnotas_api';
          savePlugNotasCertId(userId, resolved).catch(() => {});
        }
      } catch {
        /* Plugnotas indisponível — tenta fallback abaixo */
      }
    }
  }

  if (!plugnotasCertId && certOk) {
    try {
      const notas = await listarNotas(userId, { documentType: 'NFSE', limit: 1 });
      if ((notas || []).length > 0) {
        plugnotasCertSource = 'prior_nfse_emission';
      }
    } catch {
      /* opcional */
    }
  }

  const plugnotasOk = Boolean(plugnotasCertId) || plugnotasCertSource === 'prior_nfse_emission';

  const missing = [];
  if (!certOk) missing.push('certificado_a1');
  if (!plugnotasOk) missing.push('plugnotas_certificado');
  if (!emitente) missing.push('dados_fiscais_prestador');
  else {
    const cnpj = normalizeDoc(emitente.certDocument || '');
    if (cnpj.length !== 14) missing.push('prestador_cnpj');
    const logradouro = buildPrestadorLogradouro(emitente);
    if (!logradouro) missing.push('prestador_logradouro');
    if (!String(emitente.numero || '').trim()) missing.push('prestador_numero');
    if (!String(emitente.codigoCidade || '').trim()) missing.push('prestador_codigo_ibge');
    if (normalizeDoc(emitente.cep).length !== 8) missing.push('prestador_cep');
  }

  let defaultServico = null;
  try {
    const produtos = await listarCatalogoProdutos(userId, { limit: 1 });
    if (produtos?.[0]) {
      defaultServico = {
        codigo: produtos[0].codigo,
        cnae: produtos[0].cnae,
        discriminacao: produtos[0].discriminacao,
        aliquota: produtos[0].aliquota,
      };
    }
  } catch {
    /* opcional */
  }

  return {
    ready: missing.length === 0,
    missing,
    hasCertificate: certOk,
    hasPlugnotasCertId: Boolean(plugnotasCertId),
    plugnotasCertSource,
    plugnotasEmissionReady: plugnotasOk,
    prestadorCnpj: emitente?.certDocument ? normalizeDoc(emitente.certDocument) : null,
    prestadorRazaoSocial: emitente?.razaoSocial || null,
    defaultServico,
  };
};

export const previewOpenclawNfseEmit = async (userId, payload = {}) => {
  const input = await buildOpenclawNfseEmitInput(userId, payload);
  return {
    documentType: 'NFSE',
    tomadorCpfCnpj: input.tomadorCpfCnpj,
    tomadorRazaoSocial: input.tomadorRazaoSocial,
    valorServico: input.servico.valorServico,
    discriminacao: input.servico.discriminacao,
    codigoServico: input.servico.codigo,
    cnae: input.servico.cnae,
    aliquota: input.servico.aliquota,
    prestadorCnpj: input.prestadorCpfCnpj,
  };
};

const isConfirmTrue = (payload) =>
  payload?.confirm === true
  || payload?.confirmar === true
  || String(payload?.confirm || payload?.confirmar || '').toLowerCase() === 'true';

/**
 * Emite NFSe (Plugnotas) para utilizador identificado pelo telefone.
 */
export const emitOpenclawNfse = async (userId, payload = {}) => {
  const input = await buildOpenclawNfseEmitInput(userId, payload);
  if (!isConfirmTrue(payload)) {
    const preview = {
      documentType: 'NFSE',
      tomadorCpfCnpj: input.tomadorCpfCnpj,
      tomadorRazaoSocial: input.tomadorRazaoSocial,
      valorServico: input.servico.valorServico,
      discriminacao: input.servico.discriminacao,
      codigoServico: input.servico.codigo,
      cnae: input.servico.cnae,
      aliquota: input.servico.aliquota,
    };
    return {
      preview,
      requiresConfirm: true,
      notEmitted: true,
    };
  }

  const created = await emitirNota(userId, input);
  return { nota: created, preview: null, requiresConfirm: false, notEmitted: false };
};

export const listOpenclawNfseNotas = async (userId, { limit = 10 } = {}) => {
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 40);
  const rows = await listarNotas(userId, { documentType: 'NFSE', limit: safeLimit });
  return (rows || []).map((r) => ({
    id: r.id,
    status: r.status,
    plugnotas_id: r.plugnotas_id,
    cnpj_tomador: r.cnpj_tomador,
    created_at: r.created_at,
    pdf_url: r.pdf_url,
    xml_url: r.xml_url,
  }));
};

export const consultOpenclawNfse = async (userId, { id, sync = true } = {}) => {
  const recordId = String(id || '').trim();
  if (!recordId) throw badRequest('payload.id da nota é obrigatório');
  const record = await obterNota(userId, recordId, { sync: sync !== false });
  return {
    id: record.id,
    status: record.status,
    plugnotas_id: record.plugnotas_id,
    cnpj_tomador: record.cnpj_tomador,
    pdf_url: record.pdf_url,
    xml_url: record.xml_url,
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
};

export const listOpenclawNfseClientes = async (userId, { q = '', limit = 20 } = {}) =>
  listarCatalogoClientes(userId, { q, limit });

export const rethrowNfseErrorForBot = (err) => {
  const code = err?.errors?.code || err?.code;
  const botHint = err?.errors?.botHint || err?.botHint;
  if (botHint) {
    throw badRequest(err.message, { code, botHint });
  }
  const msg = String(err?.message || '');
  if (/certificado|plugnotas/i.test(msg)) {
    throw badRequest(msg, {
      code: code || 'NFSE_PLUGNOTAS',
      botHint: 'Oriente cadastro do certificado e empresa na app MEI → Notas.',
    });
  }
  throw err;
};
