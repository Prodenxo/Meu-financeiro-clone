import { unwrapPlugnotasEmpresaRecord } from '../mei-emitente-empresa-sync.js';
import { atualizarEmpresaPlugNotas, consultarEmpresaPlugNotas } from './empresa.service.js';
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

const emitPayloadHasExplicitRps = (payload) => {
  if (!payload?.rps || typeof payload.rps !== 'object' || Array.isArray(payload.rps)) return false;
  if (parsePositiveInt(payload.rps.numero) >= 1) return true;
  const numeracao = payload.rps.numeracao;
  if (!Array.isArray(numeracao) || numeracao.length < 1) return false;
  const first = numeracao[0];
  return parsePositiveInt(first?.numero) >= 1;
};

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
 * NFS-e Nacional: quando o cliente não informa `rps`, a PlugNotas pode ignorar o cadastro
 * e repetir numeração presa. Injeta série/número explícitos do cadastro da empresa.
 * @param {Record<string, unknown>} payload
 * @param {string} cnpjInput
 */
export async function applyPlugnotasNfseEmitRpsFromEmpresaConfig(payload, cnpjInput) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return;
  if (emitPayloadHasExplicitRps(payload)) return;

  const cnpj = normalizeDoc(cnpjInput);
  if (cnpj.length !== 14) return;

  let empresaJson;
  try {
    empresaJson = await consultarEmpresaPlugNotas(cnpj);
  } catch {
    return;
  }

  const next = readPlugnotasNfseNextRpsFromEmpresa(empresaJson);
  if (!next) return;

  payload.rps = {
    lote: next.lote,
    numeracao: [{ serie: next.serie, numero: next.numero }]
  };
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
