import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Grid3X3, X } from 'lucide-react';
import Header from './Header';
import Sidebar from './Sidebar';
import BottomNavigation from '../components/BottomNavigation';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { displayName } = useAuthStore();
  const { isDarkMode } = useThemeStore();
  const location = useLocation();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [quickLinksOpen, setQuickLinksOpen] = useState(false);

  useEffect(() => {
    setQuickLinksOpen(false);
  }, [location.pathname]);

  return (
    <div
      className={`min-h-screen flex flex-col ${
        isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      <Header
        userName={displayName}
        sidebarExpanded={sidebarExpanded}
        onToggleSidebar={() => setSidebarExpanded((prev) => !prev)}
      />
      <Sidebar expanded={sidebarExpanded} />
      <main
        className={`flex-1 w-full overflow-y-auto px-2 md:px-4 pt-20 pb-24 md:pb-6 transition-[padding] duration-200 ${
          sidebarExpanded ? 'md:pl-60' : 'md:pl-24'
        }`}
      >
        {children}
      </main>
      <div className="fixed bottom-20 left-4 z-40 md:hidden">
        {quickLinksOpen && (
          <div
            className={`mb-2 rounded-xl border shadow-lg p-2 flex flex-col gap-2 ${
              isDarkMode
                ? 'bg-slate-900 border-slate-700'
                : 'bg-white border-slate-200'
            }`}
          >
            <span className="px-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
              Atalhos rápidos
            </span>
            <Link to="/agenda" className="planner-button-secondary-compact">
              Agenda
            </Link>
            <Link to="/guias-mei" className="planner-button-secondary-compact">
              Meu MEI
            </Link>
          </div>
        )}
        <button
          type="button"
          onClick={() => setQuickLinksOpen((prev) => !prev)}
          className="h-11 px-4 rounded-full bg-blue-700 text-white shadow-lg flex items-center gap-2 font-semibold text-sm"
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