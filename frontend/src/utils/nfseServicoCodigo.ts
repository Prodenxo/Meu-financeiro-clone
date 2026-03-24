/**
 * Paridade com o backend (`mei-notas.service.js`, Story 6.5):
 * comprimento medido só com caracteres alfanuméricos ASCII após remover máscara.
 * @see docs/prd/PRD-nfse-servico-codigo-validacao-minima.md
 */
export const NFSE_SERVICO_CODIGO_MIN_LENGTH = 6;

export function normalizeNfseServicoCodigoForLength(raw: string): string {
  return String(raw ?? '').replace(/[^0-9A-Za-z]/g, '');
}

/**
 * Se `codigo` tiver texto (após trim), valida o mínimo; vazio delega a “campo obrigatório” no formulário.
 */
export function getNfseServicoCodigoValidationError(codigo: string | undefined | null): string | null {
  const trimmed = String(codigo ?? '').trim();
  if (!trimmed) return null;
  if (normalizeNfseServicoCodigoForLength(trimmed).length >= NFSE_SERVICO_CODIGO_MIN_LENGTH) return null;
  return `Código do serviço precisa ter pelo menos ${NFSE_SERVICO_CODIGO_MIN_LENGTH} caracteres alfanuméricos após remover máscaras (pontos, traços etc.). Use o código válido da lista de serviços do seu município.`;
}
