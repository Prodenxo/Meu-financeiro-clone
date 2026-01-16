import { Link, useLocation } from 'react-router-dom';
import { Home, List, Grid3x3, Calendar, Settings } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';

export default function BottomNavigation() {
  const location = useLocation();
  const { isDarkMode } = useThemeStore();

  const navItems = [
    { path: '/', label: 'Visão Geral', icon: Home },
    { path: '/transacoes', label: 'Transações', icon: List },
    { path: '/categorias', label: 'Categorias', icon: Grid3x3 },
    { path: '/agenda', label: 'Agenda', icon: Calendar },
    { path: '/settings', label: 'Configurações', icon: Settings },
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
          ? 'bg-gray-900 border-gray-700'
          : 'bg-white border-gray-200'
      } md:hidden`}
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                active
                  ? 'text-blue-600 dark:text-blue-400'
                  : isDarkMode
                  ? 'text-gray-400'
                  : 'text-gray-600'
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
