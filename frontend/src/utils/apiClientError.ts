import type { ApiErrorPayload } from './buildApiErrorMessage';
import type { EmpresaCadastroRuntimeDecision } from '../types/empresaCadastroRuntimeDecision';
import { getPlugnotasCodeFromApiErrors } from './plugnotasApiErrorCode';

export type PlugnotasRequestMeta = {
  method: string;
  path: string;
};

/** Extrai `errors.code` do JSON de erro da API (`success: false`). */
export function getApiErrorCodeFromApiErrors(errors: unknown): string | null {
  if (!errors || typeof errors !== 'object' || Array.isArray(errors)) return null;
  const raw = (errors as Record<string, unknown>).code;
  return typeof raw === 'string' && raw.length > 0 ? raw : null;
}

export function getPlugnotasRequestFromApiErrors(errors: unknown): PlugnotasRequestMeta | null {
  if (!errors || typeof errors !== 'object' || Array.isArray(errors)) return null;
  const raw = (errors as Record<string, unknown>).plugnotasRequest;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const method = typeof (raw as { method?: unknown }).method === 'string'
    ? String((raw as { method?: unknown }).method).trim().toUpperCase()
    : '';
  const path = typeof (raw as { path?: unknown }).path === 'string'
    ? String((raw as { path?: unknown }).path).trim()
    : '';
  if (!method || !path) return null;
  return { method, path };
}

/** Extrai `errors.runtimeDecision` do JSON de erro da API (FR-ALNFB / BFF). */
export function getRuntimeDecisionFromApiErrors(errors: unknown): EmpresaCadastroRuntimeDecision | null {
  if (!errors || typeof errors !== 'object' || Array.isArray(errors)) return null;
  const raw = (errors as Record<string, unknown>).runtimeDecision;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  return raw as EmpresaCadastroRuntimeDecision;
}

/** Erro HTTP JSON da API (`success: false`) com metadados opcionais para a UI (US-MEI-FISC-03). */
export class ApiClientError extends Error {
  readonly plugnotasCode: string | null;
  /** Código estável em `payload.errors.code` (ex.: MEI_GUIDE_SERPRO_UNAVAILABLE). */
  readonly apiErrorCode: string | null;
  readonly plugnotasRequest: PlugnotasRequestMeta | null;
  readonly payload: ApiErrorPayload | null;
  /** Status HTTP da resposta quando o erro veio de JSON `success: false` (mapeamento fiscal / gateway). */
  readonly httpStatus: number | null;
  /** Decisão de runtime BFF (cadastro empresa / Plugnotas). */
  readonly runtimeDecision: EmpresaCadastroRuntimeDecision | null;

  constructor(
    message: string,
    options?: {
      plugnotasCode?: string | null;
      apiErrorCode?: string | null;
      plugnotasRequest?: PlugnotasRequestMeta | null;
      payload?: ApiErrorPayload | null;
      httpStatus?: number | null;
      runtimeDecision?: EmpresaCadastroRuntimeDecision | null;
    }
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.plugnotasCode = options?.plugnotasCode ?? null;
    this.apiErrorCode = options?.apiErrorCode ?? null;
    this.plugnotasRequest = options?.plugnotasRequest ?? null;
    this.payload = options?.payload ?? null;
    this.httpStatus =
      options?.httpStatus != null && Number.isFinite(options.httpStatus)
        ? Number(options.httpStatus)
        : null;
    this.runtimeDecision = options?.runtimeDecision ?? null;
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

export function getPlugnotasRequestFromUnknownError(err: unknown): PlugnotasRequestMeta | null {
  if (err instanceof ApiClientError) return err.plugnotasRequest;
  if (err && typeof err === 'object' && 'plugnotasRequest' in err) {
    return getPlugnotasRequestFromApiErrors({ plugnotasRequest: (err as { plugnotasRequest?: unknown }).plugnotasRequest });
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

export function getApiErrorCodeFromUnknownError(err: unknown): string | null {
  if (err instanceof ApiClientError) return err.apiErrorCode;
  if (err && typeof err === 'object' && 'apiErrorCode' in err) {
    const v = (err as { apiErrorCode?: unknown }).apiErrorCode;
    return typeof v === 'string' && v.length > 0 ? v : null;
  }
  return null;
}

export function getRuntimeDecisionFromUnknownError(err: unknown): EmpresaCadastroRuntimeDecision | null {
  if (err instanceof ApiClientError) return err.runtimeDecision;
  if (err && typeof err === 'object' && 'runtimeDecision' in err) {
    const v = (err as { runtimeDecision?: unknown }).runtimeDecision;
    if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
    return v as EmpresaCadastroRuntimeDecision;
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
    apiErrorCode: getApiErrorCodeFromApiErrors(payload?.errors),
    plugnotasRequest: getPlugnotasRequestFromApiErrors(payload?.errors),
    payload: (payload as ApiErrorPayload | null | undefined) ?? null,
    httpStatus: init?.httpStatus ?? null,
    runtimeDecision: getRuntimeDecisionFromApiErrors(payload?.errors),
  });
}
