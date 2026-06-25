import { nfseStatusKeyParaLimite } from './meiLimiteFaturamento';

const NFSE_REJECTION_RPS_DUPLICATE_RE =
  /E0014|dps já existe|dps ja existe|numeração repetida|numeracao repetida|conjunto de série,\s*número|conjunto de serie,\s*numero/i;

/** Oculta rejeições E0014 (numeração repetida) da lista principal. */
export function isHiddenNfseE0014RejectedRecord(
  record: {
    status?: string | null;
    document_type?: string | null;
    response_json?: unknown;
    payload_json?: unknown;
  } | null | undefined,
): boolean {
  if (!record) return false;
  const docType = String(record.document_type || 'NFSE').trim().toUpperCase();
  if (docType && docType !== 'NFSE') return false;
  if (nfseStatusKeyParaLimite(record.status) !== 'rejeitado') return false;
  const meta = record.metadata_json as { nfseRejectionCode?: string } | null | undefined;
  if (meta?.nfseRejectionCode === 'E0014') return true;
  try {
    const text = JSON.stringify({
      response: record.response_json,
      payload: record.payload_json,
    }).toLowerCase();
    return NFSE_REJECTION_RPS_DUPLICATE_RE.test(text) || text.includes('e0014');
  } catch {
    return false;
  }
}
