import { initialsFromDisplayName } from './settingsProfileUtils';

type SettingsProfileHeaderProps = {
  displayName: string;
  email?: string;
};

export function SettingsProfileHeader({ displayName, email }: SettingsProfileHeaderProps) {
  const initials = initialsFromDisplayName(displayName, email);
  const title = displayName.trim() || 'Sua conta';
  const subtitle = email?.trim();

  return (
    <div className="mb-3 flex items-center gap-2.5 border-b border-slate-200/60 pb-3 dark:border-slate-700/50">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-blue-500/60 bg-blue-500/10 text-xs font-extrabold text-blue-600 dark:text-blue-300"
        aria-hidden
      >
        {initials}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{title}</p>
        {subtitle ? (
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}
