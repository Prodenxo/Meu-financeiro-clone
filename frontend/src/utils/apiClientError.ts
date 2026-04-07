import type { ApiErrorPayload } from './buildApiErrorMessage';
import { getPlugnotasCodeFromApiErrors } from './plugnotasApiErrorCode';

/** Erro HTTP JSON da API (`success: false`) com metadados opcionais para a UI (US-MEI-FISC-03). */
export class ApiClientError extends Error {
  readonly plugnotasCode: string | null;
  readonly payload: ApiErrorPayload | null;

  constructor(
    message: string,
    options?: { plugnotasCode?: string | null; payload?: ApiErrorPayload | null }
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.plugnotasCode = options?.plugnotasCode ?? null;
    this.payload = options?.payload ?? null;
  }
}

export function getPlugnotasCodeFromUnknownError(err: unknown): string | null {
  if (err instanceof ApiClientError) return err.plugnotasCode;
  if (err && typeof err === 'object' && 'plugnotasCode' in err) {
    const v = (err as { plugnotasCode?: unknown }).plugnotasCode;
    return typeof v === 'string' && v.length > 0 ? v : null;
  }
  return null;
}

/** Monta `ApiClientError` a partir do payload JSON de erro já parseado. */
export function apiClientErrorFromPayload(
  payload: { message?: string; errors?: unknown; details?: string } | null | undefined,
  buildMessage: (p: typeof payload) => string
): ApiClientError {
  return new ApiClientError(buildMessage(payload), {
    plugnotasCode: getPlugnotasCodeFromApiErrors(payload?.errors),
    payload: (payload as ApiErrorPayload | null | undefined) ?? null,
  });
}
