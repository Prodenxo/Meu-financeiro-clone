import { useEffect, useRef } from 'react';

export type GuiaMeiDesativarNfseDialogProps = {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * Confirmação ao desmarcar NFS-e no cadastro do emissor (UX §6.3 / PRD §6.4).
 */
export function GuiaMeiDesativarNfseDialog({
  open,
  onCancel,
  onConfirm
}: GuiaMeiDesativarNfseDialogProps) {
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
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="mei-desativar-nfse-title"
        aria-describedby="mei-desativar-nfse-desc"
        className="max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900"
      >
        <h2 id="mei-desativar-nfse-title" className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Desativar NFS-e?
        </h2>
        <p id="mei-desativar-nfse-desc" className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          A Guia MEI usa NFS-e para serviços. Sem NFS-e ativo no emissor, a emissão de serviços nesta app pode ficar
          bloqueada ou inconsistente com o emissor fiscal.
        </p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            className="planner-button-secondary-compact w-full sm:w-auto"
            onClick={onCancel}
          >
            Manter NFS-e
          </button>
          <button
            type="button"
            className="planner-button w-full border-amber-700/40 bg-amber-50 text-amber-950 hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-100 dark:hover:bg-amber-900/50 sm:w-auto"
            onClick={onConfirm}
          >
            Desativar mesmo assim
          </button>
        </div>
      </div>
    </div>
  );
}
