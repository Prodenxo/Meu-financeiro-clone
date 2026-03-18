import { useEffect, useMemo, useRef, useState } from 'react';
import Fuse from 'fuse.js';
import LoadingOverlay from '../components/LoadingOverlay';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { toast } from 'react-toastify';
import { useAuthStore } from '../store/authStore';
import { hasRole } from '../lib/roles';
import { banUser, createEmpresaLimits, createUser, deleteUser, listEmpresas, listUsers, resetUserPassword, unbanUser, updateEmpresaLimits, updateUser, type EmpresaOption, type ManagedUser } from '../services/usersService';

export default function ManageUsers() {
  const { role } = useAuthStore();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [empresaNome, setEmpresaNome] = useState('');
  const [empresaMaxMei, setEmpresaMaxMei] = useState('');
  const [empresaMaxNaoMei, setEmpresaMaxNaoMei] = useState('');
  const [empresaEditQuery, setEmpresaEditQuery] = useState('');
  const [empresaEditOpen, setEmpresaEditOpen] = useState(false);
  const [empresaEditSelectedId, setEmpresaEditSelectedId] = useState('');
  const [empresaEditHighlightedIndex, setEmpresaEditHighlightedIndex] = useState(-1);
  const [empresaEditNome, setEmpresaEditNome] = useState('');
  const [empresaEditMaxMei, setEmpresaEditMaxMei] = useState('');
  const [empresaEditMaxNaoMei, setEmpresaEditMaxNaoMei] = useState('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'usuario' | 'outsider'>('usuario');
  const [targetEmpresaId, setTargetEmpresaId] = useState('');
  const [empresaQuery, setEmpresaQuery] = useState('');
  const [empresas, setEmpresas] = useState<EmpresaOption[]>([]);
  const [empresaOpen, setEmpresaOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<'admin' | 'usuario' | 'outsider'>('usuario');
  const [editEmpresaId, setEditEmpresaId] = useState('');
  const [editEmpresaQuery, setEditEmpresaQuery] = useState('');
  const [editEmpresaOpen, setEditEmpresaOpen] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editMei, setEditMei] = useState(true);
  const [editExpiresAt, setEditExpiresAt] = useState('');
  const [lastPasswords, setLastPasswords] = useState<Record<string, string>>({});
  const [userQuery, setUserQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const canManage = hasRole(role, ['admin']);

  const fetchUsers = async () => {
    setLoading(true);
    setFetchError('');
    if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    fetchTimeoutRef.current = setTimeout(() => {
      setLoading(false);
      setFetchError('Tempo esgotado ao carregar usuários. Tente novamente.');
    }, 15000);
    try {
      const data = await listUsers();
      setUsers(data);
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : 'Erro ao listar usuários');
    } finally {
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
      setLoading(false);
    }
  };

  const fetchEmpresas = async () => {
    try {
      const data = await listEmpresas();
      console.log('[ManageUsers] empresas recebidas:', data);
      setEmpresas(data);
    } catch (err: unknown) {
      console.log('[ManageUsers] erro ao listar empresas:', err);
      setError(getErrorMessage(err, 'Erro ao listar empresas'));
    }
  };

  useEffect(() => {
    if (canManage) {
      void fetchUsers();
    }
  }, [canManage]);

  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(userQuery);
      setCurrentPage(1);
    }, 200);
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [userQuery]);

  useEffect(() => {
    if (!canManage || role !== 'superadmin') return;
    void fetchEmpresas();
  }, [canManage, role]);

  const baseUsers =
    role === 'admin'
      ? users.filter((user) => user.role !== 'superadmin' && user.role !== 'outsider')
      : users;
  const getUserLabel = (user: ManagedUser) =>
    user.displayName || user.email || 'Usuário sem nome';
  const sortedUsers = useMemo(
    () =>
      [...baseUsers].sort((userA, userB) => {
        const labelA = (userA.displayName || userA.email || '').toLowerCase();
        const labelB = (userB.displayName || userB.email || '').toLowerCase();
        return labelA.localeCompare(labelB, 'pt-BR', { sensitivity: 'base' });
      }),
    [baseUsers]
  );
  const fuseInstance = useMemo(
    () =>
      new Fuse(sortedUsers, {
        keys: ['displayName', 'email', 'empresaName'],
        threshold: 0.4,
        ignoreLocation: true,
      }),
    [sortedUsers]
  );
  const filteredUsers = useMemo(
    () =>
      debouncedQuery.trim()
        ? fuseInstance.search(debouncedQuery.trim()).map((result) => result.item)
        : sortedUsers,
    [debouncedQuery, fuseInstance, sortedUsers]
  );
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const startIndex = (currentPageSafe - 1) * pageSize;
  const startDisplay = filteredUsers.length === 0 ? 0 : startIndex + 1;
  const endDisplay = Math.min(startIndex + pageSize, filteredUsers.length);
  const pagedUsers = filteredUsers.slice(startIndex, startIndex + pageSize);

  const sortedEmpresas = [...empresas].sort((empresaA, empresaB) => {
    return empresaA.empresa.localeCompare(empresaB.empresa, 'pt-BR', { sensitivity: 'base' });
  });
  const empresaEditQueryNormalized = empresaEditQuery.trim().toLowerCase();
  const filteredEmpresas = empresaEditQueryNormalized
    ? sortedEmpresas.filter((empresa) =>
        empresa.empresa.toLowerCase().includes(empresaEditQueryNormalized)
      )
    : sortedEmpresas;
  const selectedEmpresa = empresas.find((empresa) => empresa.id === empresaEditSelectedId) || null;
  const hasSelectedEmpresa = Boolean(selectedEmpresa);
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

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (highlightedIndex >= filteredUsers.length) {
      setHighlightedIndex(filteredUsers.length - 1);
    }
  }, [filteredUsers.length, highlightedIndex]);

  useEffect(() => {
    if (empresaEditHighlightedIndex >= filteredEmpresas.length) {
      setEmpresaEditHighlightedIndex(filteredEmpresas.length - 1);
    }
  }, [filteredEmpresas.length, empresaEditHighlightedIndex]);

  const handleCreateUser = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        email,
        password: password || undefined,
        displayName: displayName || undefined,
        phone: phone || undefined,
        role: role === 'superadmin' ? selectedRole : 'usuario',
        empresaId: role === 'superadmin' ? targetEmpresaId || undefined : undefined
      };

      const result = await createUser(payload);
      setSuccess(
        result.generatedPassword
          ? `Usuário criado. Senha gerada: ${result.generatedPassword}`
          : 'Usuário criado com sucesso.'
      );
      toast.success(
        result.generatedPassword
          ? `Usuário criado. Senha gerada: ${result.generatedPassword}`
          : 'Usuário criado com sucesso.'
      );
      setEmail('');
      setPassword('');
      setDisplayName('');
      setPhone('');
      if (role === 'superadmin') {
        setTargetEmpresaId('');
        setSelectedRole('usuario');
      }
      await fetchUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar usuário');
      toast.error(err.message || 'Erro ao criar usuário');
    } finally {
      setLoading(false);
    }
  };

  const parseLimitValue = (value: string, fieldLabel: string) => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const numeric = Number(trimmed);
    if (!Number.isFinite(numeric) || !Number.isInteger(numeric) || numeric < 0) {
      throw new Error(`${fieldLabel} deve ser um inteiro maior ou igual a 0`);
    }
    return numeric;
  };

  const getErrorMessage = (err: unknown, fallback: string) => {
    if (err instanceof Error && err.message) return err.message;
    return fallback;
  };

  const handleCreateEmpresa = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const nome = empresaNome.trim();
      if (!nome) {
        throw new Error('Empresa é obrigatória');
      }

      const payload = {
        empresa: nome,
        max_mei: parseLimitValue(empresaMaxMei, 'Max MEI'),
        max_usuarios_nao_mei: parseLimitValue(empresaMaxNaoMei, 'Max não MEI')
      };

      await createEmpresaLimits(payload);
      setSuccess('Empresa criada com sucesso.');
      toast.success('Empresa criada com sucesso.');
      setEmpresaNome('');
      setEmpresaMaxMei('');
      setEmpresaMaxNaoMei('');
      await fetchEmpresas();
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Erro ao criar empresa');
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const selectEmpresaForEdit = (empresa: EmpresaOption) => {
    setEmpresaEditSelectedId(empresa.id);
    setEmpresaEditQuery(empresa.empresa);
    setEmpresaEditNome(empresa.empresa);
    setEmpresaEditMaxMei(
      empresa.max_mei !== undefined && empresa.max_mei !== null ? String(empresa.max_mei) : ''
    );
    setEmpresaEditMaxNaoMei(
      empresa.max_usuarios_nao_mei !== undefined && empresa.max_usuarios_nao_mei !== null
        ? String(empresa.max_usuarios_nao_mei)
        : ''
    );
    setEmpresaEditOpen(false);
    setEmpresaEditHighlightedIndex(-1);
  };

  const handleUpdateEmpresa = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const empresaId = empresaEditSelectedId;
      if (!empresaId) throw new Error('Empresa não selecionada');
      const nome = empresaEditNome.trim();
      if (!nome) throw new Error('Empresa é obrigatória');

      const payload = {
        empresa: nome,
        max_mei: parseLimitValue(empresaEditMaxMei, 'Max MEI'),
        max_usuarios_nao_mei: parseLimitValue(empresaEditMaxNaoMei, 'Max não MEI')
      };

      const result = await updateEmpresaLimits(empresaId, payload);
      if (result?.empresa) {
        setEmpresaEditNome(result.empresa.empresa);
        setEmpresaEditQuery(result.empresa.empresa);
        setEmpresaEditMaxMei(
          result.empresa.max_mei !== undefined && result.empresa.max_mei !== null
            ? String(result.empresa.max_mei)
            : ''
        );
        setEmpresaEditMaxNaoMei(
          result.empresa.max_usuarios_nao_mei !== undefined && result.empresa.max_usuarios_nao_mei !== null
            ? String(result.empresa.max_usuarios_nao_mei)
            : ''
        );
      }
      setSuccess('Empresa atualizada com sucesso.');
      toast.success('Empresa atualizada com sucesso.');
      await fetchEmpresas();
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Erro ao atualizar empresa');
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const startEditUser = (user: ManagedUser) => {
    setEditingUserId(user.id);
    setEditRole(
      user.role === 'admin' || user.role === 'usuario' || user.role === 'outsider'
        ? user.role
        : 'usuario'
    );
    setEditEmpresaId(user.empresaId || '');
    setEditEmpresaQuery(user.empresaName || '');
    setEditEmpresaOpen(false);
    setEditDisplayName(user.displayName || '');
    setEditPhone(user.phone || '');
    setEditMei(user.mei !== false);
    setEditExpiresAt(user.expiresAt ? user.expiresAt.slice(0, 10) : '');
  };

  const handleUpdateUser = async (user: ManagedUser) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const basePayload =
        role === 'superadmin'
          ? {
              role: editRole,
              empresaId: editEmpresaId || undefined,
              displayName: editDisplayName || undefined,
              phone: editPhone || undefined,
              mei: editMei
            }
          : {
              role: 'usuario' as const,
              displayName: editDisplayName || undefined,
              phone: editPhone || undefined,
              mei: editMei
            };
      const payload =
        editRole === 'usuario'
          ? { ...basePayload, expiresAt: editExpiresAt ? new Date(editExpiresAt + 'T12:00:00.000Z').toISOString() : null }
          : basePayload;
      await updateUser(user.id, payload);
      setSuccess('Usuário atualizado com sucesso.');
      toast.success('Usuário atualizado com sucesso.');
      setEditingUserId(null);
      await fetchUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar usuário');
      toast.error(err.message || 'Erro ao atualizar usuário');
    } finally {
      setLoading(false);
    }
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
      setEditingUserId(null);
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
      setEditingUserId(null);
      await fetchUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao desbloquear usuário');
      toast.error(err.message || 'Erro ao desbloquear usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (user: ManagedUser) => {
    const confirmed = window.confirm(
      'Excluir usuário é um processo irreversível. Tem certeza que deseja continuar?'
    );
    if (!confirmed) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await deleteUser(user.id);
      setSuccess('Usuário excluído com sucesso.');
      toast.success('Usuário excluído com sucesso.');
      setEditingUserId(null);
      await fetchUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir usuário');
      toast.error(err.message || 'Erro ao excluir usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (user: ManagedUser) => {
    const newPassword = window.prompt('Digite a nova senha para este usuário:');
    if (!newPassword) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await resetUserPassword(user.id, newPassword);
      setLastPasswords((prev) => ({ ...prev, [user.id]: newPassword }));
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
        <section className="admin-hero">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="admin-hero-title">Gerenciar usuários</h1>
              <p className="admin-hero-subtitle">Administre usuários por empresa e permissões.</p>
            </div>
            <div className="admin-actions">
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
          <div className="rounded-xl border border-emerald-300/90 bg-emerald-50/90 px-4 py-3 text-emerald-700 dark:border-emerald-800/80 dark:bg-emerald-950/40 dark:text-emerald-300">
            {success}
          </div>
        )}

        {role === 'superadmin' ? (
          <section className="admin-split-grid">
            <div className="admin-section-card">
              <div className="admin-section-header">
                <div>
                  <h2 className="admin-section-title">Criar empresa</h2>
                  <p className="admin-section-subtitle">Cadastre empresas e limites iniciais de capacidade.</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Nome da empresa</label>
                    <input
                      type="text"
                      value={empresaNome}
                      onChange={(e) => setEmpresaNome(e.target.value)}
                      className="planner-input-compact"
                      placeholder="Nome da empresa"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Max MEI</label>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={empresaMaxMei}
                      onChange={(e) => setEmpresaMaxMei(e.target.value)}
                      className="planner-input-compact"
                      placeholder="0 = sem limite"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Max não MEI</label>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={empresaMaxNaoMei}
                      onChange={(e) => setEmpresaMaxNaoMei(e.target.value)}
                      className="planner-input-compact"
                      placeholder="0 = sem limite"
                    />
                  </div>
                </div>
                <button
                  onClick={handleCreateEmpresa}
                  disabled={loading || !empresaNome.trim()}
                  className="planner-button w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Criar empresa'}
                </button>
              </div>
            </div>

            <div className="admin-section-card">
              <div className="admin-section-header">
                <div>
                  <h2 className="admin-section-title">Editar empresas</h2>
                  <p className="admin-section-subtitle">Selecione uma empresa para ajustar nome e limites.</p>
                </div>
              </div>
              {empresas.length === 0 ? (
                <div className="admin-empty-state">Nenhuma empresa cadastrada.</div>
              ) : (
                <div className="space-y-4">
                  <div className="admin-toolbar relative">
                    <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Buscar empresa</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={empresaEditQuery}
                        onChange={(event) => {
                          const value = event.target.value;
                          setEmpresaEditQuery(value);
                          setEmpresaEditOpen(true);
                          setEmpresaEditHighlightedIndex(-1);
                          if (empresaEditSelectedId) {
                            const selectedLabel = selectedEmpresa ? selectedEmpresa.empresa : '';
                            if (value.trim().toLowerCase() !== selectedLabel.trim().toLowerCase()) {
                              setEmpresaEditSelectedId('');
                              setEmpresaEditNome('');
                              setEmpresaEditMaxMei('');
                              setEmpresaEditMaxNaoMei('');
                            }
                          }
                        }}
                        onFocus={() => setEmpresaEditOpen(true)}
                        onBlur={() => {
                          window.setTimeout(() => setEmpresaEditOpen(false), 150);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'ArrowDown') {
                            event.preventDefault();
                            setEmpresaEditOpen(true);
                            setEmpresaEditHighlightedIndex((index) =>
                              Math.min(index + 1, filteredEmpresas.length - 1)
                            );
                            return;
                          }
                          if (event.key === 'ArrowUp') {
                            event.preventDefault();
                            setEmpresaEditHighlightedIndex((index) => Math.max(index - 1, 0));
                            return;
                          }
                          if (event.key === 'Enter') {
                            if (empresaEditHighlightedIndex >= 0 && filteredEmpresas[empresaEditHighlightedIndex]) {
                              selectEmpresaForEdit(filteredEmpresas[empresaEditHighlightedIndex]);
                              return;
                            }
                            if (filteredEmpresas.length === 1) {
                              selectEmpresaForEdit(filteredEmpresas[0]);
                            }
                          }
                          if (event.key === 'Escape') {
                            setEmpresaEditOpen(false);
                            setEmpresaEditHighlightedIndex(-1);
                          }
                        }}
                        className="planner-input-compact"
                        placeholder="Digite para filtrar"
                      />
                      <button
                        type="button"
                        onClick={() => setEmpresaEditOpen((open) => !open)}
                        className="planner-button-secondary-compact"
                        aria-label="Alternar lista de empresas"
                      >
                        ▾
                      </button>
                    </div>
                    {empresaEditOpen && (
                      <div className="admin-dropdown-panel">
                        {filteredEmpresas.length === 0 ? (
                          <div className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400">
                            Nenhuma empresa encontrada.
                          </div>
                        ) : (
                          filteredEmpresas.map((empresa, index) => (
                            <button
                              key={empresa.id}
                              type="button"
                              onMouseDown={(event) => {
                                event.preventDefault();
                                selectEmpresaForEdit(empresa);
                              }}
                              className={`admin-dropdown-option ${
                                empresaEditHighlightedIndex === index ? 'admin-dropdown-option-active' : ''
                              }`}
                            >
                              {empresa.empresa}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {!hasSelectedEmpresa ? (
                    <div className="admin-empty-state">Selecione uma empresa para editar seus dados.</div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid gap-3 md:grid-cols-3">
                        <div>
                          <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Nome da empresa</label>
                          <input
                            type="text"
                            value={empresaEditNome}
                            onChange={(e) => setEmpresaEditNome(e.target.value)}
                            className="planner-input-compact"
                            placeholder="Nome da empresa"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Max MEI</label>
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={empresaEditMaxMei}
                            onChange={(e) => setEmpresaEditMaxMei(e.target.value)}
                            className="planner-input-compact"
                            placeholder="0 = sem limite"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Max não MEI</label>
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={empresaEditMaxNaoMei}
                            onChange={(e) => setEmpresaEditMaxNaoMei(e.target.value)}
                            className="planner-input-compact"
                            placeholder="0 = sem limite"
                          />
                        </div>
                      </div>
                      <div className="admin-actions">
                        <button
                          onClick={handleUpdateEmpresa}
                          disabled={loading || !empresaEditNome.trim() || !hasSelectedEmpresa}
                          className="planner-button w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {loading ? 'Salvando...' : 'Salvar alterações'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        ) : null}

        <section className="admin-section-card">
          <div className="admin-section-header">
            <div>
              <h2 className="admin-section-title">Criar usuário</h2>
              <p className="admin-section-subtitle">Cadastre novos acessos e configure permissões.</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="planner-input-compact"
                  placeholder="email@empresa.com"
                />
              </div>
              <div className="relative">
                <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Senha (opcional)</label>
                <input
                  type={showCreatePassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="planner-input-compact pr-10"
                  placeholder="Defina uma senha ou deixe em branco"
                />
                <button
                  type="button"
                  onClick={() => setShowCreatePassword((value) => !value)}
                  className="admin-icon-button absolute bottom-1.5 right-1.5"
                  aria-label={showCreatePassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showCreatePassword ? (
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-eye-off">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-eye">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Nome de exibição</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="planner-input-compact"
                  placeholder="Nome de exibição"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Telefone</label>
                <PhoneInput
                  country={'br'}
                  value={phone}
                  onChange={(value) => setPhone(value)}
                  inputStyle={{
                    width: '100%',
                    paddingTop: '10px',
                    paddingBottom: '10px',
                    paddingLeft: '48px',
                    paddingRight: '12px',
                    borderRadius: '0.5rem',
                    border: '1px solid #4B5563',
                    fontSize: '0.875rem',
                    backgroundColor: '#374151',
                    color: '#F9FAFB',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                  buttonStyle={{ border: 'none', background: 'none', paddingLeft: 8 }}
                  placeholder="(11) 99999-9999"
                  enableSearch
                />
              </div>
            </div>

            {role === 'superadmin' ? (
              <div className="admin-toolbar">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Perfil</label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as 'admin' | 'usuario' | 'outsider')}
                      className="planner-input-compact"
                    >
                      <option value="admin">Admin</option>
                      <option value="usuario">Usuário</option>
                      <option value="outsider">Outsider</option>
                    </select>
                  </div>
                  <div className="relative">
                    <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Empresa</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={empresaQuery}
                        onChange={(e) => {
                          const value = e.target.value;
                          setEmpresaQuery(value);
                          setEmpresaOpen(true);
                          const match = empresas.find(
                            (empresa) => empresa.empresa.toLowerCase() === value.toLowerCase()
                          );
                          setTargetEmpresaId(match?.id || '');
                        }}
                        onFocus={() => setEmpresaOpen(true)}
                        className="planner-input-compact"
                        placeholder="Empresa"
                      />
                      <button
                        type="button"
                        onClick={() => setEmpresaOpen((open) => !open)}
                        className="planner-button-secondary-compact"
                        aria-label="Listar empresas"
                      >
                        ▾
                      </button>
                    </div>
                    {empresaOpen && (
                      <div className="admin-dropdown-panel">
                        {(empresas || [])
                          .filter((empresa) =>
                            empresa.empresa.toLowerCase().includes(empresaQuery.toLowerCase())
                          )
                          .map((empresa) => (
                            <button
                              key={empresa.id}
                              type="button"
                              onClick={() => {
                                setEmpresaQuery(empresa.empresa);
                                setTargetEmpresaId(empresa.id);
                                setEmpresaOpen(false);
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
                    {targetEmpresaId && (
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        Empresa selecionada: {empresaQuery}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            <button
              onClick={handleCreateUser}
              disabled={loading || !email}
              className="planner-button w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Criar usuário'}
            </button>
          </div>
        </section>

        <section className="admin-section-card">
          <div className="admin-section-header">
            <div>
              <h2 className="admin-section-title">Usuários</h2>
              <p className="admin-section-subtitle">Pesquise, edite permissões e gerencie acesso rapidamente.</p>
            </div>
          </div>
          {loading ? (
            <LoadingOverlay message="Carregando usuários..." />
          ) : fetchError ? (
            <div className="admin-empty-state border-rose-300/90 text-rose-600 dark:border-rose-800/80 dark:text-rose-400">
              {fetchError}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="admin-toolbar">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="relative w-full md:max-w-md">
                    <input
                      type="text"
                      value={userQuery}
                      onChange={(event) => {
                        setUserQuery(event.target.value);
                        setUserDropdownOpen(true);
                        setHighlightedIndex(-1);
                      }}
                      onFocus={() => setUserDropdownOpen(true)}
                      onBlur={() => {
                        window.setTimeout(() => setUserDropdownOpen(false), 150);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'ArrowDown') {
                          event.preventDefault();
                          setUserDropdownOpen(true);
                          setHighlightedIndex((index) => Math.min(index + 1, filteredUsers.length - 1));
                          return;
                        }
                        if (event.key === 'ArrowUp') {
                          event.preventDefault();
                          setHighlightedIndex((index) => Math.max(index - 1, 0));
                          return;
                        }
                        if (event.key === 'Enter') {
                          if (highlightedIndex >= 0 && filteredUsers[highlightedIndex]) {
                            const user = filteredUsers[highlightedIndex];
                            setUserQuery(getUserLabel(user));
                            setUserDropdownOpen(false);
                            setHighlightedIndex(-1);
                            setCurrentPage(1);
                            return;
                          }
                          if (filteredUsers.length === 1) {
                            const user = filteredUsers[0];
                            setUserQuery(getUserLabel(user));
                            setUserDropdownOpen(false);
                            setHighlightedIndex(-1);
                            setCurrentPage(1);
                          }
                        }
                        if (event.key === 'Escape') {
                          setUserDropdownOpen(false);
                          setHighlightedIndex(-1);
                        }
                      }}
                      className="planner-input-compact"
                      placeholder="Pesquisar por nome, email ou empresa"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      {userQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setUserQuery('');
                            setUserDropdownOpen(false);
                            setHighlightedIndex(-1);
                            setCurrentPage(1);
                          }}
                          className="admin-icon-button"
                          aria-label="Limpar filtro"
                        >
                          ✕
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setUserDropdownOpen((open) => !open)}
                        className="admin-icon-button"
                        aria-label="Alternar lista de usuários"
                      >
                        ▾
                      </button>
                    </div>
                    {userDropdownOpen && (
                      <div className="admin-dropdown-panel">
                        {filteredUsers.length === 0 ? (
                          <div className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400">
                            Nenhum usuário encontrado.
                          </div>
                        ) : (
                          filteredUsers.map((user, index) => (
                            <button
                              key={user.id}
                              type="button"
                              onMouseDown={(event) => {
                                event.preventDefault();
                                setUserQuery(getUserLabel(user));
                                setUserDropdownOpen(false);
                                setHighlightedIndex(-1);
                                setCurrentPage(1);
                              }}
                              className={`admin-dropdown-option ${
                                highlightedIndex === index ? 'admin-dropdown-option-active' : ''
                              }`}
                            >
                              <div className="flex flex-col">
                                <span className="font-semibold">{getUserLabel(user)}</span>
                                {user.empresaName ? (
                                  <span className="text-xs text-slate-500 dark:text-slate-400">
                                    {user.empresaName}
                                  </span>
                                ) : null}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
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
              </div>

              {filteredUsers.length === 0 ? (
                <div className="admin-empty-state">
                  {userQuery !== ''
                    ? `Nenhum usuário encontrado para "${userQuery}".`
                    : 'Nenhum usuário cadastrado.'}
                </div>
              ) : null}
              {pagedUsers.map((user) => {
                const canEdit =
                  role === 'superadmin'
                    ? user.role !== 'superadmin'
                    : role === 'admin' && user.role === 'usuario';
                const isBlocked = user.status === false;
                const isEditing = editingUserId === user.id;

                return (
                <div
                  key={user.id}
                  className="admin-user-card"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <p className="text-base font-semibold text-slate-900 dark:text-white">
                        {user.displayName || user.email}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                      {user.phone && (
                        <p className="text-sm text-slate-500 dark:text-slate-400">Telefone: {user.phone}</p>
                      )}
                      <div className="admin-actions">
                        <span className={getRoleBadgeClass(user.role)}>{getRoleLabel(user.role)}</span>
                        <span className={isBlocked ? 'admin-badge-danger' : 'admin-badge-success'}>
                          {isBlocked ? 'Bloqueado' : 'Ativo'}
                        </span>
                        <span className={user.mei === false ? 'admin-badge-warning' : 'admin-badge-primary'}>
                          {user.mei === false ? 'MEI desativado' : 'MEI ativo'}
                        </span>
                        <span className="admin-badge-neutral">
                          {user.empresaName || user.empresaId || 'Sem empresa'}
                        </span>
                        {user.role === 'usuario' && user.expiresAt && (
                          <span
                            className={
                              new Date(user.expiresAt) < new Date()
                                ? 'admin-badge-danger'
                                : 'admin-badge-warning'
                            }
                          >
                            {new Date(user.expiresAt) < new Date()
                              ? 'Expirado'
                              : `Expira em ${new Date(user.expiresAt).toLocaleDateString('pt-BR')}`}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-full text-sm text-slate-600 dark:text-slate-300 lg:max-w-2xl">
                    {isEditing ? (
                      <div className="space-y-3">
                        <div className="admin-toolbar">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <input
                              type="text"
                              value={lastPasswords[user.id] || ''}
                              readOnly
                              className="planner-input-compact"
                              placeholder="Sem senha em cache"
                            />
                            <button
                              type="button"
                              onClick={async () => {
                                const value = lastPasswords[user.id];
                                if (!value) return;
                                try {
                                  await navigator.clipboard.writeText(value);
                                  toast.success('Senha copiada.');
                                } catch {
                                  toast.error('Erro ao copiar senha.');
                                }
                              }}
                              disabled={!lastPasswords[user.id]}
                              className="planner-button-secondary-compact w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Copiar
                            </button>
                          </div>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <input
                            type="text"
                            value={editDisplayName}
                            onChange={(e) => setEditDisplayName(e.target.value)}
                            className="planner-input-compact"
                            placeholder="Nome de exibição"
                          />
                          <PhoneInput
                            country={'br'}
                            value={editPhone}
                            onChange={(value) => setEditPhone(value)}
                            inputStyle={{
                              width: '100%',
                              paddingTop: '10px',
                              paddingBottom: '10px',
                              paddingLeft: '48px',
                              paddingRight: '12px',
                              borderRadius: '0.5rem',
                              border: '1px solid #4B5563',
                              fontSize: '0.875rem',
                              backgroundColor: '#374151',
                              color: '#F9FAFB',
                              boxSizing: 'border-box',
                              outline: 'none'
                            }}
                            buttonStyle={{ border: 'none', background: 'none', paddingLeft: 8 }}
                            placeholder="(11) 999999999"
                            enableSearch
                          />
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value as 'admin' | 'usuario' | 'outsider')}
                            disabled={role !== 'superadmin'}
                            className="planner-input-compact"
                          >
                            {role === 'superadmin' && <option value="admin">Admin</option>}
                            <option value="usuario">Usuário</option>
                            {role === 'superadmin' && <option value="outsider">Outsider</option>}
                          </select>
                          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                            <input
                              type="checkbox"
                              checked={editMei}
                              onChange={(e) => setEditMei(e.target.checked)}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            MEI habilitado
                          </label>
                        </div>
                        {editRole === 'usuario' && (
                          <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                              Data de validade
                            </label>
                            <input
                              type="date"
                              value={editExpiresAt}
                              onChange={(e) => setEditExpiresAt(e.target.value)}
                              className="planner-input-compact w-full max-w-xs"
                              placeholder="Opcional"
                            />
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              Opcional. Deixe em branco para acesso sem data de expiração.
                            </p>
                          </div>
                        )}
                        {role === 'superadmin' ? (
                          <div className="relative admin-toolbar">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editEmpresaQuery}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setEditEmpresaQuery(value);
                                  setEditEmpresaOpen(true);
                                  const match = empresas.find(
                                    (empresa) => empresa.empresa.toLowerCase() === value.toLowerCase()
                                  );
                                  setEditEmpresaId(match?.id || '');
                                }}
                                onFocus={() => setEditEmpresaOpen(true)}
                                className="planner-input-compact"
                                placeholder="Empresa"
                              />
                              <button
                                type="button"
                                onClick={() => setEditEmpresaOpen((open) => !open)}
                                className="planner-button-secondary-compact"
                                aria-label="Listar empresas"
                              >
                                ▾
                              </button>
                            </div>
                            {editEmpresaOpen && (
                              <div className="admin-dropdown-panel">
                                {(empresas || [])
                                  .filter((empresa) =>
                                    empresa.empresa.toLowerCase().includes(editEmpresaQuery.toLowerCase())
                                  )
                                  .map((empresa) => (
                                    <button
                                      key={empresa.id}
                                      type="button"
                                      onClick={() => {
                                        setEditEmpresaQuery(empresa.empresa);
                                        setEditEmpresaId(empresa.id);
                                        setEditEmpresaOpen(false);
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
                        ) : (
                          <p>Empresa: {user.empresaName || user.empresaId || '-'}</p>
                        )}
                        <div className="admin-actions">
                          <button
                            onClick={() => handleUpdateUser(user)}
                            disabled={loading || (role === 'superadmin' && !editEmpresaId)}
                            className="planner-button w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Salvar
                          </button>
                          {canEdit && !isBlocked && (
                            <button
                              onClick={() => handleBanUser(user)}
                              disabled={loading}
                              className="planner-button w-full sm:w-auto bg-amber-500 hover:bg-amber-400"
                            >
                              Bloquear
                            </button>
                          )}
                          {canEdit && isBlocked && (
                            <button
                              onClick={() => handleUnbanUser(user)}
                              disabled={loading}
                              className="planner-button w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500"
                            >
                              Desbloquear
                            </button>
                          )}
                          {canEdit && (
                            <button
                              onClick={() => handleResetPassword(user)}
                              disabled={loading}
                              className="planner-button w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500"
                            >
                              Redefinir senha
                            </button>
                          )}
                          {canEdit && (
                            <button
                              onClick={() => handleDeleteUser(user)}
                              disabled={loading}
                              className="planner-button w-full sm:w-auto bg-rose-600 hover:bg-rose-500"
                            >
                              Excluir
                            </button>
                          )}
                          <button
                            onClick={() => setEditingUserId(null)}
                            className="planner-button-secondary-compact w-full sm:w-auto"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p>Empresa: {user.empresaName || user.empresaId || '-'}</p>
                        {canEdit && (
                          <button
                            onClick={() => startEditUser(user)}
                            className="mt-3 planner-button w-full sm:w-auto"
                          >
                            Editar
                          </button>
                        )}
                      </div>
                    )}
                    </div>
                  </div>
                </div>
              );
              })}
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
            </div>
          )}
        </section>
      </div>
    </>
  );
}

