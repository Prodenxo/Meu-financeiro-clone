import React from 'react';
import { Link } from 'react-router-dom';

const AUTH_ILLUSTRATION_URL =
  'https://ik.imagekit.io/qdohqf5kl/Capa%20-%20financas%20pessoais.png?updatedAt=1749862004209';

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Exibir painel com ilustração à esquerda (desktop). Default true para Login/Register. */
  showIllustration?: boolean;
  /** Largura máxima do card. Default max-w-3xl com ilustração, max-w-md sem. */
  maxWidth?: 'md' | 'lg' | '3xl';
  /** Conteúdo abaixo do formulário (ex.: link "Voltar ao login"). */
  footer?: React.ReactNode;
}

/**
 * Layout compartilhado para páginas de autenticação: card central, painel opcional com ilustração,
 * título, subtítulo e área do formulário. Mesma largura máxima e hierarquia em todas as telas.
 */
export default function AuthLayout({
  title,
  subtitle,
  children,
  showIllustration = true,
  maxWidth = showIllustration ? '3xl' : 'md',
  footer,
}: AuthLayoutProps) {
  const maxWidthClass = maxWidth === 'md' ? 'max-w-md' : maxWidth === 'lg' ? 'max-w-lg' : 'max-w-3xl';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-100 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 p-4">
      <div
        className={`flex w-full ${maxWidthClass} rounded-2xl overflow-hidden shadow-card border border-slate-200/70 dark:border-slate-800/70`}
      >
        {showIllustration && (
          <div className="hidden md:block w-[400px] shrink-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700">
            <img
              src={AUTH_ILLUSTRATION_URL}
              alt="Ilustração Finanças Pessoais"
              className="w-full h-full object-cover min-h-[420px]"
            />
          </div>
        )}
        <div className="flex flex-col justify-center bg-white/90 dark:bg-slate-900/80 backdrop-blur w-full px-8 md:px-10 py-10 md:py-12">
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{title}</h1>
            {subtitle && (
              <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">{subtitle}</p>
            )}
          </div>
          {children}
          {footer != null && (
            <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Link padrão "Voltar ao login" para usar no footer do AuthLayout. */
export function AuthLayoutBackToLogin() {
  return (
    <Link to="/login" className="text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400">
      Voltar ao login
    </Link>
  );
}
