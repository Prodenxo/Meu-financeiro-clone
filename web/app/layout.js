import { Inter } from 'next/font/google';
import { cookies } from 'next/headers';
import { THEME_COOKIE, normalizeTheme } from '@/lib/theme';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata = {
  title: {
    default: 'Meu Financeiro',
    template: '%s · Meu Financeiro',
  },
  description: 'Veja como está seu dinheiro neste mês.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f5fa' },
    { media: '(prefers-color-scheme: dark)', color: '#0f0f1c' },
  ],
};

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const theme = normalizeTheme(cookieStore.get(THEME_COOKIE)?.value);

  return (
    <html lang="pt-BR" data-theme={theme} className={inter.variable} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
