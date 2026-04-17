import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';

interface HeaderProps {
  userName?: string | null;
  sidebarExpanded: boolean;
  onToggleSidebar: () => void;
}

export default function Header({ userName, sidebarExpanded, onToggleSidebar }: HeaderProps) {
  const { isDarkMode } = useThemeStore();

  return (
    <header 
      className={`w-full py-3 px-4 md:px-6 flex flex-col md:flex-row items-start md:items-center justify-between fixed top-0 left-0 z-50 border-b backdrop-blur ${
        isDarkMode
          ? 'bg-slate-950/90 border-slate-700 text-slate-100'
          : 'bg-white/90 border-slate-200 text-slate-900'
      } shadow-soft ${sidebarExpanded ? 'md:pl-52' : 'md:pl-12'}`}
      style={{
        minHeight: 64, 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        width: '100%'
      }}
    >
      {/* Mobile: Título e saudação */}
      <div className="flex flex-col md:hidden w-full">
        <span className={`font-bold text-lg tracking-wide ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          Meu Financeiro
        </span>
        <span className={`text-sm mt-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>
          Olá, {userName || 'Usuário'}
        </span>
      </div>

      {/* Desktop: Título e navegação */}
      <div className="hidden md:flex items-center gap-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className={`h-9 w-9 rounded-full border ${
              isDarkMode
                ? 'border-slate-600 text-slate-100 hover:bg-slate-800/90'
                : 'border-slate-300 text-slate-800 hover:bg-slate-100/90'
            } flex items-center justify-center transition`}
            aria-label={sidebarExpanded ? 'Recolher menu lateral' : 'Expandir menu lateral'}
            title={sidebarExpanded ? 'Recolher menu lateral' : 'Expandir menu lateral'}
          >
            {sidebarExpanded ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
          <span className={`font-bold text-xl tracking-wide ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Meu Financeiro
          </span>
        </div>
        <div />
      </div>

      {/* Desktop: Saudação */}
      <div className="hidden md:flex items-center gap-4">
        <span className={`text-sm px-3 py-1 rounded-full ${
          isDarkMode
            ? 'bg-slate-800/70 text-slate-200'
            : 'bg-slate-100/80 text-slate-600'
        }`}>
          Olá, {userName || 'Usuário'}!
        </span>
      </div>
    </header>
  );
}