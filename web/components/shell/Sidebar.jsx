'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { resolveNavTarget } from '@/lib/nav';
import { useShellNav } from './ShellNavContext';
import { ThemeToggle } from './ThemeToggle';
import { BrandMark } from './BrandMark';
import s from './shell.module.css';

function cx(...names) {
  return names.filter(Boolean).join(' ');
}

function NavItem({ item, legacyAppUrl, active }) {
  const target = resolveNavTarget(item, legacyAppUrl);
  const inner = (
    <>
      <Icon name={item.icon} size={18} className={s.itemIcon} />
      <span className={s.itemLabel}>{item.label}</span>
      {target?.external ? <Icon name="arrow-up-right" size={14} className={s.itemExternal} /> : null}
    </>
  );

  if (!target) {
    return (
      <span
        className={cx(s.item, s.itemDisabled)}
        aria-disabled="true"
        title="Disponível na próxima etapa da migração"
      >
        {inner}
      </span>
    );
  }

  if (target.external) {
    return (
      <a
        href={target.href}
        className={cx(s.item, active && s.itemActive)}
        title={`${item.label} — abre no app atual`}
      >
        {inner}
      </a>
    );
  }

  return (
    <Link href={target.href} className={cx(s.item, active && s.itemActive)} aria-current={active ? 'page' : undefined}>
      {inner}
    </Link>
  );
}

export function Sidebar({ groups, footerItems, legacyAppUrl, profile, initialTheme, signOutAction }) {
  const pathname = usePathname();
  const { open, closeNav } = useShellNav();

  const isActive = (item) => Boolean(item.href) && (pathname === item.href || pathname.startsWith(`${item.href}/`));

  return (
    <>
      <div className={cx(s.backdrop, open && s.backdropOpen)} onClick={closeNav} aria-hidden="true" />
      <aside
        id="app-sidebar"
        className={cx(s.sidebar, open && s.sidebarOpen)}
        aria-label="Navegação principal"
      >
        <button type="button" className={cx(s.iconBtn, s.closeBtn)} onClick={closeNav} aria-label="Fechar menu">
          <Icon name="x" size={18} />
        </button>

        <Link href="/visao-geral" className={s.brand} aria-label="Meu Financeiro — início">
          <span className={s.brandMark}>
            <BrandMark size={18} />
          </span>
          Meu Financeiro
        </Link>

        <div className={s.workspace}>
          <span className={s.workspaceIcon}>
            <Icon name="home" size={16} />
          </span>
          <span className={s.workspaceText}>
            <span className={s.workspaceTitle}>Meu espaço</span>
            <span className={s.workspaceSub}>{profile.workspaceLabel}</span>
          </span>
        </div>

        <nav className={s.nav}>
          {groups.map((group) => (
            <div key={group.id} className={s.group} role="group" aria-labelledby={`nav-group-${group.id}`}>
              <p className={s.groupLabel} id={`nav-group-${group.id}`}>
                {group.label}
              </p>
              {group.items.map((item) => (
                <NavItem key={item.id} item={item} legacyAppUrl={legacyAppUrl} active={isActive(item)} />
              ))}
            </div>
          ))}
        </nav>

        <div className={s.footer}>
          {footerItems.map((item) => (
            <NavItem key={item.id} item={item} legacyAppUrl={legacyAppUrl} active={isActive(item)} />
          ))}
          <div className={s.profile}>
            <span className={s.avatar} aria-hidden="true">
              {profile.initials}
            </span>
            <span className={s.profileName} title={profile.name}>
              {profile.name}
            </span>
            <span className={s.profileActions}>
              <ThemeToggle initialTheme={initialTheme} />
              <form action={signOutAction}>
                <button type="submit" className={s.iconBtn} aria-label="Sair da conta" title="Sair">
                  <Icon name="log-out" size={16} />
                </button>
              </form>
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
