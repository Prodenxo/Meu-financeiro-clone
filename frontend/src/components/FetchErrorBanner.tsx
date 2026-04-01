interface FetchErrorBannerProps {
  /** Título curto visível e para leitores de ecrã */
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

/**
 * Erro de rede/API com mensagem humana e CTA opcional de repetir (spec UX §5.2).
 */
export default function FetchErrorBanner({
  title = 'Não foi possível carregar os dados',
  message,
  onRetry,
  retryLabel = 'Tentar novamente',
  className = '',
}: FetchErrorBannerProps) {
  return (
    <div
      role="alert"
      className={`mb-4 rounded-xl border border-rose-200/90 bg-rose-50/95 px-4 py-3 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-100 ${className}`.trim()}
    >
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mt-1 text-sm opacity-90">{message}</p>
      {onRetry ? (
        <button type="button" className="planner-button mt-3" onClick={onRetry}>
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}
