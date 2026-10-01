'use client';

import s from './configuracoes.module.css';
import { SettingsCard, SettingsLinkRow } from './SettingsCard';

/** «Solicitações de acesso» ainda vive no app atual (mesmo caminho de `SETTINGS_ROUTES`). */
const LEGACY_ROUTES = {
  solicitacoes: '/configuracoes/solicitacoes',
};

/**
 * Equipe — só para admin/superadmin (papel resolvido no servidor em `requireUser`).
 * «Gerenciar acessos» já é do novo site; «Solicitações de acesso» é exclusivo do superadmin.
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
          title="Gerenciar acessos"
          description="Usuários, convites, bloqueios e empresas"
          href="/configuracoes/acessos"
          ariaLabel="Gerenciar acessos"
        />
        {isSuperadmin ? (
          <SettingsLinkRow
            icon="shield-check"
            title="Solicitações de acesso"
            description="Aprovar novos pedidos de entrada"
            href={base ? `${base}${LEGACY_ROUTES.solicitacoes}` : undefined}
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
