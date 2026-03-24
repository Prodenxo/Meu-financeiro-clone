/** Código estável retornado pelo backend em `errors.plugnotasCode` (US-MEI-FISC-02). */
export const PLUGNOTAS_CODE_CERTIFICADO_409_SEM_ID = 'certificado_409_sem_id' as const;

/**
 * Extrai `plugnotasCode` do objeto `errors` no JSON de erro da API (`success: false`).
 * @param errors — valor de `payload.errors`
 */
export function getPlugnotasCodeFromApiErrors(errors: unknown): string | null {
  if (!errors || typeof errors !== 'object' || Array.isArray(errors)) return null;
  const raw = (errors as Record<string, unknown>).plugnotasCode;
  return typeof raw === 'string' && raw.length > 0 ? raw : null;
}
