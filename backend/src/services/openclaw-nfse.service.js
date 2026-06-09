import { BACKEND_BUILD_ID } from '../build-id.js';
import { badRequest } from '../utils/errors.js';
import {
  getCertificateDocument,
  getEmitenteNfseSnapshot,
  getPlugNotasCertId,
  hasCertificate,
} from './mei-certificate-store.js';
import {
  empresaJsonToEmitentePartial,
  mergeEmitenteWithEmpresaPartial,
  reconcileEmitenteMirrorFromEmpresaJson,
} from './mei-emitente-empresa-sync.js';
import { consultarEmpresaAndReconcileMirror } from './mei-notas-documentos-mirror.js';
import {
  baixarPdf,
  criarCatalogoCliente,
  emitirNota,
  listarCatalogoClientes,
  listarCatalogoProdutos,
  listarNotas,
  obterNota,
  NFSE_SERVICO_CODIGO_MIN_LENGTH,
} from './mei-notas.service.js';
import { lookupCnpjBrasilApi } from './cnpj-lookup.service.js';
import { isValidCpfOrCnpj, normalizeDocDigits } from '../utils/cpf-cnpj.js';

const normalizeDoc = (value) => normalizeDocDigits(value);

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

const normalizeNameForMatch = (value) =>
  stripDiacritics(String(value || '').trim().toLowerCase()).replace(/\s+/g, ' ');

const pickTomadorNomeFromPayload = (payload) =>
  firstNonEmpty(
    payload?.tomadorNome,
    payload?.tomadorRazaoSocial,
    payload?.cliente,
    payload?.nome,
    payload?.tomador,
  );

/**
 * Escolhe um cliente do catálogo a partir do resultado de busca por nome.
 * @param {Array<Record<string, unknown>>} rows
 * @param {string} nome
 */
export const pickClienteCatalogoByNomeResult = (rows, nome) => {
  const q = normalizeNameForMatch(nome);
  if (!q) return { kind: 'missing' };
  const list = Array.isArray(rows) ? rows : [];
  if (!list.length) return { kind: 'not_found', q: nome };

  const exact = list.filter((r) => normalizeNameForMatch(r.nome) === q);
  if (exact.length === 1) return { kind: 'ok', cliente: exact[0] };

  const allWordsMatch = list.filter((r) => {
    const n = normalizeNameForMatch(r.nome);
    const words = q.split(' ').filter((w) => w.length >= 2);
    if (!words.length) return false;
    return words.every((w) => n.includes(w));
  });
  if (allWordsMatch.length === 1) return { kind: 'ok', cliente: allWordsMatch[0] };

  if (list.length === 1) return { kind: 'ok', cliente: list[0] };

  return {
    kind: 'ambiguous',
    matches: list,
    q: nome,
  };
};

const findClienteCatalogoByDocumento = async (userId, documento) => {
  const doc = normalizeDoc(documento);
  if (!doc) return null;
  const rows = await listarCatalogoClientes(userId, { q: doc, limit: 20 });
  return (rows || []).find((r) => normalizeDoc(r.documento) === doc) || null;
};

const findClienteCatalogoByNome = async (userId, nome) => {
  const q = String(nome || '').trim();
  if (!q) return { kind: 'missing' };
  const rows = await listarCatalogoClientes(userId, { q, limit: 20 });
  return pickClienteCatalogoByNomeResult(rows, q);
};

const mapClienteResumo = (cliente) => ({
  id: cliente.id,
  nome: cliente.nome,
  documento: cliente.documento,
  email: cliente.email ?? null,
});

const assertTomadorDocumentoValido = (tomadorDoc) => {
  if (!tomadorDoc) {
    throw badRequest('CPF ou CNPJ do tomador é obrigatório.', {
      code: 'NFSE_TOMADOR_DOC_MISSING',
      botHint:
        'Se o utilizador disse o nome do cliente, use payload.tomadorNome em preview_nfse/emit_nfse '
        + 'ou list_nfse_clientes com payload.q — o CPF/CNPJ já está no catálogo. '
        + 'Só peça documento se o cliente não existir no catálogo.',
    });
  }
  if (tomadorDoc.length !== 11 && tomadorDoc.length !== 14) {
    throw badRequest('CPF/CNPJ do tomador deve ter 11 ou 14 dígitos.', {
      code: 'NFSE_TOMADOR_DOC_INVALID',
      botHint: 'Não invente documentos. Use list_nfse_clientes ou peça o CPF/CNPJ real.',
    });
  }
  if (!isValidCpfOrCnpj(tomadorDoc)) {
    throw badRequest('CPF ou CNPJ do tomador inválido (dígitos verificadores).', {
      code: 'NFSE_TOMADOR_DOC_INVALID',
      botHint:
        'PROIBIDO usar CPF/CNPJ inventado (ex.: 123456789000110). Confirme com o cliente ou cadastre via register_nfse_cliente.',
    });
  }
};

const resolveTomador = async (userId, payload) => {
  let tomadorDoc = normalizeDoc(
    payload?.tomadorCpfCnpj
      || payload?.tomadorCnpj
      || payload?.cnpjTomador
      || payload?.cnpj
      || payload?.cpfCnpj
      || payload?.documento,
  );

  let catalogo = null;

  if (tomadorDoc) {
    assertTomadorDocumentoValido(tomadorDoc);
    catalogo = await findClienteCatalogoByDocumento(userId, tomadorDoc);
  } else {
    const tomadorNome = pickTomadorNomeFromPayload(payload);
    if (!tomadorNome) {
      throw badRequest('Informe o cliente (nome ou CPF/CNPJ).', {
        code: 'NFSE_TOMADOR_MISSING',
        botHint:
          'Quando o utilizador disser "nota para Rafael Reis", use tomadorNome no payload '
          + 'ou list_nfse_clientes com q=Rafael Reis — não peça CPF se o cliente já está cadastrado.',
      });
    }
    const lookup = await findClienteCatalogoByNome(userId, tomadorNome);
    if (lookup.kind === 'not_found') {
      throw badRequest(`Cliente "${tomadorNome}" não encontrado no catálogo NFSe.`, {
        code: 'NFSE_TOMADOR_NOT_IN_CATALOG',
        tomadorNome,
        botHint:
          'Use register_nfse_cliente para cadastrar ou list_nfse_clientes para confirmar o nome.',
      });
    }
    if (lookup.kind === 'ambiguous') {
      throw badRequest(`Vários clientes encontrados para "${tomadorNome}".`, {
        code: 'NFSE_TOMADOR_AMBIGUOUS',
        tomadorNome,
        matches: (lookup.matches || []).map(mapClienteResumo),
        botHint: 'Liste nome + documento de cada match e peça ao utilizador para escolher um.',
      });
    }
    catalogo = lookup.cliente;
    tomadorDoc = normalizeDoc(catalogo?.documento || '');
    assertTomadorDocumentoValido(tomadorDoc);
  }

  if (!catalogo) {
    throw badRequest('Cliente não está cadastrado no catálogo NFSe.', {
      code: 'NFSE_TOMADOR_NOT_IN_CATALOG',
      tomadorDocumento: tomadorDoc,
      botHint:
        '1) list_nfse_clientes com nome ou documento. '
        + '2) Se não existir: peça CPF/CNPJ válido, nome/razão social e e-mail; use register_nfse_cliente. '
        + '3) Depois preview_nfse e emit_nfse com confirm:true. Não emita com cliente fantasma.',
    });
  }

  const razaoSocial = String(catalogo.nome || catalogo.metadata_json?.razaoSocial || '').trim();
  if (!razaoSocial) {
    throw badRequest('Cliente no catálogo sem nome. Atualize o cadastro na app ou register_nfse_cliente.', {
      code: 'NFSE_TOMADOR_NOME_MISSING',
      catalogoClienteId: catalogo.id,
    });
  }

  return {
    tomadorCpfCnpj: tomadorDoc,
    tomadorRazaoSocial: razaoSocial,
    tomadorEmail: catalogo.email ? String(catalogo.email).trim() : undefined,
    catalogoClienteId: catalogo.id,
  };
};

/**
 * Cadastra tomador no catálogo NFSe (WhatsApp) antes da emissão.
 */
export const registerOpenclawNfseCliente = async (userId, payload = {}) => {
  const documento = normalizeDoc(
    payload?.documento
      || payload?.tomadorCpfCnpj
      || payload?.cnpj
      || payload?.cpfCnpj,
  );
  assertTomadorDocumentoValido(documento);

  const existing = await findClienteCatalogoByDocumento(userId, documento);
  if (existing) {
    return {
      alreadyRegistered: true,
      cliente: existing,
    };
  }

  let nome = firstNonEmpty(
    payload?.nome,
    payload?.tomadorRazaoSocial,
    payload?.tomadorNome,
    payload?.razaoSocial,
    payload?.cliente,
  );

  if (!nome && documento.length === 14) {
    try {
      const lookup = await lookupCnpjBrasilApi(documento);
      nome = String(lookup?.razaoSocial || lookup?.nomeFantasia || '').trim();
    } catch {
      /* segue */
    }
  }

  if (!nome) {
    throw badRequest('Nome ou razão social do cliente é obrigatório para cadastro.', {
      code: 'NFSE_CLIENTE_NOME_MISSING',
      botHint: 'Peça o nome completo (PF) ou razão social (PJ) antes de register_nfse_cliente.',
    });
  }

  const emailRaw = firstNonEmpty(payload?.email, payload?.tomadorEmail);
  const cliente = await criarCatalogoCliente(userId, {
    documento,
    nome,
    ...(emailRaw ? { email: emailRaw } : {}),
  });

  return { alreadyRegistered: false, cliente };
};

const emitenteMissingAddressFields = (emitente) => {
  if (!emitente) return true;
  if (!buildPrestadorLogradouro(emitente)) return true;
  if (!String(emitente.numero || '').trim()) return true;
  if (!String(emitente.codigoCidade || '').trim()) return true;
  if (normalizeDoc(emitente.cep).length !== 8) return true;
  return false;
};

const sanitizeHealError = (err) => {
  const code = err?.errors?.plugnotasCode || err?.code || null;
  const status = err?.status || err?.errors?.status || null;
  const message = String(err?.message || '').trim().slice(0, 180) || null;
  return { code, status, message };
};

const completeEmitenteFromEmpresaJson = async (userId, emitente, empresaJson, source) => {
  const partial = empresaJsonToEmitentePartial(empresaJson);
  if (!partial) return null;
  await reconcileEmitenteMirrorFromEmpresaJson(userId, empresaJson).catch(() => {});
  const synced = await getEmitenteNfseSnapshot(userId);
  if (synced && !emitenteMissingAddressFields(synced)) {
    return {
      emitente: synced,
      heal: { attempted: true, ok: true, source: `${source}_mirror` },
    };
  }
  const merged = mergeEmitenteWithEmpresaPartial(emitente, partial);
  if (merged && !emitenteMissingAddressFields(merged)) {
    return {
      emitente: merged,
      heal: { attempted: true, ok: true, source: `${source}_merge` },
    };
  }
  return null;
};

/** Preenche emitente a partir do Plugnotas (ou BrasilAPI) quando o espelho local está incompleto. */
const resolveEmitenteForNfseSetup = async (userId, emitenteRaw, certOk) => {
  let emitente = emitenteRaw || null;
  let cnpj = normalizeDoc(emitente?.certDocument || '');
  if (cnpj.length !== 14 && certOk) {
    const doc = await getCertificateDocument(userId);
    cnpj = normalizeDoc(doc || '');
    if (cnpj.length === 14) {
      emitente = { ...(emitente || {}), certDocument: cnpj };
    }
  }
  if (cnpj.length !== 14) {
    return { emitente, heal: { attempted: false, reason: 'cnpj_missing' } };
  }
  if (emitente && !emitenteMissingAddressFields(emitente)) {
    return { emitente, heal: { attempted: false, reason: 'already_complete' } };
  }

  let plugnotasError = null;
  try {
    const empresa = await consultarEmpresaAndReconcileMirror(userId, cnpj);
    const fromPlugnotas = await completeEmitenteFromEmpresaJson(
      userId,
      emitente,
      empresa,
      'plugnotas_empresa',
    );
    if (fromPlugnotas) return fromPlugnotas;
  } catch (err) {
    plugnotasError = sanitizeHealError(err);
  }

  try {
    const lookup = await lookupCnpjBrasilApi(cnpj);
    const fromBrasilApi = await completeEmitenteFromEmpresaJson(
      userId,
      emitente,
      lookup,
      'brasilapi_cnpj',
    );
    if (fromBrasilApi) {
      return {
        ...fromBrasilApi,
        heal: {
          ...fromBrasilApi.heal,
          plugnotasError,
        },
      };
    }
  } catch (brasilApiError) {
    return {
      emitente,
      heal: {
        attempted: true,
        ok: false,
        reason: 'all_sources_failed',
        plugnotasError,
        brasilApiError: sanitizeHealError(brasilApiError),
      },
    };
  }

  return {
    emitente,
    heal: {
      attempted: true,
      ok: false,
      reason: 'endereco_nao_resolvido',
      plugnotasError,
    },
  };
};

/**
 * Monta input de emissão NFSe para o bot (validação sem chamar Plugnotas).
 * @param {string} userId
 * @param {object} payload
 */
export const buildOpenclawNfseEmitInput = async (userId, payload = {}) => {
  const certOk = await hasCertificate(userId);
  const emitenteRaw = await getEmitenteNfseSnapshot(userId);
  const { emitente } = await resolveEmitenteForNfseSetup(userId, emitenteRaw, certOk);
  if (!emitente || emitenteMissingAddressFields(emitente)) {
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
  const [certOk, plugId, emitenteRaw] = await Promise.all([
    hasCertificate(userId),
    getPlugNotasCertId(userId),
    getEmitenteNfseSnapshot(userId),
  ]);

  const { emitente, heal } = await resolveEmitenteForNfseSetup(userId, emitenteRaw, certOk);

  const missing = [];
  if (!certOk) missing.push('certificado_a1');
  if (!plugId) missing.push('plugnotas_certificado');
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
    buildId: BACKEND_BUILD_ID,
    ready: missing.length === 0,
    missing,
    hasCertificate: certOk,
    hasPlugnotasCertId: Boolean(plugId),
    prestadorCnpj: emitente?.certDocument ? normalizeDoc(emitente.certDocument) : null,
    prestadorRazaoSocial: emitente?.razaoSocial || null,
    defaultServico,
    heal: heal || null,
  };
};

/** Força heal do prestador (Plugnotas → BrasilAPI) e devolve diagnóstico completo. */
export const syncOpenclawNfseEmitente = async (userId) => {
  const [certOk, emitenteRaw] = await Promise.all([
    hasCertificate(userId),
    getEmitenteNfseSnapshot(userId),
  ]);
  const { emitente, heal } = await resolveEmitenteForNfseSetup(userId, emitenteRaw, certOk);
  return {
    buildId: BACKEND_BUILD_ID,
    heal,
    emitente: emitente
      ? {
        certDocument: emitente.certDocument || null,
        razaoSocial: emitente.razaoSocial || null,
        logradouro: emitente.logradouro || null,
        numero: emitente.numero || null,
        codigoCidade: emitente.codigoCidade || null,
        cep: emitente.cep || null,
      }
      : null,
    addressComplete: Boolean(emitente && !emitenteMissingAddressFields(emitente)),
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

/** Status em que o PDF costuma existir na Plugnotas. */
export const isNfsePdfReadyStatus = (status) => {
  const s = String(status || '').trim().toLowerCase();
  return s === 'concluido' || s.includes('autoriz');
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
    pdfReady: isNfsePdfReadyStatus(record?.status),
  };
};

const buildNfsePdfFileName = (record) => {
  const short = String(record?.id || 'nota').slice(0, 8);
  const tomador = String(record?.cnpj_tomador || '').replace(/\D/g, '').slice(-6) || 'nfse';
  return `NFSe-${tomador}-${short}.pdf`.replace(/[^a-zA-Z0-9._-]/g, '_');
};

/**
 * Sincroniza a nota (opcional), valida status e devolve PDF em base64 para OpenClaw / WhatsApp.
 */
export const fetchOpenclawNfsePdfBase64 = async (userId, { id, sync = true } = {}) => {
  const recordId = String(id || '').trim();
  if (!recordId) {
    throw badRequest('payload.id da nota é obrigatório', { code: 'NFSE_ID_REQUIRED' });
  }
  const record = await obterNota(userId, recordId, { sync: sync !== false });
  if (!isNfsePdfReadyStatus(record?.status)) {
    throw badRequest(
      `NFSe ainda não está pronta para PDF (status: ${record?.status || 'processando'}).`,
      {
        code: 'NFSE_PDF_NOT_READY',
        botHint:
          'Consulte com consult_nfse (sync) até status concluido; depois mf-nfse-send.sh TELEFONE UUID.',
        status: record?.status,
        notaId: record.id,
      },
    );
  }
  const file = await baixarPdf(userId, recordId);
  const buffer = file?.buffer;
  if (!buffer?.length) {
    throw badRequest('PDF da NFSe vazio ou indisponível', { code: 'NFSE_PDF_EMPTY' });
  }
  return {
    base64: Buffer.from(buffer).toString('base64'),
    fileName: buildNfsePdfFileName(record),
    mimeType: file.contentType || 'application/pdf',
    nota: {
      id: record.id,
      status: record.status,
      plugnotas_id: record.plugnotas_id,
      cnpj_tomador: record.cnpj_tomador,
    },
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
