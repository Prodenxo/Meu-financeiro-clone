import type { UserFacingErrorProps } from '../types/userFacingError';
import { attachAnalyticsSurfaceFromCtx } from './attachAnalyticsSurfaceFromCtx';
import { ApiClientError } from '../utils/apiClientError';
import { buildApiErrorMessage, type ApiErrorPayload } from '../utils/buildApiErrorMessage';
import { looksLikeOpaqueApiPayload } from './fiscalUserError';
import type { MapUserFacingContext } from './userFacingMapContext';
import { USER_ERROR_COPY, USER_ERROR_SECONDARY } from './userErrorCopy';

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

export function mapApiClientErrorToUserFacing(
  err: ApiClientError,
  ctx: MapUserFacingContext
): UserFacingErrorProps {
  const variant = ctx.variant;
  const payload: ApiErrorPayload | null = err.payload ?? ctx.errorPayload ?? null;
  const aggregated =
    payload != null
      ? buildApiErrorMessage(payload)
      : err.message.trim() || 'Erro na requisição';
  const inferred = inferHttpCategoryFromText(aggregated);

  if (err.plugnotasCode) {
    const c = USER_ERROR_COPY.provedor_fiscal;
    const detail =
      aggregated.trim() && aggregated.trim() !== 'Erro na requisição' ? aggregated : null;
    const base: UserFacingErrorProps = {
      variant,
      category: 'provedor_fiscal',
      source: 'provedor_fiscal',
      severity: 'error',
      recoverable: true,
      title: c.title,
      description: c.description,
      technicalDetail: detail,
      primaryAction: null,
      secondaryAction: null,
      titleId: ctx.titleId,
      className: ctx.className,
    };
    return attachAnalyticsSurfaceFromCtx(ctx.surfaceId, withRetry(base, ctx, c.primaryRetry));
  }

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
      technicalDetail:
        aggregated.trim() && !looksLikeOpaqueApiPayload(aggregated) ? aggregated : null,
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
      technicalDetail:
        aggregated.trim() && !looksLikeOpaqueApiPayload(aggregated) ? aggregated : null,
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
      technicalDetail:
        aggregated.trim() && !looksLikeOpaqueApiPayload(aggregated) ? aggregated : null,
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

  const c = USER_ERROR_COPY.validacao_servidor;
  const tech =
    aggregated.trim() === 'Erro na requisição'
      ? null
      : looksLikeOpaqueApiPayload(aggregated)
        ? aggregated
        : aggregated.trim()
          ? aggregated
          : null;

  const base: UserFacingErrorProps = {
    variant,
    category: 'validacao_servidor',
    source: 'backend',
    severity: 'error',
    recoverable: true,
    title: c.title,
    description: c.description,
    technicalDetail: tech,
    primaryAction: null,
    secondaryAction: null,
    titleId: ctx.titleId,
    className: ctx.className,
  };

  return attachAnalyticsSurfaceFromCtx(ctx.surfaceId, withRetry(base, ctx, c.primaryRetry));
}
