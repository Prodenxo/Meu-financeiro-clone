import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getSupabasePublicEnv } from '@/lib/supabase/env';

/** Telas de entrada: quem já está logado vai para o app. */
const GUEST_ONLY_PATHS = new Set(['/login', '/forgot', '/register', '/solicitar-acesso']);
/** Sempre acessíveis (o link de recuperação cria uma sessão antes de trocar a senha). */
const OPEN_PATHS = new Set(['/reset-password', '/privacidade', '/termos']);

/**
 * Renova a sessão Supabase a cada request e protege as rotas do app.
 * (Next.js 16: `proxy.js` substitui o antigo `middleware.js`.)
 */
export async function proxy(request) {
  const { url, anonKey, configured } = getSupabasePublicEnv();
  const { pathname } = request.nextUrl;

  if (!configured) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims?.sub);

  if (OPEN_PATHS.has(pathname)) {
    return response;
  }

  if (!isAuthenticated && !GUEST_ONLY_PATHS.has(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.search = pathname !== '/' ? `?next=${encodeURIComponent(pathname)}` : '';
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && GUEST_ONLY_PATHS.has(pathname)) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = '/visao-geral';
    homeUrl.search = '';
    return NextResponse.redirect(homeUrl);
  }

  return response;
}

export const config = {
  matcher: [
    // Tudo, menos assets estáticos, imagens, páginas legais (.html/.css) e a rota pública de ícone.
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|api/bank-icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|html|css)$).*)',
  ],
};
