import type { ApiErrorPayload } from './buildApiErrorMessage';
import { getPlugnotasCodeFromApiErrors } from './plugnotasApiErrorCode';

/** Erro HTTP JSON da API (`success: false`) com metadados opcionais para a UI (US-MEI-FISC-03). */
export class ApiClientError extends Error {
  readonly plugnotasCode: string | null;
  readonly payload: ApiErrorPayload | null;
  /** Status HTTP da resposta quando o erro veio de JSON `success: false` (mapeamento fiscal / gateway). */
  readonly httpStatus: number | null;

  constructor(
    message: string,
    options?: {
      plugnotasCode?: string | null;
      payload?: ApiErrorPayload | null;
      httpStatus?: number | null;
    }
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.plugnotasCode = options?.plugnotasCode ?? null;
    this.payload = options?.payload ?? null;
    this.httpStatus =
      options?.httpStatus != null && Number.isFinite(options.httpStatus)
        ? Number(options.httpStatus)
        : null;
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

export function getHttpStatusFromUnknownError(err: unknown): number | null {
  if (err instanceof ApiClientError) return err.httpStatus;
  if (err && typeof err === 'object' && 'httpStatus' in err) {
    const v = Number((err as { httpStatus?: unknown }).httpStatus);
    return Number.isFinite(v) ? v : null;
  }
  return null;
}

/** Monta `ApiClientError` a partir do payload JSON de erro já parseado. */
export function apiClientErrorFromPayload(
  payload: { message?: string; errors?: unknown; details?: string } | null | undefined,
  buildMessage: (p: typeof payload) => string,
  init?: { httpStatus?: number | null }
): ApiClientError {
  return new ApiClientError(buildMessage(payload), {
    plugnotasCode: getPlugnotasCodeFromApiErrors(payload?.errors),
    payload: (payload as ApiErrorPayload | null | undefined) ?? null,
    httpStatus: init?.httpStatus ?? null,
  });
}
