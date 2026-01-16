import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function LoginOnly() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const signIn = useAuthStore((state) => state.signIn);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Barra lateral */}
      <div className="hidden md:flex flex-col items-center py-10 px-4 bg-white rounded-l-2xl shadow-2xl h-[600px] w-20 mr-[-2rem] z-10">
        <div className="flex flex-col items-center gap-8 w-full">
          <div className="flex flex-col items-center gap-2 w-full">
            <div className="flex items-center justify-center w-full">
              <span className="bg-blue-500 text-white rounded-full p-2">
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-log-in"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
              </span>
            </div>
            <span className="text-blue-600 font-semibold text-sm mt-2">Entrar</span>
          </div>
        </div>
      </div>
      {/* Painel azul com ilustração */}
      <div className="hidden md:flex flex-col justify-center items-center bg-blue-600 rounded-l-2xl h-[700px] w-[500px] shadow-2xl z-0 p-0 overflow-hidden">
        <img
          src="https://ik.imagekit.io/qdohqf5kl/Capa%20-%20financas%20pessoais.png?updatedAt=1749862004209"
          alt="Ilustração Finanças Pessoais"
          className="w-full h-full object-cover rounded-l-2xl"
        />
      </div>
      {/* Formulário de login */}
      <div className="flex flex-col justify-center bg-white rounded-r-2xl shadow-2xl h-[600px] w-full max-w-md px-10 py-12 z-10">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center">Bem-vindo de volta</h2>
          <p className="text-gray-600 text-center mt-2">Faça login para acessar sua conta</p>
        </div>
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
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-mail"><path d="M4 4h16v16H4z"/><polyline points="22,6 12,13 2,6"/></svg>
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? (
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
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-blue-700 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition duration-200 mt-2"
          >
            Entrar
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-8 text-center">
          Ao clicar em Entrar, você concorda com nossa Política de Privacidade.
        </p>
      </div>
    </div>
  );
} 