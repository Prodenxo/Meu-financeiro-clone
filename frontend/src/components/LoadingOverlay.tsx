interface LoadingOverlayProps {
  message?: string;
}

export default function LoadingOverlay({ message = 'Carregando...' }: LoadingOverlayProps) {
  return (
    <div className="relative w-full min-h-[120px] flex items-center justify-center rounded-xl bg-white/70 dark:bg-slate-900/50">
      <div className="flex flex-col items-center gap-3">
        <svg
          className="animate-spin h-8 w-8 text-blue-500 dark:text-blue-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </div>
  );
}
