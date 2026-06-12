import { unwrapPlugnotasEmpresaRecord } from '../mei-emitente-empresa-sync.js';
import { atualizarEmpresaPlugNotas, consultarEmpresaPlugNotas } from './empresa.service.js';
import {
  cloneEmpresaPlugnotasRpsInicialPost,
  EMPRESA_PLUGNOTAS_NFSE_CONFIG_RPS_CANONICAL,
  hasClientRpsShape,
  hasNfseConfigRpsShape
} from './plugnotas-empresa-rps-inicial.js';

const normalizeDoc = (value) => String(value || '').replace(/\D/g, '');

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
