/**
 * Evita emissões NFSe duplicadas via WhatsApp (retries do OpenClaw em timeout).
 */

const DEFAULT_DEDUP_WINDOW_MS = 5 * 60 * 1000;

/** @type {Map<string, Promise<unknown>>} */
const inflightByFingerprint = new Map();

const normalizeDoc = (value) => String(value || '').replace(/\D/g, '');

const roundMoney = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100) / 100;
};

/**
 * @param {string} userId
 * @param {Record<string, unknown>} input
 */
export const buildOpenclawNfseEmitFingerprint = (userId, input = {}) => {
  const tomador = normalizeDoc(input.tomadorCpfCnpj || input?.tomador?.cpfCnpj);
  const valor = roundMoney(input?.servico?.valorServico ?? input?.servico?.valor?.servico);
  const codigo = String(input?.servico?.codigo || '').replace(/\D/g, '');
  return `${userId}|${tomador}|${valor ?? ''}|${codigo}`;
};

/**
 * @param {Record<string, unknown> | null | undefined} payloadJson
 */
export const extractValorFromNfsePayloadJson = (payloadJson) => {
  const servicoRaw = payloadJson?.servico;
  const servico = Array.isArray(servicoRaw) ? servicoRaw[0] : servicoRaw;
  if (!servico || typeof servico !== 'object') return null;
  return roundMoney(servico.valor?.servico ?? servico.valorServico);
};

/**
 * @param {Record<string, unknown> | null | undefined} payloadJson
 */
export const extractCodigoFromNfsePayloadJson = (payloadJson) => {
  const servicoRaw = payloadJson?.servico;
  const servico = Array.isArray(servicoRaw) ? servicoRaw[0] : servicoRaw;
  if (!servico || typeof servico !== 'object') return '';
  return String(servico.codigo || '').replace(/\D/g, '');
};

const isActiveNfseEmitStatus = (status) => {
  const normalized = String(status || '').trim().toLowerCase();
  if (!normalized) return true;
  if (normalized.includes('cancel')) return false;
  if (normalized.includes('rejeit')) return false;
  return true;
};

/**
 * Procura nota NFSe recente com mesmo tomador, valor e código de serviço.
 * @param {object} params
 * @param {string} params.userId
 * @param {Record<string, unknown>} params.input
 * @param {(userId: string, opts?: object) => Promise<Array<Record<string, unknown>>>} params.listarNotas
 * @param {number} [params.windowMs]
 */
export const findRecentDuplicateOpenclawNfse = async ({
  userId,
  input,
  listarNotas,
  windowMs = DEFAULT_DEDUP_WINDOW_MS,
}) => {
  const tomador = normalizeDoc(input?.tomadorCpfCnpj);
  const valor = roundMoney(input?.servico?.valorServico);
  const codigo = String(input?.servico?.codigo || '').replace(/\D/g, '');
  if (!tomador || valor === null || !codigo) return null;

  const rows = await listarNotas(userId, { documentType: 'NFSE', limit: 30 });
  const cutoff = Date.now() - windowMs;

  for (const row of rows || []) {
    const createdAt = row?.created_at ? new Date(row.created_at).getTime() : 0;
    if (!createdAt || createdAt < cutoff) continue;
    if (!isActiveNfseEmitStatus(row.status)) continue;

    const rowTomador = normalizeDoc(row.cnpj_tomador);
    const rowValor = extractValorFromNfsePayloadJson(row.payload_json);
    const rowCodigo = extractCodigoFromNfsePayloadJson(row.payload_json);
    if (rowTomador === tomador && rowValor === valor && rowCodigo === codigo) {
      return row;
    }
  }
  return null;
};

/**
 * Serializa emissões idênticas em paralelo (mesmo processo Node).
 * @template T
 * @param {string} fingerprint
 * @param {() => Promise<T>} fn
 * @returns {Promise<T>}
 */
export const withOpenclawNfseEmitInflight = async (fingerprint, fn) => {
  const existing = inflightByFingerprint.get(fingerprint);
  if (existing) return /** @type {Promise<T>} */ (existing);

  const promise = (async () => {
    try {
      return await fn();
    } finally {
      if (inflightByFingerprint.get(fingerprint) === promise) {
        inflightByFingerprint.delete(fingerprint);
      }
    }
  })();

  inflightByFingerprint.set(fingerprint, promise);
  return promise;
};

export const OPENCLAW_NFSE_DEDUP_WINDOW_MS = DEFAULT_DEDUP_WINDOW_MS;
