import { useState, useMemo, useEffect, useRef } from 'react';
import { type ManagedUser, type EmpresaOption } from '../../../services/usersService';
import { matchManagedUserSearch } from '../../../utils/matchManagedUserSearch';
import { getMeiUserStatusShort, isMeiSlotUser } from '../../../lib/meiUserSlot';
import { formatIsoDateUtcCalendarPtBr } from '../../../utils/formatIsoDateUtcCalendarPtBr';
import { getManagedUserActions } from '../../../lib/managedUserActions';
import { useAuthStore } from '../../../store/authStore';
import LoadingOverlay from '../../LoadingOverlay';

interface UserListTabProps {
  users: ManagedUser[];
  empresas: EmpresaOption[];
  role: string | null;
  loading: boolean;
  fetchError: string;
  onStartEdit: (user: ManagedUser) => void;
  onBan: (user: ManagedUser) => void;
  onUnban: (user: ManagedUser) => void;
  onResetPassword: (user: ManagedUser) => void;
  onDelete: (user: ManagedUser) => void;
  onImpersonate: (user: ManagedUser) => void;
  onCreateClick: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function UserListTab({
  users,
  empresas,
  role,
  loading,
  fetchError,
  onStartEdit,
  onBan,
  onUnban,
  onResetPassword,
  onDelete,
  onImpersonate,
  onCreateClick,
  searchTerm,
  onSearchChange,
}: UserListTabProps) {
  const currentUserId = useAuthStore((s) => s.userId);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [inputValue, setInputValue] = useState(searchTerm);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sincroniza valor local se o pai mudar (ex: ao limpar busca)
  useEffect(() => {
    setInputValue(searchTerm);
  }, [searchTerm]);

  // Reset de página ao filtrar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const baseUsers = useMemo(() => {
    if (role === 'admin') {
      return users.filter((user) => user.role !== 'superadmin' && user.role !== 'outsider');
    }
    return users;
  }, [users, role]);

  const sortedUsers = useMemo(
    () =>
      [...baseUsers].sort((userA, userB) => {
        const labelA = (userA.displayName || userA.email || '').toLowerCase();
        const labelB = (userB.displayName || userB.email || '').toLowerCase();
        return labelA.localeCompare(labelB, 'pt-BR', { sensitivity: 'base' });
      }),
    [baseUsers]
  );

  const filteredUsers = useMemo(
    () =>
      inputValue.trim()
        ? sortedUsers.filter((user) => matchManagedUserSearch(user, inputValue))
        : sortedUsers,
    [inputValue, sortedUsers]
  );

  const handleSearchChange = (value: string) => {
    setInputValue(value);
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      onSearchChange(value);
    }, 400);
  };

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const startIndex = (currentPageSafe - 1) * pageSize;
  const startDisplay = filteredUsers.length === 0 ? 0 : startIndex + 1;
  const endDisplay = Math.min(startIndex + pageSize, filteredUsers.length);
  const pagedUsers = filteredUsers.slice(startIndex, startIndex + pageSize);

  const getRoleLabel = (userRole: string) => {
    if (userRole === 'admin') return 'Admin';
    if (userRole === 'superadmin') return 'Superadmin';
    if (userRole === 'outsider') return 'Outsider';
    return 'Usuário';
  };

  const getRoleBadgeClass = (userRole: string) => {
    if (userRole === 'admin') return 'admin-badge-primary';
    if (userRole === 'superadmin') return 'admin-badge-danger';
    if (userRole === 'outsider') return 'admin-badge-warning';
    return 'admin-badge-neutral';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
        <div className="admin-section-header flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="admin-section-title">Usuários da Plataforma</h2>
            <p className="admin-section-subtitle">
              {role === 'superadmin'
                ? 'Gerencie acesso em todas as empresas visíveis.'
                : 'Gerencie membros da sua empresa.'}
            </p>
          </div>
          <button
            onClick={onCreateClick}
            className="planner-button flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {role === 'superadmin' ? 'Novo Usuário' : 'Novo Membro'}
          </button>
        </div>

        {loading ? (
          <LoadingOverlay message="Carregando usuários..." />
        ) : fetchError ? (
          <div className="admin-empty-state border-rose-300/90 text-rose-600 dark:border-rose-800/80 dark:text-rose-400">
            {fetchError}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="admin-toolbar flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:max-w-md">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(event) => handleSearchChange(event.target.value)}
                  className="planner-input-compact w-full pl-10"
                  placeholder="Nome, email, telefone, empresa ou perfil..."
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => handleSearchChange('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <span>Por página</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="planner-input-compact py-1 px-2 text-xs"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="admin-empty-state">
                {searchTerm !== ''
                  ? `Nenhum usuário encontrado para "${searchTerm}".`
                  : 'Nenhum usuário cadastrado.'}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200/80 dark:border-slate-700/80">
                <table className="w-full border-collapse text-left text-sm text-slate-700 dark:text-slate-200">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/90 dark:border-slate-700 dark:bg-slate-900/50">
                      <th className="px-4 py-3 font-semibold">Usuário</th>
                      <th className="px-4 py-3 font-semibold">Contato</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Empresa</th>
                      <th className="px-4 py-3 font-semibold text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedUsers.map((user) => {
                      const actions = getManagedUserActions(role, user, currentUserId);
                      const isBlocked = user.status === false;

                      return (
                        <tr
                          key={user.id}
                          className="border-b border-slate-100 dark:border-slate-800/80 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-900 dark:text-white">
                                {user.displayName || 'Sem nome'}
                              </span>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={getRoleBadgeClass(user.role)}>
                                  {getRoleLabel(user.role)}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col text-xs space-y-1">
                              <span>{user.email}</span>
                              {user.phone && <span className="text-slate-500">{user.phone}</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col items-start gap-1">
                              <span className={isBlocked ? 'admin-badge-danger' : 'admin-badge-success'}>
                                {isBlocked ? 'Bloqueado' : 'Ativo'}
                              </span>
                              {user.role === 'usuario' && user.expiresAt && (
                                <span
                                  className={
                                    new Date(user.expiresAt) < new Date()
                                      ? 'text-xs text-rose-500'
                                      : 'text-xs text-amber-500'
                                  }
                                >
                                  {new Date(user.expiresAt) < new Date()
                                    ? 'Expirado'
                                    : `Expira em ${formatIsoDateUtcCalendarPtBr(user.expiresAt)}`}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col items-start gap-1">
                              <span className="text-xs font-medium">
                                {user.empresaName || user.empresaId || 'Sem empresa'}
                              </span>
                              <span className={isMeiSlotUser(user.mei) ? 'admin-badge-primary' : 'admin-badge-warning'}>
                                {getMeiUserStatusShort(user.mei)}
                              </span>
                            </div>
                          </td>
                           <td className="px-4 py-3 text-right">
                             <div className="flex items-center justify-end gap-2">
                               {actions.canImpersonate && (
                                 <button
                                   onClick={() => onImpersonate(user)}
                                   title={user.id === currentUserId ? 'Acessar como você mesmo' : 'Acessar como este usuário'}
                                   className="planner-button-secondary-compact text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                                 >
                                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                   </svg>
                                 </button>
                               )}
                               {actions.canEdit && (
                                 <button
                                   onClick={() => onStartEdit(user)}
                                   className="planner-button-secondary-compact text-blue-600 dark:text-blue-400"
                                 >
                                   Editar
                                 </button>
                               )}
                               {actions.canDelete && (
                                 <button
                                   onClick={() => onDelete(user)}
                                   title="Excluir usuário"
                                   className="planner-button-secondary-compact text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                                 >
                                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                   </svg>
                                 </button>
                               )}
                             </div>
                           </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {filteredUsers.length > 0 && (
              <div className="admin-toolbar flex flex-col items-center justify-between gap-3 md:flex-row">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPageSafe <= 1}
                  className="planner-button-secondary-compact w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Anterior
                </button>
                <div className="text-center text-sm text-slate-600 dark:text-slate-300">
                  <p>
                    Página {currentPageSafe} de {totalPages}
                  </p>
                  <p>
                    Mostrando {startDisplay}-{endDisplay} de {filteredUsers.length}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={currentPageSafe >= totalPages}
                  className="planner-button-secondary-compact w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Próximo
                </button>
              </div>
            )}
          </div>
        )}
    </div>
  );
}
