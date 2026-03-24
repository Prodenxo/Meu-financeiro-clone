import { useDevApiHealthIndicator } from '../hooks/useDevApiHealthIndicator';

/**
 * Selo discreto só em DEV (ou com `VITE_SHOW_API_HEALTH_INDICATOR=true`): alcance de GET /health do backend.
 */
export function DevApiHealthIndicator() {
  const status = useDevApiHealthIndicator();

  if (status === null) {
    return null;
  }

  const label = status === 'checking' ? 'API …' : status === 'online' ? 'API online' : 'API offline';
  const badgeClass = status === 'online'
    ? 'admin-badge-success'
    : status === 'offline'
      ? 'admin-badge-danger'
      : 'admin-badge-neutral';

  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-mono tracking-tight ${badgeClass}`}
      title="Indicador de desenvolvimento: GET /health (foco da janela ou aba visível novamente)."
      aria-live="polite"
    >
      {label}
    </span>
  );
}
