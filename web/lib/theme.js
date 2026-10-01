/**
 * Tema persistido em cookie. A preferência pode ser `light`, `dark` ou `system`
 * (= acompanha o dispositivo, como no `themeStore` do Expo).
 * O servidor renderiza `data-theme` já resolvido quando a preferência é explícita; em
 * `system` um script inline no <head> aplica o tema do dispositivo antes da primeira pintura.
 */
export const THEME_COOKIE = 'mf-theme';

export const THEME_PREFS = ['light', 'dark', 'system'];
export const THEMES = ['light', 'dark'];

export function normalizeThemePref(value) {
  return THEME_PREFS.includes(value) ? value : 'light';
}

/** Tema efetivo que o servidor consegue garantir (sem acesso ao `prefers-color-scheme`). */
export function resolveServerTheme(pref) {
  const p = normalizeThemePref(pref);
  return p === 'dark' ? 'dark' : 'light';
}

/** Script inline (sem dependências) que corrige `data-theme` quando a preferência é `system`. */
export const THEME_BOOT_SCRIPT = `(function(){try{var d=document.documentElement;if(d.getAttribute('data-theme-pref')==='system'){d.setAttribute('data-theme',window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');}}catch(e){}})();`;
