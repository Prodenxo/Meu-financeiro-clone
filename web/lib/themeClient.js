'use client';

import { useSyncExternalStore } from 'react';
import { THEME_COOKIE, normalizeThemePref } from './theme';

const EVENT = 'mf-theme-change';
const MQ = '(prefers-color-scheme: dark)';

function systemTheme() {
  return typeof window !== 'undefined' && window.matchMedia(MQ).matches ? 'dark' : 'light';
}

export function readThemePref() {
  if (typeof document === 'undefined') return 'light';
  return normalizeThemePref(document.documentElement.getAttribute('data-theme-pref'));
}

export function resolveTheme(pref) {
  return pref === 'system' ? systemTheme() : pref === 'dark' ? 'dark' : 'light';
}

/** Aplica no <html>, grava o cookie (o servidor renderiza já no tema certo) e avisa os outros componentes. */
export function setThemePref(value) {
  const pref = normalizeThemePref(value);
  const root = document.documentElement;
  root.setAttribute('data-theme-pref', pref);
  root.setAttribute('data-theme', resolveTheme(pref));
  document.cookie = `${THEME_COOKIE}=${pref}; path=/; max-age=31536000; samesite=lax`;
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(callback) {
  const mq = window.matchMedia(MQ);
  const onSystem = () => {
    if (readThemePref() === 'system') {
      document.documentElement.setAttribute('data-theme', systemTheme());
    }
    callback();
  };
  window.addEventListener(EVENT, callback);
  mq.addEventListener('change', onSystem);
  return () => {
    window.removeEventListener(EVENT, callback);
    mq.removeEventListener('change', onSystem);
  };
}

/**
 * Preferência e tema efetivo, sincronizados entre o botão da sidebar e a tela de Configurações.
 * `initialPref` vem do servidor (cookie) para a hidratação bater com o HTML renderizado.
 */
export function useThemePref(initialPref) {
  const server = normalizeThemePref(initialPref);
  const pref = useSyncExternalStore(subscribe, readThemePref, () => server);
  const resolved = useSyncExternalStore(
    subscribe,
    () => resolveTheme(readThemePref()),
    () => (server === 'dark' ? 'dark' : 'light'),
  );
  return { pref, resolved, setPref: setThemePref };
}
