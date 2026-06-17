import { unwrapPlugnotasEmpresaRecord } from '../mei-emitente-empresa-sync.js';
import { atualizarEmpresaPlugNotas, consultarEmpresaPlugNotas } from './empresa.service.js';
import { consultarNfsePorPeriodo } from './nfse.service.js';
import {
  cloneEmpresaPlugnotasRpsInicialPost,
  EMPRESA_PLUGNOTAS_NFSE_CONFIG_RPS_CANONICAL,
  hasClientRpsShape,
  hasNfseConfigRpsShape
} from './plugnotas-empresa-rps-inicial.js';

const normalizeDoc = (value) => String(value || '').replace(/\D/g, '');

const parsePositiveInt = (value, fallback = NaN) => {
  const n = Number.parseInt(String(value ?? ''), 10);
  if (Number.isFinite(n) && n >= 1) return n;
  return fallback;
};

/**
 * Extrai série/número/lote de um payload de emissão NFS-e (corpo enviado ao PlugNotas).
 * @param {unknown} payload
 * @returns {{ serie: string, numero: number, lote: number }|null}
 */
export function readRpsFromNfseEmitPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const rps = payload.rps;
  if (!rps || typeof rps !== 'object' || Array.isArray(rps)) return null;

  const numeracao = Array.isArray(rps.numeracao) ? rps.numeracao[0] : null;
  const serie = String(numeracao?.serie ?? rps.serie ?? '1').trim() || '1';
  const numero = parsePositiveInt(numeracao?.numero ?? rps.numero);
  const lote = parsePositiveInt(rps.lote, 1);
  if (!Number.isFinite(numero)) return null;
  return { serie, numero, lote };
}

const collectPlugnotasNfseBodies = (response) => {
  if (Array.isArray(response)) return response.filter((item) => item && typeof item === 'object');
  if (!response || typeof response !== 'object') return [];
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

const parseDpsIdNumero = (dpsId) => {
  const id = String(dpsId || '').trim();
  if (!id) return NaN;
  const match = id.match(/(\d{1,15})$/);
  if (!match) return NaN;
  return parsePositiveInt(match[1]);
};

/**
 * Lê o maior número RPS/DPS numa resposta PlugNotas (array ou objeto, `rps` flat ou `dps`).
 * @param {unknown} body
 * @returns {number|null}
 */
export function readRpsNumeroFromNfsePlugnotasBody(body) {
  const candidates = collectPlugnotasNfseBodies(body);
  if (!candidates.length && body && typeof body === 'object') candidates.push(body);

  let max = 0;
  for (const candidate of candidates) {
    const fromRps = readRpsFromNfseEmitPayload(candidate)?.numero;
    const fromDps = parsePositiveInt(candidate?.dps?.numero);
    const fromDpsId = parseDpsIdNumero(candidate?.dps?.id);
    for (const n of [fromRps, fromDps, fromDpsId]) {
      if (Number.isFinite(n) && n >= 1 && n > max) max = n;
    }
  }
  return max > 0 ? max : null;
}

export const isNfseE0014DuplicateRpsMessage = (text) => {
  const lower = String(text || '').toLowerCase();
  return /e0014/.test(lower)
    || lower.includes('dps já existe')
    || lower.includes('dps ja existe')
    || (lower.includes('conjunto de série') && lower.includes('já existe'))
    || (lower.includes('conjunto de serie') && lower.includes('ja existe'));
};

/**
 * Mensagem de rejeição da prefeitura em resposta PlugNotas (array ou objeto).
 * @param {unknown} response
 * @returns {string}
 */
export function extractNfseRejectionMessage(response) {
  const candidates = collectPlugnotasNfseBodies(response);
  for (const candidate of candidates) {
    const msg = candidate?.retorno?.mensagemRetorno
      || candidate?.mensagem
      || candidate?.message
      || '';
    if (msg) return String(msg);
  }
  return '';
}

/** @param {unknown} response */
export function isNfseE0014FromPlugnotasResponse(response) {
  return isNfseE0014DuplicateRpsMessage(extractNfseRejectionMessage(response));
}

const PLUGNOTAS_NFSE_PERIODO_MAX_PAGES = 40;

/**
 * Maior número RPS/DPS já enviado ao PlugNotas para o CNPJ (todas as situações).
 * Fonte autoritativa quando o contador da empresa está desatualizado.
 * @param {string} cnpjInput
 * @returns {Promise<number|null>}
 */
export async function queryMaxRpsNumeroFromPlugnotasPeriodo(cnpjInput) {
  const cnpj = normalizeDoc(cnpjInput);
  if (cnpj.length !== 14) return null;

  let hashProximaPagina;
  let maxKnown = 0;

  for (let page = 0; page < PLUGNOTAS_NFSE_PERIODO_MAX_PAGES; page += 1) {
    let body;
    try {
      body = await consultarNfsePorPeriodo({
        cpfCnpj: cnpj,
        ...(hashProximaPagina ? { hashProximaPagina } : {})
      });
    } catch (error) {
      console.warn(
        '[plugnotas-rps] falha ao consultar histórico NFS-e por período',
        error instanceof Error ? error.message : error
      );
      break;
    }

    const notas = Array.isArray(body?.notas) ? body.notas : [];
    for (const nota of notas) {
      const numero = parsePositiveInt(nota?.numero);
      if (numero > maxKnown) maxKnown = numero;
    }

    const nextHash = body?.hashProximaPagina;
    if (!nextHash || typeof nextHash !== 'string') break;
    hashProximaPagina = nextHash;
  }

  return maxKnown > 0 ? maxKnown : null;
}

/**
 * Maior número RPS já usado numa linha do histórico (payload de emissão ou resposta PlugNotas).
 * @param {{ payload_json?: unknown, response_json?: unknown }|null|undefined} row
 * @returns {number|null}
 */
export function readRpsNumeroFromNfseHistoryRow(row) {
  if (!row || typeof row !== 'object') return null;
  const fromPayload = readRpsNumeroFromNfsePlugnotasBody(row.payload_json);
  const fromResponse = readRpsNumeroFromNfsePlugnotasBody(row.response_json);
  const max = Math.max(fromPayload ?? 0, fromResponse ?? 0);
  return max > 0 ? max : null;
}

/**
 * Próximo número RPS seguro para emissões consecutivas (PlugNotas pode atrasar o contador).
 * @param {number} plugnotasNumero
 * @param {number|null|undefined} localMaxNumero
 * @returns {number}
 */
export function resolveNextNfseRpsNumero(plugnotasNumero, localMaxNumero) {
  const plug = parsePositiveInt(plugnotasNumero, 1);
  const localMax = parsePositiveInt(localMaxNumero, 0);
  const fromLocal = localMax >= 1 ? localMax + 1 : 1;
  return Math.max(plug, fromLocal);
}

/**
 * @deprecated Preferir max conhecido via {@link readRpsNumeroFromNfseHistoryRow}.
 * Mantido só para testes de regressão — contagem de linhas ≠ número RPS na prefeitura.
 */
export function resolveNfseRpsLocalMaxFromHistory(input = {}) {
  const maxKnown = parsePositiveInt(input.maxKnownNumero, 0);
  return maxKnown > 0 ? maxKnown : null;
}

const buildPlugnotasEmpresaRpsBlocks = ({ serie, lote, numero }) => ({
  rootRps: {
    lote,
    numeracao: [{ serie, numero }]
  },
  // PATCH empresa: numeracao só na raiz `rps`; config.rps é flat (contrato PlugNotas).
  configRps: {
    serie,
    numero,
    lote
  }
});

const patchPlugnotasEmpresaRpsNextNumero = async (cnpj, empresaJson, { serie, lote, numero }) => {
  const empresa = unwrapPlugnotasEmpresaRecord(empresaJson);
  const nfseAtivo = empresa?.nfse?.ativo !== false;
  const existingConfig = empresa?.nfse?.config && typeof empresa.nfse.config === 'object'
    ? empresa.nfse.config
    : { producao: true };
  const { rootRps, configRps } = buildPlugnotasEmpresaRpsBlocks({ serie, lote, numero });

  await atualizarEmpresaPlugNotas({
    cpfCnpj: cnpj,
    rps: rootRps,
    nfse: {
      ativo: nfseAtivo,
      config: {
        ...existingConfig,
        rps: configRps
      }
    }
  });
};

/**
 * Alinha o contador RPS no PlugNotas ao número que será emitido (config pode estar atrasada).
 * @param {string} cnpjInput
 * @param {{ serie: string, lote: number, numero: number }} targetRps
 * @param {unknown} [empresaJson]
 */
export async function syncPlugnotasNfseRpsBeforeEmit(cnpjInput, targetRps, empresaJson = null) {
  const cnpj = normalizeDoc(cnpjInput);
  const targetNumero = parsePositiveInt(targetRps?.numero);
  if (cnpj.length !== 14 || !Number.isFinite(targetNumero)) return;

  const usedSerie = String(targetRps?.serie ?? '1').trim() || '1';
  const usedLote = parsePositiveInt(targetRps?.lote, 1);

  let empresa = empresaJson;
  if (!empresa) {
    try {
      empresa = await consultarEmpresaPlugNotas(cnpj);
    } catch {
      return;
    }
  }

  const current = readPlugnotasNfseNextRpsFromEmpresa(empresa);
  if (current && current.numero === targetNumero) return;

  try {
    await patchPlugnotasEmpresaRpsNextNumero(cnpj, empresa, {
      serie: usedSerie,
      lote: usedLote,
      numero: targetNumero
    });
  } catch (error) {
    console.warn(
      '[plugnotas-rps] falha ao sincronizar contador RPS antes da emissão',
      error instanceof Error ? error.message : error
    );
  }
}

/**
 * Lê série/número/lote configurados em `nfse.config.rps` (GET empresa PlugNotas).
 * @param {unknown} empresaJson
 * @returns {{ serie: string, numero: number, lote: number }|null}
 */
export function readPlugnotasNfseNextRpsFromEmpresa(empresaJson) {
  const empresa = unwrapPlugnotasEmpresaRecord(empresaJson);
  const rps = empresa?.nfse?.config?.rps;
  if (!rps || typeof rps !== 'object' || Array.isArray(rps)) return null;

  const numeracao = Array.isArray(rps.numeracao) ? rps.numeracao[0] : null;
  const serie = String(numeracao?.serie ?? rps.serie ?? '1').trim() || '1';
  const numero = parsePositiveInt(numeracao?.numero ?? rps.numero);
  if (!Number.isFinite(numero)) return null;
  const lote = parsePositiveInt(rps.lote, 1);
  return { serie, numero, lote };
}

/**
 * NFS-e Nacional: sempre injeta série/número explícitos antes do POST — mesmo que o payload
 * já traga `rps` (reemissão, payload antigo ou contador PlugNotas desatualizado).
 * @param {Record<string, unknown>} payload
 * @param {string} cnpjInput
 * @param {{ localMaxRpsNumero?: number|null }} [opts]
 */
export async function applyPlugnotasNfseEmitRpsFromEmpresaConfig(payload, cnpjInput, opts = {}) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return;

  const cnpj = normalizeDoc(cnpjInput);
  if (cnpj.length !== 14) return;

  let empresaJson;
  try {
    empresaJson = await consultarEmpresaPlugNotas(cnpj);
  } catch {
    empresaJson = null;
  }

  const next = empresaJson ? readPlugnotasNfseNextRpsFromEmpresa(empresaJson) : null;

  let plugnotasApiMax = parsePositiveInt(opts.plugnotasApiMaxRpsNumero, 0);
  if (!plugnotasApiMax && opts.skipPlugnotasPeriodoQuery !== true) {
    plugnotasApiMax = parsePositiveInt(await queryMaxRpsNumeroFromPlugnotasPeriodo(cnpj), 0);
  }

  const localMax = parsePositiveInt(opts.localMaxRpsNumero, 0);
  const combinedMax = Math.max(localMax, plugnotasApiMax);
  if (!next && combinedMax < 1) return;

  const serie = next?.serie ?? '1';
  const lote = next?.lote ?? 1;
  const plugNumero = next?.numero ?? 1;
  const numero = resolveNextNfseRpsNumero(
    plugNumero,
    combinedMax > 0 ? combinedMax : opts.localMaxRpsNumero
  );

  payload.rps = {
    lote,
    numeracao: [{ serie, numero }]
  };

  if (empresaJson) {
    await syncPlugnotasNfseRpsBeforeEmit(cnpj, { serie, lote, numero }, empresaJson);
  } else {
    await syncPlugnotasNfseRpsBeforeEmit(cnpj, { serie, lote, numero });
  }
}

const DEFAULT_NFSE_E0014_EMIT_RETRIES = 4;

/**
 * Emite NFS-e com realinhamento do contador PlugNotas e reenvio automático em E0014.
 * @param {{ emitir: (payload: Record<string, unknown>) => Promise<unknown> }} adapter
 * @param {Record<string, unknown>} emitPayload
 * @param {string} cnpjInput
 * @param {() => string} buildFreshIdIntegracao
 * @param {{ maxRetries?: number }} [opts]
 * @returns {Promise<{ response: unknown, emitPayload: Record<string, unknown> }>}
 */
export async function emitNfseWithPlugnotasRpsHeal(
  adapter,
  emitPayload,
  cnpjInput,
  buildFreshIdIntegracao,
  opts = {}
) {
  const cnpj = normalizeDoc(cnpjInput);
  const maxRetries = Number.isFinite(opts.maxRetries)
    ? Math.max(0, Math.trunc(opts.maxRetries))
    : DEFAULT_NFSE_E0014_EMIT_RETRIES;

  let payload = emitPayload;
  let response;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    response = await adapter.emitir(payload);

    if (!isNfseE0014FromPlugnotasResponse(response)) {
      return { response, emitPayload: payload };
    }

    const usedNumero = readRpsNumeroFromNfsePlugnotasBody(response);
    if (!Number.isFinite(usedNumero) || attempt >= maxRetries) {
      return { response, emitPayload: payload };
    }

    const currentRps = readRpsFromNfseEmitPayload(payload);
    const serie = currentRps?.serie ?? '1';
    const lote = currentRps?.lote ?? 1;
    const nextNumero = usedNumero + 1;

    payload = { ...payload };
    payload.rps = { lote, numeracao: [{ serie, numero: nextNumero }] };
    if (typeof buildFreshIdIntegracao === 'function') {
      payload.idIntegracao = buildFreshIdIntegracao();
    }

    await syncPlugnotasNfseRpsBeforeEmit(cnpj, { serie, lote, numero: nextNumero });
  }

  return { response, emitPayload: payload };
}

/**
 * Após E0014 ou emissão com número conhecido, garante contador PlugNotas em `numero + 1`.
 * @param {string} cnpjInput
 * @param {{ serie?: string, numero: number, lote?: number }} usedRps
 */
export async function healPlugnotasNfseRpsAfterUsedNumero(cnpjInput, usedRps) {
  await advancePlugnotasNfseRpsAfterEmit(cnpjInput, usedRps);
}

/**
 * Avança o contador RPS no PlugNotas após emissão (aceita ou rejeitada com número consumido).
 * Falhas são ignoradas — a reserva local em `resolveNextNfseRpsNumero` cobre o intervalo.
 * @param {string} cnpjInput
 * @param {{ serie?: string, numero: number, lote?: number }} usedRps
 */
export async function advancePlugnotasNfseRpsAfterEmit(cnpjInput, usedRps) {
  const cnpj = normalizeDoc(cnpjInput);
  const usedNumero = parsePositiveInt(usedRps?.numero);
  if (cnpj.length !== 14 || !Number.isFinite(usedNumero)) return;

  const usedSerie = String(usedRps?.serie ?? '1').trim() || '1';
  const usedLote = parsePositiveInt(usedRps?.lote, 1);
  const targetNext = usedNumero + 1;

  let empresaJson;
  try {
    empresaJson = await consultarEmpresaPlugNotas(cnpj);
  } catch {
    return;
  }

  const current = readPlugnotasNfseNextRpsFromEmpresa(empresaJson);
  if (current && current.numero >= targetNext) return;

  try {
    await patchPlugnotasEmpresaRpsNextNumero(cnpj, empresaJson, {
      serie: usedSerie,
      lote: usedLote,
      numero: targetNext
    });
  } catch (error) {
    console.warn(
      '[plugnotas-rps] falha ao avançar contador RPS após emissão',
      error instanceof Error ? error.message : error
    );
  }
}

/**
 * Empresa no emissor já tem bloco `rps` utilizável (lote + numeração com série).
 * @param {unknown} empresaJson
 * @returns {boolean}
 */
export function empresaPlugnotasTemRpsCadastrado(empresaJson) {
  const empresa = unwrapPlugnotasEmpresaRecord(empresaJson);
  if (!empresa) return false;
  return hasNfseConfigRpsShape(empresa) || hasClientRpsShape(empresa.rps);
}

/**
 * Repara cadastros legados (POST conflito → PATCH sem `rps`) antes da emissão NFS-e.
 * Idempotente quando o emissor já possui numeração.
 * @param {string} cnpjInput
 */
export async function ensureEmpresaPlugnotasRpsForNfseEmit(cnpjInput) {
  const cnpj = normalizeDoc(cnpjInput);
  if (cnpj.length !== 14) return;

  let empresaJson;
  try {
    empresaJson = await consultarEmpresaPlugNotas(cnpj);
  } catch {
    return;
  }

  if (empresaPlugnotasTemRpsCadastrado(empresaJson)) return;

  const empresa = unwrapPlugnotasEmpresaRecord(empresaJson);
  const nfseAtivo = empresa?.nfse?.ativo !== false;

  await atualizarEmpresaPlugNotas({
    cpfCnpj: cnpj,
    rps: cloneEmpresaPlugnotasRpsInicialPost(),
    nfse: {
      ativo: nfseAtivo,
      tipoContrato: 0,
      config: {
        producao: true,
        nfseNacional: true,
        consultaNfseNacional: true,
        rps: { ...EMPRESA_PLUGNOTAS_NFSE_CONFIG_RPS_CANONICAL }
      }
    }
  });
}
