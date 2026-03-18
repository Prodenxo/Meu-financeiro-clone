import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import AuthLayout from '../components/AuthLayout';
import ButtonSpinner from '../components/ButtonSpinner';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const signUp = useAuthStore((state) => state.signUp);
  const { isDarkMode } = useThemeStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signUp(email, password, phone || undefined, displayName || undefined);
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Criar conta"
      subtitle="Preencha os dados para se cadastrar"
      showIllustration
      footer={
        <>
          Já tem uma conta? <Link to="/login" className="text-blue-600 hover:underline dark:text-blue-400 font-semibold">Faça login</Link>
        </>
      }
    >
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
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Nome (opcional)</label>
            <div className="relative">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="planner-input pr-10"
                placeholder="Seu nome"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-user"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Telefone</label>
            <PhoneInput
              country={'br'}
              value={phone}
              onChange={setPhone}
              inputStyle={{
                width: '100%',
                paddingTop: '12px',
                paddingBottom: '12px',
                paddingLeft: '48px',
                paddingRight: '40px',
                borderRadius: '0.5rem',
                border: isDarkMode ? '1px solid #334155' : '1px solid #D1D5DB',
                fontSize: '1rem',
                backgroundColor: isDarkMode ? '#0f172a' : 'white',
                color: isDarkMode ? '#f8fafc' : '#0f172a',
                boxSizing: 'border-box',
                outline: 'none',
                lineHeight: '1.5',
                height: '48px',
              }}
              buttonStyle={{
                border: 'none',
                background: 'transparent',
                paddingLeft: 8,
                color: isDarkMode ? '#cbd5f5' : '#64748b',
              }}
              placeholder="(11) 999999999"
              enableSearch
            />
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
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
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
            <div className="admin-alert admin-alert-danger px-4 py-3 rounded">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full planner-button mt-2 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <ButtonSpinner size={18} />
                Cadastrando...
              </>
            ) : (
              'Cadastrar'
            )}
          </button>
        </form>
    </AuthLayout>
  );
}