import type { UserFacingErrorProps } from '../types/userFacingError';
import type { MeiFiscalUserCopy } from './fiscalUserError';
import {
  FISCAL_ERROR_LONG_THRESHOLD,
  isLikelyUserFacingFiscalValidationMessage,
  looksLikeOpaqueApiPayload,
  MEI_FISCAL_ERROR_FALLBACK_DESCRIPTION,
  MEI_FISCAL_GATEWAY_SOURCE_FOOTNOTE,
} from './fiscalUserError';

export type MeiFiscalUserFacingOptions = {
  variant: UserFacingErrorProps['variant'];
  /** Mensagem bruta da API / exceção (para detalhe colapsável quando aplicável). */
  rawMessage: string;
  /** Código estável (prioridade em mapMeiFiscalErrorToCopy) — reservado para analytics / extensões. */
  plugnotasCode?: string | null;
  className?: string;
  titleId?: string;
  /**
   * `false`: não preencher `technicalDetail` (ex.: painel Guia MEI que mantém {@link LongFiscalErrorMessage}).
   * `true` (defeito): agrega texto bruto no bloco unificado quando fizer sentido.
   */
  embedRawAsTechnicalDetail?: boolean;
};

function normalizeOneLine(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function pickFiscalTechnicalDetail(
  copy: MeiFiscalUserCopy,
  raw: string,
  displayDescription: string
): string | null {
  if (!raw.trim()) return null;
  if (looksLikeOpaqueApiPayload(raw)) return raw;
  const descNorm = normalizeOneLine(displayDescription);
  const rawNorm = normalizeOneLine(raw);
  if (rawNorm === descNorm) return null;
  if (
    copy.description === MEI_FISCAL_ERROR_FALLBACK_DESCRIPTION &&
    rawNorm !== descNorm &&
    raw.length >= FISCAL_ERROR_LONG_THRESHOLD
  ) {
    return raw;
  }
  if (raw.length >= FISCAL_ERROR_LONG_THRESHOLD) return raw;
  if (
    isLikelyUserFacingFiscalValidationMessage(raw) &&
    !descNorm.includes(rawNorm.slice(0, Math.min(60, rawNorm.length)))
  ) {
    return raw;
  }
  return null;
}

/**
 * Converte {@link MeiFiscalUserCopy} para {@link UserFacingErrorProps} (provedor fiscal + fonte UX §3.1).
 * FR-ERR-P0-C / arquitetura §3.2.
 */
export function meiFiscalUserCopyToUserFacing(
  copy: MeiFiscalUserCopy,
  options: MeiFiscalUserFacingOptions
): UserFacingErrorProps {
  void options.plugnotasCode;
  const embed = options.embedRawAsTechnicalDetail !== false;
  const raw = (options.rawMessage || '').trim();
  const rawTrim = raw.trim();
  const isGatewayUpstream = copy.gatewayUpstream === true;
  const useRawInsteadOfFallback =
    copy.description === MEI_FISCAL_ERROR_FALLBACK_DESCRIPTION &&
    rawTrim.length > 0 &&
    rawTrim.length < FISCAL_ERROR_LONG_THRESHOLD &&
    !looksLikeOpaqueApiPayload(rawTrim) &&
    !/^err_[a-z0-9_]+/i.test(rawTrim);

  const title = copy.title.trim() || 'Operação fiscal';
  const description = (
    useRawInsteadOfFallback
      ? normalizeOneLine(rawTrim)
      : copy.description.trim() || MEI_FISCAL_ERROR_FALLBACK_DESCRIPTION
  ).trim();

  const technicalDetail =
    isGatewayUpstream || !embed ? null : pickFiscalTechnicalDetail(copy, raw, description);

  const secondaryAction = copy.href
    ? {
        label: copy.actionLabel || 'Documentação',
        href: copy.href,
        secondary: true as const,
      }
    : null;

  return {
    variant: options.variant,
    category: 'provedor_fiscal',
    source: 'provedor_fiscal',
    severity: 'error',
    recoverable: true,
    title,
    description,
    technicalDetail,
    primaryAction: null,
    secondaryAction,
    showCopyForSupport: technicalDetail ? true : undefined,
    className: options.className,
    titleId: options.titleId,
    sourceFootnote: isGatewayUpstream ? MEI_FISCAL_GATEWAY_SOURCE_FOOTNOTE : undefined,
  };
}
