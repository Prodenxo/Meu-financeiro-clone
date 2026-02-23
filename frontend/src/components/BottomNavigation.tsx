import { Link, useLocation } from 'react-router-dom';
import { Home, List, Grid3x3, Settings, Wallet } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';

export default function BottomNavigation() {
  const location = useLocation();
  const { isDarkMode } = useThemeStore();

  const navItems = [
    { path: '/', label: 'Inicio', icon: Home },
    { path: '/transacoes', label: 'Transações', icon: List },
    { path: '/orcamentos', label: 'Orçamentos', icon: Wallet },
    { path: '/categorias', label: 'Categorias', icon: Grid3x3 },
    { path: '/settings', label: 'Mais', icon: Settings },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-50 border-t ${
        isDarkMode
          ? 'bg-slate-900 border-slate-800'
          : 'bg-white border-slate-200'
      } md:hidden`}
    >
      <div className="grid grid-cols-5 items-center h-16 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center h-12 rounded-xl transition-colors ${
                active
                  ? 'text-blue-700 dark:text-blue-300 bg-slate-100 dark:bg-slate-800'
                  : isDarkMode
                  ? 'text-slate-400'
                  : 'text-slate-500'
              }`}
            >
              <Icon size={20} className="mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
