import { createSupabaseClient } from '../../config/supabase.js';
import { badRequest } from '../../utils/errors.js';
import { lookupCnpjCascade } from '../cnpj-lookup.service.js';
import { getEmitenteNfseSnapshot } from '../mei-certificate-store.js';
import { unwrapPlugnotasEmpresaRecord } from '../mei-emitente-empresa-sync.js';
import { consultarEmpresaPlugNotas } from './empresa.service.js';

const EMAIL_LIKE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CLIENTS_TABLE = 'mei_nfse_clientes';

const normalizeDoc = (value) => String(value || '').replace(/\D/g, '');

const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const pruneEndereco = (endereco) => {
  if (!isPlainObject(endereco)) return null;
  const cep = normalizeDoc(endereco.cep).slice(0, 8);
  const codigoCidade = String(endereco.codigoCidade || '').trim();
  const logradouro = String(endereco.logradouro || '').trim();
  const numero = String(endereco.numero || '').trim();
  const bairro = String(endereco.bairro || '').trim();
  const descricaoCidade = String(endereco.descricaoCidade || '').trim();
  const estado = String(endereco.estado || '').trim().toUpperCase().slice(0, 2);
  const complemento = String(endereco.complemento || '').trim();
  const next = {
    ...(cep.length === 8 ? { cep } : {}),
    ...(logradouro ? { logradouro } : {}),
    ...(numero ? { numero } : {}),
    ...(bairro ? { bairro } : {}),
    ...(codigoCidade ? { codigoCidade } : {}),
    ...(descricaoCidade ? { descricaoCidade } : {}),
    ...(estado.length === 2 ? { estado, uf: estado } : {}),
    ...(complemento ? { complemento } : {}),
  };
  return Object.keys(next).length ? next : null;
};

export const hasCompleteTomadorEndereco = (endereco) => {
  const e = pruneEndereco(endereco);
  if (!e) return false;
  return (
    normalizeDoc(e.cep).length === 8
    && Boolean(String(e.logradouro || '').trim())
    && Boolean(String(e.numero || '').trim())
    && Boolean(String(e.bairro || '').trim())
    && Boolean(String(e.codigoCidade || '').trim())
    && Boolean(String(e.descricaoCidade || '').trim())
    && String(e.estado || '').trim().length === 2
  );
};

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export const isValidPlugnotasEmitEmail = (value) => (
  EMAIL_LIKE.test(String(value || '').trim())
);

/**
 * @param {...unknown} candidates
 * @returns {string|null}
 */
export const pickFirstValidEmitEmail = (...candidates) => {
  for (const candidate of candidates) {
    const email = String(candidate ?? '').trim();
    if (isValidPlugnotasEmitEmail(email)) return email;
  }
  return null;
};

/**
 * @param {string} userId
 * @returns {Promise<string|null>}
 */
export const resolveAuthUserEmail = async (userId) => {
  if (!userId) return null;
  try {
    const admin = createSupabaseClient({ useServiceRole: true });
    const { data: authData, error } = await admin.auth.admin.getUserById(userId);
    if (error || !authData?.user?.email) return null;
    return pickFirstValidEmitEmail(authData.user.email);
  } catch {
    return null;
  }
};

/**
 * @param {string} userId
 * @param {string} documento
 * @param {string} [documentType]
 * @returns {Promise<string|null>}
 */
export const resolveCatalogClienteEmail = async (userId, documento, documentType = 'NFSE') => {
  const record = await resolveCatalogClienteRecord(userId, documento, documentType);
  return pickFirstValidEmitEmail(record?.email);
};

/**
 * @param {string} userId
 * @param {string} documento
 * @param {string} [documentType]
 * @returns {Promise<{ email?: string|null, metadata_json?: Record<string, unknown>|null }|null>}
 */
export const resolveCatalogClienteRecord = async (userId, documento, documentType = 'NFSE') => {
  const doc = normalizeDoc(documento);
  if (!userId || !doc) return null;
  try {
    const db = createSupabaseClient();
    const { data, error } = await db
      .from(CLIENTS_TABLE)
      .select('email, metadata_json')
      .eq('user_id', userId)
      .eq('document_type', documentType)
      .eq('documento', doc)
      .maybeSingle();
    if (error) return null;
    return data || null;
  } catch {
    return null;
  }
};

export const resolveCatalogClienteEndereco = async (userId, documento, documentType = 'NFSE') => {
  const record = await resolveCatalogClienteRecord(userId, documento, documentType);
  if (!record?.metadata_json || typeof record.metadata_json !== 'object') return null;
  const rawEndereco = record.metadata_json.endereco;
  return pruneEndereco(isPlainObject(rawEndereco) ? rawEndereco : null);
};

/**
 * @param {Record<string, unknown>|null|undefined} lookup
 * @returns {Record<string, string>|null}
 */
export const enderecoFromCnpjLookupNfse = (lookup) => {
  const end = lookup?.endereco;
  if (!isPlainObject(end)) return null;
  const mapped = pruneEndereco({
    cep: end.cep,
    logradouro: end.logradouro,
    numero: String(end.numero || '').trim() || 'S/N',
    bairro: end.bairro,
    codigoCidade: end.codigoCidade,
    descricaoCidade: end.descricaoCidade || end.cidade,
    estado: end.estado || end.uf,
    complemento: end.complemento,
  });
  return hasCompleteTomadorEndereco(mapped) ? mapped : null;
};

/**
 * Catálogo → consulta CNPJ (Receita/Plugnotas) antes da validação do payload.
 * @param {string} userId
 * @param {string} tomadorDoc
 * @param {unknown} payloadEndereco
 * @returns {Promise<Record<string, string>|null>}
 */
export const resolveTomadorEmitEndereco = async (userId, tomadorDoc, payloadEndereco) => {
  const fromPayload = pruneEndereco(isPlainObject(payloadEndereco) ? payloadEndereco : null);
  if (hasCompleteTomadorEndereco(fromPayload)) return fromPayload;

  const catalogEndereco = await resolveCatalogClienteEndereco(userId, tomadorDoc);
  if (hasCompleteTomadorEndereco(catalogEndereco)) return catalogEndereco;

  if (tomadorDoc.length !== 14) return fromPayload;

  try {
    const lookup = await lookupCnpjCascade(tomadorDoc);
    const fromLookup = enderecoFromCnpjLookupNfse(lookup);
    if (fromLookup) return fromLookup;
  } catch {
    /* consulta opcional — validação final informa campos faltantes */
  }

  return fromPayload;
};

/**
 * E-mail do prestador: formulário → espelho local → Plugnotas → conta Auth.
 * @param {string} userId
 * @param {string} [cnpj14]
 * @param {unknown} payloadEmail
 */
export const resolvePrestadorEmitEmail = async (userId, cnpj14, payloadEmail) => {
  const fromPayload = pickFirstValidEmitEmail(payloadEmail);
  if (fromPayload) return fromPayload;

  let emitente = null;
  try {
    emitente = await getEmitenteNfseSnapshot(userId);
  } catch {
    emitente = null;
  }
  const fromMirror = pickFirstValidEmitEmail(emitente?.email);
  if (fromMirror) return fromMirror;

  const cnpj = normalizeDoc(cnpj14);
  if (cnpj.length === 14) {
    try {
      const empresaJson = await consultarEmpresaPlugNotas(cnpj);
      const empresa = unwrapPlugnotasEmpresaRecord(empresaJson);
      const fromPlugnotas = pickFirstValidEmitEmail(empresa?.email);
      if (fromPlugnotas) return fromPlugnotas;
    } catch {
      /* empresa pode não existir ainda */
    }
  }

  return await resolveAuthUserEmail(userId);
};

/**
 * Completa e-mails no payload NFS-e antes do POST Plugnotas.
 * @param {string} userId
 * @param {Record<string, unknown>} payload
 * @param {{ prestadorDoc?: string, tomadorDoc?: string }} [options]
 */
export const enrichNfseEmitPayloadEmails = async (userId, payload, options = {}) => {
  if (!payload || typeof payload !== 'object') return payload;

  const prestadorDoc = normalizeDoc(
    options.prestadorDoc || payload?.prestador?.cpfCnpj || '',
  );
  const tomadorDoc = normalizeDoc(
    options.tomadorDoc || payload?.tomador?.cpfCnpj || '',
  );

  const prestador = payload.prestador && typeof payload.prestador === 'object'
    ? { ...payload.prestador }
    : {};
  const tomador = payload.tomador && typeof payload.tomador === 'object'
    ? { ...payload.tomador }
    : {};

  const prestadorEmail = await resolvePrestadorEmitEmail(
    userId,
    prestadorDoc,
    prestador.email,
  );
  if (prestadorEmail) prestador.email = prestadorEmail;

  if (!isValidPlugnotasEmitEmail(tomador.email) && tomadorDoc) {
    const tomadorEmail = await resolveCatalogClienteEmail(userId, tomadorDoc);
    if (tomadorEmail) tomador.email = tomadorEmail;
  }

  if (tomadorDoc.length === 14) {
    const tomadorEndereco = await resolveTomadorEmitEndereco(userId, tomadorDoc, tomador.endereco);
    if (tomadorEndereco) tomador.endereco = tomadorEndereco;
  }

  return {
    ...payload,
    prestador,
    tomador,
  };
};

/**
 * @param {Record<string, unknown>} payload
 */
export const assertNfsePrestadorEmailOrThrow = (payload) => {
  const email = payload?.prestador?.email;
  if (isValidPlugnotasEmitEmail(email)) return;
  throw badRequest(
    'E-mail do prestador é obrigatório para emitir NFS-e. '
    + 'Preencha em Certificado → Empresa ou use o e-mail da sua conta de login.',
    { plugnotasCode: 'nfse_prestador_email_ausente' },
  );
};
