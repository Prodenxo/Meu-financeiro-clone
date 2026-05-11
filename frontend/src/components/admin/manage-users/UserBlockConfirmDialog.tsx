import { useEffect, useRef } from 'react';
import { Ban, ShieldCheck, X } from 'lucide-react';

export type UserBlockConfirmIntent = 'block' | 'unblock';

interface UserBlockConfirmDialogProps {
  open: boolean;
  intent: UserBlockConfirmIntent;
  /** Nome ou e-mail para contexto (opcional). */
  userLabel: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Confirmação de bloqueio / desbloqueio de usuário (substitui `window.confirm` no painel admin).
 */
export function UserBlockConfirmDialog({
  open,
  intent,
  userLabel,
  loading = false,
  onCancel,
  onConfirm
}: UserBlockConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => cancelRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, loading, onCancel]);

  if (!open) return null;

  const isBlock = intent === 'block';
  const title = isBlock ? 'Bloquear usuário?' : 'Desbloquear usuário?';
  const description = isBlock
    ? 'O usuário não vai conseguir entrar no Meu Financeiro até você desbloquear de novo. Você pode desfazer isso a qualquer momento aqui no painel.'
    : 'O usuário volta a conseguir entrar na plataforma com a conta dele, como antes do bloqueio.';

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
      role="presentation"
    >
      <div
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
        onClick={loading ? undefined : onCancel}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-block-confirm-title"
        aria-describedby="user-block-confirm-desc"
        data-testid="user-block-confirm-dialog"
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/80 dark:bg-slate-900 dark:ring-slate-700 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute right-3 top-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 pt-8">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div
              className={`mx-auto flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl sm:mx-0 ${
                isBlock
                  ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
                  : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
              }`}
              aria-hidden
            >
              {isBlock ? <Ban className="h-7 w-7" strokeWidth={2} /> : <ShieldCheck className="h-7 w-7" strokeWidth={2} />}
            </div>
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <h2
                id="user-block-confirm-title"
                className="text-lg font-bold text-slate-900 dark:text-white"
              >
                {title}
              </h2>
              {userLabel ? (
                <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400 truncate" title={userLabel}>
                  {userLabel}
                </p>
              ) : null}
              <p
                id="user-block-confirm-desc"
                className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300"
              >
                {description}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              ref={cancelRef}
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/80"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`rounded-xl px-4 py-3 text-sm font-bold text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 ${
                isBlock
                  ? 'bg-rose-600 shadow-rose-600/25 hover:bg-rose-700'
                  : 'bg-emerald-600 shadow-emerald-600/25 hover:bg-emerald-700'
              }`}
            >
              {loading ? (isBlock ? 'Bloqueando…' : 'Desbloqueando…') : isBlock ? 'Sim, bloquear' : 'Sim, desbloquear'}
            </button>
          </div>
        </div>

        <div
          className={`h-1 w-full ${isBlock ? 'bg-gradient-to-r from-rose-500 to-rose-600' : 'bg-gradient-to-r from-emerald-500 to-emerald-600'}`}
          aria-hidden
        />
      </div>
    </div>
  );
}
