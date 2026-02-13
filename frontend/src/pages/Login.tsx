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
    try {
      await signIn(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      {/* Barra lateral */}
      <div className="hidden md:flex flex-col items-center py-10 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-l-2xl shadow-lg h-[600px] w-20 mr-[-2rem] z-10">
        <div className="flex flex-col items-center gap-8 w-full">
          <div className="flex flex-col items-center gap-2 w-full">
            <div className="flex items-center justify-center w-full">
              <span className="bg-blue-700 text-white rounded-full p-2">
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-log-in"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
              </span>
            </div>
            <span className="text-blue-700 font-semibold text-sm mt-2">Entrar</span>
          </div>
        </div>
      </div>
      {/* Painel azul com ilustração */}
      <div className="hidden md:flex flex-col justify-center items-center bg-blue-700 rounded-l-2xl h-[700px] w-[500px] shadow-lg z-0 p-0 overflow-hidden">
        <img
          src="https://ik.imagekit.io/qdohqf5kl/Capa%20-%20financas%20pessoais.png?updatedAt=1749862004209"
          alt="Ilustração Finanças Pessoais"
          className="w-full h-full object-cover rounded-l-2xl"
        />
      </div>
      {/* Formulário de login */}
      <div className="flex flex-col justify-center planner-card h-[600px] w-full max-w-md px-10 py-12 z-10 rounded-r-2xl">
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
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-mail"><path d="M4 4h16v16H4z"/><polyline points="22,6 12,13 2,6"/></svg>
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Senha</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="planner-input pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
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
            <div className="flex justify-end mt-2">
              <Link to="/forgot-password" className="text-sm text-blue-700 hover:underline">
                Esqueci minha senha
              </Link>
            </div>
          </div>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 dark:bg-red-950 dark:border-red-900 dark:text-red-200 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <button
            type="submit"
            className="w-full planner-button mt-2"
          >
            Entrar
          </button>
        </form>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-8 text-center">
          Ao clicar em Entrar, você concorda com nossa Política de Privacidade.
        </p>
      </div>
    </div>
  );
}