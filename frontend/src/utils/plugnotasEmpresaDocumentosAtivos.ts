/**
 * Seleção canónica de documentos ativos (cadastro Plugnotas) — espelha o contrato backend `documentosAtivos`.
 * @see docs/stories/story-fr-cad-doc-p0-frontend-documentos-ativos-guidesmei.md
 */
import { extractPlugnotasEmpresaBody } from './plugnotasEmpresaCapabilities';

export type DocumentosAtivosState = {
  nfse: boolean;
  nfe: boolean;
  nfce: boolean;
};

/** PRD §6.2 — alinhado ao backend `DOCUMENTOS_ATIVOS_DEFAULT`. */
export const DEFAULT_DOCUMENTOS_ATIVOS: DocumentosAtivosState = Object.freeze({
  nfse: true,
  nfe: false,
  nfce: false
});

/** FR-CAD-DOC-03 — pt-BR (story). */
export const MSG_DOCUMENTOS_ATIVOS_MIN_ONE = 'Selecione pelo menos um tipo de documento.';

/** FR-CAD-DOC-06 — resposta ambígua (UX spec §8.2). */
export const MSG_DOCUMENTOS_ATIVOS_CONSULTA_PARCIAL =
  'Não foi possível determinar todos os tipos ativos a partir da resposta do emissor. Verifique no painel Plugnotas.';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function readAtivoStrict(
  body: Record<string, unknown> | null,
  key: 'nfse' | 'nfe' | 'nfce'
): boolean | null {
  if (!body) return null;
  const block = body[key];
  if (!isRecord(block)) return null;
  if (typeof block.ativo !== 'boolean') return null;
  return block.ativo;
}

export type MapPlugnotasEmpresaDocumentSelectionResult =
  | { kind: 'full'; selection: DocumentosAtivosState }
  | { kind: 'partial'; message: string };

/**
 * Hidrata checkboxes a partir do GET empresa (corpo bruto ou envelope `{ data }`).
 * Só devolve `full` quando `nfse` / `nfe` / `nfce` têm `ativo` booleano em blocos presentes.
 */
export function mapPlugnotasEmpresaToDocumentSelection(
  apiResponse: unknown
): MapPlugnotasEmpresaDocumentSelectionResult {
  const body = extractPlugnotasEmpresaBody(apiResponse);
  const nfse = readAtivoStrict(body, 'nfse');
  const nfe = readAtivoStrict(body, 'nfe');
  const nfce = readAtivoStrict(body, 'nfce');
  if (nfse !== null && nfe !== null && nfce !== null) {
    return {
      kind: 'full',
      selection: { nfse, nfe, nfce }
    };
  }
  return { kind: 'partial', message: MSG_DOCUMENTOS_ATIVOS_CONSULTA_PARCIAL };
}

export function getDocumentosAtivosValidationMessage(
  selection: DocumentosAtivosState
): string | null {
  if (!selection.nfse && !selection.nfe && !selection.nfce) {
    return MSG_DOCUMENTOS_ATIVOS_MIN_ONE;
  }
  return null;
}

export function countDocumentosAtivosTrue(selection: DocumentosAtivosState): number {
  return (selection.nfse ? 1 : 0) + (selection.nfe ? 1 : 0) + (selection.nfce ? 1 : 0);
}
