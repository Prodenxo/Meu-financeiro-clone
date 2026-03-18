import React from 'react';
import { Link } from 'react-router-dom';
import { useThemeStore } from '../store/themeStore';

const APP_VERSION = '1.0.0';

export default function Footer() {
  const { isDarkMode } = useThemeStore();

  return (
    <footer
      className={`w-full border-t py-4 text-xs backdrop-blur flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 ${
        isDarkMode
          ? 'bg-slate-950/80 border-slate-800/70 text-slate-400'
          : 'bg-white/80 border-slate-200/70 text-slate-500'
      }`}
      style={{ minHeight: 56 }}
      role="contentinfo"
      aria-label="Rodapé do site"
    >
      <span>Meu Financeiro v{APP_VERSION}</span>
      <nav className="flex items-center gap-4" aria-label="Links do rodapé">
        <Link
          to="/settings"
          className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
        >
          Configurações
        </Link>
      </nav>
    </footer>
  );
}
