/**
 * Política BFF: `rps` canónico só em POST /empresa; PATCH nunca envia `rps`.
 * @see docs/technical/architecture-plugnotas-empresa-rps-inicial-2026-04-16.md
 */

/** Bloco canónico PlugNotas para criação de empresa (FR-RPS-POST-01, FR-RPS-OVR-01). */
export const EMPRESA_PLUGNOTAS_RPS_INICIAL_POST = Object.freeze({
  lote: 1,
  numeracao: Object.freeze([Object.freeze({ numero: 1, serie: '1' })])
});

/**
 * Substitui qualquer `rps` existente pelo bloco canónico (idempotente nos valores finais).
 * @param {Record<string, unknown>|null|undefined} payload
 */
export const applyEmpresaPlugnotasRpsInicialForPost = (payload) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return;
  payload.rps = {
    lote: 1,
    numeracao: [{ numero: 1, serie: '1' }]
  };
};

/**
 * Remove `rps` do corpo antes de PATCH /empresa (FR-RPS-PATCH-01). Muta o objeto.
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
