/** Código estável retornado pelo backend em `errors.plugnotasCode` (US-MEI-FISC-02). */
export const PLUGNOTAS_CODE_CERTIFICADO_409_SEM_ID = 'certificado_409_sem_id' as const;

/** Prefixo para indisponibilidade upstream Plugnotas (502/503/504) — FR-MEI-CERT-GW-01. */
export const PLUGNOTAS_GATEWAY_UPSTREAM_PREFIX = 'plugnotas_gateway_' as const;

export function isPlugnotasGatewayUpstreamCode(code: string | null | undefined): boolean {
  const c = code?.trim() || '';
  return c.startsWith(PLUGNOTAS_GATEWAY_UPSTREAM_PREFIX);
}

/**
 * Extrai `plugnotasCode` do objeto `errors` no JSON de erro da API (`success: false`).
 * @param errors — valor de `payload.errors`
 */
export function getPlugnotasCodeFromApiErrors(errors: unknown): string | null {
  if (!errors || typeof errors !== 'object' || Array.isArray(errors)) return null;
  const raw = (errors as Record<string, unknown>).plugnotasCode;
  return typeof raw === 'string' && raw.length > 0 ? raw : null;
}
