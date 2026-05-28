import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { supabaseBrowser } from '../lib/supabaseBrowser';
import { checkGoogleAuth } from '../lib/google-calendar';
import { initiateGoogleAuthFlow } from '../lib/google-auth-flow';
import { MessageCircle } from 'lucide-react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import PageShell from '../components/PageShell';
import PageTitle from '../components/PageTitle';
import FetchErrorBanner from '../components/FetchErrorBanner';
import { AccessBlockedExplainer } from '../components/AccessBlockedExplainer';
import {
  adminSettingsRestrictedAccessBlockProps,
  type AccessBlockKind,
} from '../lib/accessBlockPresets';

export default function Settings() {
  const { user, userId, phone, displayName, updatePhone, updateDisplayName, signOut, role } = useAuthStore();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();
  const accessBlock = (location.state as { accessBlock?: AccessBlockKind } | null)?.accessBlock;
  const showAdminAccessBlock = accessBlock === 'admin-settings-restricted';
  const dismissAdminAccessNotice = () => {
    navigate(location.pathname, { replace: true, state: {} });
  };
  const [isGoogleAuthenticated, setIsGoogleAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown | null>(null);
  const [success, setSuccess] = useState('');
  
  const [editPhone, setEditPhone] = useState(phone || '');
  const [editDisplayName, setEditDisplayName] = useState(displayName || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');

  useEffect(() => {
    if (user?.email && !editEmail) setEditEmail(user.email);
  }, [user?.email, editEmail]);

  useEffect(() => {
    checkGoogleAuthStatus();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googleStatus = params.get('googleCalendar');
    if (!googleStatus) return;

    params.delete('googleCalendar');
    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}`;
    window.history.replaceState({}, document.title, nextUrl);

    if (googleStatus === 'connected') {
      void checkGoogleAuthStatus().then(() => {
        setSuccess('Google Agenda conectada com sucesso!');
        setTimeout(() => setSuccess(''), 5000);
      });
      return;
    }

    if (googleStatus === 'error') {
      setError(new Error('Não foi possível conectar o Google Agenda. Tente novamente.'));
    }
  }, [location.search]);

  useEffect(() => {
    console.log('[Settings] role atual:', role, 'userId:', userId, 'email:', user?.email);
  }, [role, userId, user?.email]);

  const checkGoogleAuthStatus = async () => {
    setCheckingAuth(true);
    const { authenticated } = await checkGoogleAuth();
    setIsGoogleAuthenticated(authenticated);
    setCheckingAuth(false);
  };

  const handleUpdatePhone = async () => {
    if (!editPhone) {
      setError(new Error('Telefone é obrigatório'));
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess('');
    
    try {
      await updatePhone(editPhone);
      setSuccess('Telefone atualizado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDisplayName = async () => {
    setLoading(true);
    setError(null);
    setSuccess('');

    try {
      await updateDisplayName(editDisplayName);
      setSuccess('Nome atualizado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async () => {
    const trimmed = editEmail.trim().toLowerCase();
    if (!trimmed) {
      setError(new Error('E-mail é obrigatório'));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError(new Error('E-mail inválido'));
      return;
    }
    if (trimmed === (user?.email || '').trim().toLowerCase()) {
      setError(new Error('Informe um e-mail diferente do atual'));
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess('');
    try {
      const { error: updateError } = await supabaseBrowser.auth.updateUser({ email: trimmed });
      if (updateError) throw updateError;
      setSuccess(
        `Enviamos um link de confirmação para ${trimmed}. O e-mail só passa a valer após você clicar no link.`,
      );
      setTimeout(() => setSuccess(''), 6000);
    } catch (err: unknown) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);

    try {
      await initiateGoogleAuthFlow();
    } catch (err: unknown) {
      setError(err);
      setLoading(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    setError(new Error('Funcionalidade de desconexão ainda não implementada'));
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err: unknown) {
      setError(err);
    }
  };

  return (
    <PageShell>
      <PageTitle subtitle="Conta, tema da app e outras opções. Gerencie as suas preferências e informações.">
        Configurações
      </PageTitle>

      {showAdminAccessBlock ? (
        <AccessBlockedExplainer
          {...adminSettingsRestrictedAccessBlockProps()}
          testId="access-block-admin-settings"
          onDismiss={dismissAdminAccessNotice}
        />
      ) : null}

        {error != null ? (
          <FetchErrorBanner error={error} surfaceId="settings.profile" className="mb-4" />
        ) : null}

        {success && (
          <div className="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-3 rounded">
            {success}
          </div>
        )}

        {/* Informações do Usuário */}
        <div className="planner-card p-4 md:p-6">
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
                  className="planner-input-compact flex-1"
                  placeholder="Seu nome"
                />
                <button
                  onClick={handleUpdateDisplayName}
                  disabled={loading || editDisplayName === displayName}
                  className="planner-button whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
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
                  onClick={handleUpdatePhone}
                  disabled={loading || editPhone === phone}
                  className="planner-button whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  E-mail
                </label>
              </div>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="planner-input-compact flex-1"
                  placeholder="email@exemplo.com"
                  autoComplete="email"
                />
                <button
                  onClick={handleUpdateEmail}
                  disabled={
                    loading ||
                    !editEmail.trim() ||
                    editEmail.trim().toLowerCase() === (user?.email || '').trim().toLowerCase()
                  }
                  className="planner-button whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Salvando...' : 'Alterar e-mail'}
                </button>
              </div>
              {editEmail.trim() && editEmail.trim().toLowerCase() !== (user?.email || '').trim().toLowerCase() && (
                <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-300">
                  Ao salvar, enviaremos um link de confirmação para <strong>{editEmail.trim()}</strong>. O e-mail só passa a valer após você clicar no link.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Suporte via WhatsApp */}
        <div className="planner-card p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 dark:text-white">Meu Financeiro, seu consultor pessoal!</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Fale diretamente com seu consultor pessoal no WhatsApp.
          </p>
          <a
            href="https://wa.me/5521974526796"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full md:w-auto planner-button-success"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Fale com nosso agente
          </a>
        </div>

        {/* Aparência */}
        <div className="planner-card p-4 md:p-6">
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
              type="button"
              role="switch"
              aria-checked={isDarkMode}
              aria-label={
                isDarkMode
                  ? 'Modo escuro ativado. Prima para mudar para o tema claro.'
                  : 'Modo escuro desativado. Prima para mudar para o tema escuro.'
              }
              onClick={toggleTheme}
              className="relative inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg"
            >
              <span
                aria-hidden
                className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-colors ${
                  isDarkMode
                    ? 'border-blue-500/80 bg-blue-600 dark:border-blue-400/50'
                    : 'border-[color:rgb(var(--color-surface-border))] bg-slate-300 dark:border-slate-500 dark:bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    isDarkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </span>
            </button>
          </div>
        </div>

        {role && (role === 'superadmin' || role === 'admin') && (
          <div className="planner-card p-4 md:p-6 space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg md:text-xl font-semibold dark:text-white">Administração</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Gerencie usuários, acessos e visão financeira operacional.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="admin-badge-primary">
                  {role === 'superadmin' ? 'Acesso global' : 'Acesso por empresa'}
                </span>
              </div>
            </div>
            <div className="admin-toolbar">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                Escolha um módulo para continuar.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => navigate('/settings/users')}
                  className="planner-button w-full sm:w-auto justify-center"
                >
                  Gerenciar usuários
                </button>
                <button
                  onClick={() => navigate('/settings/usuarios-dados')}
                  className="planner-button-secondary w-full sm:w-auto justify-center"
                >
                  Dados dos usuários
                </button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="admin-stat-card">
                <p className="admin-stat-label">Gestão de acesso</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Criação, edição, bloqueio e redefinição de senha.
                </p>
              </div>
              <div className="admin-stat-card">
                <p className="admin-stat-label">Visão operacional</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Pendências DAS, saldos, transações e categorias.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Integração Google Calendar */}
        <div className="planner-card p-4 md:p-6">
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
                onClick={handleDisconnectGoogle}
                className="w-full md:w-auto planner-button-danger flex items-center justify-center gap-2"
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
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full md:w-auto planner-button disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
        <div className="planner-card p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 dark:text-white">Conta</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 mb-4">
                Deseja sair da sua conta? Você precisará fazer login novamente para acessar o sistema.
              </p>
              <button
                onClick={handleSignOut}
                className="w-full md:w-auto planner-button-danger"
              >
                Sair da Conta
              </button>
            </div>
          </div>
        </div>
    </PageShell>
  );
}

