import { Link, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { Home, List, Grid3x3, Settings, Wallet, LayoutDashboard, FileText } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { hasRole } from '../lib/roles';
import { canAccessMeiArea } from '../lib/meiAccess';

type BottomNavItem = {
  path: string;
  label: string;
  icon: LucideIcon;
  /** Só quando o rótulo curto precisa de contexto extra (ex.: «Mais» → settings). */
  ariaLabel?: string;
};

export default function BottomNavigation() {
  const location = useLocation();
  const { isDarkMode } = useThemeStore();
  const { role, mei } = useAuthStore();
  const showAdminPanel = hasRole(role, ['admin']);
  const showMeiTab = canAccessMeiArea(role, mei);

  const fourthTab: BottomNavItem = showMeiTab
    ? { path: '/guias-mei', label: 'Meu MEI', icon: FileText, ariaLabel: 'Meu MEI — notas e guias' }
    : { path: '/categorias', label: 'Categorias', icon: Grid3x3 };

  const baseNavItems: BottomNavItem[] = [
    { path: '/', label: 'Início', icon: Home },
    { path: '/transacoes', label: 'Transações', icon: List },
    { path: '/orcamentos', label: 'Orçamentos', icon: Wallet },
    fourthTab,
  ];
  const maisItem: BottomNavItem = {
    path: '/settings',
    label: 'Mais',
    icon: Settings,
    ariaLabel: 'Mais — conta, tema e outras opções',
  };
  const adminPanelItem: BottomNavItem = {
    path: '/settings/usuarios-dados',
    label: 'Painel',
    icon: LayoutDashboard,
    ariaLabel: 'Painel Admin',
  };

  const navItems: BottomNavItem[] = showAdminPanel
    ? [...baseNavItems, adminPanelItem, maisItem]
    : [...baseNavItems, maisItem];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    if (path === '/settings/usuarios-dados') {
      return (
        location.pathname === '/settings/usuarios-dados' ||
        location.pathname.startsWith('/settings/usuarios-dados/')
      );
    }
    if (path === '/settings') {
      if (
        location.pathname === '/settings/usuarios-dados' ||
        location.pathname.startsWith('/settings/usuarios-dados/')
      ) {
        return false;
      }
      return location.pathname.startsWith('/settings');
    }
    if (path === '/guias-mei') {
      return location.pathname === '/guias-mei';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav
      aria-label="Navegação principal (mobile)"
      className={`fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur shadow-soft ${
        isDarkMode
          ? 'bg-slate-950/90 border-slate-600'
          : 'bg-white/90 border-slate-200'
      } md:hidden`}
    >
      <div
        className={`grid items-center h-16 ${
          showAdminPanel
            ? 'grid-cols-6 gap-px px-0.5 sm:gap-0.5 sm:px-1'
            : 'grid-cols-5 gap-0 px-1'
        }`}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          const iconSize = showAdminPanel ? 18 : 20;
          const linkTitle = item.ariaLabel ?? item.label;
          return (
            <Link
              key={item.path}
              to={item.path}
              aria-current={active ? 'page' : undefined}
              title={linkTitle}
              {...(item.ariaLabel
                ? { 'aria-label': item.ariaLabel }
                : {})}
              className={`flex min-w-0 flex-col items-center justify-center h-12 rounded-2xl px-0.5 transition-colors ${
                active
                  ? 'text-blue-700 dark:text-blue-100 bg-blue-600/10 dark:bg-blue-500/20'
                  : isDarkMode
                  ? 'text-slate-200'
                  : 'text-slate-600'
              }`}
            >
              <Icon size={iconSize} className="mb-0.5 shrink-0" aria-hidden />
              <span
                className={`w-full truncate text-center font-medium leading-tight ${
                  showAdminPanel ? 'text-[10px] sm:text-xs' : 'text-xs'
                }`}
                title={item.label}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
