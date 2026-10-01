import { cookies } from 'next/headers';
import { requireUser } from '@/lib/auth/session';
import { checkGoogleAuth } from '@/lib/data/googleCalendar';
import { THEME_COOKIE, normalizeThemePref } from '@/lib/theme';
import { ConfiguracoesView } from '@/components/configuracoes/ConfiguracoesView';

export const metadata = { title: 'Configurações' };
export const dynamic = 'force-dynamic';

export default async function ConfiguracoesPage({ searchParams }) {
  const params = await searchParams;
  const session = await requireUser();
  const cookieStore = await cookies();

  let googleConnected = false;
  let googleError = null;
  try {
    googleConnected = await checkGoogleAuth(session.supabase);
  } catch (error) {
    console.error('Error in configuracoes/checkGoogleAuth:', error);
    googleError = 'Não foi possível verificar a integração com o Google Agenda.';
  }

  const oauthStatus = params?.googleCalendar === 'connected' || params?.googleCalendar === 'error' ? params.googleCalendar : null;

  return (
    <ConfiguracoesView
      profile={{
        displayName: session.displayName,
        rawDisplayName: String(session.user.user_metadata?.display_name || ''),
        phone: String(session.user.user_metadata?.phone || ''),
        email: session.user.email || '',
      }}
      role={session.role}
      google={{ connected: googleConnected, error: googleError, oauthStatus }}
      themePref={normalizeThemePref(cookieStore.get(THEME_COOKIE)?.value)}
    />
  );
}
