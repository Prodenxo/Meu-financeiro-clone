import { useEffect, useId, useState } from 'react';

import type { UserFacingErrorProps } from '../types/userFacingError';
import { reportUserErrorShown } from '../lib/reportUserErrorShown';
import { USER_ERROR_SOURCE_LABEL } from '../lib/userErrorCopy';
import { sanitizeSupportClipboardText } from '../lib/sanitizeSupportClipboardText';

function variantWrapperClass(variant: UserFacingErrorProps['variant'], severity: UserFacingErrorProps['severity']) {
  const rose =
    'rounded-xl border border-rose-200/90 bg-rose-50/95 px-4 py-3 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-100';
  const amber =
    'rounded-xl border border-amber-200/90 bg-amber-50/95 px-4 py-3 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100';
  const baseSeverity = severity === 'warning' ? amber : rose;

  if (variant === 'inline') {
    return `admin-alert ${severity === 'warning' ? 'admin-alert-warning' : 'admin-alert-danger'} px-4 py-3 rounded-lg`;
  }
  if (variant === 'modal_body') {
    return 'rounded-lg border border-rose-300/90 bg-rose-50/90 px-4 py-3 text-rose-950 dark:border-rose-800/60 dark:bg-rose-950/35 dark:text-rose-50';
  }
  return baseSeverity;
}

/**
 * Bloco unificado de erro ao utilizador (spec UX §4.1–§4.3, a11y §7).
 */
export default function UserFacingErrorBlock(props: UserFacingErrorProps) {
  const reactId = useId().replace(/:/g, '');
  const titleId = props.titleId ?? `ufeb-title-${reactId}`;
  const panelId = `${titleId}-details-panel`;
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    const sid = props.analyticsSurfaceId?.trim();
    if (!sid) return;
    reportUserErrorShown({
      category: props.category,
      surfaceId: sid,
    });
  }, [props.category, props.analyticsSurfaceId]);

  const role = props.severity === 'info' ? 'status' : 'alert';
  const sourceLabel =
    props.sourceFootnote?.trim() || USER_ERROR_SOURCE_LABEL[props.source] || '';
  const HeadingTag = props.variant === 'page_banner' ? 'h2' : 'h3';

  async function handleCopySupport() {
    if (typeof props.onCopySupportDetail === 'function') {
      props.onCopySupportDetail();
      return;
    }
    if (!props.showCopyForSupport) return;
    const raw = props.technicalDetail?.trim();
    if (!raw || !navigator.clipboard?.writeText) return;
    await navigator.clipboard.writeText(sanitizeSupportClipboardText(raw));
  }

  /** Cópia: handler explícito, ou sanitização por defeito só com `showCopyForSupport` (opt-in). */
  const showCopy =
    typeof props.onCopySupportDetail === 'function' ||
    (props.showCopyForSupport === true && !!(props.technicalDetail && props.technicalDetail.trim().length > 0));

  return (
    <div
      role={role}
      aria-labelledby={titleId}
      data-category={props.category}
      data-recoverable={props.recoverable ? 'true' : 'false'}
      className={`${variantWrapperClass(props.variant, props.severity)} ${props.variant === 'inline' ? '' : 'mb-4'} ${props.className ?? ''}`.trim()}
    >
      <HeadingTag id={titleId} className="text-sm font-semibold">
        {props.title}
      </HeadingTag>
      <p className="mt-1 text-sm opacity-90 leading-relaxed">{props.description}</p>
      {sourceLabel.trim() ? (
        <p className="mt-2 text-xs opacity-90 leading-relaxed">{sourceLabel}</p>
      ) : null}

      {props.technicalDetail && props.technicalDetail.trim().length > 0 ? (
        <div className="mt-2">
          <button
            type="button"
            className="text-sm font-medium text-rose-800 underline decoration-rose-700/70 hover:decoration-rose-900 dark:text-rose-200 dark:decoration-rose-400/80 min-h-[44px] px-0 text-left lg:min-h-0"
            aria-expanded={detailsOpen}
            aria-controls={panelId}
            onClick={() => setDetailsOpen((o) => !o)}
          >
            {detailsOpen ? 'Ocultar detalhes técnicos' : 'Ver detalhes técnicos'}
          </button>
          {detailsOpen ? (
            <div
              id={panelId}
              className="mt-2 max-h-48 overflow-y-auto rounded-md border border-rose-200/90 bg-white/70 p-3 text-xs font-mono leading-relaxed text-rose-950 shadow-inner dark:border-rose-900/50 dark:bg-slate-950/40 dark:text-rose-100"
            >
              <pre className="whitespace-pre-wrap break-words">{props.technicalDetail}</pre>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {props.primaryAction && (props.primaryAction.onClick || props.primaryAction.href) ? (
          props.primaryAction.href ? (
            <a className="planner-button inline-flex min-h-[44px] items-center justify-center lg:min-h-0" href={props.primaryAction.href}>
              {props.primaryAction.label}
            </a>
          ) : (
            <button type="button" className="planner-button min-h-[44px] lg:min-h-0" onClick={props.primaryAction.onClick}>
              {props.primaryAction.label}
            </button>
          )
        ) : null}
        {props.secondaryAction && (props.secondaryAction.onClick || props.secondaryAction.href) ? (
          props.secondaryAction.href ? (
            <a
              className={`text-sm underline min-h-[44px] inline-flex items-center lg:min-h-0 ${
                props.secondaryAction.secondary
                  ? 'text-rose-800 dark:text-rose-200'
                  : 'font-medium text-rose-900 dark:text-rose-100'
              }`}
              href={props.secondaryAction.href}
            >
              {props.secondaryAction.label}
            </a>
          ) : (
            <button
              type="button"
              className={`text-sm underline min-h-[44px] lg:min-h-0 ${
                props.secondaryAction.secondary ? 'text-rose-800 dark:text-rose-200' : ''
              }`}
              onClick={props.secondaryAction.onClick}
            >
              {props.secondaryAction.label}
            </button>
          )
        ) : null}
      </div>

      {showCopy ? (
        <button
          type="button"
          data-testid="user-facing-copy-support"
          className="mt-2 text-xs font-medium text-rose-800 underline dark:text-rose-300 min-h-[44px] lg:min-h-0"
          onClick={() => void handleCopySupport()}
        >
          Copiar informação para suporte
        </button>
      ) : null}
    </div>
  );
}
