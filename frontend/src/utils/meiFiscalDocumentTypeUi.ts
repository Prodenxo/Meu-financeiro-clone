/**
 * Rótulos e classes de badge para `document_type` em listagens fiscais (Guia MEI).
 * Valores normalizados alinhados ao backend: NFSE, NFE, NFCE, CTE.
 */

export type MeiFiscalListDocumentFilter = 'all' | 'NFSE' | 'NFE' | 'NFCE';

const DOC_UPPER = (raw: string | null | undefined) => String(raw || '').trim().toUpperCase();

/**
 * Código interno para estilo; vazio/null tratado como legado (exibir como neutro).
 */
export function normalizeMeiFiscalDocumentType(
  raw: string | null | undefined
): 'NFSE' | 'NFE' | 'NFCE' | 'CTE' | 'UNKNOWN' {
  const u = DOC_UPPER(raw);
  if (u === 'NFSE') return 'NFSE';
  if (u === 'NFE') return 'NFE';
  if (u === 'NFCE') return 'NFCE';
  if (u === 'CTE') return 'CTE';
  if (!u) return 'UNKNOWN';
  return 'UNKNOWN';
}

/** Rótulo curto para utilizador (PT-BR). */
export function meiFiscalDocumentTypeShortLabel(raw: string | null | undefined): string {
  const code = normalizeMeiFiscalDocumentType(raw);
  if (code === 'NFSE') return 'NFS-e';
  if (code === 'NFE') return 'NF-e';
  if (code === 'NFCE') return 'NFC-e';
  if (code === 'CTE') return 'CT-e';
  return '—';
}

/** Classe Tailwind para badge (admin-badge-*). */
export function meiFiscalDocumentTypeBadgeClass(raw: string | null | undefined): string {
  const code = normalizeMeiFiscalDocumentType(raw);
  if (code === 'NFSE') return 'admin-badge-primary';
  if (code === 'NFE') return 'admin-badge-warning';
  if (code === 'NFCE') return 'admin-badge-success';
  if (code === 'CTE') return 'admin-badge-neutral';
  return 'admin-badge-neutral';
}

/** Rótulo do filtro da lista (select). Alinhado a UX §7.3 (guia MEI). */
export function meiFiscalListFilterEmptyMessage(filter: MeiFiscalListDocumentFilter): string {
  if (filter === 'NFSE' || filter === 'NFE' || filter === 'NFCE') {
    return 'Não há notas deste tipo no período visível.';
  }
  return 'Nenhuma nota corresponde aos filtros atuais.';
}

export const MEI_CATALOG_DOC_FILTER_OPTIONS: { value: MeiFiscalListDocumentFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'NFSE', label: 'NFS-e' },
  { value: 'NFE', label: 'NF-e' },
  { value: 'NFCE', label: 'NFC-e' }
];

/** Mensagem de lista vazia no catálogo de serviços/produtos. */
export function meiCatalogListFilterEmptyMessage(filter: MeiFiscalListDocumentFilter): string {
  if (filter === 'NFSE' || filter === 'NFE' || filter === 'NFCE') {
    return `Não há itens de ${meiFiscalDocumentTypeShortLabel(filter)} no catálogo.`;
  }
  return 'Nenhum item no catálogo.';
}
