import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import AuthLayout from '../components/AuthLayout';
import ButtonSpinner from '../components/ButtonSpinner';
import {
  acceptInviteRequest,
  validateInviteTokenPublic,
  type InviteValidationStatus
} from '../services/invitesService';
import { getSession } from '../services/authService';
import { getConviteTokenFromSearch, inviteStatusUserMessage } from '../utils/registerInviteQuery';
import { strongPasswordRequirementBullets, validateStrongPassword } from '../lib/passwordPolicy';

function RegisterFormFields(props: {
  email: string;
  setEmail: (v: string) => void;
  displayName: string;
  setDisplayName: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  isDarkMode: boolean;
  showErrors: boolean;
  passwordPolicyInvalid: boolean;
}) {
  const {
    email,
    setEmail,
    displayName,
    setDisplayName,
    phone,
    setPhone,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    isDarkMode,
    showErrors,
    passwordPolicyInvalid
  } = props;

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
          E-mail <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`planner-input pr-10 ${showErrors && !email.trim() ? 'border-rose-500 bg-rose-50/5' : ''}`}
            required
          />
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-mail"><path d="M4 4h16v16H4z"/><polyline points="22,6 12,13 2,6"/></svg>
          </span>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
          Nome Completo <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className={`planner-input pr-10 ${showErrors && !displayName.trim() ? 'border-rose-500 bg-rose-50/5' : ''}`}
            placeholder="Seu nome completo"
            required
          />
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-user"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </span>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
          Telefone <span className="text-rose-500">*</span>
        </label>
        <div className={showErrors && !phone.trim() ? 'phone-input-error' : ''}>
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
              border: showErrors && !phone.trim() 
                ? '1px solid #f43f5e' 
                : (isDarkMode ? '1px solid #334155' : '1px solid #D1D5DB'),
              fontSize: '1rem',
              backgroundColor: showErrors && !phone.trim() 
                ? (isDarkMode ? '#1e1b1c' : '#fff1f2') 
                : (isDarkMode ? '#0f172a' : 'white'),
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
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
          Senha <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`planner-input pr-10 ${
              showErrors && (!password.trim() || passwordPolicyInvalid) ? 'border-rose-500 bg-rose-50/5' : ''
            }`}
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
        <ul className="mt-2 list-inside list-disc space-y-0.5 text-xs text-slate-500 dark:text-slate-400">
          {strongPasswordRequirementBullets().map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
    </>
  );
}

export default function Register() {
  const location = useLocation();
  const navigate = useNavigate();
  const inviteRaw = getConviteTokenFromSearch(location.search);
  const hasInviteQuery = inviteRaw.length > 0;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [invitedByEmpresa, setInvitedByEmpresa] = useState<string | null>(null);

  const [invitePhase, setInvitePhase] = useState<
    'idle' | 'loading' | InviteValidationStatus | 'network_error' | 'no_invite'
  >(() => {
    if (!hasInviteQuery) return 'no_invite';
    return 'loading';
  });

  const signUp = useAuthStore((state) => state.signUp);
  const signIn = useAuthStore((state) => state.signIn);
  const initAuth = useAuthStore((state) => state.initAuth);
  const { isDarkMode } = useThemeStore();

  useEffect(() => {
    if (!hasInviteQuery) {
      setInvitePhase('no_invite');
      // Redirecionar para login após um breve delay ou imediatamente
      const timer = setTimeout(() => {
        navigate('/login');
      }, 2000);
      return () => clearTimeout(timer);
    }
    let cancelled = false;
    setInvitePhase('loading');
    void validateInviteTokenPublic(inviteRaw).then(
      (r) => {
        if (!cancelled) {
          setInvitePhase(r.status);
          if (r.status === 'valid' && r.empresaName) {
            setInvitedByEmpresa(r.empresaName);
          }
        }
      },
      () => {
        if (!cancelled) setInvitePhase('network_error');
      }
    );
    return () => {
      cancelled = true;
    };
  }, [hasInviteQuery, inviteRaw]);

  useEffect(() => {
    if (!hasInviteQuery) return;
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, [hasInviteQuery]);

  const showForm = invitePhase === 'valid';
  const passwordPolicyInvalid = Boolean(password.trim()) && !validateStrongPassword(password).ok;
  const inviteBanner =
    hasInviteQuery && invitePhase === 'valid' ? inviteStatusUserMessage('valid') : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShowErrors(true);
    setLoading(true);
    try {
      if (!email.trim() || !password.trim() || !displayName.trim() || !phone.trim()) {
        throw new Error('Todos os campos são obrigatórios. Por favor, preencha Nome, E-mail, Telefone e Senha.');
      }

      const pwdPolicy = validateStrongPassword(password);
      if (!pwdPolicy.ok) {
        throw new Error(pwdPolicy.message);
      }

      // Capturar o token diretamente da URL
      const tokenFromUrl = getConviteTokenFromSearch(location.search);
      
      // Realizar o cadastro já enviando o token de convite
      await signUp(email, password, phone, displayName, tokenFromUrl || undefined);

      // Se havia um convite, as permissões já foram vinculadas no backend.
      // Apenas inicializamos o auth localmente para garantir que o estado reflita a nova empresa.
      if (tokenFromUrl) {
        await initAuth();
        toast.success('Conta criada e vinculada com sucesso!');
      }

      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar');
    } finally {
      setLoading(false);
    }
  };

  const loginHref = location.search ? `/login${location.search}` : '/login';

  return (
    <AuthLayout
      title={hasInviteQuery ? 'Criar conta com convite' : 'Acesso Restrito'}
      subtitle={
        hasInviteQuery
          ? 'Use o link enviado pelo administrador da empresa'
          : 'Esta plataforma é exclusiva para convidados'
      }
      showIllustration
      footer={
        <>
          Já tem uma conta?{' '}
          <Link to={loginHref} className="text-blue-600 hover:underline dark:text-blue-400 font-semibold">
            Faça login
          </Link>
        </>
      }
    >
      {hasInviteQuery && invitePhase === 'loading' ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-center text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
          <div className="inline-flex items-center gap-2 justify-center">
            <ButtonSpinner size={22} />
            Verificando convite...
          </div>
        </div>
      ) : null}

      {hasInviteQuery &&
      invitePhase !== 'loading' &&
      invitePhase !== 'idle' &&
      invitePhase !== 'valid' ? (
        <div className="space-y-4">
          <div className="admin-alert admin-alert-danger px-4 py-3 rounded">{inviteStatusUserMessage(invitePhase)}</div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Esta plataforma é exclusiva para convidados. Por favor, solicite um link ao seu administrador.
          </p>
        </div>
      ) : null}

      {invitePhase === 'no_invite' && (
        <div className="space-y-4 text-center">
          <div className="admin-alert admin-alert-warning px-4 py-3 rounded">
            Nenhum convite detectado.
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Você precisa de um link de convite válido para criar uma conta nesta plataforma.
          </p>
        </div>
      )}

      {showForm ? (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
          {showForm && invitedByEmpresa && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/90 px-5 py-4 text-sm text-emerald-900 shadow-sm dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-200 animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <p className="font-medium leading-relaxed">
                  Você foi convidado pela empresa <span className="font-bold underline decoration-emerald-500/30 underline-offset-2">{invitedByEmpresa}</span> para o sistema.
                </p>
              </div>
            </div>
          )}
          <RegisterFormFields
            email={email}
            setEmail={setEmail}
            displayName={displayName}
            setDisplayName={setDisplayName}
            phone={phone}
            setPhone={setPhone}
            password={password}
            setPassword={setPassword}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            isDarkMode={isDarkMode}
            showErrors={showErrors}
            passwordPolicyInvalid={passwordPolicyInvalid}
          />
          {error && (
            <div className="admin-alert admin-alert-danger px-4 py-3 rounded">{error}</div>
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
      ) : null}
    </AuthLayout>
  );
}
