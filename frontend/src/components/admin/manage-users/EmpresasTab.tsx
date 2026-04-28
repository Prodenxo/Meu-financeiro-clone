import React, { useState, useMemo } from 'react';
import { toast } from '../../../lib/toast';
import { updateEmpresaLimits } from '../../../services/usersService';

interface ManagedUser {
  id: string;
  empresaId: string | null;
  mei?: boolean | null;
}

interface Empresa {
  id: string;
  empresa; string;
  max_mei?: number | null;
  max_usuarios_nao_mei?: number | null;
  createdAt?: string;
}

interface EmpresasTabProps {
  empresas: Empresa[];
  users: ManagedUser[];
  fetchEmpresas: () => Promise<void>;
}

export const EmpresasTab: React.FC<EmpresasTabProps> = ({ empresas, users, fetchEmpresas }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null);

  // Estados para formulário (reutilizados para edit/create)
  const [formData, setFormData] = useState({
    nome: '',
    maxMei: '1',
    maxNaoMei: '0',
    meiEnabled: false
  });

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filtragem
  const filteredEmpresas = useMemo(() => {
    return empresas.filter(e => 
      e.empresa.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [empresas, searchTerm]);

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

  const handleEditClick = (empresa: Empresa) => {
    setSelectedEmpresa(empresa);
    const meiVal = empresa.max_mei || 0;
    setFormData({
      nome: empresa.empresa,
      meiEnabled: meiVal > 0,
      maxMei: meiVal > 0 ? meiVal.toString() : '1',
      maxNaoMei: empresa.max_usuarios_nao_mei?.toString() || '0'
    });
    setIsEditModalOpen(true);
  };

  const handleStartCreate = () => {
    setSelectedEmpresa(null);
    setFormData({
      nome: '',
      meiEnabled: true,
      maxMei: '5',
      maxNaoMei: '0'
    });
    setIsCreateModalOpen(true);
  };

  const handleSave = async (mode: 'create' | 'edit') => {
    if (!formData.nome.trim()) {
      toast.error('O nome da empresa é obrigatório.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        empresa: formData.nome,
        max_mei: formData.meiEnabled ? (Number(formData.maxMei) || 1) : 0,
        max_usuarios_nao_mei: Number(formData.maxNaoMei) || 0,
      };

      if (mode === 'edit' && selectedEmpresa) {
        await updateEmpresaLimits(selectedEmpresa.id, payload);
        toast.success('Empresa atualizada com sucesso!');
      } else {
        await createEmpresaLimits(payload);
        toast.success('Empresa cadastrada com sucesso!');
      }

      await fetchEmpresas();
      setIsEditModalOpen(false);
      setIsCreateModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao processar empresa');
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
                  const maxMei = empresa.max_mei || 0;
                  const maxRegular = empresa.max_usuarios_nao_mei || 0;
                  const stats = getUsageStats(empresa.id, maxMei, maxRegular);

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
                        {maxMei > 0 ? (
                          <div className="flex flex-col gap-2">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tight">
                                  {stats.meiUsed} em uso
                                </span>
                                <span className="text-slate-300 dark:text-slate-700">|</span>
                                <span className={`text-[11px] font-bold uppercase tracking-tight ${
                                  stats.meiAvailable === 0 ? 'text-rose-500' : 'text-emerald-500'
                                }`}>
                                  {stats.meiAvailable} disponíveis
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                Limite total: {maxMei} usuários
                              </span>
                            </div>
                            <div className="w-40 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  (stats.meiUsed / maxMei) >= 1 ? 'bg-rose-500' : (stats.meiUsed / maxMei) > 0.8 ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(100, (stats.meiUsed / maxMei) * 100)}%` }}
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
                            {maxRegular === 0 ? (
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
                        <button
                          onClick={() => handleEditClick(empresa)}
                          className="inline-flex items-center justify-center px-4 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
                        >
                          Editar
                        </button>
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

      {/* Modal de Cadastro/Edição */}
      {(isEditModalOpen || isCreateModalOpen) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="planner-card w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                {isCreateModalOpen ? 'Nova Empresa' : 'Editar Empresa'}
              </h3>
              <button 
                onClick={() => { setIsEditModalOpen(false); setIsCreateModalOpen(false); }} 
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Nome da Empresa</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="planner-input w-full"
                  placeholder="Ex: Contabilidade Central"
                />
              </div>

              {/* Módulo MEI com Toggle */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Módulo MEI</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Habilita a criação de usuários MEI para esta empresa.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, meiEnabled: !formData.meiEnabled })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      formData.meiEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.meiEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {formData.meiEnabled && (
                  <div className="animate-in slide-in-from-top-2 duration-200">
                    <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Limite de usuários MEI</label>
                    <input
                      type="number"
                      min={1}
                      value={formData.maxMei}
                      onChange={(e) => setFormData({ ...formData, maxMei: e.target.value })}
                      className="planner-input w-full"
                      placeholder="Quantidade permitida"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Limite de Clientes (PF/Outros)</label>
                <input
                  type="number"
                  min={0}
                  value={formData.maxNaoMei}
                  onChange={(e) => setFormData({ ...formData, maxNaoMei: e.target.value })}
                  className="planner-input w-full"
                  placeholder="0 = sem limite"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-8">
              <button 
                onClick={() => { setIsEditModalOpen(false); setIsCreateModalOpen(false); }} 
                className="planner-button-secondary px-6"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleSave(isCreateModalOpen ? 'create' : 'edit')} 
                disabled={loading}
                className={`planner-button text-white px-8 shadow-lg ${
                  isCreateModalOpen 
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20' 
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                }`}
              >
                {loading ? 'Salvando...' : (isCreateModalOpen ? 'Cadastrar Empresa' : 'Salvar Alterações')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
