import { Link, useLocation } from 'react-router-dom';
import { Home, List, Grid3x3, Calendar, Settings, Wallet, FileText } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Visão Geral', icon: Home },
  { path: '/transacoes', label: 'Transações', icon: List },
  { path: '/orcamentos', label: 'Orçamentos', icon: Wallet },
  { path: '/categorias', label: 'Categorias', icon: Grid3x3 },
  { path: '/agenda', label: 'Agenda', icon: Calendar },
  { path: '/guias-mei', label: 'Meu MEI', icon: FileText },
  { path: '/settings', label: 'Configurações', icon: Settings },
];

interface SidebarProps {
  expanded: boolean;
}

export default function Sidebar({ expanded }: SidebarProps) {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={`hidden md:flex fixed top-16 left-0 h-[calc(100vh-64px)] flex-col bg-white/80 dark:bg-slate-950/80 border-r border-slate-200/60 dark:border-slate-800/70 py-6 shadow-soft backdrop-blur transition-all ${
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
            className={`flex h-12 items-center rounded-xl text-slate-600 dark:text-slate-300 transition ${
              active
                ? 'bg-blue-600 text-white shadow-soft ring-1 ring-blue-500/40'
                : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
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
