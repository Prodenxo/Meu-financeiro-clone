'use client';

import { useState } from 'react';
import { Button, Card, CardHeader, Pill } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import s from './agenda.module.css';

const SYNCED = [
  { label: 'Compromissos financeiros', note: 'lançamentos "a pagar" / "a receber" viram eventos' },
  { label: 'Lembretes', note: 'eventos de dia inteiro e alertas do Google' },
  { label: 'Eventos pessoais (opcional)', note: 'tudo do seu calendário principal aparece aqui' },
];

/**
 * Card "Integração com Google Agenda". Conectar abre o OAuth do Google (mesma edge function
 * do app atual); "Sincronizar agora" recarrega os eventos do mês.
 */
export function GoogleCalendarIntegration({ connected, email, busy, onConnect, onSync, onDisconnect }) {
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  return (
    <Card aria-labelledby="agenda-google-title">
      <CardHeader title="Integração com Google Agenda" id="agenda-google-title" />
      <p className={s.gHint} style={{ marginTop: 2 }}>
        Visualize seus compromissos do Google Agenda junto com seus eventos financeiros.
      </p>

      <div className={s.gAccount}>
        <span className={s.gLogo} aria-hidden="true">
          G
        </span>
        <div style={{ minWidth: 0 }}>
          <div className={s.gName}>Google Agenda</div>
          <div className={s.gEmail} title={email}>
            {connected ? email || 'Conta conectada' : 'Nenhuma conta conectada'}
          </div>
        </div>
        <Pill tone={connected ? 'success' : 'neutral'}>{connected ? 'Conectado' : 'Não conectado'}</Pill>
      </div>

      <div className={s.gButtons}>
        {connected ? (
          <>
            <Button variant="outline" icon="refresh-cw" block onClick={onSync} disabled={busy}>
              Sincronizar agora
            </Button>
            {confirmDisconnect ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="outline" size="sm" block onClick={() => setConfirmDisconnect(false)} disabled={busy}>
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  block
                  onClick={() => {
                    setConfirmDisconnect(false);
                    onDisconnect();
                  }}
                  disabled={busy}
                >
                  Confirmar desconexão
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" icon="unplug" onClick={() => setConfirmDisconnect(true)} disabled={busy}>
                Desconectar
              </Button>
            )}
          </>
        ) : (
          <Button icon="link" block onClick={onConnect} disabled={busy}>
            Conectar Google Agenda
          </Button>
        )}
      </div>

      <h3 className={s.syncTitle}>O que é sincronizado?</h3>
      <ul className={s.syncList}>
        {SYNCED.map((row) => (
          <li key={row.label} className={s.syncItem} title={row.note}>
            <Icon name="circle-check" size={16} />
            {row.label}
          </li>
        ))}
      </ul>
    </Card>
  );
}
