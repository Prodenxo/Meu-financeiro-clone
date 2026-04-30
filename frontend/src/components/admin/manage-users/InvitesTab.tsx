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
  const [isReusable, setIsReusable] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

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
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    setInviteActionLoading(true);
    try {
      const body = {
        ...(role === 'superadmin' ? { empresas_id: inviteEmpresaId } : {}),
        is_reusable: isReusable
      };
      const result = await createInvite(body);
      setLastInviteUrl(result.inviteUrl);
      toast.success(isReusable ? 'Link reutilizável gerado!' : 'Link único gerado!');
      await loadInvites();
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'Erro ao gerar convite');
      toast.error(msg);
    } finally {
      setInviteActionLoading(false);
    }
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copiado!');
    } catch {
      toast.error('Erro ao copiar link.');
    }
  };

  const handleCopyInviteLink = () => {
    if (!lastInviteUrl) {
      toast.error('Gere um link antes de copiar.');
      return;
    }
    void copyToClipboard(lastInviteUrl);
  };

  const getInviteUrlFromToken = (token: string) => {
    const base = window.location.origin;
    return `${base}/register?convite=${encodeURIComponent(token)}`;
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
                Empresa para o convite <span className="text-rose-500">*</span> (apenas para gerar o link)
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
                  className={`planner-input-compact ${showErrors && !inviteEmpresaId ? 'border-rose-500 bg-rose-50/5' : ''}`}
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

          <div className="flex items-center gap-2 py-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={isReusable} 
                onChange={(e) => setIsReusable(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-blue-600 transition-colors">
                Link Reutilizável (múltiplos cadastros)
              </span>
            </label>
          </div>

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
                    <th className="px-4 py-3 font-semibold">Tipo</th>
                    <th className="px-4 py-3 font-semibold">Usos</th>
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
                        <td className="px-4 py-3">
                          {inv.is_reusable ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                              Reutilizável
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                              Único
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {inv.uses_count || 0}
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          {inv.raw_token && (
                            <button
                              type="button"
                              onClick={() => void copyToClipboard(getInviteUrlFromToken(inv.raw_token!))}
                              className="planner-button-secondary-compact text-blue-600 dark:text-blue-400"
                            >
                              Copiar Link
                            </button>
                          )}
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
