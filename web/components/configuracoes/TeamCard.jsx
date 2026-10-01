'use client';

import s from './configuracoes.module.css';
import { SettingsCard, SettingsLinkRow } from './SettingsCard';

/** Rotas de equipa — ainda vivem no app atual (mesmos caminhos de `SETTINGS_ROUTES`). */
const ROUTES = {
  usuarios: '/configuracoes/usuarios',
  solicitacoes: '/configuracoes/solicitacoes',
};

/**
 * Equipe — só para admin/superadmin (papel resolvido no servidor em `requireUser`).
 * «Solicitações de acesso» é exclusivo do superadmin, como no app atual.
 */
export function TeamCard({ role, legacyAppUrl }) {
  const isSuperadmin = role === 'superadmin';
  const base = legacyAppUrl || '';
  const disabledReason = 'Disponível na próxima etapa da migração';

  return (
    <SettingsCard id="equipe" icon="users" title="Equipe" description="Gerencie usuários e permissões.">
      <div className={s.linkList}>
        <SettingsLinkRow
          icon="users"
          title="Gerenciar usuários"
          description="Convites, papéis e bloqueios"
          href={base ? `${base}${ROUTES.usuarios}` : undefined}
          external={Boolean(base)}
          disabled={!base}
          disabledReason={disabledReason}
          ariaLabel="Gerenciar usuários — abre no app atual"
        />
        {isSuperadmin ? (
          <SettingsLinkRow
            icon="shield-check"
            title="Solicitações de acesso"
            description="Aprovar novos pedidos de entrada"
            href={base ? `${base}${ROUTES.solicitacoes}` : undefined}
            external={Boolean(base)}
            disabled={!base}
            disabledReason={disabledReason}
            ariaLabel="Solicitações de acesso — abre no app atual"
          />
        ) : null}
      </div>
    </SettingsCard>
  );
}
