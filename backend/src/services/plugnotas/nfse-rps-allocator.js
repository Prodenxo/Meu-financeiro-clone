import {
  queryAuthoritativeNfseRpsMaxUsed,
  readPlugnotasNfseNextRpsFromEmpresa,
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
 * @param {() => import('@supabase/supabase-js').SupabaseClient} getDb
 * @param {string} cnpj
 * @returns {Promise<number>}
 */
export async function readNfseRpsCounterLast(getDb, cnpj) {
  const normalizedCnpj = normalizeDoc(cnpj);
  if (normalizedCnpj.length !== 14) return 0;

  const db = getDb();
  const { data, error } = await db
    .from('mei_nfse_rps_counters')
    .select('last_numero')
    .eq('cnpj_prestador', normalizedCnpj)
    .maybeSingle();

  if (error) {
    console.warn('[plugnotas-rps] leitura mei_nfse_rps_counters falhou', error.message);
    return 0;
  }

  return Math.max(parsePositiveInt(data?.last_numero, 0), 0);
}

/**
 * Alinha o contador Postgres ao maior DPS já consumido (sem incrementar).
 * @param {() => import('@supabase/supabase-js').SupabaseClient} getDb
 * @param {string} cnpj
 * @param {number} usedNumero
 */
export async function forceNfseRpsCounterFloor(getDb, cnpj, usedNumero) {
  const normalizedCnpj = normalizeDoc(cnpj);
  const floor = parsePositiveInt(usedNumero, 0);
  if (normalizedCnpj.length !== 14 || !floor) return;

  const db = getDb();
  const { error } = await db.rpc('mei_nfse_sync_rps_floor', {
    p_cnpj: normalizedCnpj,
    p_floor: floor,
  });

  if (error) {
    console.warn('[plugnotas-rps] RPC mei_nfse_sync_rps_floor falhou — upsert direto', error.message);
    const current = await readNfseRpsCounterLast(getDb, normalizedCnpj);
    const nextFloor = Math.max(current, floor);
    await db.from('mei_nfse_rps_counters').upsert({
      cnpj_prestador: normalizedCnpj,
      last_numero: nextFloor,
      updated_at: new Date().toISOString(),
    });
  }
}

/**
 * Reserva o próximo número DPS de forma atômica (RPC Postgres).
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

  const counterLast = await readNfseRpsCounterLast(getDb, normalizedCnpj);
  const next = Math.max(safeFloor, counterLast) + 1;
  await forceNfseRpsCounterFloor(getDb, normalizedCnpj, next);
  return next;
}

/**
 * Maior DPS já usado no PlugNotas + histórico local (sem contador Postgres).
 * @param {string} cnpj
 * @param {number} localMax
 * @returns {Promise<number>}
 */
export async function queryPlugnotasAndLocalNfseRpsMax(cnpj, localMax = 0) {
  const normalizedCnpj = normalizeDoc(cnpj);
  const authoritative = await queryAuthoritativeNfseRpsMaxUsed(
    normalizedCnpj,
    parsePositiveInt(localMax, 0),
  );
  return Math.max(
    parsePositiveInt(authoritative, 0),
    parsePositiveInt(localMax, 0),
  );
}

/**
 * Maior DPS conhecido incluindo contador Postgres (para diagnóstico).
 * @param {() => import('@supabase/supabase-js').SupabaseClient} getDb
 * @param {string} cnpj
 * @param {number} localMax
 */
export async function queryKnownNfseRpsMax(getDb, cnpj, localMax = 0) {
  const normalizedCnpj = normalizeDoc(cnpj);
  const counterLast = await readNfseRpsCounterLast(getDb, normalizedCnpj);
  const historyMax = await queryPlugnotasAndLocalNfseRpsMax(normalizedCnpj, localMax);
  return Math.max(historyMax, counterLast);
}

/**
 * Reserva o próximo DPS: histórico PlugNotas + Postgres + contador empresa (quando à frente).
 * @param {() => import('@supabase/supabase-js').SupabaseClient} getDb
 * @param {string} cnpj
 * @param {number} localMax
 * @param {unknown} [empresaJson]
 */
export async function allocateNfseRpsForEmit(getDb, cnpj, localMax = 0, empresaJson = null) {
  const normalizedCnpj = normalizeDoc(cnpj);
  const historyMax = await queryPlugnotasAndLocalNfseRpsMax(normalizedCnpj, localMax);
  const counterLast = await readNfseRpsCounterLast(getDb, normalizedCnpj);
  const empresaNext = readPlugnotasNfseNextRpsFromEmpresa(empresaJson);
  const empresaFloor = empresaNext?.numero >= 1 ? empresaNext.numero - 1 : 0;
  const floor = Math.max(historyMax, counterLast, empresaFloor);

  await forceNfseRpsCounterFloor(getDb, normalizedCnpj, floor);
  const numero = await reserveNextNfseRpsNumber(getDb, {
    cnpj: normalizedCnpj,
    floor,
  });

  console.info('[plugnotas-rps] DPS reservado', {
    cnpj: `${normalizedCnpj.slice(0, 2)}***${normalizedCnpj.slice(-4)}`,
    historyMax,
    counterLast,
    empresaFloor,
    floor,
    numero,
  });

  return {
    numero,
    serie: String(empresaNext?.serie ?? '1').trim() || '1',
    lote: parsePositiveInt(empresaNext?.lote, 1),
    floor,
  };
}

/**
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
