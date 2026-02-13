import { useEffect, useMemo, useState } from 'react';
import Layout from '../Layout/Layout';
import { useAuthStore } from '../store/authStore';
import { hasRole } from '../lib/roles';
import { listUsers, type ManagedUser } from '../services/usersService';
import {
  fetchAdminUserBalance,
  fetchAdminUserBudgetSummary,
  fetchAdminUserCategories,
  fetchAdminUserTransactions,
  type AdminBalance
} from '../services/adminUserDataService';
import type { Transaction } from '../services/transactionService';
import type { Category, CategoryBudgetSummary } from '../services/categoryService';

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('pt-BR');
};

export default function AdminUserData() {
  const { role, empresaId } = useAuthStore();
  const canView = hasRole(role, ['admin']);

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingBudgets, setLoadingBudgets] = useState(false);
  const [error, setError] = useState('');
  const [dataError, setDataError] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<CategoryBudgetSummary[]>([]);
  const [balance, setBalance] = useState<AdminBalance | null>(null);

  useEffect(() => {
    if (!canView) return;
    setLoadingUsers(true);
    setError('');
    listUsers()
      .then((data) => {
        const scopedUsers = role === 'admin' && empresaId
          ? (data || []).filter((user) => user.empresaId === empresaId)
          : data;
        setUsers(scopedUsers || []);
      })
      .catch((err: any) => {
        setError(err.message || 'Erro ao carregar usuários');
      })
      .finally(() => {
        setLoadingUsers(false);
      });
  }, [canView]);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) || null,
    [users, selectedUserId]
  );

  const getUserLabel = (user: ManagedUser) =>
    user.displayName || user.email || 'Usuário sem nome';

  const sortedUsers = useMemo(() => {
    return [...users].sort((userA, userB) => {
      const labelA = (userA.displayName || userA.email || '').toLowerCase();
      const labelB = (userB.displayName || userB.email || '').toLowerCase();
      return labelA.localeCompare(labelB, 'pt-BR', { sensitivity: 'base' });
    });
  }, [users]);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = userQuery.trim().toLowerCase();
    if (!normalizedQuery) return sortedUsers;
    return sortedUsers.filter((user) => {
      const name = (user.displayName || '').toLowerCase();
      const email = (user.email || '').toLowerCase();
      const empresa = (user.empresaName || '').toLowerCase();
      return (
        name.includes(normalizedQuery) ||
        email.includes(normalizedQuery) ||
        empresa.includes(normalizedQuery)
      );
    });
  }, [sortedUsers, userQuery]);

  useEffect(() => {
    if (selectedUser && !userQuery.trim()) {
      setUserQuery(getUserLabel(selectedUser));
    }
  }, [selectedUser?.id]);

  useEffect(() => {
    if (highlightedIndex >= filteredUsers.length) {
      setHighlightedIndex(filteredUsers.length - 1);
    }
  }, [filteredUsers.length, highlightedIndex]);

  const categoriesMap = useMemo(() => {
    return new Map(categories.map((category) => [category.id, category.nome]));
  }, [categories]);

  const getTransactionDate = (transaction: Transaction) => {
    if (transaction.data) {
      return new Date(`${transaction.data}T00:00:00-03:00`);
    }
    return new Date(transaction.criado_em);
  };

  const dateFilter = useMemo(() => {
    if (!dateStart && !dateEnd) return null;
    const start = dateStart ? new Date(`${dateStart}T00:00:00-03:00`) : null;
    const end = dateEnd ? new Date(`${dateEnd}T23:59:59-03:00`) : null;
    return { start, end };
  }, [dateStart, dateEnd]);

  const filteredTransactions = useMemo(() => {
    if (!dateFilter) return transactions;
    return transactions.filter((transaction) => {
      const date = getTransactionDate(transaction);
      if (dateFilter.start && date < dateFilter.start) return false;
      if (dateFilter.end && date > dateFilter.end) return false;
      return true;
    });
  }, [transactions, dateFilter]);

  const displayedTransactions = useMemo(() => {
    return filteredTransactions.slice(0, 50);
  }, [filteredTransactions]);

  const filteredTotals = useMemo(() => {
    const totals = filteredTransactions.reduce(
      (acc, transaction) => {
        const valor = Number(transaction.valor || 0);
        if (transaction.tipo === 'entrada') {
          acc.totalEntradas += valor;
        } else {
          acc.totalSaidas += valor;
        }
        return acc;
      },
      { totalEntradas: 0, totalSaidas: 0 }
    );
    return {
      ...totals,
      balance: totals.totalEntradas - totals.totalSaidas
    };
  }, [filteredTransactions]);

  const budgetFilter = useMemo(() => {
    const reference = dateStart || dateEnd;
    if (!reference) return null;
    const date = new Date(`${reference}T00:00:00-03:00`);
    return { year: date.getFullYear(), month: date.getMonth() + 1 };
  }, [dateStart, dateEnd]);

  const budgetLabel = useMemo(() => {
    if (!budgetFilter) return 'Mês atual';
    const month = String(budgetFilter.month).padStart(2, '0');
    return `${month}/${budgetFilter.year}`;
  }, [budgetFilter]);

  const balancePeriodLabel = useMemo(() => {
    if (!dateFilter) return 'Todo período';
    const startLabel = dateStart ? formatDate(dateStart) : '...';
    const endLabel = dateEnd ? formatDate(dateEnd) : '...';
    return `${startLabel} até ${endLabel}`;
  }, [dateFilter, dateStart, dateEnd]);

  const isCrossMonthRange = useMemo(() => {
    if (!dateStart || !dateEnd) return false;
    const start = new Date(`${dateStart}T00:00:00-03:00`);
    const end = new Date(`${dateEnd}T00:00:00-03:00`);
    return start.getFullYear() !== end.getFullYear() || start.getMonth() !== end.getMonth();
  }, [dateStart, dateEnd]);

  const loadUserData = async (userId: string) => {
    setLoadingData(true);
    setDataError('');
    try {
      const [transactionsData, categoriesData, balanceData] = await Promise.all([
        fetchAdminUserTransactions(userId),
        fetchAdminUserCategories(userId),
        fetchAdminUserBalance(userId)
      ]);

      setTransactions(transactionsData || []);
      setCategories(categoriesData || []);
      setBalance(balanceData || null);
    } catch (err: any) {
      setDataError(err.message || 'Erro ao carregar dados do usuário');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!selectedUserId) {
      setTransactions([]);
      setCategories([]);
      setBudgetSummary([]);
      setBalance(null);
      return;
    }

    loadUserData(selectedUserId);
  }, [selectedUserId]);

  useEffect(() => {
    if (!selectedUserId) return;
    setLoadingBudgets(true);
    setDataError('');
    fetchAdminUserBudgetSummary(
      selectedUserId,
      budgetFilter ? { year: budgetFilter.year, month: budgetFilter.month } : undefined
    )
      .then((data) => {
        setBudgetSummary(data || []);
      })
      .catch((err: any) => {
        setDataError(err.message || 'Erro ao carregar orçamentos do usuário');
      })
      .finally(() => {
        setLoadingBudgets(false);
      });
  }, [selectedUserId, budgetFilter?.year, budgetFilter?.month]);

  if (!canView) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
          <h1 className="text-xl md:text-3xl font-bold dark:text-white">Dados dos usuários</h1>
          <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">
            Você não tem permissão para acessar esta página.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-4 md:space-y-6">
        <h1 className="text-xl md:text-3xl font-bold dark:text-white">Dados dos usuários</h1>
        <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">
          Visualize transações, orçamentos, categorias e saldos dos usuários.
        </p>

        {error && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {dataError && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded">
            {dataError}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 md:p-6 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg md:text-xl font-semibold dark:text-white">Selecionar usuário</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Escolha um usuário para consultar os dados financeiros.
              </p>
            </div>
            <button
              type="button"
              onClick={() => selectedUserId && loadUserData(selectedUserId)}
              disabled={!selectedUserId || loadingData}
              className="px-4 py-2 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700"
            >
              {loadingData ? 'Atualizando...' : 'Atualizar dados'}
            </button>
          </div>
          <div className="relative">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Buscar usuário</label>
            <input
              type="text"
              value={userQuery}
              onChange={(event) => {
                const value = event.target.value;
                setUserQuery(value);
                setUserDropdownOpen(true);
                setHighlightedIndex(-1);
                if (selectedUserId) {
                  const selectedLabel = selectedUser ? getUserLabel(selectedUser) : '';
                  if (value.trim().toLowerCase() !== selectedLabel.trim().toLowerCase()) {
                    setSelectedUserId('');
                  }
                }
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
                    setSelectedUserId(user.id);
                    setUserQuery(getUserLabel(user));
                    setUserDropdownOpen(false);
                    setHighlightedIndex(-1);
                    return;
                  }
                  if (filteredUsers.length === 1) {
                    const user = filteredUsers[0];
                    setSelectedUserId(user.id);
                    setUserQuery(getUserLabel(user));
                    setUserDropdownOpen(false);
                    setHighlightedIndex(-1);
                  }
                }
                if (event.key === 'Escape') {
                  setUserDropdownOpen(false);
                  setHighlightedIndex(-1);
                }
              }}
              className="w-full px-4 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
              placeholder={loadingUsers ? 'Carregando usuários...' : 'Digite para filtrar'}
              disabled={loadingUsers}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {userQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setUserQuery('');
                    setSelectedUserId('');
                    setUserDropdownOpen(false);
                    setHighlightedIndex(-1);
                  }}
                  className="text-gray-400 hover:text-gray-200"
                  aria-label="Limpar seleção"
                >
                  ✕
                </button>
              )}
              <button
                type="button"
                onClick={() => setUserDropdownOpen((open) => !open)}
                className="text-gray-400 hover:text-gray-200"
                aria-label="Alternar lista de usuários"
              >
                ▾
              </button>
            </div>
            {userDropdownOpen && (
              <div className="absolute z-10 mt-2 w-full max-h-60 overflow-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow">
                {loadingUsers ? (
                  <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                    Carregando usuários...
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                    Nenhum usuário encontrado.
                  </div>
                ) : (
                  filteredUsers.map((user, index) => (
                    <button
                      key={user.id}
                      type="button"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        setSelectedUserId(user.id);
                        setUserQuery(getUserLabel(user));
                        setUserDropdownOpen(false);
                        setHighlightedIndex(-1);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        highlightedIndex === index ? 'bg-gray-100 dark:bg-gray-700' : ''
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold">{getUserLabel(user)}</span>
                        {user.empresaName ? (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
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
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Data inicial</label>
              <input
                type="date"
                value={dateStart}
                onChange={(event) => setDateStart(event.target.value)}
                className="w-full px-4 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Data final</label>
              <input
                type="date"
                value={dateEnd}
                onChange={(event) => setDateEnd(event.target.value)}
                className="w-full px-4 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => {
                  setDateStart('');
                  setDateEnd('');
                }}
                className="w-full px-4 py-2 text-gray-700 dark:text-gray-200 rounded-lg border dark:border-gray-600"
              >
                Limpar filtros
              </button>
            </div>
          </div>
          {selectedUser && (
            <div className="text-sm text-gray-600 dark:text-gray-300">
              <p>Role: {selectedUser.role}</p>
              <p>Empresa: {selectedUser.empresaName || selectedUser.empresaId || '-'}</p>
              <p>Email: {selectedUser.email || '-'}</p>
            </div>
          )}
        </div>

        {!selectedUserId ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 md:p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Selecione um usuário para visualizar os dados.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
                <div>
                  <h2 className="text-lg md:text-xl font-semibold dark:text-white">Saldo</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Período: {balancePeriodLabel}
                  </p>
                </div>
              </div>
              {loadingData ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Carregando saldo...</p>
              ) : balance || dateFilter ? (
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {dateFilter ? 'Saldo no período' : 'Saldo atual'}
                    </p>
                    <p className="text-xl font-bold dark:text-white">
                      {formatCurrency(dateFilter ? filteredTotals.balance : (balance?.balance || 0))}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total de entradas</p>
                    <p className="text-xl font-bold text-emerald-500">
                      {formatCurrency(dateFilter ? filteredTotals.totalEntradas : (balance?.totalEntradas || 0))}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total de saídas</p>
                    <p className="text-xl font-bold text-rose-500">
                      {formatCurrency(dateFilter ? filteredTotals.totalSaidas : (balance?.totalSaidas || 0))}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum saldo disponível.</p>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
                <div>
                  <h2 className="text-lg md:text-xl font-semibold dark:text-white">Transações</h2>
                  {dateFilter && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Filtro aplicado nas datas selecionadas.
                    </p>
                  )}
                </div>
              </div>
              {loadingData ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Carregando transações...
                </p>
              ) : displayedTransactions.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Nenhuma transação encontrada.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm text-left text-gray-600 dark:text-gray-300">
                    <thead className="text-xs uppercase text-gray-500 dark:text-gray-400">
                      <tr>
                        <th className="py-2 px-3">Data</th>
                        <th className="py-2 px-3">Classificação</th>
                        <th className="py-2 px-3">Tipo</th>
                        <th className="py-2 px-3">Valor</th>
                        <th className="py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedTransactions.map((transaction) => (
                        <tr key={transaction.id} className="border-t border-gray-200 dark:border-gray-700">
                          <td className="py-2 px-3">
                            {formatDate(transaction.data || transaction.criado_em)}
                          </td>
                          <td className="py-2 px-3">{transaction.classificacao}</td>
                          <td className="py-2 px-3 capitalize">{transaction.tipo}</td>
                          <td className="py-2 px-3">
                            {formatCurrency(Number(transaction.valor || 0))}
                          </td>
                          <td className="py-2 px-3">{transaction.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredTransactions.length > displayedTransactions.length && (
                    <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                      Mostrando {displayedTransactions.length} de {filteredTransactions.length} transações.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
                <div>
                  <h2 className="text-lg md:text-xl font-semibold dark:text-white">Orçamentos</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Período: {budgetLabel}
                  </p>
                </div>
                {isCrossMonthRange && (
                  <span className="text-xs text-amber-500">
                    Intervalo cobre mais de um mês; orçamentos usam o mês inicial.
                  </span>
                )}
              </div>
              {loadingData || loadingBudgets ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Carregando orçamentos...
                </p>
              ) : budgetSummary.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Nenhum orçamento encontrado para o período selecionado.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm text-left text-gray-600 dark:text-gray-300">
                    <thead className="text-xs uppercase text-gray-500 dark:text-gray-400">
                      <tr>
                        <th className="py-2 px-3">Categoria</th>
                        <th className="py-2 px-3">Orçado</th>
                        <th className="py-2 px-3">Gasto</th>
                        <th className="py-2 px-3">Recebido</th>
                      </tr>
                    </thead>
                    <tbody>
                      {budgetSummary.map((row) => (
                        <tr key={row.categorias_id} className="border-t border-gray-200 dark:border-gray-700">
                          <td className="py-2 px-3">
                            {categoriesMap.get(row.categorias_id) || `Categoria ${row.categorias_id}`}
                          </td>
                          <td className="py-2 px-3">
                            {row.valor_orcado !== null ? formatCurrency(row.valor_orcado) : '-'}
                          </td>
                          <td className="py-2 px-3">{formatCurrency(row.valor_gasto || 0)}</td>
                          <td className="py-2 px-3">
                            {formatCurrency(row.valor_recebido || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 md:p-6">
              <h2 className="text-lg md:text-xl font-semibold mb-4 dark:text-white">Categorias</h2>
              {loadingData ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Carregando categorias...
                </p>
              ) : categories.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Nenhuma categoria encontrada.
                </p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                    >
                      <p className="font-semibold text-gray-800 dark:text-gray-100">
                        {category.nome}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Tipo: {category.tipo}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
