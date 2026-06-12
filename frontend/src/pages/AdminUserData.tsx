import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Users } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { hasRole } from '../lib/roles';
import { listUsers, type ManagedUser } from '../services/usersService';
import { matchManagedUserSearch } from '../utils/matchManagedUserSearch';
import {
  downloadAdminMeiGuide,
  downloadAdminUserParcelamentoPdf,
  emitirNotaAsAdmin,
  fetchAdminDasStatus,
  fetchAdminMeiCertificateStatus,
  fetchAdminMeiPeriods,
  fetchAdminMeiPeriodsByCnpj,
  fetchAdminUserBalance,
  fetchAdminUserBudgetSummary,
  fetchAdminUserCategories,
  fetchAdminUserMeiNfse,
  fetchAdminUserParcelamentos,
  fetchAdminUserTransactions,
  sendAdminMeiGuideWhatsapp,
  type AdminBalance,
  type AdminDasPendingSummary,
  type AdminDasStatusFilters,
  type AdminMeiCertificateStatus,
  type AdminMeiNfseItem,
  type AdminMeiPeriod,
  type AdminParcelamentoItem,
  type AdminParcelamentosResponse
} from '../services/adminUserDataService';
import type { Transaction } from '../services/transactionService';
import { getNfseServicoCodigoValidationError } from '../utils/nfseServicoCodigo';
import type { Category, CategoryBudgetSummary } from '../services/categoryService';
import { AdminMeiCatalogClienteCombobox } from '../components/admin/AdminMeiCatalogClienteCombobox';
import { AdminMeiCatalogProdutoCombobox } from '../components/admin/AdminMeiCatalogProdutoCombobox';
import { AdminUserMeiClientesDrawer } from '../components/admin/AdminUserMeiClientesDrawer';
import { EmissaoFiscalErrorAlertModal } from '../components/FiscalIntegrationErrorAlert';
import { formatPlugnotasIntegrationError } from '../utils/plugnotasIntegrationErrorMessage';
import {
  MeiFiscalEmissionTypeSegmented,
  meiFiscalEmissionHelpLine,
  type MeiFiscalEmissionDocumentType
} from '../components/mei/MeiFiscalEmissionTypeSegmented';
import { MeiNfeLikeEmitForm } from '../components/mei/MeiNfeLikeEmitForm';
import { formatCpfCnpjPtBr, onlyDigits } from '../lib/formatCpfCnpjPtBr';
import {
  createEmptyMeiNfeLikeFormState,
  createEmptyMeiNfeLikeItem,
  prefilledMeiNfeLikeFormState,
  type MeiNfeLikeFormState
} from '../utils/meiNfeLikeFormState';
import { validateMeiNfeLikeForm } from '../utils/meiNfeLikeClientValidation';
import { buildNfeLikePayloadFromMeiForm } from '../utils/meiNfeLikePayloadBuilder';
import { isMeiNfeNfceEmitEnabled } from '../config/meiFiscalFeatureFlags';

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

function buildAdminNfeFormFromCertificate(certificateDoc?: string | null): MeiNfeLikeFormState {
  const digits = onlyDigits(String(certificateDoc || '')).slice(0, 14);
  if (digits.length === 14) {
    return prefilledMeiNfeLikeFormState({
      emitenteCnpj: formatCpfCnpjPtBr(digits),
      emitenteRazao: ''
    });
  }
  return createEmptyMeiNfeLikeFormState();
}

function mergeTomadorIntoAdminNfeForm(
  base: MeiNfeLikeFormState,
  tomadorCpfCnpj: string,
  tomadorRazaoSocial: string,
  tomadorEmail: string
): MeiNfeLikeFormState {
  const raw = onlyDigits(tomadorCpfCnpj);
  const docFormatted =
    raw.length === 14
      ? formatCpfCnpjPtBr(raw)
      : raw.length === 11
        ? formatCpfCnpjPtBr(raw)
        : tomadorCpfCnpj.trim();
  return {
    ...base,
    destinatarioDoc: docFormatted,
    destinatarioRazao: tomadorRazaoSocial.trim(),
    destinatarioEmail: tomadorEmail.trim(),
    itens: base.itens.length ? base.itens : [createEmptyMeiNfeLikeItem()]
  };
}

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
  const [parcelamentosData, setParcelamentosData] = useState<AdminParcelamentosResponse | null>(null);
  const [parcelamentosLoading, setParcelamentosLoading] = useState(false);
  const [parcelamentosError, setParcelamentosError] = useState<string | null>(null);
  const [meiNfseList, setMeiNfseList] = useState<AdminMeiNfseItem[]>([]);
  const [meiNfseLoading, setMeiNfseLoading] = useState(false);
  const [meiNfseError, setMeiNfseError] = useState<string | null>(null);
  const [parcelamentoPdfLoadingNumero, setParcelamentoPdfLoadingNumero] = useState<string | null>(null);
  const [parcelamentoPdfError, setParcelamentoPdfError] = useState<string | null>(null);
  const [showEmitirNotaModal, setShowEmitirNotaModal] = useState(false);
  const [emitirModalInstance, setEmitirModalInstance] = useState(0);
  const [showMeiClientesDrawer, setShowMeiClientesDrawer] = useState(false);
  const [meiCatalogRefresh, setMeiCatalogRefresh] = useState(0);
  const gerirMeiCatalogBtnRef = useRef<HTMLButtonElement>(null);
  const [emitirNotaSubmitting, setEmitirNotaSubmitting] = useState(false);
  const [emitirNotaError, setEmitirNotaError] = useState<string | null>(null);
  const [emitirNotaSuccess, setEmitirNotaSuccess] = useState<string | null>(null);
  const [adminEmitDocumentType, setAdminEmitDocumentType] = useState<MeiFiscalEmissionDocumentType>('NFSE');
  const [adminNfeLikeForm, setAdminNfeLikeForm] = useState<MeiNfeLikeFormState>(() =>
    createEmptyMeiNfeLikeFormState()
  );
  const [adminNfeLikeErrors, setAdminNfeLikeErrors] = useState<Record<string, string>>({});
  const [adminNfeLikeFlashSection, setAdminNfeLikeFlashSection] = useState<
    'emitente' | 'destinatario' | 'itens' | null
  >(null);
  const [emitirNotaForm, setEmitirNotaForm] = useState({
    tomadorCpfCnpj: '',
    tomadorRazaoSocial: '',
    tomadorEmail: '',
    servicoDiscriminacao: '',
    servicoValorServico: '',
    servicoCodigo: '010101',
    servicoCnae: '6201501'
  });
  const autoDownloadKeysRef = useRef<Set<string>>(new Set());
  const autoDownloadingRef = useRef(false);

  const nfeNfceEmitEnabled = useMemo(() => isMeiNfeNfceEmitEnabled(), []);

  useEffect(() => {
    if (!nfeNfceEmitEnabled && (adminEmitDocumentType === 'NFE' || adminEmitDocumentType === 'NFCE')) {
      setAdminEmitDocumentType('NFSE');
    }
  }, [nfeNfceEmitEnabled, adminEmitDocumentType]);

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

  const handleAdminEmitDocumentTypeChange = useCallback(
    (newType: MeiFiscalEmissionDocumentType) => {
      if (newType === adminEmitDocumentType) return;
      setAdminNfeLikeErrors({});
      setAdminNfeLikeFlashSection(null);
      const prev = adminEmitDocumentType;
      if (newType === 'NFSE') {
        setAdminEmitDocumentType('NFSE');
        return;
      }
      if (prev === 'NFSE') {
        const base = buildAdminNfeFormFromCertificate(meiCertificateStatus?.documento);
        setAdminNfeLikeForm(
          mergeTomadorIntoAdminNfeForm(
            base,
            emitirNotaForm.tomadorCpfCnpj,
            emitirNotaForm.tomadorRazaoSocial,
            emitirNotaForm.tomadorEmail
          )
        );
        setAdminEmitDocumentType(newType);
        return;
      }
      if ((prev === 'NFE' && newType === 'NFCE') || (prev === 'NFCE' && newType === 'NFE')) {
        setAdminNfeLikeForm((f) => ({
          ...f,
          itens: f.itens.length ? f.itens : [createEmptyMeiNfeLikeItem()]
        }));
        setAdminEmitDocumentType(newType);
        return;
      }
      setAdminEmitDocumentType(newType);
    },
    [adminEmitDocumentType, emitirNotaForm, meiCertificateStatus?.documento]
  );

  const adminNfeSubmitReady = useMemo(() => {
    if (adminEmitDocumentType === 'NFE') {
      return validateMeiNfeLikeForm(adminNfeLikeForm, 'NF-e').ok;
    }
    if (adminEmitDocumentType === 'NFCE') {
      return validateMeiNfeLikeForm(adminNfeLikeForm, 'NFC-e').ok;
    }
    return true;
  }, [adminEmitDocumentType, adminNfeLikeForm]);

  const sortedUsers = useMemo(() => {
    return [...users].sort((userA, userB) => {
      const labelA = (userA.displayName || userA.email || '').toLowerCase();
      const labelB = (userB.displayName || userB.email || '').toLowerCase();
      return labelA.localeCompare(labelB, 'pt-BR', { sensitivity: 'base' });
    });
  }, [users]);

  const filteredUsers = useMemo(() => {
    if (!userQuery.trim()) return sortedUsers;
    return sortedUsers.filter((user) => matchManagedUserSearch(user, userQuery));
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
    setParcelamentosData(null);
    setParcelamentosError(null);
    setParcelamentoPdfError(null);
    setMeiNfseList([]);
    setMeiNfseError(null);
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

  const loadMeiPeriods = useCallback(async (userId: string, options?: { refresh?: boolean }) => {
    if (!canLoadMeiPeriods) {
      setMeiPeriods([]);
      setMeiPeriodsError(null);
      return;
    }
    const refresh = Boolean(options?.refresh);
    setMeiPeriodsLoading(true);
    setMeiPeriodsError(null);
    const cnpjParam = normalizedMeiCnpj.length === 14 ? normalizedMeiCnpj : undefined;
    try {
      const fetchOpts = refresh ? { refresh: true } : undefined;
      const data = meiCertificateStatus?.hasUserCertificate
        ? await fetchAdminMeiPeriods(userId, cnpjParam, fetchOpts)
        : await fetchAdminMeiPeriodsByCnpj(userId, cnpjParam || '', fetchOpts);
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
    setMeiNfseLoading(true);
    setMeiNfseError(null);
    fetchAdminUserMeiNfse(selectedUserId)
      .then((data) => setMeiNfseList(data || []))
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Erro ao carregar notas fiscais';
        setMeiNfseError(message);
        setMeiNfseList([]);
      })
      .finally(() => setMeiNfseLoading(false));
  }, [selectedUserId]);

  useEffect(() => {
    if (!selectedUserId || !canLoadMeiPeriods) return;
    setParcelamentosLoading(true);
    setParcelamentosError(null);
    const cnpjParam = normalizedMeiCnpj.length === 14 ? normalizedMeiCnpj : undefined;
    fetchAdminUserParcelamentos(selectedUserId, cnpjParam)
      .then((data) => setParcelamentosData(data || null))
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Erro ao carregar parcelamentos';
        setParcelamentosError(message);
        setParcelamentosData(null);
      })
      .finally(() => setParcelamentosLoading(false));
  }, [selectedUserId, canLoadMeiPeriods, normalizedMeiCnpj]);

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

        <div className="admin-alert-info">
          <span className="font-semibold text-blue-800 dark:text-blue-100">Gestão de acessos:</span>{' '}
          criar empresas, utilizadores e convites por link está na página{' '}
          <Link to="/settings/users" className="font-semibold underline underline-offset-2 hover:no-underline">
            Gerenciar utilizadores
          </Link>{' '}
          (<span className="whitespace-nowrap">/settings/users</span>). Este ecrã é só para dados operacionais
          (transações, DAS, etc.) do utilizador escolhido.
        </div>

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
          <div className="admin-toolbar relative z-20">
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
              placeholder={loadingUsers ? 'Carregando usuários...' : 'Nome, email, telefone ou empresa...'}
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
            Selecione um usuário para visualizar os dados da área Mei Infinito.
          </div>
        ) : (
          <>
            <div className="admin-section-card">
              <div className="admin-section-header">
                <div>
                  <h2 className="admin-section-title">Mei Infinito (cliente)</h2>
                  <p className="admin-section-subtitle">
                    Gere, baixe e envie a guia DAS do cliente selecionado.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => selectedUserId && loadMeiPeriods(selectedUserId, { refresh: true })}
                  disabled={!canLoadMeiPeriods || meiPeriodsLoading}
                  className="planner-button w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-50"
                  title="Consultar novamente a Receita/Serpro e atualizar o status de cada competência"
                >
                  {meiPeriodsLoading ? 'Atualizando...' : 'Atualizar'}
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
                      {meiCertificateStatus?.hasUserCertificate &&
                        (meiCertificateStatus?.certValidFrom || meiCertificateStatus?.certValidTo) && (
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {meiCertificateStatus.certValidFrom && meiCertificateStatus.certValidTo
                              ? `Válido de ${new Date(meiCertificateStatus.certValidFrom).toLocaleDateString('pt-BR')} até ${new Date(meiCertificateStatus.certValidTo).toLocaleDateString('pt-BR')}`
                              : meiCertificateStatus.certValidTo
                                ? `Válido até ${new Date(meiCertificateStatus.certValidTo).toLocaleDateString('pt-BR')}`
                                : null}
                          </p>
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
                      {meiSending ? 'Enviando...' : 'Enviar por Whatsapp'}
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

            <div className="admin-section-card">
              <div className="admin-section-header">
                <div>
                  <h2 className="admin-section-title">Parcelamentos</h2>
                  <p className="admin-section-subtitle">
                    Parcelamentos do MEI/Simples Nacional consultados no SERPRO para o usuário selecionado.
                  </p>
                </div>
              </div>
              {parcelamentosError && (
                <div className="rounded-xl border border-rose-300/90 bg-rose-50/90 px-4 py-3 text-rose-700 dark:border-rose-800/80 dark:bg-rose-950/40 dark:text-rose-300">
                  {parcelamentosError}
                </div>
              )}
              {parcelamentoPdfError && (
                <div className="rounded-xl border border-amber-300/90 bg-amber-50/90 px-4 py-3 text-amber-700 dark:border-amber-800/80 dark:bg-amber-950/40 dark:text-amber-300">
                  {parcelamentoPdfError}
                </div>
              )}
              {!canLoadMeiPeriods ? (
                <div className="admin-empty-state">Informe o CNPJ do MEI ou use o certificado do cliente para consultar parcelamentos.</div>
              ) : parcelamentosLoading ? (
                <div className="admin-empty-state">Carregando parcelamentos...</div>
              ) : !parcelamentosData?.parcelamentos?.length ? (
                <div className="admin-empty-state">Nenhum parcelamento encontrado.</div>
              ) : (
                <div className="admin-table-shell">
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead className="admin-table-head">
                        <tr>
                          <th className="admin-table-cell">Número</th>
                          <th className="admin-table-cell">Modalidade</th>
                          <th className="admin-table-cell">Situação</th>
                          <th className="admin-table-cell">Data pedido</th>
                          <th className="admin-table-cell">Data situação</th>
                          <th className="admin-table-cell">PDF</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parcelamentosData.parcelamentos.map((p: AdminParcelamentoItem, index: number) => (
                          <tr key={`${p.numero ?? index}-${p.modalidade ?? ''}`} className="admin-table-row">
                            <td className="admin-table-cell">{p.numero ?? '-'}</td>
                            <td className="admin-table-cell">{p.modalidade ?? '-'}</td>
                            <td className="admin-table-cell">{p.situacao ?? '-'}</td>
                            <td className="admin-table-cell">{p.dataPedido ? formatDate(p.dataPedido) : '-'}</td>
                            <td className="admin-table-cell">{p.dataSituacao ? formatDate(p.dataSituacao) : '-'}</td>
                            <td className="admin-table-cell">
                              {p.numero ? (
                                <button
                                  type="button"
                                  disabled={parcelamentoPdfLoadingNumero === (p.numero ?? '')}
                                  onClick={async () => {
                                    setParcelamentoPdfError(null);
                                    setParcelamentoPdfLoadingNumero(p.numero ?? '');
                                    try {
                                      const { blob, filename } = await downloadAdminUserParcelamentoPdf(
                                        selectedUserId,
                                        p.numero!,
                                        {
                                          cnpj: normalizedMeiCnpj.length === 14 ? normalizedMeiCnpj : undefined,
                                          modalidade: p.modalidade
                                        }
                                      );
                                      triggerFileDownload(blob, filename || `parcelamento-${p.numero}.pdf`);
                                    } catch (err) {
                                      const msg = err instanceof Error ? err.message : 'PDF não disponível para este parcelamento.';
                                      setParcelamentoPdfError(msg);
                                    } finally {
                                      setParcelamentoPdfLoadingNumero(null);
                                    }
                                  }}
                                  className="planner-button-secondary-compact text-sm disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {parcelamentoPdfLoadingNumero === (p.numero ?? '') ? 'Baixando...' : 'Baixar'}
                                </button>
                              ) : (
                                '-'
                              )}
                            </td>
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
                  <h2 className="admin-section-title">Notas fiscais</h2>
                  <p className="admin-section-subtitle">
                    A lista pode trazer NFS-e, NF-e ou NFC-e conforme o histórico no emissor; por este painel pode
                    emitir nos três formatos em nome do utilizador seleccionado. Status indica criação, cancelamento
                    ou erro.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEmitirModalInstance((n) => n + 1);
                    setShowMeiClientesDrawer(false);
                    setShowEmitirNotaModal(true);
                    setEmitirNotaError(null);
                    setEmitirNotaSuccess(null);
                    setAdminEmitDocumentType('NFSE');
                    setAdminNfeLikeForm(buildAdminNfeFormFromCertificate(meiCertificateStatus?.documento));
                    setAdminNfeLikeErrors({});
                    setAdminNfeLikeFlashSection(null);
                    setEmitirNotaForm({
                      tomadorCpfCnpj: '',
                      tomadorRazaoSocial: '',
                      tomadorEmail: '',
                      servicoDiscriminacao: '',
                      servicoValorServico: '',
                      servicoCodigo: '010101',
                      servicoCnae: '6201501'
                    });
                  }}
                  className="planner-button w-full sm:w-auto"
                >
                  Emitir nota fiscal
                </button>
              </div>
              {meiNfseError && (
                <div className="rounded-xl border border-rose-300/90 bg-rose-50/90 px-4 py-3 text-rose-700 dark:border-rose-800/80 dark:bg-rose-950/40 dark:text-rose-300">
                  {meiNfseError}
                </div>
              )}
              {meiNfseLoading ? (
                <div className="admin-empty-state">Carregando notas fiscais...</div>
              ) : meiNfseList.length === 0 ? (
                <div className="admin-empty-state">Nenhuma nota fiscal encontrada.</div>
              ) : (
                <div className="admin-table-shell">
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead className="admin-table-head">
                        <tr>
                          <th className="admin-table-cell">Data criação</th>
                          <th className="admin-table-cell">Tipo</th>
                          <th className="admin-table-cell">Status</th>
                          <th className="admin-table-cell">Protocolo / ID</th>
                          <th className="admin-table-cell">PDF / XML</th>
                        </tr>
                      </thead>
                      <tbody>
                        {meiNfseList.map((n) => (
                          <tr key={n.id} className="admin-table-row">
                            <td className="admin-table-cell">{formatDate(n.created_at)}</td>
                            <td className="admin-table-cell">{n.document_type ?? '-'}</td>
                            <td className="admin-table-cell">
                              <span className={`admin-badge ${
                                n.status === 'cancelado' ? 'admin-badge-danger' :
                                n.status === 'emitido' || n.status === 'autorizado' ? 'admin-badge-success' :
                                'admin-badge-warning'
                              }`}>
                                {n.status ?? '—'}
                              </span>
                            </td>
                            <td className="admin-table-cell">{n.protocol || n.id_integracao || n.plugnotas_id || '-'}</td>
                            <td className="admin-table-cell">
                              {n.pdf_url ? (
                                <a href={n.pdf_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">PDF</a>
                              ) : null}
                              {n.pdf_url && n.xml_url ? ' · ' : null}
                              {n.xml_url ? (
                                <a href={n.xml_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">XML</a>
                              ) : null}
                              {!n.pdf_url && !n.xml_url ? '-' : null}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {showEmitirNotaModal && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
                role="dialog"
                aria-modal="true"
                aria-labelledby="emitir-nota-modal-title"
              >
                <div className="my-auto flex w-full max-w-3xl max-h-[min(92vh,920px)] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
                  <div className="shrink-0 border-b border-slate-200 px-4 pb-3 pt-4 dark:border-slate-700 sm:px-6">
                    <h2 id="emitir-nota-modal-title" className="text-lg font-semibold dark:text-white">
                      Emitir nota fiscal
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Emissão em nome de{' '}
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {selectedUser ? getUserLabel(selectedUser) : 'este usuário'}
                      </span>
                      . O pedido segue o mesmo contrato do Guia MEI (NFS-e com campos planos; NF-e/NFC-e com{' '}
                      <code className="rounded bg-slate-100 px-1 text-xs dark:bg-slate-800">documentType</code> +{' '}
                      <code className="rounded bg-slate-100 px-1 text-xs dark:bg-slate-800">payload</code>). Catálogos de
                      cliente e serviço aplicam-se à NFS-e. Rejeições refletem o retorno do provedor fiscal.
                    </p>
                    {selectedUser?.mei === false ? (
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        Com MEI desativado para este utilizador, os catálogos não aparecem — use preenchimento manual.
                      </p>
                    ) : null}
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-6">
                    {emitirNotaError ? (
                      <EmissaoFiscalErrorAlertModal
                        documentTypeLabel={
                          adminEmitDocumentType === 'NFSE'
                            ? 'NFSe'
                            : adminEmitDocumentType === 'NFE'
                              ? 'NF-e'
                              : 'NFC-e'
                        }
                        message={emitirNotaError}
                      />
                    ) : null}
                    {emitirNotaSuccess ? (
                      <div className="mb-3 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                        {emitirNotaSuccess}
                      </div>
                    ) : null}

                    <div className="mb-4 space-y-2">
                      <MeiFiscalEmissionTypeSegmented
                        idPrefix="admin-user-emit-fiscal"
                        value={adminEmitDocumentType}
                        onChange={handleAdminEmitDocumentTypeChange}
                        nfeNfceEmitEnabled={nfeNfceEmitEnabled}
                      />
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {meiFiscalEmissionHelpLine(adminEmitDocumentType)}
                      </p>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Todas as opções acima emitem <span className="underline decoration-slate-400">em nome do utilizador</span>{' '}
                        seleccionado no painel (não em nome da sua sessão de administrador).
                      </p>
                    </div>

                    <div className="space-y-3">
                      {adminEmitDocumentType === 'NFSE' ? (
                      <>
                      <div>
                        <p className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-400">Tomador</p>
                        {selectedUserId ? (
                          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
                            <div className="min-w-0 flex-1 sm:min-w-[12rem]">
                              <AdminMeiCatalogClienteCombobox
                                key={`emit-catalog-${selectedUserId}-${emitirModalInstance}`}
                                userId={selectedUserId}
                                meiEnabled={selectedUser?.mei === true}
                                formatDocument={formatDocument}
                                catalogRefreshToken={meiCatalogRefresh}
                                onApplyCliente={(fields) =>
                                  setEmitirNotaForm((prev) => ({ ...prev, ...fields }))
                                }
                              />
                            </div>
                            {selectedUser?.mei === true ? (
                              <button
                                ref={gerirMeiCatalogBtnRef}
                                type="button"
                                className="planner-button-secondary-compact inline-flex w-full shrink-0 items-center justify-center gap-1 sm:w-auto"
                                disabled={!selectedUserId.trim()}
                                onClick={() => setShowMeiClientesDrawer(true)}
                              >
                                <Users className="h-4 w-4 shrink-0" aria-hidden />
                                Gerir clientes deste utilizador
                              </button>
                            ) : null}
                          </div>
                        ) : null}
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <div className="sm:col-span-1">
                            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                              CPF/CNPJ do tomador
                            </label>
                            <input
                              type="text"
                              value={emitirNotaForm.tomadorCpfCnpj}
                              onChange={(e) =>
                                setEmitirNotaForm((prev) => ({
                                  ...prev,
                                  tomadorCpfCnpj: formatDocument(e.target.value)
                                }))
                              }
                              placeholder="00.000.000/0001-00 ou 000.000.000-00"
                              className="planner-input-compact w-full"
                            />
                          </div>
                          <div className="sm:col-span-1">
                            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                              Razão social do tomador
                            </label>
                            <input
                              type="text"
                              value={emitirNotaForm.tomadorRazaoSocial}
                              onChange={(e) =>
                                setEmitirNotaForm((prev) => ({ ...prev, tomadorRazaoSocial: e.target.value }))
                              }
                              placeholder="Nome ou razão social"
                              className="planner-input-compact w-full"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                              E-mail do tomador (opcional)
                            </label>
                            <input
                              type="email"
                              value={emitirNotaForm.tomadorEmail}
                              onChange={(e) =>
                                setEmitirNotaForm((prev) => ({ ...prev, tomadorEmail: e.target.value }))
                              }
                              placeholder="email@exemplo.com"
                              className="planner-input-compact w-full"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-200 pt-3 dark:border-slate-700">
                        <p className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-400">Serviço</p>
                        {selectedUserId ? (
                          <div className="mb-3">
                            <AdminMeiCatalogProdutoCombobox
                              key={`emit-prod-${selectedUserId}-${emitirModalInstance}`}
                              userId={selectedUserId}
                              meiEnabled={selectedUser?.mei === true}
                              catalogRefreshToken={meiCatalogRefresh}
                              onApplyServico={(fields) =>
                                setEmitirNotaForm((prev) => ({
                                  ...prev,
                                  servicoCodigo: fields.servicoCodigo || prev.servicoCodigo,
                                  servicoCnae:
                                    fields.servicoCnae.trim() !== ''
                                      ? fields.servicoCnae.trim()
                                      : prev.servicoCnae,
                                  servicoDiscriminacao:
                                    fields.servicoDiscriminacao || prev.servicoDiscriminacao,
                                  servicoValorServico:
                                    fields.servicoValorServico !== ''
                                      ? fields.servicoValorServico
                                      : prev.servicoValorServico
                                }))
                              }
                            />
                          </div>
                        ) : null}
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                              Código do serviço (NFSe)
                            </label>
                            <input
                              type="text"
                              value={emitirNotaForm.servicoCodigo}
                              onChange={(e) =>
                                setEmitirNotaForm((prev) => ({ ...prev, servicoCodigo: e.target.value }))
                              }
                              placeholder="Ex.: 01.01.01 (mín. 6 alfanum.)"
                              className="planner-input-compact w-full"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                              CNAE (LC 116)
                            </label>
                            <input
                              type="text"
                              value={emitirNotaForm.servicoCnae}
                              onChange={(e) =>
                                setEmitirNotaForm((prev) => ({ ...prev, servicoCnae: e.target.value }))
                              }
                              placeholder="Ex.: 6201501"
                              className="planner-input-compact w-full"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                              Descrição do serviço
                            </label>
                            <input
                              type="text"
                              value={emitirNotaForm.servicoDiscriminacao}
                              onChange={(e) =>
                                setEmitirNotaForm((prev) => ({
                                  ...prev,
                                  servicoDiscriminacao: e.target.value
                                }))
                              }
                              placeholder="Ex.: Desenvolvimento de software"
                              className="planner-input-compact w-full"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                              Valor do serviço (R$)
                            </label>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={emitirNotaForm.servicoValorServico}
                              onChange={(e) =>
                                setEmitirNotaForm((prev) => ({
                                  ...prev,
                                  servicoValorServico: e.target.value.replace(',', '.')
                                }))
                              }
                              placeholder="0,00"
                              className="planner-input-compact w-full"
                            />
                          </div>
                        </div>
                      </div>
                      </>
                      ) : (
                        <MeiNfeLikeEmitForm
                          documentLabel={adminEmitDocumentType === 'NFE' ? 'NF-e' : 'NFC-e'}
                          value={adminNfeLikeForm}
                          onChange={setAdminNfeLikeForm}
                          errors={adminNfeLikeErrors}
                          flashOpenSection={adminNfeLikeFlashSection}
                          onFlashOpenConsumed={() => setAdminNfeLikeFlashSection(null)}
                          nfLikeCatalogDocumentType={
                            adminEmitDocumentType === 'NFE' || adminEmitDocumentType === 'NFCE'
                              ? adminEmitDocumentType
                              : undefined
                          }
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900 sm:px-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowMeiClientesDrawer(false);
                        setShowEmitirNotaModal(false);
                        setEmitirNotaError(null);
                        setEmitirNotaSuccess(null);
                      }}
                      disabled={emitirNotaSubmitting}
                      className="planner-button-secondary-compact disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={
                        emitirNotaSubmitting
                        || !selectedUserId.trim()
                        || (adminEmitDocumentType === 'NFSE'
                          ? !emitirNotaForm.tomadorCpfCnpj.trim()
                            || !emitirNotaForm.tomadorRazaoSocial.trim()
                            || !emitirNotaForm.servicoCodigo.trim()
                            || !emitirNotaForm.servicoDiscriminacao.trim()
                            || !emitirNotaForm.servicoValorServico.trim()
                            || Boolean(getNfseServicoCodigoValidationError(emitirNotaForm.servicoCodigo))
                          : !adminNfeSubmitReady)
                      }
                      onClick={async () => {
                        setEmitirNotaError(null);
                        setEmitirNotaSuccess(null);
                        setAdminNfeLikeErrors({});
                        setAdminNfeLikeFlashSection(null);

                        if (adminEmitDocumentType === 'NFSE') {
                          const doc = normalizeDoc(emitirNotaForm.tomadorCpfCnpj);
                          if (doc.length !== 11 && doc.length !== 14) {
                            setEmitirNotaError('CPF deve ter 11 dígitos ou CNPJ 14 dígitos.');
                            return;
                          }
                          if (!emitirNotaForm.servicoCodigo.trim()) {
                            setEmitirNotaError('Informe o código do serviço.');
                            return;
                          }
                          const codigoServicoErro = getNfseServicoCodigoValidationError(emitirNotaForm.servicoCodigo);
                          if (codigoServicoErro) {
                            setEmitirNotaError(codigoServicoErro);
                            return;
                          }
                          const valor = Number(String(emitirNotaForm.servicoValorServico).replace(',', '.'));
                          if (Number.isNaN(valor) || valor <= 0) {
                            setEmitirNotaError('Valor do serviço deve ser um número positivo.');
                            return;
                          }
                          setEmitirNotaSubmitting(true);
                          try {
                            const prestadorCpfCnpj = meiCertificateStatus?.documento
                              ? String(meiCertificateStatus.documento).replace(/\D/g, '')
                              : undefined;
                            await emitirNotaAsAdmin(selectedUserId, {
                              documentType: 'NFSE',
                              ...(prestadorCpfCnpj ? { prestadorCpfCnpj } : {}),
                              tomadorCpfCnpj: doc,
                              tomadorRazaoSocial: emitirNotaForm.tomadorRazaoSocial.trim(),
                              ...(emitirNotaForm.tomadorEmail.trim()
                                ? { tomadorEmail: emitirNotaForm.tomadorEmail.trim() }
                                : {}),
                              servico: {
                                codigo: emitirNotaForm.servicoCodigo,
                                discriminacao: emitirNotaForm.servicoDiscriminacao.trim(),
                                cnae: emitirNotaForm.servicoCnae,
                                valorServico: String(valor)
                              }
                            });
                            setEmitirNotaSuccess('NFS-e enviada para emissão.');
                            const list = await fetchAdminUserMeiNfse(selectedUserId);
                            setMeiNfseList(list || []);
                            setTimeout(() => {
                              setShowMeiClientesDrawer(false);
                              setShowEmitirNotaModal(false);
                              setEmitirNotaSuccess(null);
                            }, 1500);
                          } catch (err) {
                            setEmitirNotaError(
                              formatPlugnotasIntegrationError(
                                err instanceof Error ? err.message : 'Erro ao enviar nota para emissão.'
                              )
                            );
                          } finally {
                            setEmitirNotaSubmitting(false);
                          }
                          return;
                        }

                        const docShort = adminEmitDocumentType === 'NFE' ? 'NF-e' : 'NFC-e';
                        const validation = validateMeiNfeLikeForm(adminNfeLikeForm, docShort);
                        if (!validation.ok) {
                          setAdminNfeLikeErrors(validation.errors);
                          if (validation.firstSection) {
                            setAdminNfeLikeFlashSection(validation.firstSection);
                          }
                          return;
                        }

                        setEmitirNotaSubmitting(true);
                        try {
                          const payload = buildNfeLikePayloadFromMeiForm(
                            adminNfeLikeForm,
                            adminEmitDocumentType === 'NFE' ? 'NFE' : 'NFCE',
                          );
                          await emitirNotaAsAdmin(selectedUserId, {
                            documentType: adminEmitDocumentType,
                            payload
                          });
                          setEmitirNotaSuccess(`${docShort}: nota enviada para emissão.`);
                          const list = await fetchAdminUserMeiNfse(selectedUserId);
                          setMeiNfseList(list || []);
                          setTimeout(() => {
                            setShowMeiClientesDrawer(false);
                            setShowEmitirNotaModal(false);
                            setEmitirNotaSuccess(null);
                          }, 1500);
                        } catch (err) {
                          setEmitirNotaError(
                            formatPlugnotasIntegrationError(
                              err instanceof Error ? err.message : 'Erro ao enviar nota para emissão.'
                            )
                          );
                        } finally {
                          setEmitirNotaSubmitting(false);
                        }
                      }}
                      className="planner-button disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {emitirNotaSubmitting ? 'Enviando...' : 'Emitir'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showEmitirNotaModal && showMeiClientesDrawer && selectedUserId && selectedUser ? (
              <AdminUserMeiClientesDrawer
                open={showMeiClientesDrawer}
                onClose={() => setShowMeiClientesDrawer(false)}
                userId={selectedUserId}
                userDisplayName={getUserLabel(selectedUser)}
                meiEnabled={selectedUser.mei === true}
                formatDocument={formatDocument}
                returnFocusRef={gerirMeiCatalogBtnRef}
                onInvalidateCatalog={() => setMeiCatalogRefresh((n) => n + 1)}
              />
            ) : null}

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
