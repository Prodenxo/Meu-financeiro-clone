'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';

const ShellNavContext = createContext({ open: false, openNav: () => {}, closeNav: () => {} });

/** Estado do menu lateral no celular (drawer). Fecha ao navegar e com Esc. */
export function ShellNavProvider({ children }) {
  // Guarda a rota em que o menu foi aberto: ao navegar, `open` vira false sozinho.
  const [openedAt, setOpenedAt] = useState(null);
  const pathname = usePathname();
  const open = openedAt !== null && openedAt === pathname;

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpenedAt(null);
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const openNav = useCallback(() => setOpenedAt(pathname), [pathname]);
  const closeNav = useCallback(() => setOpenedAt(null), []);
  const value = useMemo(() => ({ open, openNav, closeNav }), [open, openNav, closeNav]);

  return <ShellNavContext.Provider value={value}>{children}</ShellNavContext.Provider>;
}

export function useShellNav() {
  return useContext(ShellNavContext);
}
