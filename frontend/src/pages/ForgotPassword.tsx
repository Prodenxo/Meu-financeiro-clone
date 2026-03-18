import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import AuthLayout, { AuthLayoutBackToLogin } from '../components/AuthLayout';
import ButtonSpinner from '../components/ButtonSpinner';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const resetPasswordForEmail = useAuthStore((state) => state.resetPasswordForEmail);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await resetPasswordForEmail(email);
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar email de recuperação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Esqueci minha senha"
      subtitle="Digite seu e-mail para receber um link de recuperação"
      showIllustration={false}
      maxWidth="md"
      footer={!success ? <AuthLayoutBackToLogin /> : undefined}
    >
      {success ? (
        <div className="space-y-4">
          <div className="admin-alert admin-alert-success px-4 py-3 rounded">
            <p className="font-semibold">E-mail enviado com sucesso!</p>
            <p className="text-sm mt-1">
              Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
            </p>
          </div>
          <Link to="/login" className="block w-full text-center planner-button">
            Voltar para o login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">E-mail</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="planner-input pr-10"
                required
                placeholder="seu@email.com"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16v16H4z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </span>
            </div>
          </div>

          {error && (
            <div className="admin-alert admin-alert-danger px-4 py-3 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full planner-button disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <ButtonSpinner size={18} />
                Enviando...
              </>
            ) : (
              'Enviar link de recuperação'
            )}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}

