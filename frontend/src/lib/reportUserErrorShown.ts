import type { UserErrorCategory } from '../types/userFacingError';

/** Nome do evento para integrações tipo gtag / dataLayer (sem PII). */
export const USER_ERROR_SHOWN_EVENT = 'error_shown';

export type ReportUserErrorShownPayload = {
  category: UserErrorCategory;
  /** Superfície estável (ex. `transacoes.list`); opcional. */
  surfaceId?: string;
  /** ISO 8601; preenchido pelo reporter se omitido. */
  timestamp?: string;
};

export type UserErrorShownReporter = (payload: ReportUserErrorShownPayload) => void;

let injectedReporter: UserErrorShownReporter | null = null;

/** Para testes ou integração manual (ex. wrapper PostHog). */
export function setUserErrorShownReporter(reporter: UserErrorShownReporter | null): void {
  injectedReporter = reporter;
}

function isAnalyticsEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_USER_ERROR_ANALYTICS === 'true';
}

type GtagFn = (...args: unknown[]) => void;

/** Parâmetros enviados ao `gtag` — em GA4, mapear `event_category` e `surface_id` a *custom dimensions* no painel (ops). */
function forwardToGtag(payload: ReportUserErrorShownPayload): void {
  if (typeof window === 'undefined') return;
  const gtag = (window as unknown as { gtag?: GtagFn }).gtag;
  if (typeof gtag !== 'function') return;

  const params: Record<string, string> = {
    event_category: payload.category,
    timestamp: payload.timestamp ?? new Date().toISOString(),
  };
  if (payload.surfaceId) {
    params.surface_id = payload.surfaceId;
  }
  gtag('event', USER_ERROR_SHOWN_EVENT, params);
}

/**
 * Contabiliza erro mostrado ao utilizador — **apenas** `category` e `surfaceId` opcional.
 * Nunca enviar título, descrição, detalhe técnico ou dados fiscais.
 *
 * **Semântica:** chamado pelo `UserFacingErrorBlock` no `useEffect` quando `analyticsSurfaceId`
 * está definido — típico: uma vez por montagem com essa combinação `(category, analyticsSurfaceId)`;
 * em React 18 Strict Mode (dev) o efeito pode correr duas vezes.
 */
export function reportUserErrorShown(payload: ReportUserErrorShownPayload): void {
  const timestamp = payload.timestamp ?? new Date().toISOString();
  const safe: ReportUserErrorShownPayload = {
    category: payload.category,
    timestamp,
    ...(payload.surfaceId?.trim() ? { surfaceId: payload.surfaceId.trim() } : {}),
  };

  injectedReporter?.(safe);

  if (!isAnalyticsEnabled()) return;
  forwardToGtag(safe);
}
