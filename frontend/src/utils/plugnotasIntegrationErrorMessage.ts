import { formatMeiFiscalErrorForIntegrations } from '../lib/fiscalUserError';

/**
 * Mensagem de erro fiscal/Plugnotas para a UI (Guia MEI, alertas longos).
 * Aplica mapeamento UX-GLOBAL-06 + fallbacks; não expor JSON bruto como única saída.
 */
export function formatPlugnotasIntegrationError(
  message: string,
  plugnotasCode?: string | null
): string {
  return formatMeiFiscalErrorForIntegrations(message, plugnotasCode ?? null);
}
