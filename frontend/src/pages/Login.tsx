import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import AuthLayout from '../components/AuthLayout';
import ButtonSpinner from '../components/ButtonSpinner';
import { getConviteTokenFromSearch } from '../utils/registerInviteQuery';
import { acceptInviteRequest } from '../services/invitesService';
import { toast } from '../lib/toast';

export default function Login() {
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const signIn = useAuthStore((state) => state.signIn);
  const initAuth = useAuthStore((state) => state.initAuth);
  const navigate = useNavigate();

  const inviteRaw = getConviteTokenFromSearch(location.search);
  const hasInviteQuery = inviteRaw.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);

      // Tentar capturar o token diretamente da URL para evitar problemas de estado
      const tokenFromUrl = getConviteTokenFromSearch(location.search);
      
      if (tokenFromUrl) {
        try {
          await acceptInviteRequest({ token: tokenFromUrl, mei: false });
          await initAuth(); // Recarregar permissões e empresa
          toast.success('Convite aceito! Você foi vinculado à empresa.');
        } catch (inviteErr: any) {
          console.error('[Login] Erro ao aceitar convite:', inviteErr);
          toast.warning('Você entrou, mas não foi possível concluir o vínculo do convite automaticamente.');
        }
      }

      navigate('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err ?? '');
      if (msg === 'Failed to fetch' || msg.includes('NetworkError')) {
        const isVercelPreview = typeof window !== 'undefined' && /\.vercel\.app$/.test(window.location?.hostname ?? '');
        setError(
          isVercelPreview
            ? 'Não foi possível conectar ao servidor. Em preview na Vercel, confira se VITE_API_URL está definida (Production e Preview) e se o backend permite a origem em CORS.'
            : 'Não foi possível conectar ao servidor. Verifique se o backend está rodando (na pasta backend: npm run dev) e se a URL da API está correta.'
        );
      } else if (msg.includes('405') || /method not allowed/i.test(msg)) {
        setError(
          'O servidor recusou o login (erro 405). Em desenvolvimento, use o proxy: não defina VITE_API_URL no .env do frontend e rode o backend em http://localhost:3333.'
        );
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Bem-vindo de volta"
      subtitle="Faça login para acessar sua conta"
      showIllustration
      footer={
        <>
          Ao clicar em Entrar, você concorda com nossa{' '}
          <span className="underline cursor-pointer">Política de Privacidade</span>.
        </>
      }
    >
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
              <div className="admin-alert admin-alert-danger px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full planner-button py-3 mt-1 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <ButtonSpinner size={18} />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>
    </AuthLayout>
  );
}