import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Grid3X3, X } from 'lucide-react';
import Header from './Header';
import Sidebar from './Sidebar';
import BottomNavigation from '../components/BottomNavigation';
import UpdatesPanel from '../components/UpdatesPanel';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { displayName, mei, role } = useAuthStore();
  const { isDarkMode } = useThemeStore();
  const location = useLocation();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [quickLinksOpen, setQuickLinksOpen] = useState(false);
  const canAccessMeiArea = mei !== false || role === 'superadmin';

  useEffect(() => {
    setQuickLinksOpen(false);
  }, [location.pathname]);

  return (
    <div
      className={`min-h-screen flex flex-col ${
        isDarkMode
          ? 'bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100'
          : 'bg-gradient-to-b from-slate-100 via-slate-100 to-slate-50 text-slate-900'
      }`}
    >
      <Header
        userName={displayName}
        sidebarExpanded={sidebarExpanded}
        onToggleSidebar={() => setSidebarExpanded((prev) => !prev)}
      />
      <Sidebar expanded={sidebarExpanded} />
      <UpdatesPanel />
      <main
        className={`flex-1 w-full overflow-y-auto px-3 md:px-6 pt-24 pb-24 md:pb-6 transition-[padding] duration-200 ${
          sidebarExpanded ? 'md:pl-60' : 'md:pl-24'
        }`}
      >
        {children}
      </main>
      <div className="fixed bottom-20 left-4 z-40 md:hidden">
        {quickLinksOpen && (
          <div className="mb-2 planner-card p-2 flex flex-col gap-2">
            <span className="px-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
              Atalhos rápidos
            </span>
            <Link to="/agenda" className="planner-button-secondary-compact">
              Agenda
            </Link>
            {canAccessMeiArea ? (
              <Link to="/guias-mei" className="planner-button-secondary-compact">
                Meu MEI
              </Link>
            ) : null}
          </div>
        )}
        <button
          type="button"
          onClick={() => setQuickLinksOpen((prev) => !prev)}
          className="planner-button-compact shadow-soft"
          aria-label={quickLinksOpen ? 'Fechar atalhos rápidos' : 'Abrir atalhos rápidos'}
          title={quickLinksOpen ? 'Fechar atalhos rápidos' : 'Abrir atalhos rápidos'}
        >
          {quickLinksOpen ? <X size={16} /> : <Grid3X3 size={16} />}
          <span>Atalhos</span>
        </button>
      </div>
      <BottomNavigation />
    </div>
  );
}