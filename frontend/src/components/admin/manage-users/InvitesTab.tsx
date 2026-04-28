import { useState, useEffect } from 'react';
import { toast } from '../../../lib/toast';
import {
  listPendingInvites,
  createInvite,
  revokeInvite,
  type EmpresaInviteRow
} from '../../../services/invitesService';
import LoadingOverlay from '../../LoadingOverlay';
import { type EmpresaOption, type ManagedUser } from '../../../services/usersService';

interface InvitesTabProps {
  role: string | null;
  empresas: EmpresaOption[];
  users: ManagedUser[];
}

export function InvitesTab({ role, empresas, users }: InvitesTabProps) {
  const [invites, setInvites] = useState<EmpresaInviteRow[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(false);
  const [invitesError, setInvitesError] = useState('');
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);
  const [inviteActionLoading, setInviteActionLoading] = useState(false);
  const [inviteEmpresaId, setInviteEmpresaId] = useState('');
  const [inviteEmpresaQuery, setInviteEmpresaQuery] = useState('');
  const [inviteEmpresaOpen, setInviteEmpresaOpen] = useState(false);

  const getErrorMessage = (err: unknown, fallback: string) => {
    if (err instanceof Error && err.message) return err.message;
    return fallback;
  };

  const loadInvites = async () => {
    setInvitesLoading(true);
    setInvitesError('');
    try {
      const data = await listPendingInvites();
      setInvites(data.invites || []);
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'Erro ao listar convites');
      setInvitesError(msg);
      toast.error(msg);
    } finally {
      setInvitesLoading(false);
    }
  };

  useEffect(() => {
    void loadInvites();
  }, []);

  const formatInviteDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return iso;
    }
  };

  const getInviteCreatorLabel = (createdBy: string) => {
    const match = users.find((u) => u.id === createdBy);
    if (match) return match.displayName || match.email || '—';
    return '—';
  };

  const getEmpresaNameForInvite = (empresaId: string) => {
    const found = empresas.find((e) => e.id === empresaId);
    return found?.empresa ?? '—';
  };

  const handleGenerateInvite = async () => {
    if (role === 'superadmin' && !inviteEmpresaId) {
      toast.error('Selecione a empresa para gerar o convite.');
      return;
    }
    setInviteActionLoading(true);
    try {
      const body = role === 'superadmin' ? { empresas_id: inviteEmpresaId } : {};
      const result = await createInvite(body);
      setLastInviteUrl(result.inviteUrl);
      toast.success('Link gerado. Use Copiar link para enviar ao convidado.');
      await loadInvites();
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'Erro ao gerar convite');
      toast.error(msg);
    } finally {
      setInviteActionLoading(false);
    }
  };

  const handleCopyInviteLink = async () => {
    if (!lastInviteUrl) {
      toast.error('Gere um link antes de copiar.');
      return;
    }
    try {
      await navigator.clipboard.writeText(lastInviteUrl);
      toast.success('Link copiado para a área de transferência.');
    } catch {
      toast.error('Não foi possível copiar automaticamente.');
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!window.confirm('Revogar este convite? O link deixará de funcionar.')) return;
    setInviteActionLoading(true);
    try {
      await revokeInvite(inviteId);
      toast.success('Convite revogado.');
      await loadInvites();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Erro ao revogar convite'));
    } finally {
      setInviteActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
        <div className="admin-section-header">
          <div>
            <h2 className="admin-section-title">Convites por link</h2>
            <p className="admin-section-subtitle">
              {role === 'superadmin'
                ? 'Gere um link de cadastro (URL da API), copie e envie ao convidado. Convites pendentes aparecem na lista.'
                : 'Gere um link de cadastro para a sua empresa, copie e envie. Convites pendentes aparecem abaixo.'}
            </p>
          </div>
        </div>
        <div className="space-y-4">
          {role === 'superadmin' ? (
            <div className="relative">
              <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                Empresa para o convite (apenas para gerar o link)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inviteEmpresaQuery}
                  onChange={(e) => {
                    const value = e.target.value;
                    setInviteEmpresaQuery(value);
                    setInviteEmpresaOpen(true);
                    const match = empresas.find(
                      (empresa) => empresa.empresa.toLowerCase() === value.toLowerCase()
                    );
                    setInviteEmpresaId(match?.id || '');
                  }}
                  onFocus={() => setInviteEmpresaOpen(true)}
                  onBlur={() => {
                    window.setTimeout(() => setInviteEmpresaOpen(false), 150);
                  }}
                  className="planner-input-compact"
                  placeholder="Selecione a empresa"
                />
                <button
                  type="button"
                  onClick={() => setInviteEmpresaOpen((open) => !open)}
                  className="planner-button-secondary-compact"
                  aria-label="Listar empresas para convite"
                >
                  ▾
                </button>
              </div>
              {inviteEmpresaOpen && (
                <div className="admin-dropdown-panel">
                  {(empresas || [])
                    .filter((empresa) =>
                      empresa.empresa.toLowerCase().includes(inviteEmpresaQuery.toLowerCase())
                    )
                    .map((empresa) => (
                      <button
                        key={empresa.id}
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          setInviteEmpresaQuery(empresa.empresa);
                          setInviteEmpresaId(empresa.id);
                          setInviteEmpresaOpen(false);
                        }}
                        className="admin-dropdown-option"
                      >
                        {empresa.empresa}
                      </button>
                    ))}
                  {empresas.length === 0 && (
                    <div className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400">
                      Nenhuma empresa encontrada.
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleGenerateInvite()}
              disabled={inviteActionLoading || (role === 'superadmin' && !inviteEmpresaId)}
              aria-busy={inviteActionLoading}
              className="planner-button disabled:cursor-not-allowed disabled:opacity-50"
            >
              {inviteActionLoading ? 'Processando...' : 'Gerar link'}
            </button>
            <button
              type="button"
              onClick={() => void handleCopyInviteLink()}
              disabled={!lastInviteUrl}
              aria-label="Copiar link de convite"
              className="planner-button-secondary-compact disabled:cursor-not-allowed disabled:opacity-50"
            >
              Copiar link
            </button>
            <button
              type="button"
              onClick={() => void loadInvites()}
              disabled={invitesLoading}
              className="planner-button-secondary-compact disabled:cursor-not-allowed disabled:opacity-50"
            >
              {invitesLoading ? 'Atualizando...' : 'Atualizar lista'}
            </button>
          </div>

          {lastInviteUrl ? (
            <p className="text-xs text-emerald-700 dark:text-emerald-400">
              Link gerado nesta sessão — use <strong>Copiar link</strong> para colar em outro canal (e-mail,
              mensagem).
            </p>
          ) : null}

          {invitesError ? (
            <div className="rounded-xl border border-rose-300/90 bg-rose-50/90 px-4 py-3 text-rose-700 dark:border-rose-800/80 dark:bg-rose-950/40 dark:text-rose-300">
              {invitesError}
            </div>
          ) : null}

          {invitesLoading ? (
            <LoadingOverlay message="Carregando convites..." />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200/80 dark:border-slate-700/80">
              <table className="w-full border-collapse text-left text-sm text-slate-700 dark:text-slate-200">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/90 dark:border-slate-700 dark:bg-slate-900/50">
                    {role === 'superadmin' ? (
                      <th className="px-4 py-3 font-semibold">Empresa</th>
                    ) : null}
                    <th className="px-4 py-3 font-semibold">Criado em</th>
                    <th className="px-4 py-3 font-semibold">Expira em</th>
                    <th className="px-4 py-3 font-semibold">Criador</th>
                    <th className="px-4 py-3 font-semibold">E-mail convidado</th>
                    <th className="px-4 py-3 font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {invites.length === 0 ? (
                    <tr>
                      <td
                        colSpan={role === 'superadmin' ? 6 : 5}
                        className="px-4 py-6 text-center text-slate-500 dark:text-slate-400"
                      >
                        Nenhum convite pendente.
                      </td>
                    </tr>
                  ) : (
                    invites.map((inv) => (
                      <tr
                        key={inv.id}
                        className="border-b border-slate-100 dark:border-slate-800/80 last:border-0"
                      >
                        {role === 'superadmin' ? (
                          <td className="px-4 py-3">{getEmpresaNameForInvite(inv.empresas_id)}</td>
                        ) : null}
                        <td className="px-4 py-3 whitespace-nowrap">{formatInviteDate(inv.created_at)}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{formatInviteDate(inv.expires_at)}</td>
                        <td className="px-4 py-3">{getInviteCreatorLabel(inv.created_by)}</td>
                        <td className="px-4 py-3">{inv.invited_email || '—'}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => void handleRevokeInvite(inv.id)}
                            disabled={inviteActionLoading}
                            className="planner-button-secondary-compact text-rose-700 dark:text-rose-400 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Revogar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
    </div>
  );
}
