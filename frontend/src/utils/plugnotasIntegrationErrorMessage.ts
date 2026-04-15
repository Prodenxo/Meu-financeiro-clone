import { formatMeiFiscalErrorForIntegrations } from '../lib/fiscalUserError';
import type { PlugnotasRequestMeta } from './apiClientError';

/**
 * Mensagem de erro fiscal/Plugnotas para a UI (Guia MEI, alertas longos).
 * Aplica mapeamento UX-GLOBAL-06 + fallbacks; não expor JSON bruto como única saída.
 *
 * Quando o Plugnotas devolve "rota não existe", o problema costuma ser base URL ou token em ambiente errado
 * — ver `mapMeiFiscalErrorToCopy` em `fiscalUserError.ts`.
 */
export function formatPlugnotasIntegrationError(
  message: string,
  plugnotasCode?: string | null,
  httpStatus?: number | null,
  plugnotasRequest?: PlugnotasRequestMeta | null
): string {
  return formatMeiFiscalErrorForIntegrations(
    message,
    plugnotasCode ?? null,
    httpStatus ?? null,
    plugnotasRequest ?? null
  );
}
