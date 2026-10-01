'use client';

import s from './configuracoes.module.css';
import { SettingsCard, SettingsLinkRow } from './SettingsCard';

/**
 * Equipe — só para admin/superadmin (papel resolvido no servidor em `requireUser`).
 * «Solicitações de acesso» é exclusivo do superadmin; a rota confere o papel de novo no servidor.
 */
export function TeamCard({ role }) {
  const isSuperadmin = role === 'superadmin';

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
            href="/configuracoes/solicitacoes"
            ariaLabel="Solicitações de acesso"
          />
        ) : null}
      </div>
    </SettingsCard>
  );
}
