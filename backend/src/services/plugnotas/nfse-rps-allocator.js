import {
  queryAuthoritativeNfseRpsMaxUsed,
  readRpsFromNfseEmitPayload,
  syncPlugnotasNfseRpsBeforeEmit,
} from './plugnotas-empresa-rps-heal.js';

const normalizeDoc = (value) => String(value || '').replace(/\D/g, '');

const parsePositiveInt = (value, fallback = NaN) => {
  const n = Number.parseInt(String(value ?? ''), 10);
  if (Number.isFinite(n) && n >= 1) return n;
  return fallback;
};

/**
 * Reserva o próximo número DPS de forma atômica (RPC Postgres).
 * Fallback: floor + 1 (requer mutex externo por CNPJ).
 * @param {() => import('@supabase/supabase-js').SupabaseClient} getDb
 * @param {{ cnpj: string, floor?: number }} input
 * @returns {Promise<number>}
 */
export async function reserveNextNfseRpsNumber(getDb, { cnpj, floor = 0 }) {
  const normalizedCnpj = normalizeDoc(cnpj);
  if (normalizedCnpj.length !== 14) {
    throw new Error('CNPJ prestador inválido para reserva RPS');
  }

  const safeFloor = Math.max(parsePositiveInt(floor, 0), 0);
  const db = getDb();
  const { data, error } = await db.rpc('mei_nfse_reserve_rps', {
    p_cnpj: normalizedCnpj,
    p_floor: safeFloor,
  });

  if (!error) {
    const reserved = parsePositiveInt(data, 0);
    if (reserved >= 1) return reserved;
  } else {
    console.warn('[plugnotas-rps] RPC mei_nfse_reserve_rps indisponível — fallback sequencial', {
      message: error.message,
      code: error.code,
    });
  }

  return safeFloor + 1;
}

/**
 * Calcula floor (maior DPS já usado) e reserva o próximo número.
 * @param {() => import('@supabase/supabase-js').SupabaseClient} getDb
 * @param {string} cnpj
 * @param {number} localMax
 * @returns {Promise<{ numero: number, serie: string, lote: number, floor: number }>}
 */
export async function allocateNfseRpsForEmit(getDb, cnpj, localMax = 0) {
  const normalizedCnpj = normalizeDoc(cnpj);
  const periodoAndLocalMax = await queryAuthoritativeNfseRpsMaxUsed(
    normalizedCnpj,
    parsePositiveInt(localMax, 0),
  );
  const floor = Math.max(parsePositiveInt(periodoAndLocalMax, 0), parsePositiveInt(localMax, 0));
  const numero = await reserveNextNfseRpsNumber(getDb, { cnpj: normalizedCnpj, floor });
  return { numero, serie: '1', lote: 1, floor };
}

/**
 * Injeta RPS reservado no payload e sincroniza contador PlugNotas.
 * @param {Record<string, unknown>} emitPayload
 * @param {string} cnpj
 * @param {{ numero: number, serie?: string, lote?: number }} allocation
 * @param {unknown} [empresaJson]
 */
export async function applyAllocatedNfseRpsToEmitPayload(
  emitPayload,
  cnpj,
  allocation,
  empresaJson = null,
) {
  const serie = String(allocation?.serie ?? '1').trim() || '1';
  const lote = parsePositiveInt(allocation?.lote, 1);
  const numero = parsePositiveInt(allocation?.numero);
  if (!Number.isFinite(numero)) {
    throw new Error('Numeração RPS reservada inválida');
  }

  emitPayload.rps = { lote, numeracao: [{ serie, numero }] };
  await syncPlugnotasNfseRpsBeforeEmit(cnpj, { serie, lote, numero }, empresaJson);
  return readRpsFromNfseEmitPayload(emitPayload);
}
