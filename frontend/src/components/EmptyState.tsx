import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Optional primary CTA (e.g. "Nova transação") */
  action?: React.ReactNode;
  className?: string;
}

/**
 * Estado vazio padronizado: ícone, título, descrição e CTA opcional.
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`admin-empty-state flex flex-col items-center justify-center py-8 md:py-12 ${className}`.trim()}
      role="status"
      aria-label={`${title}. ${description ?? ''}`}
    >
      <Icon
        className="mb-3 text-slate-400 dark:text-slate-500"
        size={48}
        aria-hidden
      />
      <h2 className="text-base font-semibold text-slate-700 dark:text-slate-300">
        {title}
      </h2>
      {description && (
        <p className="mt-1 max-w-sm text-center text-sm text-slate-500 dark:text-slate-400">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
