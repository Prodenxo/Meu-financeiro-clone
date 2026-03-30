import {
  MEI_CATALOGO_DELETE_CATALOG_BODY_PARAGRAPHS,
  MEI_CATALOGO_DELETE_CATALOG_CANCEL_BUTTON,
  MEI_CATALOGO_DELETE_CATALOG_CONFIRM_BUTTON
} from './meiCatalogoDeleteCatalogShared';

/** Copy canónica — UX spec catálogo MEI exclusão §4.2, FR-CAT-13. */

export const MEI_CATALOGO_DELETE_CLIENTE_TITLE = 'Excluir cliente do catálogo?';

/** Parágrafos do corpo do diálogo (irreversibilidade + notas não anuladas). */
export const MEI_CATALOGO_DELETE_CLIENTE_BODY_PARAGRAPHS = MEI_CATALOGO_DELETE_CATALOG_BODY_PARAGRAPHS;

export const MEI_CATALOGO_DELETE_CLIENTE_CONFIRM_BUTTON = MEI_CATALOGO_DELETE_CATALOG_CONFIRM_BUTTON;

export const MEI_CATALOGO_DELETE_CLIENTE_CANCEL_BUTTON = MEI_CATALOGO_DELETE_CATALOG_CANCEL_BUTTON;

export const MEI_CATALOGO_DELETE_CLIENTE_DANGER_HEADING = 'Eliminar do catálogo';

export const MEI_CATALOGO_DELETE_CLIENTE_DANGER_HINT =
  'Remove este registo dos atalhos. Isto não anula notas já emitidas.';

export const MEI_CATALOGO_DELETE_CLIENTE_DANGER_CTA = 'Excluir do catálogo…';

/** Linha de resumo: "Cliente: Nome · documento formatado" */
export function buildMeiCatalogoDeleteClienteSummaryLine(nome: string, documentoFormatado: string): string {
  return `Cliente: ${nome} · ${documentoFormatado}`;
}
