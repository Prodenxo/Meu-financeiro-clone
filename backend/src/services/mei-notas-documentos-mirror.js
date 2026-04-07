import { saveDocumentosAtivosMirror } from './mei-certificate-store.js';
import {
  assertAtLeastOneDocumentoAtivo,
  normalizeDocumentosAtivosShape
} from './plugnotas/plugnotas-empresa-documentos-ativos.js';

/**
 * Espelho Supabase após sucesso Plugnotas (FR-CAD-DOC P1); não falha a resposta HTTP.
 * @param {string|undefined} userId
 * @param {Record<string, unknown>} payload
 * @param {object} [deps] — injeção para testes
 */
export async function persistDocumentosAtivosMirrorAfterEmpresa(userId, payload, deps = {}) {
  const save = deps.saveDocumentosAtivosMirror ?? saveDocumentosAtivosMirror;
  const normalize = deps.normalizeDocumentosAtivosShape ?? normalizeDocumentosAtivosShape;
  const assertOne = deps.assertAtLeastOneDocumentoAtivo ?? assertAtLeastOneDocumentoAtivo;
  if (!userId || !payload || typeof payload !== 'object') return;
  if (!Object.prototype.hasOwnProperty.call(payload, 'documentosAtivos')) return;
  try {
    const selection = normalize(payload.documentosAtivos);
    assertOne(selection);
    await save(userId, selection);
  } catch {
    // deploy parcial ou payload inesperado — não bloquear cadastro fiscal
  }
}
