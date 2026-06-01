import React, { useState, useMemo, useEffect } from 'react';
import { CreditCard } from 'lucide-react';
import { toast } from '../../../lib/toast';
import { EmpresaStripeMeiBillingModal } from './EmpresaStripeMeiBillingModal';
import EmpresaModal from '../../EmpresaModal';
import {
  deleteEmpresa,
  getEmpresaById,
  type EmpresaFullData,
  type ManagedUser
} from '../../../services/usersService';
import { getMeiUserTypeLabel, isMeiSlotUser } from '../../../lib/meiUserSlot';

interface Empresa {
  id: string;
  empresa: string;
  max_mei?: number | null;
  max_usuarios_nao_mei?: number | null;
  legacy_mei_slots_pix?: number | null;
  createdAt?: string;
}

interface EmpresasTabProps {
  empresas: Empresa[];
  users: ManagedUser[];
  fetchEmpresas: () => Promise<void>;
}

const roleLabel: Record<ManagedUser['role'], string> = {
  superadmin: 'Superadmin',
  admin: 'Admin',
  usuario: 'Usuário',
  outsider: 'Externo'
};

export const EmpresasTab: React.FC<EmpresasTabProps> = ({ empresas, users, fetchEmpresas }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [meiStatusFilter, setMeiStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [loading, setLoading] = useState(false);
  const [empresaFormOpen, setEmpresaFormOpen] = useState(false);
  const [empresaFormInitial, setEmpresaFormInitial] = useState<EmpresaFullData | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [empresaForMembers, setEmpresaForMembers] = useState<Empresa | null>(null);
  const [empresaToDelete, setEmpresaToDelete] = useState<Empresa | null>(null);
  const [empresaBilling, setEmpresaBilling] = useState<Empresa | null>(null);

  useEffect(() => {
    if (!empresaBilling) return;
    const fresh = empresas.find((e) => e.id === empresaBilling.id);
    if (
      fresh &&
      (fresh.max_mei !== empresaBilling.max_mei ||
        fresh.empresa !== empresaBilling.empresa)
    ) {
      setEmpresaBilling(fresh);
    }
  }, [empresas, empresaBilling]);

  /** Volta de outro separador / após pagamento: atualiza limites na tabela. */
  useEffect(() => {
    let debounce: ReturnType<typeof setTimeout> | null = null;
    const onVisibility = () => {
      if (document.visibilityState !== 'visible') return;
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => {
        void fetchEmpresas();
      }, 400);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      if (debounce) clearTimeout(debounce);
    };
  }, [fetchEmpresas]);

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filtragem
  const totalEmpresasMeiAtivo = useMemo(() => {
    return empresas.filter((empresa) => {
      const maxMei = empresa.max_mei || 0;
      const meiUsed = users.filter((u) => u.empresaId === empresa.id && u.mei).length;
      return maxMei > 0 || meiUsed > 0;
    }).length;
  }, [empresas, users]);

  const filteredEmpresas = useMemo(() => {
    return empresas.filter((empresa) => {
      const matchesName = empresa.empresa.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesName) return false;

      if (meiStatusFilter === 'all') return true;

      const maxMei = empresa.max_mei || 0;
      const meiUsed = users.filter((u) => u.empresaId === empresa.id && u.mei).length;
      const meiAtivo = maxMei > 0 || meiUsed > 0;

      return meiStatusFilter === 'active' ? meiAtivo : !meiAtivo;
    });
  }, [empresas, searchTerm, meiStatusFilter, users]);

  const totalPages = Math.ceil(filteredEmpresas.length / pageSize);
  const currentData = filteredEmpresas.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Lógica de cálculo de uso por empresa
  const getUsageStats = (empresaId: string, maxMei: number, maxNaoMei: number) => {
    const empresaUsers = users.filter(u => u.empresaId === empresaId);
    
    const meiUsed = empresaUsers.filter(u => u.mei).length;
    const meiAvailable = Math.max(0, maxMei - meiUsed);
    
    const regularUsed = empresaUsers.filter(u => !u.mei).length;
    const regularAvailable = maxNaoMei > 0 ? Math.max(0, maxNaoMei - regularUsed) : Infinity;

    return {
      meiUsed,
      meiAvailable,
      regularUsed,
      regularAvailable
    };
  };

  const handleEditClick = async (empresa: Empresa) => {
    setLoading(true);
    try {
      const res = await getEmpresaById(empresa.id);
      setEmpresaFormInitial(res?.empresa ?? { id: empresa.id, empresa: empresa.empresa });
      setEmpresaFormOpen(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar dados da empresa';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartCreate = () => {
    setEmpresaFormInitial(null);
    setEmpresaFormOpen(true);
  };

  const handleEmpresaSaved = async () => {
    setEmpresaFormOpen(false);
    setEmpresaFormInitial(null);
    toast.success('Empresa salva com sucesso!');
    await fetchEmpresas();
  };

  const handleDeleteClick = (empresa: Empresa) => {
    setEmpresaToDelete(empresa);
    setIsDeleteModalOpen(true);
  };

  const handleViewMembers = (empresa: Empresa) => {
    setEmpresaForMembers(empresa);
    setIsMembersModalOpen(true);
  };

  const membersOfSelectedEmpresa = useMemo(() => {
    if (!empresaForMembers) return [];
    return users.filter((u) => u.empresaId === empresaForMembers.id);
  }, [users, empresaForMembers]);

  const confirmDelete = async () => {
    if (!empresaToDelete) return;

    setLoading(true);
    try {
      await deleteEmpresa(empresaToDelete.id);
      toast.success('Empresa excluída com sucesso!');
      await fetchEmpresas();
      setIsDeleteModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir empresa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="admin-section-title">Empresas Cadastradas</h2>
          <p className="admin-section-subtitle">Gerencie os limites e dados das empresas da plataforma.</p>
        </div>
        <button
          onClick={handleStartCreate}
          className="planner-button flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg shadow-emerald-500/20"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nova Empresa
        </button>
      </div>

      {/* Toolbar */}
      <div className="admin-toolbar flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 flex-1 max-w-3xl">
          <div className="relative flex-1 max-w-lg">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Pesquisar por nome da empresa..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="planner-input pl-10 w-full"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <span>Filtro MEI</span>
              <select
                value={meiStatusFilter}
                onChange={(e) => {
                  setMeiStatusFilter(e.target.value as 'all' | 'active' | 'inactive');
                  setCurrentPage(1);
                }}
                className="planner-input-compact min-w-[170px]"
                aria-label="Filtrar empresas por estado do MEI"
              >
                <option value="all">Todas as empresas</option>
                <option value="active">Só MEI ativo</option>
                <option value="inactive">Só MEI inativo</option>
              </select>
            </label>

            <span className="inline-flex items-center rounded-full border border-emerald-200 dark:border-emerald-700/40 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              MEI ativo: {totalEmpresasMeiAtivo}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
          <span>Por página</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="planner-input-compact w-20"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Tabela */}
      <div className="admin-table-shell">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Módulo MEI</th>
                <th>Clientes PF (Outros)</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {currentData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    Nenhuma empresa encontrada.
                  </td>
                </tr>
              ) : (
                currentData.map((empresa) => {
                  const maxMei =
                    empresa.max_mei === null || empresa.max_mei === undefined
                      ? 0
                      : Number(empresa.max_mei) || 0;
                  const naoMeiUnlimited = empresa.max_usuarios_nao_mei === null
                    || empresa.max_usuarios_nao_mei === undefined
                    || empresa.max_usuarios_nao_mei === 0;
                  const maxRegular = naoMeiUnlimited ? 0 : (empresa.max_usuarios_nao_mei || 0);
                  const stats = getUsageStats(empresa.id, maxMei, maxRegular);
                  const meiEnabled = maxMei > 0;
                  const effectiveMaxMei = Math.max(maxMei, stats.meiUsed, 1);
                  const meiProgressRatio = stats.meiUsed / effectiveMaxMei;
                  const meiAvailable = Math.max(0, effectiveMaxMei - stats.meiUsed);

                  return (
                    <tr key={empresa.id} className="border-b border-slate-100 dark:border-slate-800/50 last:border-0 hover:bg-slate-50/30 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="py-6">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900 dark:text-slate-100">{empresa.empresa}</span>
                          <span className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {empresa.id.substring(0, 8)}</span>
                        </div>
                      </td>
                      
                      {/* Estatísticas MEI - Versão Humana */}
                      <td className="py-6">
                        {meiEnabled ? (
                          <div className="flex flex-col gap-2">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tight">
                                  {stats.meiUsed} em uso
                                </span>
                                <span className="text-slate-300 dark:text-slate-700">|</span>
                                <span className={`text-[11px] font-bold uppercase tracking-tight ${
                                  meiAvailable === 0 ? 'text-rose-500' : 'text-emerald-500'
                                }`}>
                                  {meiAvailable} disponíveis
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                {maxMei > 0
                                  ? `Limite total: ${maxMei} usuários`
                                  : `Sincronizado por uso atual: ${effectiveMaxMei} usuário${effectiveMaxMei > 1 ? 's' : ''}`}
                              </span>
                            </div>
                            <div className="w-40 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  meiProgressRatio >= 1 ? 'bg-rose-500' : meiProgressRatio > 0.8 ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(100, meiProgressRatio * 100)}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800/50 px-2.5 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700/50 uppercase tracking-wider">
                            Desativado
                          </span>
                        )}
                      </td>

                      {/* Estatísticas PF - Versão Humana */}
                      <td className="py-6">
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-col gap-1">
                            {naoMeiUnlimited ? (
                              <div className="flex flex-col gap-1">
                                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-tight">
                                  {stats.regularUsed} cadastrados
                                </span>
                                <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-black text-blue-700 dark:text-blue-400 border border-blue-200/50 dark:border-blue-500/20 w-fit uppercase">
                                  Ilimitado
                                </span>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tight">
                                    {stats.regularUsed} em uso
                                  </span>
                                  <span className="text-slate-300 dark:text-slate-700">|</span>
                                  <span className={`text-[11px] font-bold uppercase tracking-tight ${
                                    stats.regularAvailable === 0 ? 'text-rose-500' : 'text-blue-500'
                                  }`}>
                                    {stats.regularAvailable} disponíveis
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                  Limite total: {maxRegular} clientes
                                </span>
                              </>
                            )}
                          </div>
                          {maxRegular > 0 && (
                            <div className="w-40 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  (stats.regularUsed / maxRegular) >= 1 ? 'bg-rose-500' : (stats.regularUsed / maxRegular) > 0.8 ? 'bg-amber-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${Math.min(100, (stats.regularUsed / maxRegular) * 100)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEmpresaBilling(empresa)}
                            title="Cobrança MEI (link de pagamento ou próxima fatura)"
                            className="inline-flex items-center justify-center p-2 text-sm font-medium text-violet-600 dark:text-violet-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all shadow-sm"
                          >
                            <CreditCard className="h-4 w-4" aria-hidden />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleViewMembers(empresa)}
                            title="Ver membros desta empresa"
                            className="inline-flex items-center justify-center p-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all shadow-sm"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleEditClick(empresa)}
                            title="Editar empresa"
                            className="inline-flex items-center justify-center p-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all shadow-sm"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteClick(empresa)}
                            title="Excluir empresa"
                            disabled={loading}
                            className="inline-flex items-center justify-center p-2 text-sm font-medium text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all shadow-sm disabled:opacity-50"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="admin-table-pagination">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Mostrando <span className="font-medium text-slate-900 dark:text-slate-200">{(currentPage - 1) * pageSize + 1}</span> a{' '}
              <span className="font-medium text-slate-900 dark:text-slate-200">{Math.min(currentPage * pageSize, filteredEmpresas.length)}</span> de{' '}
              <span className="font-medium text-slate-900 dark:text-slate-200">{filteredEmpresas.length}</span> empresas
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="planner-button-secondary-compact disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="planner-button-secondary-compact disabled:opacity-50"
              >
                Próximo
              </button>
            </div>
          </div>
        )}
      </div>

      <EmpresaStripeMeiBillingModal
        open={Boolean(empresaBilling)}
        empresa={
          empresaBilling
            ? {
                id: empresaBilling.id,
                empresa: empresaBilling.empresa,
                maxMeiPlataforma:
                  empresaBilling.max_mei === undefined || empresaBilling.max_mei === null
                    ? null
                    : Number(empresaBilling.max_mei),
                meiUsuariosEmUso: users.filter(
                  (u) => u.empresaId === empresaBilling.id && u.mei
                ).length
              }
            : null
        }
        onClose={() => {
          setEmpresaBilling(null);
          void fetchEmpresas();
        }}
        onMaxMeiSynced={() => fetchEmpresas()}
      />

      {/* Modal: membros da empresa */}
      {isMembersModalOpen && empresaForMembers && (
        <div
          className="fixed inset-0 z-[105] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300"
          role="dialog"
          aria-modal="true"
          aria-labelledby="empresa-members-title"
        >
          <div className="planner-card w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 shrink-0">
              <div>
                <h3 id="empresa-members-title" className="text-lg font-semibold text-slate-900 dark:text-white">
                  Membros da empresa
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{empresaForMembers.empresa}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsMembersModalOpen(false);
                  setEmpresaForMembers(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-lg p-1"
                aria-label="Fechar"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto p-6 flex-1">
              {membersOfSelectedEmpresa.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
                  Nenhum usuário vinculado a esta empresa.
                </p>
              ) : (
                <ul className="space-y-3">
                  {membersOfSelectedEmpresa.map((member) => (
                    <li
                      key={member.id}
                      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/40 px-4 py-3"
                    >
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {member.displayName || member.email || 'Sem nome'}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{member.email || '—'}</div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="inline-flex items-center rounded-md bg-white dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                          {roleLabel[member.role] ?? member.role}
                        </span>
                        <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {getMeiUserTypeLabel(member.mei)}
                        </span>
                        {member.status === false ? (
                          <span className="inline-flex items-center rounded-md bg-rose-50 dark:bg-rose-900/30 px-2 py-0.5 text-[10px] font-semibold text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            Bloqueado
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            Ativo
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 shrink-0 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsMembersModalOpen(false);
                  setEmpresaForMembers(null);
                }}
                className="planner-button-secondary px-6"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal completo de Cadastro/Edição (com CNPJ + endereço + limites) */}
      <EmpresaModal
        open={empresaFormOpen}
        initial={empresaFormInitial}
        onClose={() => {
          setEmpresaFormOpen(false);
          setEmpresaFormInitial(null);
        }}
        onSuccess={handleEmpresaSaved}
      />

      {/* Modal de Exclusão */}
      {isDeleteModalOpen && empresaToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="planner-card w-full max-w-sm p-6 shadow-2xl border-rose-100 dark:border-rose-900/30 animate-in zoom-in-95 duration-200 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-900 shadow-sm">
                <svg className="h-8 w-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Excluir Empresa?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Você está prestes a excluir <strong>{empresaToDelete.empresa}</strong>. 
              <br /><br />
              <span className="text-rose-500 font-medium">Atenção:</span> Todos os vínculos de acesso dos usuários com esta empresa serão permanentemente removidos.
            </p>

            <div className="flex flex-col gap-3">
              <button 
                onClick={confirmDelete}
                disabled={loading}
                className="planner-button w-full bg-rose-500 hover:bg-rose-600 text-white py-3 shadow-lg shadow-rose-500/20"
              >
                {loading ? 'Excluindo...' : 'Sim, Excluir Empresa'}
              </button>
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={loading}
                className="planner-button-secondary w-full py-3"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
