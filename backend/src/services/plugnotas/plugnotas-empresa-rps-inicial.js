/**
 * Política BFF: `rps` no POST /empresa (canónico ou valores do cliente); PATCH pode enviar `rps` quando o cliente os inclui.
 * @see docs/technical/architecture-plugnotas-empresa-rps-inicial-2026-04-16.md
 */

/** Bloco canónico PlugNotas quando o cliente não envia `rps`. */
export const EMPRESA_PLUGNOTAS_RPS_INICIAL_POST = Object.freeze({
  lote: 1,
  numeracao: Object.freeze([Object.freeze({ numero: 1, serie: '1' })])
});

const parsePositiveInt = (value, fallback) => {
  const n = Number.parseInt(String(value ?? ''), 10);
  if (Number.isFinite(n) && n >= 1) return n;
  return fallback;
};

/**
 * @param {unknown} rps
 * @returns {boolean}
 */
const hasClientRpsShape = (rps) => {
  if (!rps || typeof rps !== 'object' || Array.isArray(rps)) return false;
  const numeracao = rps.numeracao;
  if (!Array.isArray(numeracao) || numeracao.length < 1) return false;
  const first = numeracao[0];
  if (!first || typeof first !== 'object' || Array.isArray(first)) return false;
  return true;
};

/**
 * Normaliza `payload.rps` para o contrato PlugNotas (muta o objeto).
 * @param {Record<string, unknown>|null|undefined} payload
 */
export const sanitizeEmpresaPlugnotasRpsPayload = (payload) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return;
  if (!Object.prototype.hasOwnProperty.call(payload, 'rps')) return;
  const raw = payload.rps;
  if (!hasClientRpsShape(raw)) {
    delete payload.rps;
    return;
  }
  const lot = parsePositiveInt(raw.lote, 1);
  const first = raw.numeracao[0];
  const num = parsePositiveInt(first.numero, 1);
  let ser = first.serie != null ? String(first.serie).trim() : '';
  if (!ser) ser = '1';
  payload.rps = {
    lote: lot,
    numeracao: [{ numero: num, serie: ser }]
  };
};

/**
 * POST /empresa: aplica `rps` canónico só se o cliente não enviou bloco utilizável; caso contrário sanitiza o enviado.
 * @param {Record<string, unknown>|null|undefined} payload
 */
export const applyEmpresaPlugnotasRpsInicialForPost = (payload) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return;
  if (hasClientRpsShape(payload.rps)) {
    sanitizeEmpresaPlugnotasRpsPayload(payload);
    return;
  }
  payload.rps = {
    lote: 1,
    numeracao: [{ numero: 1, serie: '1' }]
  };
};

/**
 * Remove `rps` do corpo (fallback POST conflito → PATCH). Muta o objeto.
 * @param {Record<string, unknown>|null|undefined} payload
 * @returns {typeof payload}
 */
export const stripRpsFromEmpresaPayload = (payload) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return payload;
  if (Object.prototype.hasOwnProperty.call(payload, 'rps')) {
    delete payload.rps;
  }
  return payload;
};
