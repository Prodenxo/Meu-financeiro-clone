import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingOverlay from '../components/LoadingOverlay';

import { toast } from '../lib/toast';
import { useAuthStore } from '../store/authStore';
import { hasRole } from '../lib/roles';
import { validateStrongPassword } from '../lib/passwordPolicy';
import {
  banUser,
  createUser,
  deleteUser,
  listEmpresas,
  listUsers,
  resetUserPassword,
  unbanUser,
  updateUser,
  type EmpresaOption,
  type ManagedUser
} from '../services/usersService';
import { InvitesTab } from '../components/admin/manage-users/InvitesTab';
import { EmpresasTab } from '../components/admin/manage-users/EmpresasTab';
import { UserListTab } from '../components/admin/manage-users/UserListTab';
import { UserModal } from '../components/admin/manage-users/UserModal';
import { DeleteUserModal } from '../components/admin/manage-users/DeleteUserModal';

export default function ManageUsers() {
  const navigate = useNavigate();
  const { role, impersonate } = useAuthStore();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [activeTab, setActiveTab] = useState<'membros' | 'convites' | 'empresas'>('membros');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [empresas, setEmpresas] = useState<EmpresaOption[]>([]);


  const canManage = hasRole(role, ['admin']);

  const fetchUsers = async (search?: string, silent = false) => {
    if (!silent) setLoading(true);
    setFetchError('');
    try {
      const data = await listUsers(search);
      
      setUsers((prev) => {
        if (!search) return data; // Se for carga inicial, substitui tudo
        
        // Se for busca, mesclamos os resultados para não perder o que já temos (fuzzy search local)
        const merged = [...prev];
        data.forEach((newUser) => {
          const index = merged.findIndex((u) => u.id === newUser.id);
          if (index > -1) {
            merged[index] = newUser; // Atualiza se já existir
          } else {
            merged.push(newUser); // Adiciona se for novo
          }
        });
        return merged;
      });

      setFetchError('');
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : 'Erro ao listar usuários');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (!canManage) return;
    
    // Se for a primeira carga (lista vazia), mostramos o loading global.
    // Se já houver dados, a atualização é 'silenciosa' para não interromper o usuário.
    const isInitialLoad = users.length === 0;
    void fetchUsers(searchTerm, !isInitialLoad);
  }, [searchTerm, canManage]);

  const fetchEmpresas = async () => {
    try {
      const data = await listEmpresas();
      if (import.meta.env.DEV) {
        console.log('[ManageUsers] empresas recebidas:', data);
      }
      setEmpresas(data);
    } catch (err: unknown) {
      if (import.meta.env.DEV) {
        console.log('[ManageUsers] erro ao listar empresas:', err);
      }
      setError(getErrorMessage(err, 'Erro ao listar empresas'));
    }
  };




  useEffect(() => {
    if (!canManage) return;
    void fetchEmpresas();
  }, [canManage, role]);

  /** Ao abrir o separador Empresas, recarrega limites (ex.: após pagamento na Stripe noutro separador). */
  useEffect(() => {
    if (!canManage || role !== 'superadmin') return;
    if (activeTab !== 'empresas') return;
    void fetchEmpresas();
  }, [activeTab, canManage, role]);

  const baseUsers =
    role === 'admin'
      ? users.filter((user) => user.role !== 'superadmin' && user.role !== 'outsider')
      : users;


  const totalUsersCount = baseUsers.length;
  const activeUsersCount = baseUsers.filter((user) => user.status !== false).length;
  const blockedUsersCount = baseUsers.filter((user) => user.status === false).length;
  const adminUsersCount = baseUsers.filter((user) => user.role === 'admin').length;

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


  const handleStartEdit = (user: ManagedUser) => {
    setSelectedUser(user);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleStartCreate = () => {
    setSelectedUser(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const getErrorMessage = (err: unknown, fallback: string) => {
    if (err instanceof Error && err.message) return err.message;
    return fallback;
  };

  const handleBanUser = async (user: ManagedUser) => {
    const confirmed = window.confirm('Tem certeza que deseja bloquear este usuário?');
    if (!confirmed) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await banUser(user.id);
      setSuccess('Usuário bloqueado com sucesso.');
      toast.success('Usuário bloqueado com sucesso.');
      await fetchUsers();
      await fetchUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao bloquear usuário');
      toast.error(err.message || 'Erro ao bloquear usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleUnbanUser = async (user: ManagedUser) => {
    const confirmed = window.confirm('Tem certeza que deseja desbloquear este usuário?');
    if (!confirmed) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await unbanUser(user.id);
      setSuccess('Usuário desbloqueado com sucesso.');
      toast.success('Usuário desbloqueado com sucesso.');
      await fetchUsers();
      await fetchUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao desbloquear usuário');
      toast.error(err.message || 'Erro ao desbloquear usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = (user: ManagedUser) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await deleteUser(selectedUser.id);
      setSuccess('Usuário excluído com sucesso.');
      toast.success('Usuário excluído com sucesso.');
      setIsDeleteModalOpen(false);
      await fetchUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir usuário');
      toast.error(err instanceof Error ? err.message : 'Erro ao excluir usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (user: ManagedUser) => {
    const newPassword = window.prompt('Digite a nova senha para este usuário:');
    if (!newPassword) return;
    const policy = validateStrongPassword(newPassword.trim());
    if (!policy.ok) {
      toast.error(policy.message);
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await resetUserPassword(user.id, newPassword.trim());
      const message = `Senha redefinida com sucesso.`;
      setSuccess(message);
      toast.success(message);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao redefinir senha');
      toast.error(err.message || 'Erro ao redefinir senha');
    } finally {
      setLoading(false);
    }
  };

  const handleImpersonate = async (user: ManagedUser) => {
    try {
      setLoading(true);
      await impersonate(user.id);
      toast.success(`Acessando como ${user.displayName || user.email}`);
      navigate('/'); // Redireciona para o dashboard
    } catch (err: any) {
      console.error('Erro ao impersonar:', err);
      toast.error(err.message || 'Erro ao acessar conta');
    } finally {
      setLoading(false);
    }
  };

  if (!canManage) {
    return (
      <>
        <div className="admin-page-shell">
          <section className="admin-hero">
            <h1 className="admin-hero-title">Gerenciar usuários</h1>
            <p className="admin-hero-subtitle">Você não tem permissão para acessar esta página.</p>
          </section>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="admin-page-shell">
        <section className="admin-hero ring-1 ring-blue-500/15 shadow-[0_12px_40px_rgb(37,99,235,0.08)] dark:ring-blue-400/20 dark:shadow-[0_12px_40px_rgb(0,0,0,0.2)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="admin-hero-title">Gerenciar usuários</h1>
              <p className="admin-hero-subtitle">
                {role === 'superadmin'
                  ? 'Empresas, pessoas e convites em escopo global.'
                  : 'Membros, convites e lista da sua empresa.'}
              </p>
            </div>
            <div className="admin-actions">
              {role === 'superadmin' && (
                <button
                  onClick={() => navigate('/settings/quick-onboarding')}
                  className="planner-button flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Cadastro Rápido
                </button>
              )}
              <span className="admin-badge-primary">
                {role === 'superadmin' ? 'Escopo global' : 'Escopo da empresa'}
              </span>
            </div>
          </div>
          <div className="admin-stat-grid">
            <div className="admin-stat-card">
              <p className="admin-stat-label">Usuários visíveis</p>
              <p className="admin-stat-value">{totalUsersCount}</p>
            </div>
            <div className="admin-stat-card">
              <p className="admin-stat-label">Ativos</p>
              <p className="admin-stat-value">{activeUsersCount}</p>
            </div>
            <div className="admin-stat-card">
              <p className="admin-stat-label">Bloqueados</p>
              <p className="admin-stat-value">{blockedUsersCount}</p>
            </div>
            <div className="admin-stat-card">
              <p className="admin-stat-label">Admins</p>
              <p className="admin-stat-value">{adminUsersCount}</p>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-rose-300/90 bg-rose-50/90 px-4 py-3 text-rose-700 dark:border-rose-800/80 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-emerald-300/90 bg-emerald-50/90 px-4 py-3 text-emerald-700 dark:border-emerald-800/80 dark:bg-emerald-950/40 dark:text-emerald-300 mb-4">
            {success}
          </div>
        )}

        <div className="border-b border-slate-200 dark:border-slate-800 mb-6">
          <nav className="-mb-px flex space-x-6 sm:space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('membros')}
              className={`${
                activeTab === 'membros'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
              } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors`}
            >
              Membros
            </button>
            <button
              onClick={() => setActiveTab('convites')}
              className={`${
                activeTab === 'convites'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
              } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors`}
            >
              Convites
            </button>
            {role === 'superadmin' && (
              <button
                onClick={() => setActiveTab('empresas')}
                className={`${
                  activeTab === 'empresas'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors`}
              >
                Empresas
              </button>
            )}
          </nav>
        </div>



        {activeTab === 'membros' && (
          <section aria-labelledby="admin-heading-pessoas">
            <div className="admin-region admin-region--pessoas space-y-4 md:space-y-6">
              <UserListTab 
                users={baseUsers}
                empresas={empresas}
                role={role}
                loading={loading}
                fetchError={fetchError}
                onStartEdit={handleStartEdit}
                onBan={handleBanUser}
                onUnban={handleUnbanUser}
                onResetPassword={handleResetPassword}
                onDelete={handleDeleteUser}
                onImpersonate={handleImpersonate}
                onCreateClick={handleStartCreate}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
              />
            </div>
          </section>
        )}

        {activeTab === 'convites' && (
          <div className="admin-region admin-region--convites space-y-4 md:space-y-6">
            <InvitesTab role={role} empresas={empresas} users={users} />
          </div>
        )}

        {activeTab === 'empresas' && role === 'superadmin' && (
          <div className="admin-region admin-region--empresas space-y-4 md:space-y-6">
            <EmpresasTab empresas={empresas} users={baseUsers} fetchEmpresas={fetchEmpresas} />
          </div>
        )}
        <UserModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchUsers}
          mode={modalMode}
          user={selectedUser}
          empresas={empresas}
          users={baseUsers}
          role={role}
        />
        <DeleteUserModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          user={selectedUser}
          loading={loading}
        />
      </div>
    </>
  );
}

