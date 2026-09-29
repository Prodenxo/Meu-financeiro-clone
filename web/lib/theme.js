/** Tema claro/escuro persistido em cookie (servidor renderiza já no tema certo, sem flash). */
export const THEME_COOKIE = 'mf-theme';

export const THEMES = ['light', 'dark'];

export function normalizeTheme(value) {
  return THEMES.includes(value) ? value : 'light';
}
