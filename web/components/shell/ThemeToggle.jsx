'use client';

import { useThemePref } from '@/lib/themeClient';
import { Icon } from '@/components/ui/Icon';
import s from './shell.module.css';

/**
 * Atalho claro/escuro da sidebar. Alterna o tema efetivo e grava a preferência explícita;
 * «Automático» continua disponível em Configurações → Aparência.
 */
export function ThemeToggle({ initialTheme }) {
  const { resolved, setPref } = useThemePref(initialTheme);
  const next = resolved === 'dark' ? 'light' : 'dark';

  return (
    <button
      type="button"
      className={s.iconBtn}
      onClick={() => setPref(next)}
      aria-label={next === 'dark' ? 'Ativar modo escuro' : 'Ativar modo claro'}
      title={next === 'dark' ? 'Modo escuro' : 'Modo claro'}
    >
      <Icon name={resolved === 'dark' ? 'sun' : 'moon'} size={16} />
    </button>
  );
}
