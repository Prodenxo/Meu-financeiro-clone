import { useEffect, useRef } from 'react';

export type MeiFiscalChangeEmissionTypeDialogProps = {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * Confirmação ao trocar tipo de nota com formulário dirty (UX §5.3).
 */
export function MeiFiscalChangeEmissionTypeDialog({
  open,
  onCancel,
  onConfirm
}: MeiFiscalChangeEmissionTypeDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="mei-fiscal-change-type-title"
        className="max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900"
      >
        <h2 id="mei-fiscal-change-type-title" className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Alterar tipo de nota?
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Os dados preenchidos neste formulário serão limpos. Esta ação não pode ser desfeita.
        </p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            className="planner-button w-full sm:w-auto"
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="planner-button-secondary-compact w-full border-slate-300 text-slate-800 dark:border-slate-600 dark:text-slate-100 sm:w-auto"
            onClick={onConfirm}
          >
            Alterar tipo
          </button>
        </div>
      </div>
    </div>
  );
}
