'use client';

import { useEffect, useState, useTransition } from 'react';
import { disconnectGoogleFromSettingsAction, googleAuthUrlFromSettingsAction } from '@/app/(app)/configuracoes/actions';
import { Alert } from '@/components/ui';
import t from '@/components/transactions/transactions.module.css';
import s from './configuracoes.module.css';
import { AppearanceCard } from './AppearanceCard';
import { GoogleAgendaCard } from './GoogleAgendaCard';
import { ProfileCard } from './ProfileCard';
import { SessionCard } from './SessionCard';
import { SupportCard } from './SupportCard';
import { SupportTicketModal } from './SupportTicketModal';
import { TeamCard } from './TeamCard';

const isAdmin = (role) => role === 'admin' || role === 'superadmin';

/**
 * Tela Configurações. Dados do perfil, papel e status do Google vêm do servidor;
 * cada card cuida do próprio fluxo (perfil, equipe, suporte, Google, aparência, sessão).
 */
export function ConfiguracoesView({ profile, role, google, themePref, legacyAppUrl }) {
  const [googleConnected, setGoogleConnected] = useState(google.connected);
  const [googleError, setGoogleError] = useState(google.error);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [ticketOpen, setTicketOpen] = useState(false);
  const [toast, setToast] = useState(() =>
    google.oauthStatus === 'connected'
      ? { tone: 'success', text: 'Google Agenda vinculada com sucesso!' }
      : google.oauthStatus === 'error'
        ? { tone: 'error', text: 'Não foi possível autorizar o acesso ao Google Calendar. Por favor, tente novamente.' }
        : null,
  );
  const [googleBusy, startGoogle] = useTransition();

  useEffect(() => {
    if (!toast) return undefined;
    const tm = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(tm);
  }, [toast]);

  useEffect(() => {
    if (!google.oauthStatus) return;
    // Limpa `?googleCalendar=` da URL depois de mostrar o aviso.
    const url = new URL(window.location.href);
    url.searchParams.delete('googleCalendar');
    window.history.replaceState(null, '', url.toString());
  }, [google.oauthStatus]);

  const connectGoogle = () => {
    startGoogle(async () => {
      const res = await googleAuthUrlFromSettingsAction(window.location.origin);
      if (res?.ok) window.location.assign(res.authUrl);
      else setToast({ tone: 'error', text: res?.error || 'Não foi possível iniciar a conexão com o Google.' });
    });
  };

  const disconnectGoogle = () => {
    startGoogle(async () => {
      const res = await disconnectGoogleFromSettingsAction();
      setConfirmDisconnect(false);
      if (res?.ok) {
        setGoogleConnected(false);
        setGoogleError(null);
        setToast({ tone: 'success', text: 'A integração com Google Calendar foi removida desta conta.' });
      } else {
        setToast({ tone: 'error', text: res?.error || 'Erro ao desconectar Google Calendar. Por favor, tente novamente.' });
      }
    });
  };

  return (
    <div className={s.page}>
      <header className={t.header}>
        <div>
          <p className={t.crumb}>Meu espaço / Configurações</p>
          <h1 className={t.title}>Configurações</h1>
          <p className={t.subtitle}>Gerencie seu perfil, integrações e preferências.</p>
        </div>
      </header>

      <div className={s.layout}>
        <div className={s.col}>
          <ProfileCard profile={profile} onToast={setToast} />
          {isAdmin(role) ? <TeamCard role={role} legacyAppUrl={legacyAppUrl} /> : null}
          <GoogleAgendaCard
            connected={googleConnected}
            email={profile.email}
            error={googleError}
            busy={googleBusy}
            confirming={confirmDisconnect}
            onConnect={connectGoogle}
            onAskDisconnect={() => setConfirmDisconnect(true)}
            onCancelDisconnect={() => setConfirmDisconnect(false)}
            onConfirmDisconnect={disconnectGoogle}
          />
        </div>
        <div className={s.col}>
          <SupportCard onOpenTicket={() => setTicketOpen(true)} />
          <AppearanceCard initialPref={themePref} />
          <SessionCard />
        </div>
      </div>

      {ticketOpen ? (
        <SupportTicketModal
          defaults={{ nome: profile.displayName, email: profile.email, telefone: profile.phone }}
          onClose={(sent) => {
            setTicketOpen(false);
            if (sent) setToast({ tone: 'success', text: 'Chamado enviado ao suporte.' });
          }}
        />
      ) : null}

      {toast ? (
        <div className={t.toast}>
          <Alert tone={toast.tone}>{toast.text}</Alert>
        </div>
      ) : null}
    </div>
  );
}
