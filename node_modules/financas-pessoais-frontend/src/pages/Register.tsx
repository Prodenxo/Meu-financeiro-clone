import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const signUp = useAuthStore((state) => state.signUp);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signUp(email, password, phone || undefined, displayName || undefined);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Barra lateral */}
      <div className="hidden md:flex flex-col items-center py-10 px-4 bg-white rounded-l-2xl shadow-2xl h-[700px] w-20 mr-[-2rem] z-10">
        <div className="flex flex-col items-center gap-8 w-full">
          <div className="flex flex-col items-center gap-2 w-full opacity-60">
            <Link to="/login" className="flex flex-col items-center">
              <span className="bg-gray-200 text-gray-500 rounded-full p-2">
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-log-in"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
              </span>
              <span className="text-gray-500 font-semibold text-sm mt-2">Entrar</span>
            </Link>
          </div>
          <div className="flex flex-col items-center gap-2 w-full">
            <span className="bg-blue-500 text-white rounded-full p-2">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-user-plus"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
            </span>
            <span className="text-blue-600 font-semibold text-sm mt-2">Cadastrar</span>
          </div>
        </div>
      </div>
      {/* Painel azul com imagem */}
      <div className="hidden md:flex flex-col justify-center items-center bg-blue-600 rounded-l-2xl h-[700px] w-[500px] shadow-2xl z-0 p-0 overflow-hidden">
        <img
          src="https://ik.imagekit.io/qdohqf5kl/Capa%20-%20financas%20pessoais.png?updatedAt=1749862004209"
          alt="Ilustração Finanças Pessoais"
          className="w-full h-full object-cover rounded-l-2xl"
        />
      </div>
      {/* Formulário de registro */}
      <div className="flex flex-col justify-center bg-white rounded-r-2xl shadow-2xl h-[700px] w-full max-w-md px-10 py-12 z-10">
        <div className="flex justify-end text-sm mb-6">
          <span className="text-gray-500">Já tem uma conta? </span>
          <Link to="/login" className="text-blue-600 hover:underline ml-1 font-semibold">Faça login</Link>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome (opcional)</label>
            <div className="relative">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                placeholder="Seu nome"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-user"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
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
                border: '1px solid #D1D5DB',
                fontSize: '1rem',
                backgroundColor: 'white',
                boxSizing: 'border-box',
                outline: 'none',
                lineHeight: '1.5',
                height: '48px',
              }}
              buttonStyle={{ border: 'none', background: 'none', paddingLeft: 8 }}
              placeholder="(11) 999999999"
              enableSearch
            />
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
            Cadastrar
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-8 text-center">
          Ao clicar em Cadastrar, você concorda com nossa Política de Privacidade.
        </p>
      </div>
    </div>
  );
}