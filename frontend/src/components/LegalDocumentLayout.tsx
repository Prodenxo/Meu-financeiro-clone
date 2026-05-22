import React from 'react';
import { Link } from 'react-router-dom';

interface LegalDocumentLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export default function LegalDocumentLayout({
  title,
  lastUpdated,
  children,
}: LegalDocumentLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <header className="border-b border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-900/80 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link
            to="/login"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            ← Meu Financeiro
          </Link>
          <p className="text-xs text-slate-500 dark:text-slate-400">Atualizado em {lastUpdated}</p>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-8">{title}</h1>
        <article className="space-y-6 text-slate-700 dark:text-slate-300 text-sm leading-relaxed [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-slate-900 [&_h2]:dark:text-slate-100 [&_h2]:mt-8 [&_h2]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
          {children}
        </article>
        <footer className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400 flex flex-wrap gap-4">
          <Link to="/privacidade" className="hover:underline">
            Política de Privacidade
          </Link>
          <Link to="/termos" className="hover:underline">
            Termos de Uso
          </Link>
          <Link to="/login" className="hover:underline">
            Entrar
          </Link>
        </footer>
      </main>
    </div>
  );
}
