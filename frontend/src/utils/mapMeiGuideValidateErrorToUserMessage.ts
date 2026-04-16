import {
  getApiErrorCodeFromUnknownError,
  getHttpStatusFromUnknownError
} from './apiClientError';

/** Espelha `backend/src/constants/mei-guide-error-codes.js`. */
export const MEI_GUIDE_SERPRO_UNAVAILABLE = 'MEI_GUIDE_SERPRO_UNAVAILABLE';

/** UX spec §6.2 — CONS-C (validação guia / Serpro). */
export const MEI_GUIDE_VALIDATE_CONS_C_TITLE = 'Validação do guia (Receita Federal)';

export const MEI_GUIDE_VALIDATE_CONS_C_BODY =
  'Não foi possível validar o CNPJ com a Receita Federal neste momento. Tente de novo em alguns minutos. Este passo não é o cadastro da empresa no emissor fiscal.';

/**
 * Fallback (2026-04): `POST /mei-guide/validate` ainda pode devolver 400 + mensagem genérica
 * até o BFF mapear 5xx Serpro para 503 + `errors.code`. Quando só existir 503+code, o ramo
 * `isLegacyGenericInternalServerError` pode ser removido.
 */
function isLegacyGenericInternalServerError(httpStatus: number | null, message: string): boolean {
  if (httpStatus !== 400) return false;
  const head = message.trim().split('\n')[0]?.trim().toLowerCase() ?? '';
  return head === 'internal server error' || head.startsWith('internal server error');
}

function shouldShowRawTechnicalDetail(httpStatus: number | null, rawMessage: string): boolean {
  return isLegacyGenericInternalServerError(httpStatus, rawMessage);
}

export type MeiGuideValidateMappedError =
  | {
      variant: 'cons-c';
      title: string;
      body: string;
      rawDetail?: string;
    }
  | { variant: 'plain'; message: string };

/** Mapeia erro do `validateMeiGuide` para copy CONS-C (spec UX §6) ou mensagem simples. */
export function mapMeiGuideValidateErrorToUserMessage(err: unknown): MeiGuideValidateMappedError {
  const httpStatus = getHttpStatusFromUnknownError(err);
  const apiCode = getApiErrorCodeFromUnknownError(err);
  const rawMessage = err instanceof Error ? err.message : String(err ?? '');

  const isConsC =
    httpStatus === 503 ||
    httpStatus === 502 ||
    apiCode === MEI_GUIDE_SERPRO_UNAVAILABLE ||
    isLegacyGenericInternalServerError(httpStatus, rawMessage);

  if (isConsC) {
    return {
      variant: 'cons-c',
      title: MEI_GUIDE_VALIDATE_CONS_C_TITLE,
      body: MEI_GUIDE_VALIDATE_CONS_C_BODY,
      rawDetail: shouldShowRawTechnicalDetail(httpStatus, rawMessage) ? rawMessage : undefined
    };
  }

  return {
    variant: 'plain',
    message: rawMessage.trim() || 'Erro ao validar CNPJ.'
  };
}
