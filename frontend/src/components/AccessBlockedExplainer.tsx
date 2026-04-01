import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

export type AccessBlockedExplainerProps = {
  title: string;
  explanation: string;
  nextStep: string;
  primaryCta?: { label: string; to: string };
  dismissLabel?: string;
  onDismiss?: () => void;
  /** Para testes e QA automatizado. */
  testId?: string;
  /** Após redirect de guard, envia foco para a região (WCAG / QA UX-GLOBAL-04). Predefinição: `true`. */
  focusOnMount?: boolean;
};

/**
 * Padrão spec §4.4: título humano, explicação, próximo passo, CTA opcional.
 * `role="status"` + `aria-live="polite"` para leitores de ecrã.
 */
export function AccessBlockedExplainer({
  title,
  explanation,
  nextStep,
  primaryCta,
  dismissLabel = 'Ocultar aviso',
  onDismiss,
  testId,
  focusOnMount = true,
}: AccessBlockedExplainerProps) {
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!focusOnMount) return;
    const el = regionRef.current;
    if (!el) return;
    el.focus({ preventScroll: true });
  }, [focusOnMount]);

  const afterNavigate = () => {
    onDismiss?.();
  };

  return (
    <div
      ref={regionRef}
      data-testid={testId}
      role="status"
      aria-live="polite"
      tabIndex={-1}
      className="mb-4 rounded-xl border border-amber-200/90 bg-amber-50/95 px-4 py-3 text-amber-950 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2 dark:border-amber-900/55 dark:bg-amber-950/35 dark:text-amber-50 dark:focus-visible:ring-amber-400 dark:focus-visible:ring-offset-slate-950"
    >
      <h2 className="text-base font-semibold text-amber-950 dark:text-amber-100">{title}</h2>
      <p className="mt-1 text-sm leading-relaxed text-amber-900/95 dark:text-amber-100/90">
        {explanation}
      </p>
      <p className="mt-2 text-sm font-medium leading-relaxed text-amber-950 dark:text-amber-100">
        {nextStep}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {primaryCta ? (
          <Link
            to={primaryCta.to}
            className="inline-flex items-center rounded-lg bg-amber-800 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-900 dark:bg-amber-600 dark:hover:bg-amber-500"
            onClick={afterNavigate}
          >
            {primaryCta.label}
          </Link>
        ) : null}
        {onDismiss ? (
          <button
            type="button"
            className="inline-flex items-center rounded-lg border border-amber-300/90 bg-white/80 px-3 py-2 text-sm font-medium text-amber-950 transition hover:bg-amber-100/80 dark:border-amber-700 dark:bg-slate-900/40 dark:text-amber-100 dark:hover:bg-slate-800/60"
            onClick={onDismiss}
          >
            {dismissLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
