import React from 'react';

interface DataCardProps {
  children: React.ReactNode;
  className?: string;
  /** Use 'muted' for planner-card-muted style, default is planner-card */
  variant?: 'default' | 'muted';
}

/**
 * Card reutilizável para blocos de conteúdo (equivale a planner-card / planner-card-muted).
 */
export default function DataCard({ children, className = '', variant = 'default' }: DataCardProps) {
  const baseClass = variant === 'muted' ? 'planner-card-muted' : 'planner-card';
  return (
    <div className={`${baseClass} ${className}`.trim()}>
      {children}
    </div>
  );
}
