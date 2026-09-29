'use client';

import { useEffect, useState } from 'react';
import { THEME_COOKIE, normalizeTheme } from '@/lib/theme';
import { Icon } from '@/components/ui/Icon';
import s from './shell.module.css';

/** Alterna claro/escuro: aplica no <html> e grava cookie (servidor renderiza já no tema certo). */
export function ThemeToggle({ initialTheme }) {
  const [theme, setTheme] = useState(normalizeTheme(initialTheme));

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=31536000; samesite=lax`;
  }, [theme]);

  const next = theme === 'dark' ? 'light' : 'dark';
  return (
    <button
      type="button"
      className={s.iconBtn}
      onClick={() => setTheme(next)}
      aria-label={next === 'dark' ? 'Ativar modo escuro' : 'Ativar modo claro'}
      title={next === 'dark' ? 'Modo escuro' : 'Modo claro'}
    >
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
    </button>
  );
}
