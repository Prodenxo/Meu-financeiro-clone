/**
 * Seleção canónica de documentos ativos (cadastro Plugnotas) — espelha o contrato backend `documentosAtivos`.
 * @see docs/stories/story-fr-cad-doc-p0-frontend-documentos-ativos-guidesmei.md
 * @see docs/stories/story-fr-upd-doc-p0-frontend-hidratacao-cache-patch.md — paridade com `extractDocumentosAtivosFromEmpresaResponse` (backend)
 */

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
  'Não foi possível determinar todos os tipos ativos a partir da resposta do emissor. Verifique no painel do emissor.';

/** Paridade com `toBool` no backend `plugnotas-empresa-documentos-ativos.js`. */
export function plugnotasDocumentoAtivoToBool(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'number') return value !== 0;
  const t = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'sim'].includes(t)) return true;
  if (['0', 'false', 'no', 'nao', 'não'].includes(t)) return false;
  return fallback;
}

/**
 * Paridade com `extractDocumentosAtivosFromEmpresaResponse` (backend) — envelopes `data` / `empresa` / `data.empresa`.
 * `null` se inválido ou nenhum tipo ativo.
 */
export function extractDocumentosAtivosFromEmpresaResponse(empresaJson: unknown): DocumentosAtivosState | null {
  try {
    if (!empresaJson || typeof empresaJson !== 'object' || Array.isArray(empresaJson)) {
      return null;
    }
    const root = empresaJson as Record<string, unknown>;
    const candidates: Record<string, unknown>[] = [];
    const push = (obj: unknown) => {
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        candidates.push(obj as Record<string, unknown>);
      }
    };
    push(root);
    push(root.data);
    push(root.empresa);
    const data = root.data;
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      push((data as Record<string, unknown>).empresa);
    }
    const extractFlat = (o: Record<string, unknown>): DocumentosAtivosState | null => {
      const blockAtivo = (key: 'nfse' | 'nfe' | 'nfce') => {
        const block = o[key];
        if (!block || typeof block !== 'object' || Array.isArray(block)) return false;
        return plugnotasDocumentoAtivoToBool((block as Record<string, unknown>).ativo, false);
      };
      const nfse = blockAtivo('nfse');
      const nfe = blockAtivo('nfe');
      const nfce = blockAtivo('nfce');
      if (!nfse && !nfe && !nfce) return null;
      return { nfse, nfe, nfce };
    };
    for (const c of candidates) {
      const sel = extractFlat(c);
      if (sel) return sel;
    }
    return null;
  } catch {
    return null;
  }
}

/** FR-UPD-DOC-04 — remoto (GET parseado) > espelho (certificate/status) > default PRD. */
export function mergeDocumentosAtivosPrecedence(options: {
  remote: DocumentosAtivosState | null;
  mirror: DocumentosAtivosState | null;
  fallback: DocumentosAtivosState;
}): DocumentosAtivosState {
  const { remote, mirror, fallback } = options;
  if (remote) return remote;
  if (mirror) return mirror;
  return fallback;
}

/**
 * FR-UPD-DOC-08 — divergência só quando espelho e remoto são **ambos** conhecidos e tri-boolean difere.
 */
export function documentosAtivosDivergem(
  espelho: DocumentosAtivosState | null,
  remoto: DocumentosAtivosState | null
): boolean {
  if (!espelho || !remoto) return false;
  return espelho.nfse !== remoto.nfse || espelho.nfe !== remoto.nfe || espelho.nfce !== remoto.nfce;
}

export type MapPlugnotasEmpresaDocumentSelectionResult =
  | { kind: 'full'; selection: DocumentosAtivosState }
  | { kind: 'partial'; message: string };

/**
 * Hidrata checkboxes a partir do GET empresa — usa o mesmo extract que o backend (incl. envelopes).
 */
export function mapPlugnotasEmpresaToDocumentSelection(
  apiResponse: unknown
): MapPlugnotasEmpresaDocumentSelectionResult {
  const selection = extractDocumentosAtivosFromEmpresaResponse(apiResponse);
  if (selection) {
    return { kind: 'full', selection };
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

/**
 * FR-GUIA-FISC-14 D2 — monta `documentosAtivos` para PATCH após GET empresa (mantém modalidades actuais e activa o alvo).
 * @see `PATCH /mei-notas/setup/emissao-fiscal/empresa` com `documentosAtivos` (ADR-plugnotas-empresa + complemento documentos activos)
 */
export function buildDocumentosAtivosSolicitacaoModalidade(
  consultarEmpresaApiResponse: unknown,
  target: 'NFE' | 'NFCE'
): DocumentosAtivosState {
  const parsed = extractDocumentosAtivosFromEmpresaResponse(consultarEmpresaApiResponse);
  const base = parsed ?? DEFAULT_DOCUMENTOS_ATIVOS;
  if (target === 'NFE') {
    return { nfse: base.nfse, nfe: true, nfce: base.nfce };
  }
  return { nfse: base.nfse, nfe: base.nfe, nfce: true };
}
