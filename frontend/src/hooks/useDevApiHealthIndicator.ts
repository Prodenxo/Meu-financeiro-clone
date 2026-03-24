import { useCallback, useEffect, useRef, useState } from 'react';
import { getBackendHealthCheckUrl } from '../services/apiClient';
import { fetchBackendHealthOk } from '../utils/fetchBackendHealthOk';

const POLL_MS = 25_000;
const FOCUS_DEBOUNCE_MS = 400;

export type DevApiHealthIndicatorStatus = 'checking' | 'online' | 'offline';

/** Ligado em `import.meta.env.DEV` exceto se `VITE_SHOW_API_HEALTH_INDICATOR=false`. Em produção, só com `VITE_SHOW_API_HEALTH_INDICATOR=true`. */
export function isDevApiHealthIndicatorEnabled(): boolean {
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_SHOW_API_HEALTH_INDICATOR !== 'false';
  }
  return import.meta.env.VITE_SHOW_API_HEALTH_INDICATOR === 'true';
}

/**
 * Estado de alcance do GET /health do backend. Retorna `null` quando o indicador está desligado (produção padrão).
 * Polling espaçado + nova verificação ao focar a janela ou quando a aba volta a ficar visível (`visibilitychange`, debounce). Cleanup em unmount.
 */
export function useDevApiHealthIndicator(): DevApiHealthIndicatorStatus | null {
  const enabled = isDevApiHealthIndicatorEnabled();
  const [status, setStatus] = useState<DevApiHealthIndicatorStatus | null>(enabled ? 'checking' : null);
  const mounted = useRef(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runProbe = useCallback(async (mode: 'initial' | 'poll' | 'interactive') => {
    if (!mounted.current) return;
    if (mode === 'initial') {
      setStatus('checking');
    }
    const url = getBackendHealthCheckUrl();
    const ok = await fetchBackendHealthOk(url);
    if (!mounted.current) return;
    setStatus(ok ? 'online' : 'offline');
  }, []);

  useEffect(() => {
    mounted.current = true;
    if (!enabled) {
      setStatus(null);
      return undefined;
    }

    void runProbe('initial');

    const intervalId = setInterval(() => {
      void runProbe('poll');
    }, POLL_MS);

    const scheduleDebouncedProbe = () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        void runProbe('interactive');
      }, FOCUS_DEBOUNCE_MS);
    };

    const onWindowFocus = () => {
      scheduleDebouncedProbe();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      scheduleDebouncedProbe();
    };

    window.addEventListener('focus', onWindowFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      mounted.current = false;
      clearInterval(intervalId);
      window.removeEventListener('focus', onWindowFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [enabled, runProbe]);

  return status;
}
