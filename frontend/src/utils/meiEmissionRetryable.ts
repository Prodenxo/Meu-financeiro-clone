import { getHttpStatusFromUnknownError, getPlugnotasCodeFromUnknownError } from './apiClientError';
import { isFetchConnectivityFailure } from './isFetchConnectivityFailure';
import { isPlugnotasGatewayUpstreamCode } from './plugnotasApiErrorCode';

/**
 * FR-GUIA-FISC-13 — erros de emissão onde faz sentido oferecer «Tentar novamente» (novo POST; novo `idIntegracao` no servidor).
 *
 * **Retryable:** HTTP 408, 429; 5xx; código gateway Plugnotas upstream (`plugnotas_gateway_*`); falha de transporte típica de `fetch` (rede) sem resposta HTTP utilizável.
 *
 * **Não retryable (exemplos):** 4xx de validação/negócio (salvo 429); mensagens de regra fiscal sem indicação de indisponibilidade transitória.
 */
export function isMeiEmissionErrorRetryable(error: unknown): boolean {
  const plugCode = getPlugnotasCodeFromUnknownError(error);
  if (isPlugnotasGatewayUpstreamCode(plugCode)) return true;

  const status = getHttpStatusFromUnknownError(error);
  if (status != null) {
    if (status === 429 || status === 408) return true;
    if (status >= 500 && status <= 599) return true;
    return false;
  }

  if (isFetchConnectivityFailure(error)) return true;

  return false;
}
