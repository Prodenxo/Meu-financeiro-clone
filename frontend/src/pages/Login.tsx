import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const signIn = useAuthStore((state) => state.signIn);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await signIn(email, password);
      navigate('/');
    } catch (err: any) {
      const msg = err?.message ?? '';
      if (msg === 'Failed to fetch' || msg.includes('NetworkError')) {
        setError(
          'Não foi possível conectar ao servidor. Verifique se o backend está rodando (na pasta backend: npm run dev) e se a URL da API está correta.'
        );
      } else if (msg.includes('405') || /method not allowed/i.test(msg)) {
        setError(
          'O servidor recusou o login (erro 405). Em desenvolvimento, use o proxy: não defina VITE_API_URL no .env do frontend e rode o backend em http://localhost:3333.'
        );
      } else {
        setError(msg);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-100 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 p-4">
      {/* Card unificado: ilustração + formulário */}
      <div className="flex w-full max-w-3xl rounded-2xl overflow-hidden shadow-card border border-slate-200/70 dark:border-slate-800/70">
        {/* Painel azul com ilustração */}
        <div className="hidden md:block w-[400px] shrink-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700">
          <img
            src="https://ik.imagekit.io/qdohqf5kl/Capa%20-%20financas%20pessoais.png?updatedAt=1749862004209"
            alt="Ilustração Finanças Pessoais"
            className="w-full h-full object-cover"
          />
        </div>
        {/* Formulário de login */}
        <div className="flex flex-col justify-center bg-white/90 dark:bg-slate-900/80 backdrop-blur w-full px-10 py-12">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Bem-vindo de volta</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Faça login para acessar sua conta</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">E-mail</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="planner-input pr-10"
                  placeholder="seu@email.com"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="planner-input pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="flex justify-end mt-2">
                <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400">
                  Esqueci minha senha
                </Link>
              </div>
            </div>
            {error && (
              <div className="bg-red-50 border border-red-300 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-300 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}
            <button type="submit" className="w-full planner-button py-3 mt-1">
              Entrar
            </button>
          </form>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-8 text-center">
            Ao clicar em Entrar, você concorda com nossa{' '}
            <span className="underline cursor-pointer">Política de Privacidade</span>.
          </p>
        </div>
      </div>
    </div>
  );
}