import React, { useEffect, useRef } from 'react';

/**
 * Diálogo de confirmação de exclusão no catálogo MEI (cliente ou item).
 * Cobre checklist UX §12 (acessibilidade, Esc, duplo submit mitigado no pai + estado isDeleting).
 */
export interface MeiCatalogoDeleteCatalogConfirmDialogProps {
  open: boolean;
  title: string;
  bodyParagraphs: readonly string[];
  summaryLine: string;
  confirmButtonLabel: string;
  cancelButtonLabel: string;
  dataTestId: string;
  titleDomId: string;
  descDomId: string;
  isDeleting: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onConfirm: () => void;
  /** Pilha modal/drawer (ex.: admin NFSe). Default `z-[60]`. */
  overlayZIndexClass?: string;
}

export default function MeiCatalogoDeleteCatalogConfirmDialog({
  open,
  title,
  bodyParagraphs,
  summaryLine,
  confirmButtonLabel,
  cancelButtonLabel,
  dataTestId,
  titleDomId,
  descDomId,
  isDeleting,
  errorMessage,
  onCancel,
  onConfirm,
  overlayZIndexClass = 'z-[60]'
}: MeiCatalogoDeleteCatalogConfirmDialogProps) {
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
        data-testid={dataTestId}
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
        aria-labelledby={titleDomId}
        aria-describedby={descDomId}
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
        <h2 id={titleDomId} className="pr-8 text-lg font-bold text-slate-900 dark:text-white">
          {title}
        </h2>
        <div id={descDomId} className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
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
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-700 dark:hover:bg-red-600 sm:w-auto"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'A eliminar…' : confirmButtonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
