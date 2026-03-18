import React from 'react';

interface PageTitleProps {
  children: React.ReactNode;
  subtitle?: React.ReactNode;
  className?: string;
}

/**
 * Título principal da página (h1) com estilo consistente.
 */
export default function PageTitle({ children, subtitle, className = '' }: PageTitleProps) {
  return (
    <header className={className.trim()}>
      <h1 className="admin-hero-title text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
        {children}
      </h1>
      {subtitle != null && (
        <p className="admin-hero-subtitle mt-1">{subtitle}</p>
      )}
    </header>
  );
}
