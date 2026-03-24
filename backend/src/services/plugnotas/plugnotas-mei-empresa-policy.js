/**
 * Política MEI / Guia MEI — cadastro empresa Plugnotas (apenas NFS-e).
 * @see docs/adr/ADR-plugnotas-empresa-payload-apenas-nfse.md
 * @see docs/stories/epic-guia-mei-apenas-nfse-prd.md (US-MEI-NFS-01)
 */
export const PLUGNOTAS_MEI_INSCRICAO_ESTADUAL_QUANDO_VAZIA = 'ISENTO';

/**
 * NFS-e Nacional no `POST/PATCH` empresa — chave em `nfse` e default ON (US-MEI-NAT-02).
 * @see docs/adr/ADR-plugnotas-nfse-nacional-empresa-spike.md
 */
export const PLUGNOTAS_NFSE_NACIONAL_PAYLOAD_KEY = 'nacional';
export const PLUGNOTAS_NFSE_NACIONAL_DEFAULT_ON = true;
