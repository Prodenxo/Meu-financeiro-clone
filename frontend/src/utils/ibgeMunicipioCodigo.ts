/**
 * Normaliza código IBGE de município para envio ao Plugnotas (`endereco.codigoCidade`).
 * Semântica espelhada em `backend/src/utils/ibge-municipio-codigo.js` — ver
 * `docs/technical/architecture-plugnotas-empresa-codigo-cidade-ibge-2026-04-08.md` §2.
 *
 * - Saída: apenas dígitos (string). Idempotente em valores já normalizados.
 * - Padding 6→7: **desligado** até exemplo real + teste (PRD §6.2).
 */
export function normalizeIbgeMunicipioCodigo(raw: unknown): string {
  if (raw === null || raw === undefined) {
    return '';
  }
  return String(raw).replace(/\D/g, '');
}
