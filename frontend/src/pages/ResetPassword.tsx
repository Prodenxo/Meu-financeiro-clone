import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getSession } from '../services/authService';

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const updatePassword = useAuthStore((state) => state.updatePassword);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { apiClient } = await import('../services/apiClient')

        // Suporta 2 formatos comuns de link do Supabase:
        // - Implicit: #access_token=...&refresh_token=...&type=recovery
        // - PKCE: ?code=... (às vezes junto com type=recovery)
        const hash = window.location.hash
        const searchParams = new URLSearchParams(window.location.search)

        const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.substring(1) : hash)
        const typeFromHash = hashParams.get('type')
        const accessTokenFromHash = hashParams.get('access_token')
        const refreshTokenFromHash = hashParams.get('refresh_token')

        const typeFromSearch = searchParams.get('type')
        const accessTokenFromSearch = searchParams.get('access_token')
        const refreshTokenFromSearch = searchParams.get('refresh_token')
        const codeFromSearch = searchParams.get('code')

        const type = typeFromHash || typeFromSearch
        const access_token = accessTokenFromHash || accessTokenFromSearch
        const refresh_token = refreshTokenFromHash || refreshTokenFromSearch

        if (codeFromSearch) {
          console.log('Detectado code de recuperação na URL (PKCE), processando...')
          try {
            const result = await apiClient.post<{ session: any }>('/auth/exchange-code-for-session', {
              code: codeFromSearch,
            })

            if (result.session?.access_token) {
              apiClient.setAuthToken({
                access_token: result.session.access_token,
                refresh_token: result.session.refresh_token,
                expires_at: result.session.expires_at,
                user: result.session.user,
              })

              setIsValidSession(true)
              // Limpar URL (hash + query) por segurança
              window.history.replaceState(null, '', window.location.pathname)
              setCheckingSession(false)
              return
            }
          } catch (codeError: any) {
            console.error('Erro ao processar code:', codeError)
            setError('Link inválido ou expirado. Por favor, solicite um novo link de recuperação.')
            setCheckingSession(false)
            return
          }
        }

        if (access_token && type === 'recovery') {
          console.log('Detectado access_token de recuperação na URL, processando...')
          try {
            const result = await apiClient.post<{ session: any }>('/auth/process-recovery-hash', {
              access_token,
              refresh_token,
              type,
            })

            if (result.session?.access_token) {
              apiClient.setAuthToken({
                access_token: result.session.access_token,
                refresh_token: result.session.refresh_token,
                expires_at: result.session.expires_at,
                user: result.session.user,
              })

              setIsValidSession(true)
              // Limpar URL (hash + query) por segurança
              window.history.replaceState(null, '', window.location.pathname)
              setCheckingSession(false)
              return
            }
          } catch (hashError: any) {
            console.error('Erro ao processar tokens:', hashError)
            setError('Link inválido ou expirado. Por favor, solicite um novo link de recuperação.')
            setCheckingSession(false)
            return
          }
        }
        
        // Se não houver hash, verificar sessão existente via API
        const session = await getSession();
        if (session) {
          console.log('Sessão válida encontrada');
          setIsValidSession(true);
        } else {
          setError('Link inválido ou expirado. Por favor, solicite um novo link de recuperação.');
        }
      } catch (err: any) {
        console.error('Erro ao verificar sessão:', err);
        setError('Erro ao verificar o link de recuperação.');
      } finally {
        setCheckingSession(false);
      }
    };

    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      await updatePassword(newPassword);
      navigate('/login', { 
        state: { message: 'Senha redefinida com sucesso! Faça login com sua nova senha.' } 
      });
    } catch (err: any) {
      setError(err.message || 'Erro ao redefinir senha');
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="planner-card px-10 py-12">
          <p className="text-slate-600 dark:text-slate-300">Verificando link...</p>
        </div>
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col justify-center planner-card w-full max-w-md px-10 py-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 text-center">Link inválido</h2>
            <p className="text-slate-600 dark:text-slate-300 text-center mt-2">
              O link de recuperação é inválido ou expirou
            </p>
          </div>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 dark:bg-red-950 dark:border-red-900 dark:text-red-200 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          <button
            onClick={() => navigate('/forgot-password')}
            className="w-full planner-button"
          >
            Solicitar novo link
          </button>
          <div className="mt-4 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-blue-700 dark:text-blue-300 hover:underline"
            >
              Voltar para o login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      {/* Formulário */}
      <div className="flex flex-col justify-center planner-card w-full max-w-md px-10 py-12">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 text-center">Redefinir senha</h2>
          <p className="text-slate-600 dark:text-slate-300 text-center mt-2">
            Digite sua nova senha abaixo
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Nova Senha</label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="planner-input pr-10"
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                aria-label={showNewPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showNewPassword ? (
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-eye-off">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-eye">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Confirmar Senha</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="planner-input pr-10"
                required
                minLength={6}
                placeholder="Digite a senha novamente"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showConfirmPassword ? (
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-eye-off">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-eye">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 dark:bg-red-950 dark:border-red-900 dark:text-red-200 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full planner-button disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Redefinindo...' : 'Redefinir senha'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-blue-700 dark:text-blue-300 hover:underline"
          >
            Voltar para o login
          </button>
        </div>
      </div>
    </div>
  );
}
