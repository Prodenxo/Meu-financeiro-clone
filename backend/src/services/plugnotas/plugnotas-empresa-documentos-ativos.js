/**
 * Seleção canónica de documentos ativos (NFSe / NF-e / NFC-e) para POST/PATCH empresa Plugnotas.
 * @see docs/stories/story-fr-cad-doc-p0-backend-documentos-ativos-plugnotas.md
 * @see docs/adr/ADR-plugnotas-empresa-payload-apenas-nfse.md
 */
import { badRequest } from '../../utils/errors.js';
import {
  PLUGNOTAS_MEI_INSCRICAO_ESTADUAL_QUANDO_VAZIA,
  PLUGNOTAS_NFSE_NACIONAL_DEFAULT_ON,
  PLUGNOTAS_NFSE_NACIONAL_PAYLOAD_KEY
} from './plugnotas-mei-empresa-policy.js';

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

/** Default PRD §6.2 — alinhado ao comportamento histórico “apenas NFS-e”. */
export const DOCUMENTOS_ATIVOS_DEFAULT = Object.freeze({
  nfse: true,
  nfe: false,
  nfce: false
});

const PLUGNOTAS_EMPRESA_DOC_INATIVO = Object.freeze({ ativo: false, tipoContrato: 0 });

/** Config mínimo para blocos ativos — alinhado a spike sandbox; revisar com doc oficial Plugnotas. */
const PLUGNOTAS_NFE_ATIVO_CONFIG_MIN = Object.freeze({ producao: true });
const PLUGNOTAS_NFCE_ATIVO_CONFIG_MIN = Object.freeze({
  producao: true,
  serie: 1,
  numero: 1,
  versaoQrCode: 2
});

const toBool = (value, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'number') return value !== 0;
  const t = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'sim'].includes(t)) return true;
  if (['0', 'false', 'no', 'nao', 'não'].includes(t)) return false;
  return fallback;
};

/**
 * @param {unknown} raw
 * @returns {{ nfse: boolean, nfe: boolean, nfce: boolean }}
 */
export const normalizeDocumentosAtivosShape = (raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw badRequest(
      'Campo documentosAtivos deve ser um objeto com nfse, nfe e nfce (booleanos).'
    );
  }
  const o = /** @type {Record<string, unknown>} */ (raw);
  return {
    nfse: toBool(o.nfse, false),
    nfe: toBool(o.nfe, false),
    nfce: toBool(o.nfce, false)
  };
};

/**
 * @param {{ nfse: boolean, nfe: boolean, nfce: boolean }} selection
 */
export const assertAtLeastOneDocumentoAtivo = (selection) => {
  if (!selection.nfse && !selection.nfe && !selection.nfce) {
    throw badRequest('Seleccione pelo menos um tipo de documento.');
  }
};

/**
 * Remove `documentosAtivos` do payload antes do fetch ao Plugnotas.
 * @param {Record<string, unknown>} payload
 */
export const stripDocumentosAtivos = (payload) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return;
  delete payload.documentosAtivos;
};

/**
 * @param {Record<string, unknown>} payload
 * @returns {{ selection: { nfse: boolean, nfe: boolean, nfce: boolean } }}
 */
export const resolveDocumentosAtivosForPost = (payload) => {
  if (!hasOwn(payload, 'documentosAtivos')) {
    return { selection: { ...DOCUMENTOS_ATIVOS_DEFAULT } };
  }
  const selection = normalizeDocumentosAtivosShape(payload.documentosAtivos);
  assertAtLeastOneDocumentoAtivo(selection);
  return { selection };
};

/**
 * @param {Record<string, unknown>} payload
 * @returns {{ present: boolean, selection?: { nfse: boolean, nfe: boolean, nfce: boolean } }}
 */
export const resolveDocumentosAtivosForPatch = (payload) => {
  if (!hasOwn(payload, 'documentosAtivos')) {
    return { present: false };
  }
  const selection = normalizeDocumentosAtivosShape(payload.documentosAtivos);
  assertAtLeastOneDocumentoAtivo(selection);
  return { present: true, selection };
};

/**
 * POST: IE vazia → ISENTO (mantém contrato MEI).
 * @param {Record<string, unknown>} payload
 */
const normalizeInscricaoEstadualApenasNfse = (payload) => {
  const ieRaw = payload.inscricaoEstadual;
  const ieStr = ieRaw != null ? String(ieRaw).trim() : '';
  if (!ieStr) {
    payload.inscricaoEstadual = PLUGNOTAS_MEI_INSCRICAO_ESTADUAL_QUANDO_VAZIA;
  }
};

/**
 * POST: default NFS-e Nacional ON quando nfse ativo.
 * @param {Record<string, unknown>} payload
 */
const applyNfseNacionalDefaultForPost = (payload) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return;
  const base =
    payload.nfse && typeof payload.nfse === 'object' && !Array.isArray(payload.nfse)
      ? { ...payload.nfse }
      : { ativo: true, tipoContrato: 0, config: { producao: true } };
  payload.nfse = {
    ...base,
    [PLUGNOTAS_NFSE_NACIONAL_PAYLOAD_KEY]: PLUGNOTAS_NFSE_NACIONAL_DEFAULT_ON
  };
};

/**
 * Monta apenas nfse / nfe / nfce (sem IE). POST e PATCH com `documentosAtivos` partilham esta árvore.
 * @param {Record<string, unknown>} payload
 * @param {{ nfse: boolean, nfe: boolean, nfce: boolean }} selection
 */
const assignDocumentBlocksFromSelection = (payload, selection) => {
  if (selection.nfse) {
    payload.nfse = { ativo: true, tipoContrato: 0, config: { producao: true } };
    applyNfseNacionalDefaultForPost(payload);
  } else {
    payload.nfse = { ...PLUGNOTAS_EMPRESA_DOC_INATIVO };
  }

  payload.nfe = selection.nfe
    ? {
      ativo: true,
      tipoContrato: 0,
      config: { ...PLUGNOTAS_NFE_ATIVO_CONFIG_MIN }
    }
    : { ...PLUGNOTAS_EMPRESA_DOC_INATIVO };

  payload.nfce = selection.nfce
    ? {
      ativo: true,
      tipoContrato: 0,
      config: { ...PLUGNOTAS_NFCE_ATIVO_CONFIG_MIN }
    }
    : { ...PLUGNOTAS_EMPRESA_DOC_INATIVO };
};

/**
 * Monta blocos nfse / nfe / nfce a partir da selecção canónica (POST).
 * @param {Record<string, unknown>} payload
 * @param {{ nfse: boolean, nfe: boolean, nfce: boolean }} selection
 */
export const applyEmpresaPlugnotasDocumentSelectionForPost = (payload, selection) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return;
  assignDocumentBlocksFromSelection(payload, selection);
  normalizeInscricaoEstadualApenasNfse(payload);
};

/**
 * PATCH com `documentosAtivos`: mesma montagem de blocos que no POST (arquitetura §3.2).
 * @param {Record<string, unknown>} payload
 * @param {{ nfse: boolean, nfe: boolean, nfce: boolean }} selection
 */
export const applyEmpresaPlugnotasDocumentSelectionForPatch = (payload, selection) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return;
  assignDocumentBlocksFromSelection(payload, selection);
};
