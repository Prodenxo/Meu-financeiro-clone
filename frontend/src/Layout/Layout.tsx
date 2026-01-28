import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import BottomNavigation from '../components/BottomNavigation';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { displayName } = useAuthStore();
  const { isDarkMode } = useThemeStore();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
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
      <div className="flex-1 flex flex-col" style={{ minHeight: '100vh' }}>
        <main
          className={`flex-1 w-full px-2 md:px-3 pb-20 md:pb-10 overflow-y-auto pt-2 ${
            sidebarExpanded ? 'md:pl-52' : 'md:pl-12'
          }`}
          style={{
            paddingTop: 52, // altura do header mobile (ajustado)
            paddingBottom: 80, // espaço para bottom navigation em mobile
            height: 'calc(100vh - 80px)',
          }}
        >
          <style>{`
            @media (min-width: 768px) {
              main {
                padding-top: 40px !important;
                padding-bottom: 20px !important;
                height: calc(100vh - 40px) !important;
              }
            }
          `}</style>
          {children}
        </main>
      </div>
      <BottomNavigation />
      <style>{`
        header { position: fixed; top: 0; left: 0; right: 0; z-index: 50; }
      `}</style>
    </div>
  );
} 