export function normalizeCodigoNbsInput(value: string): string {
  return String(value || '').replace(/\D/g, '').slice(0, 9);
}

export function isValidCodigoNbs(value: string): boolean {
  const digits = normalizeCodigoNbsInput(value);
  return digits.length === 9 && digits.startsWith('1');
}

export function pickCodigoNbsFromCatalogMetadata(
  metadata?: Record<string, unknown> | null
): string {
  if (!metadata) return '';
  const raw = metadata.codigoNbs ?? metadata.codigo_nbs;
  if (raw === undefined || raw === null) return '';
  return normalizeCodigoNbsInput(String(raw));
}

export function buildCatalogMetadataWithCodigoNbs(
  existing: Record<string, unknown> | null | undefined,
  codigoNbs: string
): Record<string, unknown> | null {
  const digits = normalizeCodigoNbsInput(codigoNbs);
  const base = { ...(existing && typeof existing === 'object' ? existing : {}) };
  delete base.codigo_nbs;
  if (!digits) {
    delete base.codigoNbs;
    return Object.keys(base).length ? base : null;
  }
  return { ...base, codigoNbs: digits };
}
