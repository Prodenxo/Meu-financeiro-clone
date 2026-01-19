import { useEffect, useState } from 'react';
import Layout from '../Layout/Layout';
import { useAuthStore } from '../store/authStore';
import { hasRole } from '../lib/roles';
import { createUser, listEmpresas, listUsers, updateUser, type EmpresaOption, type ManagedUser } from '../services/usersService';

export default function ManageUsers() {
  const { role, empresaId } = useAuthStore();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
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

  const canManage = hasRole(role, ['admin']);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao listar usuários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canManage) {
      fetchUsers();
    }
  }, [canManage]);

  useEffect(() => {
    if (!canManage || role !== 'superadmin') return;
    listEmpresas()
      .then((data) => {
        console.log('[ManageUsers] empresas recebidas:', data);
        setEmpresas(data);
      })
      .catch((err: any) => {
        console.log('[ManageUsers] erro ao listar empresas:', err);
        setError(err.message || 'Erro ao listar empresas');
      });
  }, [canManage, role]);

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
      setEmail('');
      setPassword('');
      setDisplayName('');
      setPhone('');
      if (role === 'superadmin') {
        setTargetEmpresaId('');
        setSelectedRole('usuario');
      }
      await fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar usuário');
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
  };

  const handleUpdateUser = async (user: ManagedUser) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload =
        role === 'superadmin'
          ? { role: editRole, empresaId: editEmpresaId || undefined }
          : { role: 'usuario' };
      await updateUser(user.id, payload);
      setSuccess('Usuário atualizado com sucesso.');
      setEditingUserId(null);
      await fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar usuário');
    } finally {
      setLoading(false);
    }
  };

  if (!canManage) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
          <h1 className="text-xl md:text-3xl font-bold dark:text-white">Gerenciar usuários</h1>
          <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">
            Você não tem permissão para acessar esta página.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
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

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 dark:text-white">Criar usuário</h2>
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="px-4 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                placeholder="Email"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="px-4 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                placeholder="Senha (opcional)"
              />
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="px-4 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                placeholder="Nome de exibição"
              />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="px-4 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                placeholder="Telefone"
              />
            </div>

            {role === 'superadmin' ? (
              <div className="grid gap-3 md:grid-cols-2">
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as 'admin' | 'usuario' | 'outsider')}
                  className="px-4 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
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
                      className="w-full px-4 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                      placeholder="Empresa"
                    />
                    <button
                      type="button"
                      onClick={() => setEmpresaOpen((open) => !open)}
                      className="px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                      aria-label="Listar empresas"
                    >
                      ▾
                    </button>
                  </div>
                  {empresaOpen && (
                    <div className="absolute z-10 mt-2 w-full max-h-60 overflow-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow">
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
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            {empresa.empresa}
                          </button>
                        ))}
                      {empresas.length === 0 && (
                        <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                          Nenhuma empresa encontrada.
                        </div>
                      )}
                    </div>
                  )}
                  {targetEmpresaId && (
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Empresa selecionada: {empresaQuery}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Usuário será criado na empresa atual: {empresaId || 'não definida'}
              </p>
            )}

            <button
              onClick={handleCreateUser}
              disabled={loading || !email}
              className="px-4 py-2 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Salvando...' : 'Criar usuário'}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 dark:text-white">Usuários</h2>
          {loading ? (
            <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
          ) : users.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">Nenhum usuário encontrado.</p>
          ) : (
            <div className="space-y-3">
              {users.map((user) => {
                const canEdit =
                  role === 'superadmin'
                    ? user.role !== 'superadmin'
                    : role === 'admin' && user.role === 'usuario';
                const isEditing = editingUserId === user.id;

                return (
                <div
                  key={user.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                >
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{user.displayName || user.email}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                    {user.phone && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">Telefone: {user.phone}</p>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 min-w-[200px]">
                    {isEditing ? (
                      <div className="space-y-2">
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value as 'admin' | 'usuario' | 'outsider')}
                          disabled={role !== 'superadmin'}
                          className="w-full px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                        >
                          {role === 'superadmin' && <option value="admin">Admin</option>}
                          <option value="usuario">User</option>
                          {role === 'superadmin' && <option value="outsider">Outsider</option>}
                        </select>
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
                                className="w-full px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                                placeholder="Empresa"
                              />
                              <button
                                type="button"
                                onClick={() => setEditEmpresaOpen((open) => !open)}
                                className="px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                                aria-label="Listar empresas"
                              >
                                ▾
                              </button>
                            </div>
                            {editEmpresaOpen && (
                              <div className="absolute z-10 mt-2 w-full max-h-60 overflow-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow">
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
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                      {empresa.empresa}
                                    </button>
                                  ))}
                                {empresas.length === 0 && (
                                  <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
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
                            className="px-3 py-2 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700"
                          >
                            Salvar
                          </button>
                          <button
                            onClick={() => setEditingUserId(null)}
                            className="px-3 py-2 text-gray-700 dark:text-gray-200 rounded-lg border dark:border-gray-600"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p>Role: {user.role}</p>
                        <p>Empresa: {user.empresaName || user.empresaId || '-'}</p>
                        {canEdit && (
                          <button
                            onClick={() => startEditUser(user)}
                            className="mt-2 px-3 py-2 text-white rounded-lg font-semibold bg-blue-600 hover:bg-blue-700"
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
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
