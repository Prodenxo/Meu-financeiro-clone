import { Link, useLocation } from 'react-router-dom';
import { Home, List, Grid3x3, Calendar, Settings, Wallet, FileText, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { hasRole } from '../lib/roles';
import { canAccessMeiArea } from '../lib/meiAccess';

interface SidebarProps {
  expanded: boolean;
}

export default function Sidebar({ expanded }: SidebarProps) {
  const location = useLocation();
  const { mei, role } = useAuthStore();
  const showMeiNav = canAccessMeiArea(role, mei);
  const adminPanelItem = {
    path: '/settings/usuarios-dados',
    label: 'Painel Admin',
    icon: LayoutDashboard,
  } as const;

  const navItems = [
    ...(hasRole(role, ['admin']) ? [adminPanelItem] : []),
    { path: '/', label: 'Início', icon: Home },
    { path: '/transacoes', label: 'Transações', icon: List },
    { path: '/orcamentos', label: 'Orçamentos', icon: Wallet },
    { path: '/categorias', label: 'Categorias', icon: Grid3x3 },
    { path: '/agenda', label: 'Agenda', icon: Calendar },
    ...(showMeiNav ? [{ path: '/guias-mei', label: 'Meu MEI', icon: FileText }] : []),
    { path: '/settings', label: 'Configurações', icon: Settings },
  ];

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
    // Configurações: não marcar como ativo na rota do Painel Admin (item dedicado acima).
    if (path === '/settings') {
      if (
        location.pathname === '/settings/usuarios-dados' ||
        location.pathname.startsWith('/settings/usuarios-dados/')
      ) {
        return false;
      }
      return location.pathname === '/settings' || location.pathname.startsWith(`${path}/`);
    }
    // Mei Infinito (/guias-mei): só ativo na rota da guia, não em /mei-catalogo/* (spec CAT-MEI-05 §3.2).
    if (path === '/guias-mei') {
      return location.pathname === '/guias-mei';
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <aside
      className={`hidden md:flex fixed top-16 left-0 h-[calc(100vh-64px)] flex-col bg-white/85 dark:bg-slate-950/90 border-r border-slate-200 dark:border-slate-700 py-6 shadow-soft backdrop-blur transition-all ${
        expanded ? 'w-56 px-3 items-start' : 'w-20 items-center'
      }`}
      aria-label="Menu lateral"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.path);
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex h-12 items-center rounded-xl text-slate-700 dark:text-slate-200 transition ${
              active
                ? 'bg-blue-600 text-white shadow-soft ring-1 ring-blue-500/40'
                : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/70'
            } ${expanded ? 'w-full px-3 gap-3 justify-start' : 'w-12 justify-center'}`}
            aria-label={item.label}
            title={item.label}
          >
            <Icon size={20} />
            {expanded && <span className="text-sm font-semibold">{item.label}</span>}
          </Link>
        );
      })}
    </aside>
  );
}
