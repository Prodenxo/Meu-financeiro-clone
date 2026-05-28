const STORAGE_KEY = 'mf_google_calendar_oauth';

export type GoogleCalendarOAuthReturnStatus = 'connected' | 'error';

/**
 * Guarda o resultado do OAuth na sessionStorage antes do router redirecionar para /login.
 * Deve rodar de forma síncrona no boot do App (não em useEffect).
 */
export function captureGoogleCalendarReturnFromUrl(): void {
  if (typeof window === 'undefined') return;

  const params = new URLSearchParams(window.location.search);
  const status = params.get('googleCalendar');
  if (status !== 'connected' && status !== 'error') return;

  sessionStorage.setItem(STORAGE_KEY, status);
  params.delete('googleCalendar');
  const nextSearch = params.toString();
  const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}`;
  window.history.replaceState({}, document.title, nextUrl);
}

export function consumeGoogleCalendarOAuthReturn(): GoogleCalendarOAuthReturnStatus | null {
  if (typeof window === 'undefined') return null;

  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(STORAGE_KEY);

  if (raw === 'connected' || raw === 'error') return raw;
  return null;
}

/** URL estável para o redirect pós-Google (localhost e produção). */
export function buildGoogleOAuthReturnTo(): string {
  const { origin, pathname } = window.location;
  if (pathname.startsWith('/configuracoes')) {
    return `${origin}/configuracoes`;
  }
  return `${origin}/settings`;
}
