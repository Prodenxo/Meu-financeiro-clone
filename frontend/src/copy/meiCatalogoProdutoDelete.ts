import {
  MEI_CATALOGO_DELETE_CATALOG_BODY_PARAGRAPHS,
  MEI_CATALOGO_DELETE_CATALOG_CANCEL_BUTTON,
  MEI_CATALOGO_DELETE_CATALOG_CONFIRM_BUTTON
} from './meiCatalogoDeleteCatalogShared';

/** Copy canónica — UX spec catálogo MEI exclusão §4.2 (variante item), FR-CAT-13. */

export const MEI_CATALOGO_DELETE_PRODUTO_TITLE = 'Excluir item do catálogo?';

export const MEI_CATALOGO_DELETE_PRODUTO_BODY_PARAGRAPHS = MEI_CATALOGO_DELETE_CATALOG_BODY_PARAGRAPHS;

export const MEI_CATALOGO_DELETE_PRODUTO_CONFIRM_BUTTON = MEI_CATALOGO_DELETE_CATALOG_CONFIRM_BUTTON;

export const MEI_CATALOGO_DELETE_PRODUTO_CANCEL_BUTTON = MEI_CATALOGO_DELETE_CATALOG_CANCEL_BUTTON;

export const MEI_CATALOGO_DELETE_PRODUTO_DANGER_HEADING = 'Eliminar do catálogo';

export const MEI_CATALOGO_DELETE_PRODUTO_DANGER_HINT =
  'Remove este registo dos atalhos. Isto não anula notas já emitidas.';

export const MEI_CATALOGO_DELETE_PRODUTO_DANGER_CTA = 'Excluir do catálogo…';

const DISC_SUMMARY_MAX = 56;

/** Resumo: discriminação truncada; código quando existir (UX §4.2). */
export function buildMeiCatalogoDeleteProdutoSummaryLine(
  discriminacao: string | null | undefined,
  codigo: string | null | undefined
): string {
  const disc = (discriminacao || 'Item').trim();
  const short =
    disc.length > DISC_SUMMARY_MAX ? `${disc.slice(0, DISC_SUMMARY_MAX - 1)}…` : disc;
  const cod = (codigo || '').trim();
  return cod ? `${short} · Código: ${cod}` : short;
}
