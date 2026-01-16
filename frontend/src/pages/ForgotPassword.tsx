import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

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
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar email de recuperação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Formulário */}
      <div className="flex flex-col justify-center bg-white rounded-2xl shadow-2xl w-full max-w-md px-10 py-12">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center">Esqueci minha senha</h2>
          <p className="text-gray-600 text-center mt-2">
            Digite seu e-mail para receber um link de recuperação
          </p>
        </div>

        {success ? (
          <div className="space-y-4">
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              <p className="font-semibold">Email enviado com sucesso!</p>
              <p className="text-sm mt-1">
                Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
              </p>
            </div>
            <Link
              to="/login"
              className="block w-full text-center bg-blue-700 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition duration-200"
            >
              Voltar para o login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                  required
                  placeholder="seu@email.com"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-mail">
                    <path d="M4 4h16v16H4z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </span>
              </div>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Enviando...' : 'Enviar link de recuperação'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-blue-600 hover:underline">
            Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  );
}

