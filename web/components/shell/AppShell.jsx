import { cookies } from 'next/headers';
import { NAV_FOOTER_ITEMS, NAV_GROUPS, filterNavGroups, getLegacyAppUrl } from '@/lib/nav';
import { canAccessMeiArea } from '@/lib/auth/roles';
import { THEME_COOKIE, normalizeTheme } from '@/lib/theme';
import { signOutAction } from '@/lib/auth/actions';
import { ShellNavProvider } from './ShellNavContext';
import { Sidebar } from './Sidebar';
import { MobileBar } from './MobileBar';
import s from './shell.module.css';

function initialsOf(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'MF';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const ROLE_LABEL = {
  superadmin: 'Superadmin',
  admin: 'Administrador',
  usuario: 'Conta pessoal',
  outsider: 'Convidado',
};

/** Casca do app (Server Component): sidebar + conteúdo. Recebe a sessão já resolvida pelo layout. */
export async function AppShell({ session, children }) {
  const cookieStore = await cookies();
  const theme = normalizeTheme(cookieStore.get(THEME_COOKIE)?.value);
  const showMei = canAccessMeiArea(session.role, session.mei);
  const groups = filterNavGroups(NAV_GROUPS, { showMei });
  const legacyAppUrl = getLegacyAppUrl();

  const profile = {
    name: session.displayName,
    initials: initialsOf(session.displayName),
    workspaceLabel: ROLE_LABEL[session.role] || 'Conta pessoal',
  };

  return (
    <ShellNavProvider>
      <div className={s.shell}>
        <Sidebar
          groups={groups}
          footerItems={NAV_FOOTER_ITEMS}
          legacyAppUrl={legacyAppUrl}
          profile={profile}
          initialTheme={theme}
          signOutAction={signOutAction}
        />
        <div className={s.main}>
          <MobileBar />
          <main className={s.content} id="conteudo">
            {children}
          </main>
        </div>
      </div>
    </ShellNavProvider>
  );
}
