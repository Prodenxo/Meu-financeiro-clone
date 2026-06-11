import type { ReactNode } from 'react';

type SettingsSectionCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function SettingsSectionCard({
  title,
  description,
  children,
  className = '',
}: SettingsSectionCardProps) {
  return (
    <section className={['settings-panel', className].filter(Boolean).join(' ')}>
      <h2 className="settings-panel-title">{title}</h2>
      {description ? <p className="settings-panel-desc">{description}</p> : null}
      {children}
    </section>
  );
}
