import React, { useEffect, useRef } from 'react';

export interface OrcamentoRemovePlanningConfirmDialogProps {
  open: boolean;
  title: string;
  bodyParagraphs: readonly string[];
  summaryLine: string;
  confirmButtonLabel: string;
  cancelButtonLabel: string;
  isDeleting: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onConfirm: () => void;
  /** Pilha acima do modal "Novo Orçamento" (z-50). */
  overlayZIndexClass?: string;
}

/**
 * Confirmação acessível para remover planejamento mensal (Orçamentos).
 * Estrutura alinhada a MeiCatalogoDeleteCatalogConfirmDialog; botão destrutivo em rose (UX spec).
 */
export default function OrcamentoRemovePlanningConfirmDialog({
  open,
  title,
  bodyParagraphs,
  summaryLine,
  confirmButtonLabel,
  cancelButtonLabel,
  isDeleting,
  errorMessage,
  onCancel,
  onConfirm,
  overlayZIndexClass = 'z-[60]'
}: OrcamentoRemovePlanningConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => cancelRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 ${overlayZIndexClass} flex items-center justify-center bg-black/50`}
      onClick={isDeleting ? undefined : onCancel}
      role="presentation"
    >
      <div
        data-testid="orcamento-remove-planning-confirm"
        className="planner-card relative mx-4 max-h-[90vh] w-full max-w-md overflow-y-auto p-6 shadow-xl"
        onClick={(ev) => ev.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && !isDeleting) {
            e.stopPropagation();
            onCancel();
          }
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="orc-remove-planning-title"
        aria-describedby="orc-remove-planning-desc"
      >
        <button
          type="button"
          aria-label="Fechar"
          className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 disabled:opacity-40 dark:text-slate-300 dark:hover:text-slate-100"
          onClick={onCancel}
          disabled={isDeleting}
        >
          ×
        </button>
        <h2 id="orc-remove-planning-title" className="pr-8 text-lg font-bold text-slate-900 dark:text-white">
          {title}
        </h2>
        <div id="orc-remove-planning-desc" className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
          {bodyParagraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          <p className="rounded-lg border border-slate-200/80 bg-slate-50 px-3 py-2 font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100">
            {summaryLine}
          </p>
        </div>
        {errorMessage ? (
          <div
            className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
            role="alert"
          >
            {errorMessage}
          </div>
        ) : null}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            className="planner-button-secondary-compact min-h-[44px] w-full sm:w-auto"
            onClick={onCancel}
            disabled={isDeleting}
          >
            {cancelButtonLabel}
          </button>
          <button
            type="button"
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-rose-600 dark:hover:bg-rose-500 sm:w-auto"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'A remover…' : confirmButtonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
