import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../Layout/Layout';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { checkGoogleAuth, startGoogleAuth } from '../lib/google-calendar';
import { initiateGoogleAuthFlow } from '../lib/google-auth-flow';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

export default function Settings() {
  const { user, userId, phone, displayName, updatePhone, updateDisplayName, signOut, role } = useAuthStore();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const [isGoogleAuthenticated, setIsGoogleAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [editPhone, setEditPhone] = useState(phone || '');
  const [editDisplayName, setEditDisplayName] = useState(displayName || '');

  const saveNameButtonRef = useRef<HTMLButtonElement>(null);
  const savePhoneButtonRef = useRef<HTMLButtonElement>(null);
  const connectGoogleButtonRef = useRef<HTMLButtonElement>(null);
  const disconnectGoogleButtonRef = useRef<HTMLButtonElement>(null);
  const signOutButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    checkGoogleAuthStatus();
  }, []);

  useEffect(() => {
    console.log('[Settings] role atual:', role, 'userId:', userId, 'email:', user?.email);
  }, [role, userId, user?.email]);

  useEffect(() => {
    // Aplicar cores com important nos botões
    if (saveNameButtonRef.current) {
      saveNameButtonRef.current.style.setProperty('background-color', '#2563eb', 'important');
    }
    if (savePhoneButtonRef.current) {
      savePhoneButtonRef.current.style.setProperty('background-color', '#2563eb', 'important');
    }
    if (connectGoogleButtonRef.current) {
      connectGoogleButtonRef.current.style.setProperty('background-color', '#2563eb', 'important');
    }
    if (disconnectGoogleButtonRef.current) {
      disconnectGoogleButtonRef.current.style.setProperty('background-color', '#dc2626', 'important');
    }
    if (signOutButtonRef.current) {
      signOutButtonRef.current.style.setProperty('background-color', '#dc2626', 'important');
    }
  }, [isDarkMode]);

  const checkGoogleAuthStatus = async () => {
    setCheckingAuth(true);
    const { authenticated } = await checkGoogleAuth();
    setIsGoogleAuthenticated(authenticated);
    setCheckingAuth(false);
  };

  const handleUpdatePhone = async () => {
    if (!editPhone) {
      setError('Telefone é obrigatório');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await updatePhone(editPhone);
      setSuccess('Telefone atualizado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar telefone');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDisplayName = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await updateDisplayName(editDisplayName);
      setSuccess('Nome atualizado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar nome');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError('');
    
    try {
      await initiateGoogleAuthFlow();
      // O redirecionamento será feito pela função
    } catch (err: any) {
      setError(err.message || 'Erro ao iniciar autenticação Google');
      setLoading(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    // Implementar desconexão se necessário
    setError('Funcionalidade de desconexão ainda não implementada');
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer logout');
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
        <h1 className="text-xl md:text-3xl font-bold dark:text-white mb-4 md:mb-6">Configurações</h1>
        <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 mb-4 md:mb-6">
          Gerencie suas preferências e informações
        </p>

        {error && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-3 rounded">
            {success}
          </div>
        )}

        {/* Informações do Usuário */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 dark:text-white">Informações do Usuário</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Adicione e atualize suas informações pessoais
          </p>
          
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nome de Exibição
                </label>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="flex-1 px-4 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                  placeholder="Seu nome"
                />
                <button
                  ref={saveNameButtonRef}
                  onClick={handleUpdateDisplayName}
                  disabled={loading || editDisplayName === displayName}
                  className="px-4 py-2 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  onMouseEnter={(e) => {
                    if (!loading && editDisplayName !== displayName) {
                      e.currentTarget.style.setProperty('background-color', '#1d4ed8', 'important');
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.setProperty('background-color', '#2563eb', 'important');
                  }}
                >
                  {loading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Telefone
                </label>
              </div>
              <div className="flex gap-2">
                <PhoneInput
                  country={'br'}
                  value={editPhone}
                  onChange={setEditPhone}
                  inputStyle={{
                    width: '100%',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    paddingLeft: '48px',
                    paddingRight: '40px',
                    borderRadius: '0.5rem',
                    border: isDarkMode ? '1px solid #4B5563' : '1px solid #D1D5DB',
                    fontSize: '1rem',
                    backgroundColor: isDarkMode ? '#374151' : 'white',
                    color: isDarkMode ? '#F9FAFB' : '#111827',
                    boxSizing: 'border-box',
                    outline: 'none',
                    lineHeight: '1.5',
                    height: '48px',
                  }}
                  buttonStyle={{ border: 'none', background: 'none', paddingLeft: 8 }}
                  placeholder="(11) 999999999"
                  enableSearch
                />
                <button
                  ref={savePhoneButtonRef}
                  onClick={handleUpdatePhone}
                  disabled={loading || editPhone === phone}
                  className="px-4 py-2 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  onMouseEnter={(e) => {
                    if (!loading && editPhone !== phone) {
                      e.currentTarget.style.setProperty('background-color', '#1d4ed8', 'important');
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.setProperty('background-color', '#2563eb', 'important');
                  }}
                >
                  {loading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Aparência */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 dark:text-white">Aparência</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Escolha entre modo claro ou escuro
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-700 dark:text-gray-300 font-medium">Modo Escuro</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Alternar entre tema claro e escuro</p>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isDarkMode ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isDarkMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {role && (role === 'superadmin' || role === 'admin') && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 dark:text-white">Administração</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Gerencie usuários e permissões da sua empresa.
            </p>
            <button
              onClick={() => navigate('/settings/users')}
              className="px-4 py-2 text-white rounded-lg font-semibold bg-blue-600 hover:bg-blue-700"
            >
              Gerenciar usuários
            </button>
          </div>
        )}

        {/* Integração Google Calendar */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 dark:text-white">Integração com Google Agenda</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Para visualizar seus pagamentos futuros como eventos, autorize o acesso à sua agenda do Google.
          </p>
          
          {checkingAuth ? (
            <p className="text-gray-600 dark:text-gray-400">Verificando autenticação...</p>
          ) : isGoogleAuthenticated ? (
            <div className="space-y-4">
              <div className="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-3 rounded flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="font-semibold">Google Calendar conectado</p>
              </div>
              <button
                ref={disconnectGoogleButtonRef}
                onClick={handleDisconnectGoogle}
                className="w-full md:w-auto px-4 py-2 text-white rounded-lg font-semibold flex items-center justify-center gap-2"
                onMouseEnter={(e) => {
                  e.currentTarget.style.setProperty('background-color', '#b91c1c', 'important');
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.setProperty('background-color', '#dc2626', 'important');
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Desconectar
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                ref={connectGoogleButtonRef}
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full md:w-auto px-4 py-2 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.setProperty('background-color', '#1d4ed8', 'important');
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.setProperty('background-color', '#2563eb', 'important');
                }}
              >
                {loading ? (
                  <>Carregando...</>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Conectar com Google
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Conta */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 dark:text-white">Conta</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 mb-4">
                Deseja sair da sua conta? Você precisará fazer login novamente para acessar o sistema.
              </p>
              <button
                ref={signOutButtonRef}
                onClick={handleSignOut}
                className="w-full md:w-auto px-4 py-2 text-white rounded-lg font-semibold transition-colors duration-200"
                onMouseEnter={(e) => {
                  e.currentTarget.style.setProperty('background-color', '#b91c1c', 'important');
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.setProperty('background-color', '#dc2626', 'important');
                }}
              >
                Sair da Conta
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

