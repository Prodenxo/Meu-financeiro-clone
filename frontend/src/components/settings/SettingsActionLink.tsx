import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';

type SettingsActionLinkProps = {
  title: string;
  description?: string;
  icon: LucideIcon;
  iconClassName?: string;
  onClick?: () => void;
  href?: string;
  external?: boolean;
};

export function SettingsActionLink({
  title,
  description,
  icon: Icon,
  iconClassName = 'text-slate-500 dark:text-slate-400',
  onClick,
  href,
  external,
}: SettingsActionLinkProps) {
  const className = 'settings-link-row';

  const inner = (
    <>
      <Icon className={`h-[18px] w-[18px] shrink-0 ${iconClassName}`} aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-slate-700 dark:text-slate-200">{title}</span>
        {description ? (
          <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{description}</span>
        ) : null}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-400/80" aria-hidden />
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className={className}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
      >
        {inner}
      </a>
    );
  }

  return (
    <button type="button" className={className} onClick={onClick}>
      {inner}
    </button>
  );
}
