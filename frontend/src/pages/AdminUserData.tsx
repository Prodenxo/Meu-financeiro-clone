import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { hasRole } from '../lib/roles';
import { listUsers, type ManagedUser } from '../services/usersService';
import {
  downloadAdminMeiGuide,
  fetchAdminDasStatus,
  fetchAdminMeiCertificateStatus,
  fetchAdminMeiPeriods,
  fetchAdminMeiPeriodsByCnpj,
  fetchAdminUserBalance,
  fetchAdminUserBudgetSummary,
  fetchAdminUserCategories,
  fetchAdminUserTransactions,
  sendAdminMeiGuideWhatsapp,
  type AdminBalance,
  type AdminDasPendingSummary,
  type AdminDasStatusFilters,
  type AdminMeiCertificateStatus,
  type AdminMeiPeriod
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

const normalizeDoc = (value: string) => value.replace(/\D/g, '');

const formatDocument = (value: string) => {
  const digits = normalizeDoc(value).slice(0, 14);
  let formatted = '';
  for (let i = 0; i < digits.length; i += 1) {
    formatted += digits[i];
    if (digits.length <= 11) {
      if (i === 2 || i === 5) formatted += '.';
      if (i === 8) formatted += '-';
    } else {
      if (i === 1 || i === 4) formatted += '.';
      if (i === 7) formatted += '/';
      if (i === 11) formatted += '-';
    }
  }
  return formatted;
};

const formatDasCompetenciaLabel = (value?: string | null) => {
  if (!value) return '---';
  const match = String(value).match(/^(\d{4})-(\d{2})$/);
  if (match) {
    return `${match[2]}/${match[1]}`;
  }
  return String(value);
};

const normalizeWhatsappErrorMessage = (message: string) => {
  const normalized = message.toLowerCase();
  if (normalized.includes('webhook') && normalized.includes('not registered')) {
    return 'Webhook do WhatsApp não está ativo/registrado. Verifique o endpoint no n8n.';
  }
  if (normalized.includes('webhook') && normalized.includes('not found')) {
    return 'Webhook do WhatsApp não está ativo/registrado. Verifique o endpoint no n8n.';
  }
  return message || 'Erro ao enviar guia pelo WhatsApp.';
};

const getDefaultMeiPeriod = () => {
  const now = new Date();
  const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return {
    year: previous.getFullYear(),
    month: String(previous.getMonth() + 1).padStart(2, '0')
  };
};

const toPeriodoApuracao = (month: string, year: number) => {
  return `${year}${month}`;
};

const toPeriodoApuracaoFromCompetencia = (competencia?: string | null) => {
  const match = String(competencia || '').match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  return `${match[1]}${match[2]}`;
};

const triggerFileDownload = (blob: Blob, filename: string) => {
  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(downloadUrl);
};

const getDasStatusLabel = (status: 'pago' | 'pendente' | 'erro') => {
  if (status === 'pago') return 'Pago';
  if (status === 'erro') return 'Erro';
  return 'Pendente';
};

const getDasStatusClasses = (status: 'pago' | 'pendente' | 'erro') => {
  if (status === 'pago') {
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
  }
  if (status === 'erro') {
    return 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300';
  }
  return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
};

const getMeiStatusLabel = (status?: AdminMeiPeriod['status'] | null) => {
  if (status === 'pago') return 'Pago';
  if (status === 'erro') return 'Erro/Indeterminado';
  return 'Em aberto';
};

const getMeiStatusClasses = (status?: AdminMeiPeriod['status'] | null) => {
  if (status === 'pago') return 'admin-badge-success';
  if (status === 'erro') return 'admin-badge-danger';
  return 'admin-badge-warning';
};

const getDefaultDasCompetencia = () => {
  const now = new Date();
  const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const month = String(previous.getMonth() + 1).padStart(2, '0');
  return `${previous.getFullYear()}-${month}`;
};

export default function AdminUserData() {
  const { role, empresaId } = useAuthStore();
  const canView = hasRole(role, ['admin']);

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingBudgets, setLoadingBudgets] = useState(false);
  const [loadingDasPending, setLoadingDasPending] = useState(false);
  const [error, setError] = useState('');
  const [dataError, setDataError] = useState('');
  const [dasError, setDasError] = useState('');
  const [dasCompetencia, setDasCompetencia] = useState(getDefaultDasCompetencia);
  const [dasStatusFilter, setDasStatusFilter] = useState<'pendente' | 'pago' | 'erro' | 'todos'>('pendente');
  const [dasSearch, setDasSearch] = useState('');
  const [debouncedDasSearch, setDebouncedDasSearch] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [openAccordion, setOpenAccordion] = useState<'balance' | 'transactions' | 'budgets' | 'categories'>(
    'balance'
  );

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<CategoryBudgetSummary[]>([]);
  const [balance, setBalance] = useState<AdminBalance | null>(null);
  const [dasPendingSummary, setDasPendingSummary] = useState<AdminDasPendingSummary | null>(null);
  const defaultMeiPeriod = useMemo(() => getDefaultMeiPeriod(), []);
  const [meiCertificateStatus, setMeiCertificateStatus] = useState<AdminMeiCertificateStatus | null>(null);
  const [meiCnpj, setMeiCnpj] = useState('');
  const [meiSelectedYear, setMeiSelectedYear] = useState<number>(defaultMeiPeriod.year);
  const [meiSelectedMonth, setMeiSelectedMonth] = useState<string>(defaultMeiPeriod.month);
  const [meiPeriods, setMeiPeriods] = useState<AdminMeiPeriod[]>([]);
  const [meiPeriodsLoading, setMeiPeriodsLoading] = useState(false);
  const [meiPeriodsError, setMeiPeriodsError] = useState<string | null>(null);
  const [meiActionError, setMeiActionError] = useState<string | null>(null);
  const [meiActionSuccess, setMeiActionSuccess] = useState<string | null>(null);
  const [meiDownloading, setMeiDownloading] = useState(false);
  const [meiSending, setMeiSending] = useState(false);
  const [meiStatusLoading, setMeiStatusLoading] = useState(false);
  const autoDownloadKeysRef = useRef<Set<string>>(new Set());
  const autoDownloadingRef = useRef(false);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedDasSearch(dasSearch.trim());
    }, 300);
    return () => window.clearTimeout(handle);
  }, [dasSearch]);

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
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Erro ao carregar usuários';
        setError(message);
      })
      .finally(() => {
        setLoadingUsers(false);
      });
  }, [canView]);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) || null,
    [users, selectedUserId]
  );
  const normalizedMeiCnpj = useMemo(() => normalizeDoc(meiCnpj), [meiCnpj]);
  const canLoadMeiPeriods = useMemo(
    () => Boolean(meiCertificateStatus?.hasUserCertificate) || normalizedMeiCnpj.length === 14,
    [meiCertificateStatus?.hasUserCertificate, normalizedMeiCnpj.length]
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

  const availableMeiYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 10 }, (_, index) => currentYear - index);
  }, []);

  const availableMeiMonths = useMemo(() => (
    Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'))
  ), []);

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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar dados do usuário';
      setDataError(message);
    } finally {
      setLoadingData(false);
    }
  };

  const loadDasPending = async (filters?: AdminDasStatusFilters) => {
    setLoadingDasPending(true);
    setDasError('');
    try {
      const data = await fetchAdminDasStatus({
        competencia: filters?.competencia || dasCompetencia,
        status: filters?.status || (dasStatusFilter === 'todos' ? undefined : dasStatusFilter),
        q: filters?.q ?? debouncedDasSearch
      });
      setDasPendingSummary(data || null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar pendências de DAS';
      setDasError(message);
    } finally {
      setLoadingDasPending(false);
    }
  };

  const resetMeiState = useCallback(() => {
    setMeiCertificateStatus(null);
    setMeiCnpj('');
    setMeiPeriods([]);
    setMeiPeriodsError(null);
    setMeiActionError(null);
    setMeiActionSuccess(null);
  }, []);

  const triggerAutoDownload = useCallback(async (userId: string, periods: AdminMeiPeriod[]) => {
    if (autoDownloadingRef.current) return;
    if (!periods?.length) return;
    const pendingPeriods = periods.filter((period) => period.status !== 'pago');
    if (pendingPeriods.length === 0) return;
    autoDownloadingRef.current = true;
    try {
      const cnpjParam = normalizedMeiCnpj.length === 14 ? normalizedMeiCnpj : undefined;
      for (const period of pendingPeriods) {
        const periodoApuracao = period.guideId || toPeriodoApuracaoFromCompetencia(period.competencia);
        if (!periodoApuracao) continue;
        const key = `${userId}:${cnpjParam || 'no-cnpj'}:${periodoApuracao}`;
        if (autoDownloadKeysRef.current.has(key)) continue;
        autoDownloadKeysRef.current.add(key);
        try {
          const { blob, filename } = await downloadAdminMeiGuide(userId, periodoApuracao, cnpjParam);
          triggerFileDownload(blob, filename || `guia-mei-${periodoApuracao}.pdf`);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Erro ao baixar guia.';
          setMeiActionError(message);
        }
      }
    } finally {
      autoDownloadingRef.current = false;
    }
  }, [normalizedMeiCnpj]);

  const loadMeiCertificateStatus = useCallback(async (userId: string) => {
    setMeiStatusLoading(true);
    setMeiActionError(null);
    try {
      const data = await fetchAdminMeiCertificateStatus(userId);
      setMeiCertificateStatus(data || null);
      if (data?.documento) {
        setMeiCnpj(formatDocument(data.documento));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar certificado MEI';
      setMeiCertificateStatus(null);
      setMeiActionError(message);
    } finally {
      setMeiStatusLoading(false);
    }
  }, []);

  const loadMeiPeriods = useCallback(async (userId: string) => {
    if (!canLoadMeiPeriods) {
      setMeiPeriods([]);
      setMeiPeriodsError(null);
      return;
    }
    setMeiPeriodsLoading(true);
    setMeiPeriodsError(null);
    const cnpjParam = normalizedMeiCnpj.length === 14 ? normalizedMeiCnpj : undefined;
    try {
      const data = meiCertificateStatus?.hasUserCertificate
        ? await fetchAdminMeiPeriods(userId, cnpjParam)
        : await fetchAdminMeiPeriodsByCnpj(userId, cnpjParam || '');
      setMeiPeriods(data || []);
      await triggerAutoDownload(userId, data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao listar períodos do DAS.';
      setMeiPeriodsError(message);
    } finally {
      setMeiPeriodsLoading(false);
    }
  }, [canLoadMeiPeriods, meiCertificateStatus?.hasUserCertificate, normalizedMeiCnpj, triggerAutoDownload]);

  const handleMeiDownload = async () => {
    if (!selectedUserId) return;
    setMeiActionError(null);
    setMeiActionSuccess(null);
    const hasCertificate = Boolean(meiCertificateStatus?.hasUserCertificate);
    if (!hasCertificate && normalizedMeiCnpj.length !== 14) {
      setMeiActionError('Informe o CNPJ do MEI para baixar a guia.');
      return;
    }
    const periodoApuracao = toPeriodoApuracao(meiSelectedMonth, meiSelectedYear);
    const cnpjParam = normalizedMeiCnpj.length === 14 ? normalizedMeiCnpj : undefined;
    setMeiDownloading(true);
    try {
      const { blob, filename } = await downloadAdminMeiGuide(
        selectedUserId,
        periodoApuracao,
        cnpjParam
      );
      triggerFileDownload(blob, filename || `guia-mei-${periodoApuracao}.pdf`);
      setMeiActionSuccess('Download da guia iniciado.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao baixar guia.';
      setMeiActionError(message);
    } finally {
      setMeiDownloading(false);
    }
  };

  const handleMeiSendWhatsapp = async () => {
    if (!selectedUserId) return;
    setMeiActionError(null);
    setMeiActionSuccess(null);
    const hasCertificate = Boolean(meiCertificateStatus?.hasUserCertificate);
    if (!selectedUser?.phone) {
      setMeiActionError('Telefone do usuário não informado.');
      return;
    }
    if (!hasCertificate && normalizedMeiCnpj.length !== 14) {
      setMeiActionError('Informe o CNPJ do MEI para enviar a guia.');
      return;
    }
    const periodoApuracao = toPeriodoApuracao(meiSelectedMonth, meiSelectedYear);
    const competencia = `${meiSelectedYear}-${meiSelectedMonth}`;
    const cnpjParam = normalizedMeiCnpj.length === 14 ? normalizedMeiCnpj : undefined;
    setMeiSending(true);
    try {
      await sendAdminMeiGuideWhatsapp(selectedUserId, {
        periodoApuracao,
        competencia,
        ...(cnpjParam ? { cnpj: cnpjParam } : {})
      });
      setMeiActionSuccess('Envio para WhatsApp solicitado.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao enviar guia pelo WhatsApp.';
      setMeiActionError(normalizeWhatsappErrorMessage(message));
    } finally {
      setMeiSending(false);
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
    if (!selectedUserId) {
      resetMeiState();
      return;
    }
    resetMeiState();
    setMeiSelectedYear(defaultMeiPeriod.year);
    setMeiSelectedMonth(defaultMeiPeriod.month);
    void loadMeiCertificateStatus(selectedUserId);
  }, [selectedUserId, defaultMeiPeriod.year, defaultMeiPeriod.month, loadMeiCertificateStatus, resetMeiState]);

  useEffect(() => {
    if (!selectedUserId) return;
    if (!canLoadMeiPeriods) {
      setMeiPeriods([]);
      setMeiPeriodsError(null);
      return;
    }
    void loadMeiPeriods(selectedUserId);
  }, [selectedUserId, canLoadMeiPeriods, loadMeiPeriods]);

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
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Erro ao carregar orçamentos do usuário';
        setDataError(message);
      })
      .finally(() => {
        setLoadingBudgets(false);
      });
  }, [selectedUserId, budgetFilter?.year, budgetFilter?.month]);

  useEffect(() => {
    if (!canView) return;
    void loadDasPending({
      competencia: dasCompetencia,
      status: dasStatusFilter === 'todos' ? undefined : dasStatusFilter,
      q: debouncedDasSearch
    });
  }, [canView, dasCompetencia, dasStatusFilter, debouncedDasSearch]);

  const dasTotalClientes = dasPendingSummary?.totalClientes || 0;
  const dasPendentes = dasPendingSummary?.pendentes || 0;
  const dasItemsCount = dasPendingSummary?.items?.length || 0;
  const meiPendingCount = useMemo(
    () => meiPeriods.filter((period) => period.status !== 'pago').length,
    [meiPeriods]
  );
  const meiCertificateStatusLabel = useMemo(() => {
    if (meiCertificateStatus?.hasUserCertificate) return 'Cliente';
    if (meiCertificateStatus?.hasEnvCertificate) return 'Servidor';
    return 'Indisponível';
  }, [meiCertificateStatus?.hasEnvCertificate, meiCertificateStatus?.hasUserCertificate]);

  if (!canView) {
    return (
      <>
        <div className="admin-page-shell">
          <section className="admin-hero">
            <h1 className="admin-hero-title">Dados dos usuários</h1>
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
              <h1 className="admin-hero-title">Dados dos usuários</h1>
              <p className="admin-hero-subtitle">
                Visualize transações, orçamentos, categorias e saldos dos usuários.
              </p>
            </div>
            <span className="admin-badge-primary">
              {selectedUserId ? 'Usuário selecionado' : 'Selecione um usuário'}
            </span>
          </div>
          <div className="admin-stat-grid">
            <div className="admin-stat-card">
              <p className="admin-stat-label">Clientes na competência</p>
              <p className="admin-stat-value">{dasTotalClientes}</p>
            </div>
            <div className="admin-stat-card">
              <p className="admin-stat-label">Pendências DAS</p>
              <p className="admin-stat-value">{dasPendentes}</p>
            </div>
            <div className="admin-stat-card">
              <p className="admin-stat-label">Registros retornados</p>
              <p className="admin-stat-value">{dasItemsCount}</p>
            </div>
            <div className="admin-stat-card">
              <p className="admin-stat-label">Período</p>
              <p className="admin-stat-value text-base md:text-lg">
                {dateFilter ? `${formatDate(dateStart)} - ${formatDate(dateEnd)}` : 'Sem filtro'}
              </p>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-rose-300/90 bg-rose-50/90 px-4 py-3 text-rose-700 dark:border-rose-800/80 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </div>
        )}

        {dataError && (
          <div className="rounded-xl border border-rose-300/90 bg-rose-50/90 px-4 py-3 text-rose-700 dark:border-rose-800/80 dark:bg-rose-950/40 dark:text-rose-300">
            {dataError}
          </div>
        )}

        {dasError && (
          <div className="rounded-xl border border-rose-300/90 bg-rose-50/90 px-4 py-3 text-rose-700 dark:border-rose-800/80 dark:bg-rose-950/40 dark:text-rose-300">
            {dasError}
          </div>
        )}

        <div className="admin-section-card">
          <div className="admin-section-header">
            <div>
              <h2 className="admin-section-title">Pendências DAS</h2>
              <p className="admin-section-subtitle">
                Clientes pendentes de pagamento do DAS na competência selecionada.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                void loadDasPending({
                  competencia: dasCompetencia,
                  status: dasStatusFilter === 'todos' ? undefined : dasStatusFilter,
                  q: dasSearch
                })
              }
              disabled={loadingDasPending}
              className="planner-button w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingDasPending ? 'Atualizando...' : 'Atualizar pendências'}
            </button>
          </div>

          <div className="admin-toolbar grid gap-3 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                Competência (YYYY-MM)
              </label>
              <input
                type="month"
                value={dasCompetencia}
                onChange={(event) => setDasCompetencia(event.target.value)}
                className="planner-input-compact"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Status</label>
              <select
                value={dasStatusFilter}
                onChange={(event) =>
                  setDasStatusFilter(event.target.value as 'pendente' | 'pago' | 'erro' | 'todos')
                }
                className="planner-input-compact"
              >
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
                <option value="erro">Erro</option>
                <option value="todos">Todos</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Buscar cliente</label>
              <input
                type="text"
                value={dasSearch}
                onChange={(event) => setDasSearch(event.target.value)}
                placeholder="Nome, email ou CNPJ"
                className="planner-input-compact"
              />
            </div>
            <div className="md:col-span-4 grid gap-3 md:grid-cols-2">
              <div className="admin-stat-card">
                <p className="admin-stat-label">Total de clientes</p>
                <p className="admin-stat-value">{dasTotalClientes}</p>
              </div>
              <div className="admin-stat-card border-amber-300 dark:border-amber-800/70">
                <p className="admin-stat-label">Pendentes DAS</p>
                <p className="admin-stat-value text-amber-600 dark:text-amber-400">{dasPendentes}</p>
              </div>
            </div>
          </div>

          {loadingDasPending ? (
            <div className="admin-empty-state">Carregando pendências...</div>
          ) : (dasPendingSummary?.items?.length || 0) === 0 ? (
            <div className="admin-empty-state">Nenhuma pendência de DAS para esta competência.</div>
          ) : (
            <div className="admin-table-shell">
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead className="admin-table-head">
                    <tr>
                      <th className="admin-table-cell">Cliente</th>
                      <th className="admin-table-cell">Empresa</th>
                      <th className="admin-table-cell">CNPJ</th>
                      <th className="admin-table-cell">Competência</th>
                      <th className="admin-table-cell">Status</th>
                      <th className="admin-table-cell">PDF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(dasPendingSummary?.items || []).map((item) => (
                      <tr key={`${item.userId}-${item.competencia}`} className="admin-table-row">
                        <td className="admin-table-cell">
                          <div className="font-semibold">{item.displayName}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{item.email || '-'}</div>
                        </td>
                        <td className="admin-table-cell">{item.empresaName || item.empresaId || '-'}</td>
                        <td className="admin-table-cell">{item.cnpj}</td>
                        <td className="admin-table-cell">{item.competencia}</td>
                        <td className="admin-table-cell">
                          <span className={`admin-badge ${getDasStatusClasses(item.status)}`}>
                            {getDasStatusLabel(item.status)}
                          </span>
                        </td>
                        <td className="admin-table-cell">{item.hasPdf ? 'Disponível' : 'Não gerado'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="admin-section-card">
          <div className="admin-section-header">
            <div>
              <h2 className="admin-section-title">Selecionar usuário</h2>
              <p className="admin-section-subtitle">
                Escolha um usuário para consultar os dados financeiros.
              </p>
            </div>
            <button
              type="button"
              onClick={() => selectedUserId && loadUserData(selectedUserId)}
              disabled={!selectedUserId || loadingData}
              className="planner-button w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingData ? 'Atualizando...' : 'Atualizar dados'}
            </button>
          </div>
          <div className="admin-toolbar relative">
            <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Buscar usuário</label>
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
              className="planner-input-compact"
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
                  className="admin-icon-button"
                  aria-label="Limpar seleção"
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
                      className={`admin-dropdown-option ${
                        highlightedIndex === index ? 'admin-dropdown-option-active' : ''
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
          <div className="admin-toolbar grid gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Data inicial</label>
              <input
                type="date"
                value={dateStart}
                onChange={(event) => setDateStart(event.target.value)}
                className="planner-input-compact"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Data final</label>
              <input
                type="date"
                value={dateEnd}
                onChange={(event) => setDateEnd(event.target.value)}
                className="planner-input-compact"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => {
                  setDateStart('');
                  setDateEnd('');
                }}
                className="planner-button-secondary-compact w-full justify-between"
              >
                Limpar filtros
              </button>
            </div>
          </div>
          {selectedUser && (
            <div className="admin-toolbar text-sm text-slate-600 dark:text-slate-300">
              <p>Role: {selectedUser.role}</p>
              <p>Empresa: {selectedUser.empresaName || selectedUser.empresaId || '-'}</p>
              <p>Email: {selectedUser.email || '-'}</p>
            </div>
          )}
        </div>

        {!selectedUserId ? (
          <div className="admin-empty-state">
            Selecione um usuário para visualizar os dados e o Meu MEI.
          </div>
        ) : (
          <>
            <div className="admin-section-card">
              <div className="admin-section-header">
                <div>
                  <h2 className="admin-section-title">Meu MEI (cliente)</h2>
                  <p className="admin-section-subtitle">
                    Gere, baixe e envie a guia DAS do cliente selecionado.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => selectedUserId && loadMeiPeriods(selectedUserId)}
                  disabled={!canLoadMeiPeriods || meiPeriodsLoading}
                  className="planner-button w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {meiPeriodsLoading ? 'Atualizando...' : 'Atualizar histórico'}
                </button>
              </div>

              <div className="admin-stat-grid">
                <div className="admin-stat-card">
                  <p className="admin-stat-label">Períodos DAS</p>
                  <p className="admin-stat-value">{meiPeriods.length}</p>
                </div>
                <div className="admin-stat-card">
                  <p className="admin-stat-label">Pendências DAS</p>
                  <p className="admin-stat-value">{meiPendingCount}</p>
                </div>
                <div className="admin-stat-card">
                  <p className="admin-stat-label">Contato WhatsApp</p>
                  <p className="admin-stat-value text-base md:text-lg">
                    {selectedUser?.phone ? 'Disponível' : 'Sem telefone'}
                  </p>
                </div>
                <div className="admin-stat-card">
                  <p className="admin-stat-label">Certificado</p>
                  <p className="admin-stat-value text-base md:text-lg">{meiCertificateStatusLabel}</p>
                </div>
              </div>

              {meiActionError && (
                <div className="rounded-xl border border-rose-300/90 bg-rose-50/90 px-4 py-3 text-rose-700 dark:border-rose-800/80 dark:bg-rose-950/40 dark:text-rose-300">
                  {meiActionError}
                </div>
              )}

              {meiActionSuccess && (
                <div className="rounded-xl border border-emerald-300/90 bg-emerald-50/90 px-4 py-3 text-emerald-700 dark:border-emerald-800/80 dark:bg-emerald-950/40 dark:text-emerald-300">
                  {meiActionSuccess}
                </div>
              )}

              <div className="admin-toolbar grid gap-3 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
                <div>
                  <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">CNPJ do MEI</label>
                  <input
                    type="text"
                    value={meiCnpj}
                    onChange={(event) => setMeiCnpj(formatDocument(event.target.value))}
                    placeholder="00.000.000/0001-00"
                    className="planner-input-compact"
                  />
                  {meiStatusLoading ? (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      Carregando status do certificado...
                    </p>
                  ) : (
                    <div className="mt-2 admin-actions">
                      {meiCertificateStatus?.hasUserCertificate && (
                        <span className="admin-badge-success">Certificado do cliente ativo</span>
                      )}
                      {!meiCertificateStatus?.hasUserCertificate && meiCertificateStatus?.hasEnvCertificate && (
                        <span className="admin-badge-primary">Certificado do servidor disponível</span>
                      )}
                      {!meiCertificateStatus?.hasUserCertificate &&
                        !meiCertificateStatus?.hasEnvCertificate && (
                          <span className="admin-badge-warning">Sem certificado disponível</span>
                        )}
                    </div>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-[170px_170px_auto] md:items-end">
                  <div>
                    <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Mês</label>
                    <select
                      className="planner-input-compact"
                      value={meiSelectedMonth}
                      onChange={(event) => setMeiSelectedMonth(event.target.value)}
                    >
                      {availableMeiMonths.map((month) => (
                        <option key={month} value={month}>
                          {month}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Ano</label>
                    <select
                      className="planner-input-compact"
                      value={meiSelectedYear}
                      onChange={(event) => setMeiSelectedYear(Number(event.target.value))}
                    >
                      {availableMeiYears.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="admin-actions md:justify-self-start">
                    <button
                      type="button"
                      onClick={handleMeiDownload}
                      disabled={meiDownloading}
                      className="planner-button w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {meiDownloading ? 'Baixando...' : 'Baixar guia'}
                    </button>
                    <button
                      type="button"
                      onClick={handleMeiSendWhatsapp}
                      disabled={meiSending || !selectedUser?.phone}
                      className="planner-button-secondary-compact w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {meiSending ? 'Enviando...' : 'Enviar por zap'}
                    </button>
                  </div>
                </div>
              </div>

              {!selectedUser?.phone && (
                <div className="rounded-xl border border-amber-300/90 bg-amber-50/90 px-4 py-3 text-amber-700 dark:border-amber-800/80 dark:bg-amber-950/40 dark:text-amber-300">
                  Telefone do cliente não cadastrado. Atualize antes de enviar.
                </div>
              )}

              <div className="admin-toolbar space-y-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">Histórico do DAS</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Últimos períodos consultados e situação do pagamento.
                  </p>
                </div>

                {!canLoadMeiPeriods ? (
                  <div className="admin-empty-state">Informe o CNPJ do MEI para consultar meses pagos.</div>
                ) : meiPeriodsLoading ? (
                  <div className="admin-empty-state">Carregando histórico...</div>
                ) : meiPeriodsError ? (
                  <div className="rounded-xl border border-rose-300/90 bg-rose-50/90 px-4 py-3 text-rose-700 dark:border-rose-800/80 dark:bg-rose-950/40 dark:text-rose-300">
                    {meiPeriodsError}
                  </div>
                ) : meiPeriods.length === 0 ? (
                  <div className="admin-empty-state">Nenhum período encontrado.</div>
                ) : (
                  <div className="space-y-2">
                    {meiPeriods.map((period) => (
                      <div
                        key={`${period.competencia}-${period.guideId || period.status}`}
                        className="admin-toolbar flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="text-sm text-slate-700 dark:text-gray-200">
                            {formatDasCompetenciaLabel(period.competencia)}
                          </div>
                          {period.status === 'erro' ? (
                            <p className="mt-1 text-xs text-rose-600 dark:text-rose-300">
                              {period.errorMessage || 'Falha ao consultar o período no Serpro.'}
                            </p>
                          ) : null}
                        </div>
                        <span className={getMeiStatusClasses(period.status)}>
                          {getMeiStatusLabel(period.status)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="planner-card overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenAccordion('balance')}
                  aria-expanded={openAccordion === 'balance'}
                  aria-controls="accordion-panel-balance"
                  className="w-full flex items-start justify-between gap-4 p-4 md:p-6 text-left transition-colors hover:bg-slate-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 dark:hover:bg-slate-900/45"
                >
                  <div className="flex-1">
                    <h2 className="text-lg md:text-xl font-semibold dark:text-white">Saldo</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Período: {balancePeriodLabel}
                    </p>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-400 transition-transform ${
                      openAccordion === 'balance' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                    openAccordion === 'balance' ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div
                      id="accordion-panel-balance"
                      aria-hidden={openAccordion !== 'balance'}
                      className={`border-t border-gray-100 dark:border-gray-700 px-4 md:px-6 pb-4 md:pb-6 pt-4 transition-opacity duration-300 ease-in-out ${
                        openAccordion === 'balance' ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
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
                              {formatCurrency(
                                dateFilter ? filteredTotals.totalEntradas : (balance?.totalEntradas || 0)
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total de saídas</p>
                            <p className="text-xl font-bold text-rose-500">
                              {formatCurrency(
                                dateFilter ? filteredTotals.totalSaidas : (balance?.totalSaidas || 0)
                              )}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum saldo disponível.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="planner-card overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenAccordion('transactions')}
                  aria-expanded={openAccordion === 'transactions'}
                  aria-controls="accordion-panel-transactions"
                  className="w-full flex items-start justify-between gap-4 p-4 md:p-6 text-left transition-colors hover:bg-slate-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 dark:hover:bg-slate-900/45"
                >
                  <div className="flex-1">
                    <h2 className="text-lg md:text-xl font-semibold dark:text-white">Transações</h2>
                    {dateFilter && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Filtro aplicado nas datas selecionadas.
                      </p>
                    )}
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-400 transition-transform ${
                      openAccordion === 'transactions' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                    openAccordion === 'transactions' ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div
                      id="accordion-panel-transactions"
                      aria-hidden={openAccordion !== 'transactions'}
                      className={`border-t border-gray-100 dark:border-gray-700 px-4 md:px-6 pb-4 md:pb-6 pt-4 transition-opacity duration-300 ease-in-out ${
                        openAccordion === 'transactions' ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      {loadingData ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">Carregando transações...</p>
                      ) : displayedTransactions.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Nenhuma transação encontrada.
                        </p>
                      ) : (
                        <div className="admin-table-shell">
                          <div className="admin-table-wrap">
                            <table className="admin-table">
                              <thead className="admin-table-head">
                                <tr>
                                  <th className="admin-table-cell">Data</th>
                                  <th className="admin-table-cell">Classificação</th>
                                  <th className="admin-table-cell">Tipo</th>
                                  <th className="admin-table-cell">Valor</th>
                                  <th className="admin-table-cell">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {displayedTransactions.map((transaction) => (
                                  <tr key={transaction.id} className="admin-table-row">
                                    <td className="admin-table-cell">
                                      {formatDate(transaction.data || transaction.criado_em)}
                                    </td>
                                    <td className="admin-table-cell">{transaction.classificacao}</td>
                                    <td className="admin-table-cell capitalize">{transaction.tipo}</td>
                                    <td className="admin-table-cell">
                                      {formatCurrency(Number(transaction.valor || 0))}
                                    </td>
                                    <td className="admin-table-cell">{transaction.status}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                      {filteredTransactions.length > displayedTransactions.length && (
                        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                          Mostrando {displayedTransactions.length} de {filteredTransactions.length} transações.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="planner-card overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenAccordion('budgets')}
                  aria-expanded={openAccordion === 'budgets'}
                  aria-controls="accordion-panel-budgets"
                  className="w-full flex items-start justify-between gap-4 p-4 md:p-6 text-left transition-colors hover:bg-slate-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 dark:hover:bg-slate-900/45"
                >
                  <div className="flex-1">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h2 className="text-lg md:text-xl font-semibold dark:text-white">Orçamentos</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Período: {budgetLabel}</p>
                      </div>
                      {isCrossMonthRange && (
                        <span className="text-xs text-amber-500">
                          Intervalo cobre mais de um mês; orçamentos usam o mês inicial.
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-400 transition-transform ${
                      openAccordion === 'budgets' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                    openAccordion === 'budgets' ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div
                      id="accordion-panel-budgets"
                      aria-hidden={openAccordion !== 'budgets'}
                      className={`border-t border-gray-100 dark:border-gray-700 px-4 md:px-6 pb-4 md:pb-6 pt-4 transition-opacity duration-300 ease-in-out ${
                        openAccordion === 'budgets' ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      {loadingData || loadingBudgets ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">Carregando orçamentos...</p>
                      ) : budgetSummary.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Nenhum orçamento encontrado para o período selecionado.
                        </p>
                      ) : (
                        <div className="admin-table-shell">
                          <div className="admin-table-wrap">
                            <table className="admin-table">
                              <thead className="admin-table-head">
                                <tr>
                                  <th className="admin-table-cell">Categoria</th>
                                  <th className="admin-table-cell">Orçado</th>
                                  <th className="admin-table-cell">Gasto</th>
                                  <th className="admin-table-cell">Recebido</th>
                                </tr>
                              </thead>
                              <tbody>
                                {budgetSummary.map((row) => (
                                  <tr key={row.categorias_id} className="admin-table-row">
                                    <td className="admin-table-cell">
                                      {categoriesMap.get(row.categorias_id) || `Categoria ${row.categorias_id}`}
                                    </td>
                                    <td className="admin-table-cell">
                                      {row.valor_orcado !== null ? formatCurrency(row.valor_orcado) : '-'}
                                    </td>
                                    <td className="admin-table-cell">{formatCurrency(row.valor_gasto || 0)}</td>
                                    <td className="admin-table-cell">
                                      {formatCurrency(row.valor_recebido || 0)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="planner-card overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenAccordion('categories')}
                  aria-expanded={openAccordion === 'categories'}
                  aria-controls="accordion-panel-categories"
                  className="w-full flex items-start justify-between gap-4 p-4 md:p-6 text-left transition-colors hover:bg-slate-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 dark:hover:bg-slate-900/45"
                >
                  <div className="flex-1">
                    <h2 className="text-lg md:text-xl font-semibold dark:text-white">Categorias</h2>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-400 transition-transform ${
                      openAccordion === 'categories' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                    openAccordion === 'categories' ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div
                      id="accordion-panel-categories"
                      aria-hidden={openAccordion !== 'categories'}
                      className={`border-t border-gray-100 dark:border-gray-700 px-4 md:px-6 pb-4 md:pb-6 pt-4 transition-opacity duration-300 ease-in-out ${
                        openAccordion === 'categories' ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      {loadingData ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">Carregando categorias...</p>
                      ) : categories.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Nenhuma categoria encontrada.
                        </p>
                      ) : (
                        <div className="grid gap-3 md:grid-cols-2">
                          {categories.map((category) => (
                            <div
                              key={category.id}
                              className="admin-stat-card"
                            >
                              <p className="font-semibold text-gray-800 dark:text-gray-100">{category.nome}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Tipo: {category.tipo}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
