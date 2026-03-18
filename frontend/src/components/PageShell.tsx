import React from 'react';

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Container padrão para páginas autenticadas (max-width, espaçamento).
 * Equivalente à classe admin-page-shell.
 */
export default function PageShell({ children, className = '' }: PageShellProps) {
  return (
    <div className={`admin-page-shell ${className}`.trim()}>
      {children}
    </div>
  );
}
