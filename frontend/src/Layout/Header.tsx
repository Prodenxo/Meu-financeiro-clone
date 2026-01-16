import { Link, useLocation } from 'react-router-dom';
import { useThemeStore } from '../store/themeStore';

interface HeaderProps {
  userName?: string | null;
}

export default function Header({ userName }: HeaderProps) {
  const location = useLocation();
  const { isDarkMode } = useThemeStore();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  const navLinkClass = (path: string) => {
    const baseClasses = "px-3 py-2 rounded-md font-medium transition-all duration-200 relative";
    const activeClasses = "bg-blue-600 text-white shadow-md";
    const inactiveClasses = "text-blue-100 hover:text-white hover:bg-blue-600/50";
    
    return `${baseClasses} ${isActive(path) ? activeClasses : inactiveClasses}`;
  };

  return (
    <header 
      className={`w-full text-white py-3 px-4 md:px-8 flex flex-col md:flex-row items-start md:items-center justify-between shadow-lg fixed top-0 left-0 z-50 border-b ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gradient-to-r from-blue-800 to-blue-700 border-blue-600'}`} 
      style={{
        minHeight: 64, 
        backgroundColor: isDarkMode ? '#111827' : 'rgb(30, 64, 175)',
        opacity: 1,
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        width: '100%'
      }}
    >
      {/* Mobile: Título e saudação */}
      <div className="flex flex-col md:hidden w-full">
        <span className="font-bold text-lg tracking-wide text-white">
          Finanças Pessoais
        </span>
        <span className="text-sm text-blue-100 mt-1">
          Olá, {userName || 'Usuário'}
        </span>
      </div>

      {/* Desktop: Título e navegação */}
      <div className="hidden md:flex items-center gap-8">
        <span className="font-bold text-xl tracking-wide text-blue-50">
          Meu Financeiro
        </span>
        <nav className="flex gap-2 text-sm">
          <Link to="/" className={navLinkClass("/")}>
            Visão Geral
          </Link>
          <Link to="/transacoes" className={navLinkClass("/transacoes")}>
            Transações
          </Link>
          <Link to="/categorias" className={navLinkClass("/categorias")}>
            Categorias
          </Link>
          <Link to="/agenda" className={navLinkClass("/agenda")}>
            Agenda
          </Link>
          <Link to="/settings" className={navLinkClass("/settings")}>
            Configurações
          </Link>
        </nav>
      </div>

      {/* Desktop: Saudação */}
      <div className="hidden md:flex items-center gap-4">
        <span className="text-base text-blue-100 bg-blue-900/30 px-3 py-1 rounded-full">
          Olá, {userName || 'Usuário'}!
        </span>
      </div>
    </header>
  );
}