'use client';

import Link from 'next/link';
import { Alert, Button, cx } from '@/components/ui';
import s from './configuracoes.module.css';
import { SettingsCard } from './SettingsCard';

function GoogleG() {
  return (
    <svg className={s.googleG} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.5 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 7.1-10 7.1-17.5z" />
      <path fill="#FBBC05" d="M10.5 28.6A14.5 14.5 0 0 1 9.7 24c0-1.6.3-3.1.8-4.6l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.3 0 11.7-2.1 15.6-5.7l-7.5-5.8c-2.1 1.4-4.8 2.3-8.1 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

/**
 * Google Agenda — status real da integração (edge function `google-calendar`).
 * Conectar abre o OAuth; desconectar pede confirmação. Sem ações além das suportadas.
 */
export function GoogleAgendaCard({ connected, email, error, busy, confirming, onConnect, onAskDisconnect, onConfirmDisconnect, onCancelDisconnect }) {
  return (
    <SettingsCard id="google-agenda" icon="calendar-days" title="Google Agenda" description="Sincronize pagamentos no calendário.">
      {error ? (
        <div style={{ marginBottom: 12 }}>
          <Alert tone="error">{error}</Alert>
        </div>
      ) : null}

      <div className={s.googleRow}>
        <span className={cx(s.googleStatus, connected && s.googleStatusOn)} role="status">
          <span className={cx(s.googleDot, connected && s.googleDotOn)} aria-hidden="true" />
          {connected ? 'Conectado' : 'Não conectado'}
        </span>

        {connected ? (
          confirming ? (
            <div className={s.googleActions}>
              <Button variant="outline" size="sm" onClick={onCancelDisconnect} disabled={busy}>
                Cancelar
              </Button>
              <Button size="sm" onClick={onConfirmDisconnect} disabled={busy} aria-busy={busy}>
                {busy ? 'Desconectando…' : 'Confirmar desconexão'}
              </Button>
            </div>
          ) : (
            <div className={s.googleActions}>
              <Link href="/agenda" className={s.googleBtn}>
                Abrir agenda
              </Link>
              <Button variant="ghost" icon="unplug" onClick={onAskDisconnect} disabled={busy}>
                Desconectar
              </Button>
            </div>
          )
        ) : (
          <button type="button" className={s.googleBtn} onClick={onConnect} disabled={busy} aria-busy={busy}>
            <GoogleG />
            {busy ? 'Abrindo o Google…' : 'Conectar com Google'}
          </button>
        )}
      </div>

      {connected ? (
        <p className={s.googleEmail}>
          {confirming ? 'Seus compromissos no app deixam de sincronizar com o Google Calendar. Você pode conectar de novo quando quiser.' : `Conta do app: ${email}. Compromissos criados aqui podem aparecer no seu calendário.`}
        </p>
      ) : null}
    </SettingsCard>
  );
}
