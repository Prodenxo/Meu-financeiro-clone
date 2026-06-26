import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { supabaseBrowser } from '../lib/supabaseBrowser';
import { checkGoogleAuth } from '../lib/google-calendar';
import { initiateGoogleAuthFlow } from '../lib/google-auth-flow';
import {
  CheckCircle2,
  LogOut,
  MessageCircle,
  Moon,
  Sun,
  Users,
} from 'lucide-react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import PageShell from '../components/PageShell';
import FetchErrorBanner from '../components/FetchErrorBanner';
import { AccessBlockedExplainer } from '../components/AccessBlockedExplainer';
import {
  adminSettingsRestrictedAccessBlockProps,
  type AccessBlockKind,
} from '../lib/accessBlockPresets';
import { SettingsSectionCard } from '../components/settings/SettingsSectionCard';
import { SettingsProfileField } from '../components/settings/SettingsProfileField';
import { SettingsActionLink } from '../components/settings/SettingsActionLink';

export default function Settings() {
  const { user, userId, phone, displayName, updatePhone, updateDisplayName, signOut, role } =
    useAuthStore();
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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [error, setError] = useState<unknown | null>(null);
  const [success, setSuccess] = useState('');

  const [editPhone, setEditPhone] = useState(phone || '');
  const [editDisplayName, setEditDisplayName] = useState(displayName || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');

  const normalizedCurrentEmail = (user?.email || '').trim().toLowerCase();
  const trimmedEmail = editEmail.trim();
  const showEmailHint =
    trimmedEmail.length > 0 && trimmedEmail.toLowerCase() !== normalizedCurrentEmail;

  useEffect(() => {
    if (user?.email && !editEmail) setEditEmail(user.email);
  }, [user?.email, editEmail]);

  useEffect(() => {
    void checkGoogleAuthStatus();
  }, []);

  useEffect(() => {
    const onOAuthDone = () => {
      void checkGoogleAuthStatus();
    };
    window.addEventListener('mf-google-calendar-oauth-done', onOAuthDone);
    return () => window.removeEventListener('mf-google-calendar-oauth-done', onOAuthDone);
  }, []);

  useEffect(() => {
    console.log('[Settings] role atual:', role, 'userId:', userId, 'email:', user?.email);
  }, [role, userId, user?.email]);

  const checkGoogleAuthStatus = async () => {
    setCheckingAuth(true);
    const { authenticated } = await checkGoogleAuth();
    setIsGoogleAuthenticated(authenticated);
    setCheckingAuth(false);
  };

  const flashSuccess = (message: string, ms = 3000) => {
    setSuccess(message);
    window.setTimeout(() => setSuccess(''), ms);
  };

  const handleUpdatePhone = async () => {
    if (!editPhone) {
      setError(new Error('Telefone é obrigatório'));
      return;
    }

    setSavingPhone(true);
    setError(null);
    setSuccess('');

    try {
      await updatePhone(editPhone);
      flashSuccess('Telefone atualizado! Se o WhatsApp ainda mostrar outro nome, envie /new no chat.');
    } catch (err: unknown) {
      setError(err);
    } finally {
      setSavingPhone(false);
    }
  };

  const handleUpdateDisplayName = async () => {
    setSavingName(true);
    setError(null);
    setSuccess('');

    try {
      await updateDisplayName(editDisplayName);
      flashSuccess('Nome atualizado com sucesso!');
    } catch (err: unknown) {
      setError(err);
    } finally {
      setSavingName(false);
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
    if (trimmed === normalizedCurrentEmail) {
      setError(new Error('Informe um e-mail diferente do atual'));
      return;
    }

    setSavingEmail(true);
    setError(null);
    setSuccess('');
    try {
      const { error: updateError } = await supabaseBrowser.auth.updateUser({ email: trimmed });
      if (updateError) throw updateError;
      flashSuccess(
        `Enviamos um link de confirmação para ${trimmed}. O e-mail só passa a valer após você clicar no link.`,
        6000,
      );
    } catch (err: unknown) {
      setError(err);
    } finally {
      setSavingEmail(false);
    }
  };

  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    setError(null);

    try {
      await initiateGoogleAuthFlow();
    } catch (err: unknown) {
      setError(err);
      setGoogleLoading(false);
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
      <div className="settings-shell">
      <header>
        <h1 className="settings-heading">Configurações</h1>
        <p className="settings-lead">Perfil, integrações e preferências da sua conta.</p>
      </header>

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

      {success ? (
        <div className="mb-4 rounded-xl border border-emerald-300/70 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200">
          {success}
        </div>
      ) : null}

      <div className="settings-grid">
        <SettingsSectionCard
          title="Perfil"
          description="Atualize seus dados de acesso"
          className="xl:col-span-2"
        >
          <SettingsProfileField
            label="Nome"
            onSave={() => void handleUpdateDisplayName()}
            saving={savingName}
            disabled={editDisplayName.trim() === (displayName || '').trim()}
          >
            <input
              type="text"
              value={editDisplayName}
              onChange={(e) => setEditDisplayName(e.target.value)}
              className="planner-input-compact w-full"
              placeholder="Como quer ser chamado"
              autoComplete="name"
            />
          </SettingsProfileField>

          <SettingsProfileField
            label="Telefone"
            onSave={() => void handleUpdatePhone()}
            saving={savingPhone}
            disabled={editPhone === (phone || '')}
          >
            <PhoneInput
              country="br"
              value={editPhone}
              onChange={setEditPhone}
              inputClass="planner-input-compact !pl-12"
              buttonClass="!border-0 !bg-transparent !pl-2"
              containerClass="admin-phone-input w-full"
              placeholder="(11) 999999999"
              enableSearch
            />
          </SettingsProfileField>

          <SettingsProfileField
            label="E-mail"
            onSave={() => void handleUpdateEmail()}
            saving={savingEmail}
            saveLabel="Alterar e-mail"
            disabled={!trimmedEmail || trimmedEmail.toLowerCase() === normalizedCurrentEmail}
            hint={
              showEmailHint
                ? `Enviamos um link de confirmação para ${trimmedEmail}. O e-mail só muda após você clicar no link.`
                : undefined
            }
            isLast
          >
            <input
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              className="planner-input-compact w-full"
              placeholder="email@exemplo.com"
              autoComplete="email"
            />
          </SettingsProfileField>
        </SettingsSectionCard>

        <SettingsSectionCard title="Suporte" description="Ajuda humana e comunidade">
          <SettingsActionLink
            title="Fale com o Agente"
            description="WhatsApp do consultor pessoal"
            icon={MessageCircle}
            href="https://wa.me/5521974526796"
            external
          />
          <SettingsActionLink
            title="Grupo de suporte"
            description="Tire dúvidas com outros usuários"
            icon={MessageCircle}
            href="https://chat.whatsapp.com/G0F3SaEFfvNI066k5MYKDT"
            external
          />
        </SettingsSectionCard>

        <SettingsSectionCard title="Aparência">
          <div className="settings-muted-row">
            <div className="flex items-center gap-3">
              {isDarkMode ? (
                <Moon className="h-[18px] w-[18px] text-slate-400" aria-hidden />
              ) : (
                <Sun className="h-[18px] w-[18px] text-slate-400" aria-hidden />
              )}
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Modo escuro</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isDarkMode ? 'Tema escuro ativo' : 'Tema claro ativo'}
                </p>
              </div>
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
                    ? 'border-blue-400/50 bg-blue-500/90 dark:border-blue-500/35 dark:bg-blue-600/80'
                    : 'border-slate-200/80 bg-slate-200/80 dark:border-slate-600/50 dark:bg-slate-700/60'
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
        </SettingsSectionCard>

        <SettingsSectionCard title="Google Agenda" description="Sincronize pagamentos no calendário">
          {checkingAuth ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Verificando integração…</p>
          ) : isGoogleAuthenticated ? (
            <div className="settings-status-ok">
              <p className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500/80" aria-hidden />
                Google Calendar conectado
              </p>
              <button
                type="button"
                onClick={() => void handleDisconnectGoogle()}
                className="settings-text-danger"
              >
                Desconectar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => void handleGoogleAuth()}
              disabled={googleLoading}
              className="settings-text-action disabled:cursor-not-allowed"
            >
              {googleLoading ? 'Carregando…' : 'Conectar com Google'}
            </button>
          )}
        </SettingsSectionCard>

        {role && (role === 'superadmin' || role === 'admin') ? (
          <SettingsSectionCard
            title="Equipe"
            description="Gerenciamento de usuários e permissões"
            className="xl:col-span-2"
          >
            <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
              {role === 'superadmin' ? 'Acesso global' : 'Acesso por empresa'}
            </p>
            <SettingsActionLink
              title="Gerenciar usuários"
              description="Criação, edição e bloqueio de contas"
              icon={Users}
              onClick={() => navigate('/settings/users')}
            />
          </SettingsSectionCard>
        ) : null}

        <SettingsSectionCard title="Sessão" className="xl:col-span-2">
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="settings-text-danger inline-flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Sair da conta
          </button>
        </SettingsSectionCard>
      </div>
      </div>
    </PageShell>
  );
}
