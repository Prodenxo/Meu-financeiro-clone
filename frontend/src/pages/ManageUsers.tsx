import { useEffect, useMemo, useRef, useState } from 'react';
import Fuse from 'fuse.js';
import LoadingOverlay from '../components/LoadingOverlay';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { toast } from 'react-toastify';
import { useAuthStore } from '../store/authStore';
import { hasRole } from '../lib/roles';
import { banUser, createEmpresa, createUser, deleteUser, listEmpresas, listUsers, resetUserPassword, unbanUser, updateEmpresa, updateUser, type EmpresaOption, type ManagedUser } from '../services/usersService';

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
  const [empresaEdits, setEmpresaEdits] = useState<Record<string, { empresa: string; maxMei: string; maxNaoMei: string }>>({});
  const [empresaEditQuery, setEmpresaEditQuery] = useState('');
  const [empresaEditOpen, setEmpresaEditOpen] = useState(false);
  const [empresaEditSelectedId, setEmpresaEditSelectedId] = useState('');
  const [empresaEditHighlightedIndex, setEmpresaEditHighlightedIndex] = useState(-1);
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
    } catch (err: any) {
      console.log('[ManageUsers] erro ao listar empresas:', err);
      setError(err.message || 'Erro ao listar empresas');
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
  const selectedEmpresaEdit = selectedEmpresa
    ? (empresaEdits[selectedEmpresa.id] || {
        empresa: selectedEmpresa.empresa,
        maxMei: selectedEmpresa.max_mei !== undefined && selectedEmpresa.max_mei !== null
          ? String(selectedEmpresa.max_mei)
          : '',
        maxNaoMei: selectedEmpresa.max_usuarios_nao_mei !== undefined
          && selectedEmpresa.max_usuarios_nao_mei !== null
          ? String(selectedEmpresa.max_usuarios_nao_mei)
          : ''
      })
    : null;

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

  useEffect(() => {
    if (!selectedEmpresa) return;
    if (!empresaEditQuery.trim()) {
      setEmpresaEditQuery(selectedEmpresa.empresa);
    }
  }, [selectedEmpresa?.id]);

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

      await createEmpresa(payload);
      setSuccess('Empresa criada com sucesso.');
      toast.success('Empresa criada com sucesso.');
      setEmpresaNome('');
      setEmpresaMaxMei('');
      setEmpresaMaxNaoMei('');
      await fetchEmpresas();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar empresa');
      toast.error(err.message || 'Erro ao criar empresa');
    } finally {
      setLoading(false);
    }
  };

  const updateEmpresaEdit = (
    empresaId: string,
    updates: Partial<{ empresa: string; maxMei: string; maxNaoMei: string }>
  ) => {
    setEmpresaEdits((prev) => ({
      ...prev,
      [empresaId]: {
        ...prev[empresaId],
        ...updates
      }
    }));
  };

  const selectEmpresaForEdit = (empresa: EmpresaOption) => {
    setEmpresaEditSelectedId(empresa.id);
    setEmpresaEditQuery(empresa.empresa);
    setEmpresaEditOpen(false);
    setEmpresaEditHighlightedIndex(-1);
    setEmpresaEdits((prev) => ({
      ...prev,
      [empresa.id]: {
        empresa: empresa.empresa,
        maxMei: empresa.max_mei !== undefined && empresa.max_mei !== null ? String(empresa.max_mei) : '',
        maxNaoMei:
          empresa.max_usuarios_nao_mei !== undefined && empresa.max_usuarios_nao_mei !== null
            ? String(empresa.max_usuarios_nao_mei)
            : ''
      }
    }));
  };

  const handleUpdateEmpresa = async (empresaId: string) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const edit = empresaEdits[empresaId];
      if (!edit) throw new Error('Empresa não encontrada');
      const nome = edit.empresa.trim();
      if (!nome) throw new Error('Empresa é obrigatória');

      const payload = {
        empresa: nome,
        max_mei: parseLimitValue(edit.maxMei, 'Max MEI'),
        max_usuarios_nao_mei: parseLimitValue(edit.maxNaoMei, 'Max não MEI')
      };

      await updateEmpresa(empresaId, payload);
      setSuccess('Empresa atualizada com sucesso.');
      toast.success('Empresa atualizada com sucesso.');
      await fetchEmpresas();
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar empresa');
      toast.error(err.message || 'Erro ao atualizar empresa');
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
  };

  const handleUpdateUser = async (user: ManagedUser) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload =
        role === 'superadmin'
          ? {
              role: editRole,
              empresaId: editEmpresaId || undefined,
              displayName: editDisplayName || undefined,
              phone: editPhone || undefined,
              mei: editMei
            }
          : {
              role: 'usuario',
              displayName: editDisplayName || undefined,
              phone: editPhone || undefined,
              mei: editMei
            };
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
        <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
          <h1 className="text-xl md:text-3xl font-bold dark:text-white">Gerenciar usuários</h1>
          <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">
            Você não tem permissão para acessar esta página.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
        <h1 className="text-xl md:text-3xl font-bold dark:text-white mb-4 md:mb-6">Gerenciar usuários</h1>
        <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 mb-4 md:mb-6">
          Administre usuários por empresa e permissões.
        </p>

        {error && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-3 rounded">
            {success}
          </div>
        )}

        {role === 'superadmin' ? (
          <div className="planner-card p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 dark:text-white">Criar empresa</h2>
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <input
                  type="text"
                  value={empresaNome}
                  onChange={(e) => setEmpresaNome(e.target.value)}
                  className="planner-input-compact"
                  placeholder="Nome da empresa"
                />
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={empresaMaxMei}
                  onChange={(e) => setEmpresaMaxMei(e.target.value)}
                  className="planner-input-compact"
                  placeholder="Max MEI (0 = sem limite)"
                />
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={empresaMaxNaoMei}
                  onChange={(e) => setEmpresaMaxNaoMei(e.target.value)}
                  className="planner-input-compact"
                  placeholder="Max não MEI (0 = sem limite)"
                />
              </div>
              <button
                onClick={handleCreateEmpresa}
                disabled={loading || !empresaNome.trim()}
                className="planner-button disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Salvando...' : 'Criar empresa'}
              </button>
            </div>
          </div>
        ) : null}

        {role === 'superadmin' ? (
          <div className="planner-card p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 dark:text-white">Editar empresas</h2>
            {empresas.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma empresa cadastrada.</p>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Buscar empresa</label>
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
                    <div className="absolute z-10 mt-2 w-full max-h-60 overflow-auto rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-900/80 shadow-soft backdrop-blur">
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
                            className={`w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 ${
                              empresaEditHighlightedIndex === index ? 'bg-slate-100/80 dark:bg-slate-800/60' : ''
                            }`}
                          >
                            {empresa.empresa}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {!selectedEmpresaEdit ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Selecione uma empresa para editar seus dados.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div className="grid gap-3 md:grid-cols-3">
                      <input
                        type="text"
                        value={selectedEmpresaEdit.empresa}
                        onChange={(e) =>
                          updateEmpresaEdit(empresaEditSelectedId, { empresa: e.target.value })
                        }
                        className="planner-input-compact"
                        placeholder="Nome da empresa"
                      />
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={selectedEmpresaEdit.maxMei}
                        onChange={(e) =>
                          updateEmpresaEdit(empresaEditSelectedId, { maxMei: e.target.value })
                        }
                        className="planner-input-compact"
                        placeholder="Max MEI (0 = sem limite)"
                      />
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={selectedEmpresaEdit.maxNaoMei}
                        onChange={(e) =>
                          updateEmpresaEdit(empresaEditSelectedId, { maxNaoMei: e.target.value })
                        }
                        className="planner-input-compact"
                        placeholder="Max não MEI (0 = sem limite)"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleUpdateEmpresa(empresaEditSelectedId)}
                        disabled={loading || !selectedEmpresaEdit.empresa.trim()}
                        className="planner-button disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Salvando...' : 'Salvar alterações'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}

        <div className="planner-card p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 dark:text-white">Criar usuário</h2>
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="planner-input-compact"
                placeholder="Email"
              />
              <div className="relative">
                <input
                  type={showCreatePassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="planner-input-compact pr-10"
                  placeholder="Senha (opcional)"
                />
                <button
                  type="button"
                  onClick={() => setShowCreatePassword((value) => !value)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
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
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="planner-input-compact"
                placeholder="Nome de exibição"
              />
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

            {role === 'superadmin' ? (
              <div className="grid gap-3 md:grid-cols-2">
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as 'admin' | 'usuario' | 'outsider')}
                  className="planner-input-compact"
                >
                  <option value="admin">Admin</option>
                  <option value="usuario">User</option>
                  <option value="outsider">Outsider</option>
                </select>
                <div className="relative">
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
                    <div className="absolute z-10 mt-2 w-full max-h-60 overflow-auto rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-900/80 shadow-soft backdrop-blur">
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
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/60"
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
            ) : null}

            <button
              onClick={handleCreateUser}
              disabled={loading || !email}
              className="planner-button disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : 'Criar usuário'}
            </button>
          </div>
        </div>

        <div className="planner-card p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 dark:text-white">Usuários</h2>
          {loading ? (
            <LoadingOverlay message="Carregando usuários..." />
          ) : fetchError ? (
            <p className="text-red-500 dark:text-red-400 text-sm">{fetchError}</p>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="relative w-full md:max-w-xs">
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
                        className="text-slate-400 hover:text-slate-200"
                        aria-label="Limpar filtro"
                      >
                        ✕
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setUserDropdownOpen((open) => !open)}
                      className="text-slate-400 hover:text-slate-200"
                      aria-label="Alternar lista de usuários"
                    >
                      ▾
                    </button>
                  </div>
                  {userDropdownOpen && (
                    <div className="absolute z-10 mt-2 w-full max-h-60 overflow-auto rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-900/80 shadow-soft backdrop-blur">
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
                            className={`w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 ${
                              highlightedIndex === index ? 'bg-slate-100/80 dark:bg-slate-800/60' : ''
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
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
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
                <p className="text-gray-500 dark:text-gray-400 text-sm py-4">
                  {userQuery !== ''
                    ? `Nenhum usuário encontrado para "${userQuery}".`
                    : 'Nenhum usuário cadastrado.'}
                </p>
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
                  className="border border-slate-200/70 dark:border-slate-800/70 rounded-xl p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2 bg-white/70 dark:bg-slate-900/50"
                >
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{user.displayName || user.email}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                    {user.phone && (
                      <p className="text-sm text-slate-500 dark:text-slate-400">Telefone: {user.phone}</p>
                    )}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-300 min-w-[200px]">
                    {isEditing ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
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
                            className="planner-button-secondary-compact disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Copiar
                          </button>
                        </div>
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
                          <option value="usuario">User</option>
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
                        {role === 'superadmin' ? (
                          <div className="relative">
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
                              <div className="absolute z-10 mt-2 w-full max-h-60 overflow-auto rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-900/80 shadow-soft backdrop-blur">
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
                                      className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/60"
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
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateUser(user)}
                            disabled={loading || (role === 'superadmin' && !editEmpresaId)}
                            className="planner-button disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Salvar
                          </button>
                          {canEdit && !isBlocked && (
                            <button
                              onClick={() => handleBanUser(user)}
                              disabled={loading}
                              className="planner-button bg-amber-500 hover:bg-amber-400"
                            >
                              Bloquear
                            </button>
                          )}
                          {canEdit && isBlocked && (
                            <button
                              onClick={() => handleUnbanUser(user)}
                              disabled={loading}
                              className="planner-button bg-emerald-600 hover:bg-emerald-500"
                            >
                              Desbloquear
                            </button>
                          )}
                          {canEdit && (
                            <button
                              onClick={() => handleResetPassword(user)}
                              disabled={loading}
                              className="planner-button bg-indigo-600 hover:bg-indigo-500"
                            >
                              Redefinir senha
                            </button>
                          )}
                          {canEdit && (
                            <button
                              onClick={() => handleDeleteUser(user)}
                              disabled={loading}
                              className="planner-button bg-rose-600 hover:bg-rose-500"
                            >
                              Excluir
                            </button>
                          )}
                          <button
                            onClick={() => setEditingUserId(null)}
                            className="planner-button-secondary-compact"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p>Role: {user.role}</p>
                        <p>Empresa: {user.empresaName || user.empresaId || '-'}</p>
                        <p>MEI: {user.mei === false ? 'Desativado' : 'Ativo'}</p>
                        {canEdit && (
                          <button
                            onClick={() => startEditUser(user)}
                            className="mt-2 planner-button"
                          >
                            Editar
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
              })}
              <div className="flex flex-col items-center justify-between gap-3 pt-2 md:flex-row">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPageSafe <= 1}
                  className="planner-button-secondary-compact disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="planner-button-secondary-compact disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próximo
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

