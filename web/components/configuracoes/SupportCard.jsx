'use client';

import s from './configuracoes.module.css';
import { SettingsCard, SettingsLinkRow } from './SettingsCard';

/** Destinos do app atual (`SettingsScreen.tsx`) — não inventar outros canais. */
export const SUPPORT_WHATSAPP_URL = 'https://wa.me/5521974526796';
export const SUPPORT_GROUP_URL = 'https://chat.whatsapp.com/G0F3SaEFfvNI066k5MYKDT';

export function SupportCard({ onOpenTicket }) {
  return (
    <SettingsCard id="suporte" icon="headset" title="Suporte" description="Ajuda humana e comunidade.">
      <div className={s.linkList}>
        <SettingsLinkRow icon="ticket" title="Abrir chamado" description="Registre um ticket de suporte técnico" onClick={onOpenTicket} />
        <SettingsLinkRow icon="message-circle" title="Fale com o Agente" description="WhatsApp do consultor pessoal" href={SUPPORT_WHATSAPP_URL} external ariaLabel="Fale com o Agente no WhatsApp" />
        <SettingsLinkRow icon="messages-square" title="Grupo de suporte" description="Tire dúvidas com outros usuários" href={SUPPORT_GROUP_URL} external ariaLabel="Entrar no grupo de suporte do WhatsApp" />
      </div>
    </SettingsCard>
  );
}
