import { createSupabaseClient } from '../../config/supabase.js';
import { badRequest } from '../../utils/errors.js';
import { getEmitenteNfseSnapshot } from '../mei-certificate-store.js';
import { unwrapPlugnotasEmpresaRecord } from '../mei-emitente-empresa-sync.js';
import { consultarEmpresaPlugNotas } from './empresa.service.js';

const EMAIL_LIKE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CLIENTS_TABLE = 'mei_nfse_clientes';

const normalizeDoc = (value) => String(value || '').replace(/\D/g, '');

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
  const doc = normalizeDoc(documento);
  if (!userId || !doc) return null;
  try {
    const db = createSupabaseClient();
    const { data, error } = await db
      .from(CLIENTS_TABLE)
      .select('email')
      .eq('user_id', userId)
      .eq('document_type', documentType)
      .eq('documento', doc)
      .maybeSingle();
    if (error) return null;
    return pickFirstValidEmitEmail(data?.email);
  } catch {
    return null;
  }
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
