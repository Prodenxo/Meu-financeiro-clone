import type { UserFacingErrorProps } from '../types/userFacingError';
import { attachAnalyticsSurfaceFromCtx } from './attachAnalyticsSurfaceFromCtx';
import { ApiClientError, getPlugnotasCodeFromUnknownError } from '../utils/apiClientError';
import { isFetchConnectivityFailure } from '../utils/isFetchConnectivityFailure';
import { looksLikeOpaqueApiPayload } from './fiscalUserError';
import { mapApiClientErrorToUserFacing } from './mapApiClientErrorToUserFacing';
import { USER_ERROR_COPY, USER_ERROR_SECONDARY } from './userErrorCopy';
import type { MapUserFacingContext } from './userFacingMapContext';

export type { MapUserFacingContext } from './userFacingMapContext';

function inferHttpCategoryFromText(text: string): 'sessao' | 'permissao' | 'indisponivel' | null {
  if (/\b401\b/.test(text)) return 'sessao';
  if (/\b403\b/.test(text) || /forbidden/i.test(text) || /proibido/i.test(text)) return 'permissao';
  if (/\b50[0-9]\b/.test(text)) return 'indisponivel';
  return null;
}

function withRetry(
  props: UserFacingErrorProps,
  ctx: MapUserFacingContext,
  defaultLabel: string
): UserFacingErrorProps {
  if (!ctx.onRetry) return props;
  if (props.category === 'sessao' || props.category === 'permissao') return props;
  return {
    ...props,
    recoverable: true,
    primaryAction: {
      label: ctx.retryLabel ?? defaultLabel,
      onClick: ctx.onRetry,
    },
  };
}

function plainErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error == null) return '';
  try {
    return String(error);
  } catch {
    return '';
  }
}

/**
 * Pipeline: rede → ApiClientError / plugnotas → heurísticas de mensagem → desconhecido (FR-ERR-B07).
 */
export function mapUnknownErrorToUserFacing(
  error: unknown,
  ctx: MapUserFacingContext
): UserFacingErrorProps {
  void ctx.httpStatus;
  const variant = ctx.variant;

  const coerced: unknown =
    typeof error === 'string' ? (error.length > 0 ? new Error(error) : error) : error;

  if (isFetchConnectivityFailure(coerced)) {
    const c = USER_ERROR_COPY.rede;
    const base: UserFacingErrorProps = {
      variant,
      category: 'rede',
      source: 'network',
      severity: 'error',
      recoverable: true,
      title: c.title,
      description: c.description,
      technicalDetail: null,
      primaryAction: null,
      secondaryAction: null,
      titleId: ctx.titleId,
      className: ctx.className,
    };
    return attachAnalyticsSurfaceFromCtx(ctx.surfaceId, withRetry(base, ctx, c.primaryRetry));
  }

  if (coerced instanceof ApiClientError) {
    return attachAnalyticsSurfaceFromCtx(ctx.surfaceId, mapApiClientErrorToUserFacing(coerced, ctx));
  }

  const plugCode = getPlugnotasCodeFromUnknownError(coerced);
  if (plugCode) {
    const msg = plainErrorMessage(coerced);
    const synthetic = new ApiClientError(msg || 'Erro na requisição', {
      plugnotasCode: plugCode,
      payload: null,
    });
    return attachAnalyticsSurfaceFromCtx(ctx.surfaceId, mapApiClientErrorToUserFacing(synthetic, ctx));
  }

  const msg = plainErrorMessage(coerced);
  const trimmed = msg.trim();

  if (trimmed === 'Erro na requisição') {
    const c = USER_ERROR_COPY.validacao_servidor;
    const base: UserFacingErrorProps = {
      variant,
      category: 'validacao_servidor',
      source: 'backend',
      severity: 'error',
      recoverable: true,
      title: c.title,
      description: c.description,
      technicalDetail: null,
      primaryAction: null,
      secondaryAction: null,
      titleId: ctx.titleId,
      className: ctx.className,
    };
    return attachAnalyticsSurfaceFromCtx(ctx.surfaceId, withRetry(base, ctx, c.primaryRetry));
  }

  if (trimmed && looksLikeOpaqueApiPayload(trimmed)) {
    const c = USER_ERROR_COPY.desconhecido;
    const base: UserFacingErrorProps = {
      variant,
      category: 'desconhecido',
      source: 'backend',
      severity: 'error',
      recoverable: true,
      title: c.title,
      description: c.description,
      technicalDetail: trimmed,
      primaryAction: null,
      secondaryAction: null,
      titleId: ctx.titleId,
      className: ctx.className,
    };
    return attachAnalyticsSurfaceFromCtx(ctx.surfaceId, withRetry(base, ctx, c.primaryRetry));
  }

  const inferred = trimmed ? inferHttpCategoryFromText(trimmed) : null;
  if (inferred === 'sessao') {
    const c = USER_ERROR_COPY.sessao;
    return attachAnalyticsSurfaceFromCtx(ctx.surfaceId, {
      variant,
      category: 'sessao',
      source: 'backend',
      severity: 'warning',
      recoverable: true,
      title: c.title,
      description: c.description,
      technicalDetail: trimmed && !looksLikeOpaqueApiPayload(trimmed) ? trimmed : null,
      primaryAction: { label: c.primaryRetry, href: '/login' },
      secondaryAction: null,
      titleId: ctx.titleId,
      className: ctx.className,
    });
  }
  if (inferred === 'permissao') {
    const c = USER_ERROR_COPY.permissao;
    const base: UserFacingErrorProps = {
      variant,
      category: 'permissao',
      source: 'backend',
      severity: 'error',
      recoverable: true,
      title: c.title,
      description: c.description,
      technicalDetail: trimmed || null,
      primaryAction: { label: c.primaryRetry, href: '/' },
      secondaryAction: null,
      titleId: ctx.titleId,
      className: ctx.className,
    };
    return attachAnalyticsSurfaceFromCtx(ctx.surfaceId, withRetry(base, ctx, c.primaryRetry));
  }
  if (inferred === 'indisponivel') {
    const c = USER_ERROR_COPY.indisponivel;
    const base: UserFacingErrorProps = {
      variant,
      category: 'indisponivel',
      source: 'backend',
      severity: 'error',
      recoverable: true,
      title: c.title,
      description: c.description,
      technicalDetail: trimmed || null,
      primaryAction: null,
      secondaryAction: {
        label: USER_ERROR_SECONDARY.voltarInicio,
        href: '/',
        secondary: true,
      },
      titleId: ctx.titleId,
      className: ctx.className,
    };
    return attachAnalyticsSurfaceFromCtx(ctx.surfaceId, withRetry(base, ctx, c.primaryRetry));
  }

  const c = USER_ERROR_COPY.desconhecido;
  const base: UserFacingErrorProps = {
    variant,
    category: 'desconhecido',
    source: 'app',
    severity: 'error',
    recoverable: true,
    title: c.title,
    description: c.description,
    technicalDetail: trimmed || null,
    primaryAction: null,
    secondaryAction: null,
    titleId: ctx.titleId,
    className: ctx.className,
  };
  return attachAnalyticsSurfaceFromCtx(ctx.surfaceId, withRetry(base, ctx, c.primaryRetry));
}

const TOAST_SUMMARY_MAX_LEN = 200;

/**
 * Uma linha curta para toasts (FR-ERR-P0-D / UX §4.3) — evita `Error.message` cru no snackbar.
 */
export function userFacingToastSummary(error: unknown, fallback: string): string {
  const e =
    error == null || (typeof error === 'string' && !String(error).trim())
      ? new Error(fallback)
      : error;
  const props = mapUnknownErrorToUserFacing(e, { variant: 'toast' });
  const line = `${props.title}: ${props.description}`.replace(/\s+/g, ' ').trim();
  return line.length > TOAST_SUMMARY_MAX_LEN
    ? `${line.slice(0, TOAST_SUMMARY_MAX_LEN - 1)}…`
    : line;
}
