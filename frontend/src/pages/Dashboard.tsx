import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTransactionStore } from '../store/transactionStore';
import { useAuthStore } from '../store/authStore';
import { hasRole } from '../lib/roles';
import { Pie, Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { fetchCategories, fetchCategoryBudgetsSummary, fetchCategoryBudgetsYearly, type Category, type CategoryBudgetYearly } from '../services/categoryService';
import PageShell from '../components/PageShell';
import PageTitle from '../components/PageTitle';
import FetchErrorBanner from '../components/FetchErrorBanner';
import LoadingOverlay from '../components/LoadingOverlay';
import { AccessBlockedExplainer } from '../components/AccessBlockedExplainer';
import {
  meiRequiredAccessBlockProps,
  type AccessBlockKind,
} from '../lib/accessBlockPresets';
import BpoBudgetMatrixPanel from '../components/dashboard/BpoBudgetMatrixPanel';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { transactions, fetchTransactions, addTransaction, updateTransaction, deleteTransaction, loading, error } = useTransactionStore();
  const { userId, user, role } = useAuthStore();
  const accessBlock = (location.state as { accessBlock?: AccessBlockKind } | null)?.accessBlock;
  const showMeiAccessBlock = accessBlock === 'mei-required';
  const dismissAccessNotice = () => {
    navigate(location.pathname, { replace: true, state: {} });
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [formData, setFormData] = useState({
    classificacao: '',
    valor: '',
    tipo: 'saída' as 'saída' | 'entrada',
    status: 'pago' as string,
  });
  const [period, setPeriod] = useState('Mês');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [aplicarFiltroDatas, setAplicarFiltroDatas] = useState(false);
  const [categoriasMap, setCategoriasMap] = useState<Record<string, string>>({});
  const [categoriasTipoMap, setCategoriasTipoMap] = useState<Record<string, 'entrada' | 'saida'>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [bpoOpen, setBpoOpen] = useState(false);
  const [bpoYear, setBpoYear] = useState<number>(new Date().getFullYear());
  const [bpoEntradaOpen, setBpoEntradaOpen] = useState(false);
  const [bpoSaidaOpen, setBpoSaidaOpen] = useState(false);
  const [bpoViewMode, setBpoViewMode] = useState<'graficos' | 'matriz'>('matriz');
  const [despesaTab, setDespesaTab] = useState<'pagos' | 'a_pagar'>('pagos');
  const [budgetSummary, setBudgetSummary] = useState<Array<{
    categorias_id: number;
    valor_orcado: number | null;
    valor_gasto: number;
    valor_recebido?: number;
  }>>([]);
  const [budgetTab, setBudgetTab] = useState<'entrada' | 'saida'>('saida');
  const [bpoMonthlyBudgets, setBpoMonthlyBudgets] = useState<CategoryBudgetYearly[]>([]);

  const refreshBudgetSummary = async () => {
    if (!userId) return;
    try {
      const data = await fetchCategoryBudgetsSummary(userId);
      setBudgetSummary(data || []);
    } catch (error) {
      console.error('Erro ao buscar resumo de orçamento:', error);
    }
  };

  const refreshBpoMonthlyBudgets = async (year: number) => {
    if (!userId || !year) return;
    try {
      const data = await fetchCategoryBudgetsYearly(userId, year);
      setBpoMonthlyBudgets(data || []);
    } catch (error) {
      console.error('Erro ao buscar orçamentos mensais do BPO:', error);
      setBpoMonthlyBudgets([]);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchTransactions();
    }
  }, [userId, fetchTransactions]);

  useEffect(() => {
    // Buscar categorias e criar um map id -> nome
    if (!userId) return;
    
    fetchCategories(userId)
      .then((data) => {
        const map: Record<string, string> = {};
        const tipoMap: Record<string, 'entrada' | 'saida'> = {};
        data.forEach((cat) => {
          map[cat.id] = cat.nome;
          const normalizedTipo = cat.tipo === 'saída' ? 'saida' : cat.tipo;
          tipoMap[cat.id] = normalizedTipo === 'entrada' ? 'entrada' : 'saida';
        });
        setCategoriasMap(map);
        setCategoriasTipoMap(tipoMap);
        setCategories(data);
      })
      .catch((error) => console.error('Erro ao buscar categorias:', error));
  }, [userId]);

  useEffect(() => {
    refreshBudgetSummary();
  }, [userId]);

  useEffect(() => {
    if (!bpoOpen) return;
    refreshBpoMonthlyBudgets(bpoYear);
  }, [bpoOpen, bpoYear, userId]);

  const totalIncome = transactions
    .filter((t) => t.tipo === 'entrada')
    .reduce((sum, t) => sum + t.valor, 0);

  const isSaida = (tipo: string) => tipo === 'saída' || tipo === 'saida';
  const normalizeCategoryName = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  const bpoMonthLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  const totalExpenses = transactions
    .filter((t) => isSaida(t.tipo))
    .reduce((sum, t) => sum + t.valor, 0);

  const balance = totalIncome - totalExpenses;

  const getTransactionDate = (t: any) =>
    t.data ? new Date(`${t.data}T00:00:00-03:00`) : new Date(t.criado_em);

  const categoryNameToId = useMemo(() => {
    const map = new Map<string, number>();
    categories.forEach((cat) => {
      map.set(normalizeCategoryName(cat.nome), cat.id);
    });
    return map;
  }, [categories]);

  const resolveCategoryId = useCallback((t: any) => {
    if (t.categoria !== null && t.categoria !== undefined && t.categoria !== '') {
      return String(t.categoria);
    }
    const classificacao = typeof t.classificacao === 'string' ? t.classificacao : '';
    const normalizedName = normalizeCategoryName(classificacao);
    const mappedId = categoryNameToId.get(normalizedName);
    return mappedId ? String(mappedId) : null;
  }, [categoryNameToId]);

  const transactionsWithCategory = useMemo(
    () => transactions.filter((t) => resolveCategoryId(t) !== null),
    [transactions, resolveCategoryId]
  );

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    transactionsWithCategory.forEach((t) => {
      const date = getTransactionDate(t);
      years.add(date.getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [transactionsWithCategory]);

  useEffect(() => {
    if (availableYears.length === 0) {
      return;
    }
    const latestYear = Math.max(...availableYears);
    if (!availableYears.includes(bpoYear)) {
      setBpoYear(latestYear);
    }
  }, [availableYears, bpoYear]);

  const bpoTotalsByCategory = useMemo(() => {
    const totalsMap = new Map<string, number[]>();
    if (!bpoYear) {
      return totalsMap;
    }
    transactionsWithCategory.forEach((t) => {
      const date = getTransactionDate(t);
      if (date.getFullYear() !== bpoYear) return;
      const categoryKey = resolveCategoryId(t);
      if (!categoryKey) return;
      const currentTotals = totalsMap.get(categoryKey) || new Array(12).fill(0);
      currentTotals[date.getMonth()] += t.valor;
      totalsMap.set(categoryKey, currentTotals);
    });
    return totalsMap;
  }, [transactionsWithCategory, bpoYear, resolveCategoryId]);

  const hasBpoMovement = useCallback(
    (categoryId: number) => {
      const totals = bpoTotalsByCategory.get(String(categoryId)) || [];
      return totals.some((value) => value > 0);
    },
    [bpoTotalsByCategory]
  );

  const bpoEntradaCategories = useMemo(() => (
    categories
      .filter((cat) => !isSaida(cat.tipo))
      .filter((cat) => hasBpoMovement(cat.id))
      .slice()
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  ), [categories, hasBpoMovement]);

  const bpoSaidaCategories = useMemo(() => (
    categories
      .filter((cat) => isSaida(cat.tipo))
      .filter((cat) => hasBpoMovement(cat.id))
      .slice()
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  ), [categories, hasBpoMovement]);

  const monthlyBudgetByCategory = useMemo(() => {
    const map = new Map<string, number[]>();
    bpoMonthlyBudgets.forEach((budget) => {
      const key = String(budget.categorias_id);
      const current = map.get(key) || new Array(12).fill(null);
      current[budget.month] = budget.valor_orcado;
      map.set(key, current);
    });
    return map;
  }, [bpoMonthlyBudgets]);

  const getBpoTotalsForCategory = (categoryId: number) =>
    bpoTotalsByCategory.get(String(categoryId)) || new Array(12).fill(0);

  const getMonthlyBudgetsForCategory = (categoryId: number) =>
    monthlyBudgetByCategory.get(String(categoryId)) || new Array(12).fill(null);

  const buildBudgetDatasets = (categoryId: number, baseColor: string) => {
    const totals = getBpoTotalsForCategory(categoryId);
    const budgets = getMonthlyBudgetsForCategory(categoryId);
    const baseValues: number[] = [];
    const excessValues: number[] = [];

    totals.forEach((value, index) => {
      const budget = budgets[index];
      if (budget === null || budget === undefined) {
        baseValues.push(value);
        excessValues.push(0);
        return;
      }
      const safeBudget = Number(budget) || 0;
      const base = Math.min(value, safeBudget);
      const excess = Math.max(value - safeBudget, 0);
      baseValues.push(base);
      excessValues.push(excess);
    });

    return [
      {
        label: 'Realizado',
        data: baseValues,
        backgroundColor: baseColor,
        stack: 'budget'
      },
      {
        label: 'Excesso',
        data: excessValues,
        backgroundColor: '#8B5CF6',
        stack: 'budget'
      }
    ];
  };

  const bpoYearOptions = availableYears.length > 0 ? availableYears : [new Date().getFullYear()];

  const renderChevron = (open: boolean) => (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`transition-transform ${open ? 'rotate-90' : ''}`}
      aria-hidden="true"
    >
      <path
        d="M4 2.5L8 6L4 9.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  // Gráfico de evolução do saldo
  const sorted = [...transactions].sort((a, b) => {
    const dateA = getTransactionDate(a);
    const dateB = getTransactionDate(b);
    return dateA.getTime() - dateB.getTime();
  });
  let saldo = 0;
  const saldoData = sorted.map(t => {
    saldo += t.tipo === 'entrada' ? t.valor : -t.valor;
    const dataRef = getTransactionDate(t);
    return { x: dataRef.toLocaleDateString('pt-BR'), y: saldo };
  });

  // Gráfico de pizza por categoria
  const expensesByCategory = transactions.filter(t => isSaida(t.tipo)).reduce((acc, curr) => {
    acc[curr.classificacao] = (acc[curr.classificacao] || 0) + curr.valor;
    return acc;
  }, {} as Record<string, number>);
  const pieLabels = Object.keys(expensesByCategory);
  const pieData = Object.values(expensesByCategory);
  const pieColors = [
    '#F59E42', '#10B981', '#EF4444', '#6366F1', '#FBBF24', '#3B82F6', '#22D3EE', '#A78BFA', '#F472B6', '#34D399'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const statusPadrao = formData.tipo === 'entrada' ? 'recebido' : 'pago';
    const transaction = {
      ...formData,
      status: formData.status || statusPadrao,
      valor: parseFloat(formData.valor),
    };

    if (editingTransaction) {
      const result = await updateTransaction(editingTransaction.id, transaction);
      if (!result?.error) {
        await refreshBudgetSummary();
      }
    } else {
      const result = await addTransaction(transaction);
      if (!result?.error) {
        await refreshBudgetSummary();
      }
    }

    setIsModalOpen(false);
    setEditingTransaction(null);
    setFormData({
      classificacao: '',
      valor: '',
      tipo: 'saída',
      status: 'pago',
    });
  };

  const handleEdit = (transaction: any) => {
    setEditingTransaction(transaction);
    setFormData({
      classificacao: transaction.classificacao,
      valor: transaction.valor.toString(),
      tipo: transaction.tipo,
      status: transaction.status || (transaction.tipo === 'entrada' ? 'recebido' : 'pago'),
    });
    setIsModalOpen(true);
  };

  // Filtros de período (apenas visual, não filtra dados reais)
  const handlePeriod = (p: string) => setPeriod(p);

  // Função para obter o total de entradas/saídas no período
  function getTotalInPeriod(start: Date, end: Date, tipo: 'entrada' | 'saída') {
    return transactions
      .filter(t => {
        const d = getTransactionDate(t);
        return t.tipo === tipo && d >= start && d <= end;
      })
      .reduce((sum, t) => sum + t.valor, 0);
  }

  // Determinar período atual
  let periodoAtual = { start: null as Date | null, end: null as Date | null };
  const hoje = new Date();
  hoje.setHours(0,0,0,0);

  if (dateRange.start && dateRange.end) {
    // Personalizado
    const start = new Date(`${dateRange.start}T00:00:00-03:00`);
    const end = new Date(`${dateRange.end}T23:59:59-03:00`);
    periodoAtual = { start, end };
  } else if (period === 'Semana') {
    // Semana atual
    const now = new Date();
    const day = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - day);
    start.setHours(0,0,0,0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23,59,59,999);
    periodoAtual = { start, end };
  } else if (period === 'Mês') {
    // Mês atual
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    end.setHours(23,59,59,999);
    periodoAtual = { start, end };
  } else if (period === 'Hoje') {
    // Hoje
    const start = new Date();
    start.setHours(0,0,0,0);
    const end = new Date();
    end.setHours(23,59,59,999);
    periodoAtual = { start, end };
  }

  // Calcular entradas e saídas do período filtrado
  const entradasPeriodo = (periodoAtual.start && periodoAtual.end) ? getTotalInPeriod(periodoAtual.start, periodoAtual.end, 'entrada') : totalIncome;
  const saidasPeriodo = (periodoAtual.start && periodoAtual.end) ? getTotalInPeriod(periodoAtual.start, periodoAtual.end, 'saída') : totalExpenses;

  // Calcular total previsto (a receber) no período
  const entradasAReceber = (periodoAtual.start && periodoAtual.end)
    ? transactions.filter(t => {
        const d = getTransactionDate(t);
        return t.tipo === 'entrada' && t.status === 'a_receber' && d >= periodoAtual.start! && d <= periodoAtual.end!;
      }).reduce((sum, t) => sum + t.valor, 0)
    : transactions.filter(t => t.tipo === 'entrada' && t.status === 'a_receber').reduce((sum, t) => sum + t.valor, 0);

  // Calcular total previsto (a pagar) no período
  const saidasAPagar = (periodoAtual.start && periodoAtual.end)
    ? transactions.filter(t => {
        const d = getTransactionDate(t);
        return isSaida(t.tipo) && t.status === 'a_pagar' && d >= periodoAtual.start! && d <= periodoAtual.end!;
      }).reduce((sum, t) => sum + t.valor, 0)
    : transactions.filter(t => isSaida(t.tipo) && t.status === 'a_pagar').reduce((sum, t) => sum + t.valor, 0);

  // Filtrar transações do período atual para o gráfico
  const transacoesPeriodo = (periodoAtual.start && periodoAtual.end)
    ? sorted.filter(t => {
        const d = getTransactionDate(t);
        return d >= periodoAtual.start! && d <= periodoAtual.end!;
      })
    : sorted;

  // Gráfico de evolução do saldo no período filtrado
  let saldoPeriodo = 0;
  const saldoDataPeriodo = transacoesPeriodo.map(t => {
    saldoPeriodo += t.tipo === 'entrada' ? t.valor : -t.valor;
    const dataRef = getTransactionDate(t);
    return { x: dataRef.toLocaleDateString('pt-BR'), y: saldoPeriodo };
  });

  // Filtrar despesas do período atual para o gráfico de pizza
  const despesasPeriodo = (periodoAtual.start && periodoAtual.end)
    ? transactions.filter(t => {
        const d = getTransactionDate(t);
        return isSaida(t.tipo) && d >= periodoAtual.start! && d <= periodoAtual.end!;
      })
    : transactions.filter(t => isSaida(t.tipo));

  // Filtrar por status (Pagos ou A Pagar)
  const despesasFiltradas = despesasPeriodo.filter(t => {
    if (despesaTab === 'pagos') {
      return t.status === 'pago';
    } else {
      return t.status === 'a_pagar';
    }
  });

  const expensesByCategoryPeriodo = despesasFiltradas.reduce((acc, curr) => {
    const catKey = curr.categoria ? String(curr.categoria) : curr.classificacao;
    acc[catKey] = (acc[catKey] || 0) + curr.valor;
    return acc;
  }, {} as Record<string, number>);
  const pieLabelsPeriodo = Object.keys(expensesByCategoryPeriodo).map(catId => categoriasMap[catId] || catId);
  const pieDataPeriodo = Object.values(expensesByCategoryPeriodo);
  
  // Calcular total para a aba selecionada
  const totalDespesaTab = despesasFiltradas.reduce((sum, t) => sum + t.valor, 0);

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const categorizedBudgets = budgetSummary
    .filter((item) => item.valor_orcado !== null && Number(item.valor_orcado) > 0)
    .map((item) => {
      const orcado = Number(item.valor_orcado || 0);
      const gasto = Number(item.valor_gasto || 0);
      const recebido = Number(item.valor_recebido || 0);
      const tipo = categoriasTipoMap[String(item.categorias_id)] || 'saida';
      const realizado = tipo === 'entrada' ? recebido : gasto;
      const percentual = orcado > 0 ? (realizado / orcado) * 100 : 0;
      return {
        categorias_id: item.categorias_id,
        nome: categoriasMap[String(item.categorias_id)] || `Categoria ${item.categorias_id}`,
        tipo,
        realizado,
        orcado,
        percentual,
      };
    });

  const filteredBudgets = categorizedBudgets.filter((item) => item.tipo === budgetTab);

  const bucketedBudgets = budgetTab === 'entrada'
    ? {
        verde: filteredBudgets.filter((item) => item.percentual > 75),
        amarelo: filteredBudgets.filter((item) => item.percentual > 50 && item.percentual <= 75),
        laranja: filteredBudgets.filter((item) => item.percentual > 25 && item.percentual <= 50),
        vermelho: filteredBudgets.filter((item) => item.percentual <= 25),
      }
    : {
        verde: filteredBudgets.filter((item) => item.percentual <= 25),
        amarelo: filteredBudgets.filter((item) => item.percentual > 25 && item.percentual <= 50),
        laranja: filteredBudgets.filter((item) => item.percentual > 50 && item.percentual <= 75),
        vermelho: filteredBudgets.filter((item) => item.percentual > 75),
      };

  return (
    <PageShell>
      <PageTitle subtitle="Resumo das suas finanças e transações">Início</PageTitle>
      {error ? (
        <FetchErrorBanner
          error={error}
          onRetry={() => void fetchTransactions()}
          surfaceId="dashboard.transactions"
        />
      ) : null}
      {showMeiAccessBlock ? (
        <AccessBlockedExplainer
          {...meiRequiredAccessBlockProps()}
          testId="access-block-mei-required"
          onDismiss={dismissAccessNotice}
        />
      ) : null}
      {/* Conteúdo do dashboard abaixo, sem header/main duplicado */}
      {/* FR-SIDEBAR-ADMIN-06 opção B (PRD §6 / UX §7): cartão só em viewports sem sidebar desktop (md:hidden). */}
      {hasRole(role, ['admin']) && (
        <div className="md:hidden card-premium p-5 md:p-6 mb-4 md:mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <span className="text-slate-500 dark:text-slate-400 text-sm">Administração</span>
            <h2 className="text-lg md:text-xl font-semibold text-slate-900 dark:text-white">
              Acesso rápido ao Painel Admin
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Visualize dados financeiros dos usuários da sua empresa.
            </p>
          </div>
          <Link
            to="/settings/usuarios-dados"
            className="btn-premium"
          >
            Painel Admin
          </Link>
        </div>
      )}
      {/* Filtros de período */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-6 gap-3 md:gap-4 mt-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePeriod('Semana')}
            className={period === 'Semana' ? 'planner-tab planner-tab-active' : 'planner-tab'}
          >
            Semana
          </button>
          <button
            onClick={() => handlePeriod('Mês')}
            className={period === 'Mês' ? 'planner-tab planner-tab-active' : 'planner-tab'}
          >
            Mês
          </button>
          <button
            onClick={() => handlePeriod('Hoje')}
            className={period === 'Hoje' ? 'planner-tab planner-tab-active' : 'planner-tab'}
          >
            Hoje
          </button>
        </div>
        <div className="flex items-center gap-2 md:ml-auto">
          <button
            onClick={() => setBpoOpen((prev) => !prev)}
            className={bpoOpen ? 'planner-tab planner-tab-active' : 'planner-tab'}
          >
            BPO
          </button>
          <div className="hidden md:flex items-center gap-2">
            <input
              type="date"
              className="planner-input py-2 text-sm"
              value={dateRange.start}
              onChange={e=>setDateRange({...dateRange, start: e.target.value})}
            />
            <span className="text-slate-400 dark:text-slate-400">até</span>
            <input
              type="date"
              className="planner-input py-2 text-sm"
              value={dateRange.end}
              onChange={e=>setDateRange({...dateRange, end: e.target.value})}
            />
            <button
              className="ml-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 text-sm font-semibold"
              onClick={e => { e.preventDefault(); setDateRange({ start: '', end: '' }); setAplicarFiltroDatas(false); }}
            >
              Limpar
            </button>
          </div>
        </div>
      </div>
      {!bpoOpen && (
        <>
          {loading && transactions.length === 0 && !error ? (
            <LoadingOverlay message="Carregando transações…" className="min-h-[280px]" />
          ) : (
            <>
          {/* Cards de resumo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5 mb-4 md:mb-6">
            <div className="card-premium p-5 md:p-6 flex flex-col justify-between md:min-h-[150px]">
              <span className="text-slate-500 dark:text-slate-400 text-sm mb-2">Saldo Geral</span>
              <span className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-1">{balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              <div className="mt-2">
                <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-blue-100 rounded-full"></div>
              </div>
            </div>
            <div className="card-premium p-5 md:p-6 flex flex-col justify-between md:min-h-[150px]">
              <span className="text-slate-500 dark:text-slate-400 text-sm mb-2">Entradas</span>
              <div className="flex items-center justify-between mb-2">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xl md:text-2xl">{entradasPeriodo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                <span className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs px-3 py-1 rounded-full font-semibold">Receitas</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-2">
                <span>Previsto (A Receber)</span>
                <span>{entradasAReceber.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
            </div>
            <div className="card-premium p-5 md:p-6 flex flex-col justify-between md:min-h-[150px]">
              <span className="text-slate-500 dark:text-slate-400 text-sm mb-2">Saídas</span>
              <div className="flex items-center justify-between mb-2">
                <span className="text-rose-500 dark:text-rose-400 font-bold text-xl md:text-2xl">{saidasPeriodo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                <span className="bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300 text-xs px-3 py-1 rounded-full font-semibold">Despesas</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-2">
                <span>Previsto (A Pagar)</span>
                <span>{saidasAPagar.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
            </div>
          </div>
          {/* Gráficos e detalhes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="card-premium p-4 md:p-6 lg:col-span-2">
              <span className="font-semibold text-slate-800 dark:text-white text-sm md:text-base">Evolução do Saldo no Período</span>
              <div className="mt-4">
                <Line
                  data={{
                    labels: saldoDataPeriodo.map(d => d.x),
                    datasets: [
                      {
                        label: 'Saldo Realizado',
                        data: saldoDataPeriodo.map(d => d.y),
                        borderColor: '#6366F1',
                        backgroundColor: 'rgba(99,102,241,0.1)',
                        fill: true,
                        tension: 0.4,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                      legend: { display: false },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: (value: any) => `R$ ${value}`,
                          font: { size: 10 },
                        },
                      },
                      x: {
                        ticks: {
                          font: { size: 10 },
                        },
                      },
                    },
                  }}
                  height={150}
                />
              </div>
            </div>
            <div className="card-premium p-4 md:p-6 flex flex-col lg:col-span-1">
              <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 mb-4">
                <span className="font-semibold text-slate-800 dark:text-gray-200 text-sm md:text-base">Despesas</span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setDespesaTab('pagos')}
                    className={despesaTab === 'pagos' ? 'planner-tab planner-tab-active' : 'planner-tab'}
                  >
                    Pagos
                  </button>
                  <button 
                    onClick={() => setDespesaTab('a_pagar')}
                    className={despesaTab === 'a_pagar' ? 'planner-tab planner-tab-active' : 'planner-tab'}
                  >
                    A Pagar
                  </button>
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="w-32 h-32 md:w-40 md:h-40 mx-auto">
                  <Pie
                    data={{
                      labels: pieLabelsPeriodo,
                      datasets: [
                        {
                          data: pieDataPeriodo,
                          backgroundColor: pieColors,
                          borderWidth: 2,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: true,
                      plugins: {
                        legend: { display: false },
                      },
                    }}
                  />
                  <div className="text-center font-bold mt-2 text-base md:text-lg dark:text-white">{totalDespesaTab.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                  <div className="text-center text-xs text-slate-400 dark:text-slate-500">Total {despesaTab === 'pagos' ? 'Pago' : 'A Pagar'}</div>
                </div>
                <div className="flex-1 w-full">
                  <span className="font-semibold text-slate-700 dark:text-gray-300 text-sm block mb-2">Detalhes por Categoria</span>
                  <ul className="space-y-2">
                    {Object.keys(expensesByCategoryPeriodo).map((catId, idx) => (
                      <li key={catId} className="flex items-center justify-between text-sm dark:text-gray-200">
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-3 h-3 rounded-full" style={{background: pieColors[idx % pieColors.length]}}></span>
                          <span>{categoriasMap[catId] || catId}</span>
                        </div>
                        <span className="font-semibold">{expensesByCategoryPeriodo[catId].toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                      </li>
                    ))}
                    {Object.keys(expensesByCategoryPeriodo).length === 0 && (
                      <li className="text-sm text-slate-500 dark:text-gray-400">Nenhuma despesa {despesaTab === 'pagos' ? 'paga' : 'a pagar'} no período</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 md:mt-6 card-premium p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <span className="font-semibold text-slate-800 dark:text-white text-sm md:text-base">
                Categorias por percentual de orçamento (mês atual)
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setBudgetTab('entrada')}
                  className={budgetTab === 'entrada' ? 'planner-tab planner-tab-active' : 'planner-tab'}
                >
                  Entrada
                </button>
                <button
                  type="button"
                  onClick={() => setBudgetTab('saida')}
                  className={budgetTab === 'saida' ? 'planner-tab planner-tab-active' : 'planner-tab'}
                >
                  Saída
                </button>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-green-600 dark:text-green-400 mb-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                  OK
                </div>
                <ul className="space-y-2 text-sm dark:text-gray-200">
                  {bucketedBudgets.verde.map((item) => (
                    <li key={`verde-${item.categorias_id}`} className="flex items-center justify-between">
                      <span>{item.nome}</span>
                      <span className="text-right font-semibold">
                        {formatCurrency(item.realizado)} / {formatCurrency(item.orcado)} ({item.percentual.toFixed(1)}%)
                      </span>
                    </li>
                  ))}
                  {bucketedBudgets.verde.length === 0 && (
                    <li className="text-gray-500 dark:text-gray-400">Nenhuma categoria</li>
                  )}
                </ul>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-yellow-600 dark:text-yellow-400 mb-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-yellow-500"></span>
                  Atenção
                </div>
                <ul className="space-y-2 text-sm dark:text-gray-200">
                  {bucketedBudgets.amarelo.map((item) => (
                    <li key={`amarelo-${item.categorias_id}`} className="flex items-center justify-between">
                      <span>{item.nome}</span>
                      <span className="text-right font-semibold">
                        {formatCurrency(item.realizado)} / {formatCurrency(item.orcado)} ({item.percentual.toFixed(1)}%)
                      </span>
                    </li>
                  ))}
                  {bucketedBudgets.amarelo.length === 0 && (
                    <li className="text-gray-500 dark:text-gray-400">Nenhuma categoria</li>
                  )}
                </ul>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-orange-600 dark:text-orange-400 mb-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-orange-500"></span>
                  Cuidado
                </div>
                <ul className="space-y-2 text-sm dark:text-gray-200">
                  {bucketedBudgets.laranja.map((item) => (
                    <li key={`laranja-${item.categorias_id}`} className="flex items-center justify-between">
                      <span>{item.nome}</span>
                      <span className="text-right font-semibold">
                        {formatCurrency(item.realizado)} / {formatCurrency(item.orcado)} ({item.percentual.toFixed(1)}%)
                      </span>
                    </li>
                  ))}
                  {bucketedBudgets.laranja.length === 0 && (
                    <li className="text-gray-500 dark:text-gray-400">Nenhuma categoria</li>
                  )}
                </ul>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400 mb-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-500"></span>
                  Alerta
                </div>
                <ul className="space-y-2 text-sm dark:text-gray-200">
                  {bucketedBudgets.vermelho.map((item) => (
                    <li key={`vermelho-${item.categorias_id}`} className="flex items-center justify-between">
                      <span>{item.nome}</span>
                      <span className="text-right font-semibold">
                        {formatCurrency(item.realizado)} / {formatCurrency(item.orcado)} ({item.percentual.toFixed(1)}%)
                      </span>
                    </li>
                  ))}
                  {bucketedBudgets.vermelho.length === 0 && (
                    <li className="text-gray-500 dark:text-gray-400">Nenhuma categoria</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
            </>
          )}
        </>
      )}
      {bpoOpen && (
        <div className="mt-4 md:mt-6 card-premium p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <span className="font-semibold text-slate-800 dark:text-white text-sm md:text-base block">
                BPO — Orçado × Realizado
              </span>
              <span className="text-xs text-slate-500 dark:text-gray-400">
                Ano selecionado: {bpoYear}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div
                role="tablist"
                aria-label="Visão do BPO"
                className="inline-flex rounded-lg border border-slate-200/90 dark:border-slate-700/80 p-0.5 bg-slate-100/90 dark:bg-slate-900/50"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={bpoViewMode === 'matriz'}
                  className={`px-3 py-2 text-sm font-medium rounded-md min-h-[40px] transition-colors ${
                    bpoViewMode === 'matriz'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                  onClick={() => setBpoViewMode('matriz')}
                >
                  Matriz
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={bpoViewMode === 'graficos'}
                  className={`px-3 py-2 text-sm font-medium rounded-md min-h-[40px] transition-colors ${
                    bpoViewMode === 'graficos'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                  onClick={() => setBpoViewMode('graficos')}
                >
                  Gráficos
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-gray-400">Ano</span>
                <select
                  className="planner-input py-2 text-sm"
                  value={bpoYear}
                  onChange={(e) => setBpoYear(Number(e.target.value))}
                  aria-label="Ano do BPO"
                >
                  {bpoYearOptions.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {bpoViewMode === 'matriz' && userId ? (
            <div className="mt-4">
              <BpoBudgetMatrixPanel
                userId={userId}
                year={bpoYear}
                transactions={transactions}
              />
            </div>
          ) : null}

          {bpoViewMode === 'graficos' ? (
          <div className="mt-4 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={() => setBpoEntradaOpen((prev) => !prev)}
                  className="flex items-center gap-2 text-sm md:text-base font-semibold text-slate-700 dark:text-gray-200"
                  aria-expanded={bpoEntradaOpen}
                >
                  <span>Entradas</span>
                  <span className="inline-flex items-center justify-center w-5 h-5">
                    {renderChevron(bpoEntradaOpen)}
                  </span>
                </button>
                <span className="text-xs text-slate-400 dark:text-gray-500">
                  {bpoEntradaCategories.length} categorias
                </span>
              </div>
              {bpoEntradaCategories.length === 0 ? (
                <div className="text-sm text-slate-500 dark:text-gray-400">
                  Nenhuma categoria de entrada cadastrada.
                </div>
              ) : bpoEntradaOpen ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bpoEntradaCategories.map((cat) => {
                    const totals = getBpoTotalsForCategory(cat.id);
                    const monthlyBudgets = getMonthlyBudgetsForCategory(cat.id);
                    return (
                      <div key={`bpo-entrada-${cat.id}`} className="card-premium-muted p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-slate-800 dark:text-white text-sm">
                            {cat.nome}
                          </span>
                          <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                            Entrada
                          </span>
                        </div>
                        <Bar
                          data={{
                            labels: bpoMonthLabels,
                            datasets: buildBudgetDatasets(cat.id, '#10B981'),
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: true,
                            plugins: {
                              legend: { display: false },
                              tooltip: {
                                callbacks: {
                                  label: (context: any) => {
                                    const index = context.dataIndex;
                                    const totalValue = totals[index] || 0;
                                    const budget = monthlyBudgets[index];
                                    if (budget === null || budget === undefined) {
                                      return [
                                        `Valor: ${formatCurrency(totalValue)}`,
                                        'Sem orçamento',
                                        'Excesso: R$ 0,00'
                                      ];
                                    }
                                    const safeBudget = Number(budget) || 0;
                                    const excesso = Math.max(totalValue - safeBudget, 0);
                                    return [
                                      `Valor: ${formatCurrency(totalValue)}`,
                                      `Orçamento: ${formatCurrency(safeBudget)}`,
                                      `Excesso: ${formatCurrency(excesso)}`
                                    ];
                                  }
                                }
                              }
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                                ticks: {
                                  callback: (value: any) => `R$ ${value}`,
                                  font: { size: 10 },
                                },
                              },
                              x: {
                                ticks: {
                                  font: { size: 10 },
                                },
                              },
                            },
                          }}
                          height={140}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={() => setBpoSaidaOpen((prev) => !prev)}
                  className="flex items-center gap-2 text-sm md:text-base font-semibold text-slate-700 dark:text-gray-200"
                  aria-expanded={bpoSaidaOpen}
                >
                  <span>Saídas</span>
                  <span className="inline-flex items-center justify-center w-5 h-5">
                    {renderChevron(bpoSaidaOpen)}
                  </span>
                </button>
                <span className="text-xs text-slate-400 dark:text-gray-500">
                  {bpoSaidaCategories.length} categorias
                </span>
              </div>
              {bpoSaidaCategories.length === 0 ? (
                <div className="text-sm text-slate-500 dark:text-gray-400">
                  Nenhuma categoria de saída cadastrada.
                </div>
              ) : bpoSaidaOpen ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bpoSaidaCategories.map((cat) => {
                    const totals = getBpoTotalsForCategory(cat.id);
                    const monthlyBudgets = getMonthlyBudgetsForCategory(cat.id);
                    return (
                      <div key={`bpo-saida-${cat.id}`} className="card-premium-muted p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-slate-800 dark:text-white text-sm">
                            {cat.nome}
                          </span>
                          <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                            Saída
                          </span>
                        </div>
                        <Bar
                          data={{
                            labels: bpoMonthLabels,
                            datasets: buildBudgetDatasets(cat.id, '#EF4444'),
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: true,
                            plugins: {
                              legend: { display: false },
                              tooltip: {
                                callbacks: {
                                  label: (context: any) => {
                                    const index = context.dataIndex;
                                    const totalValue = totals[index] || 0;
                                    const budget = monthlyBudgets[index];
                                    if (budget === null || budget === undefined) {
                                      return [
                                        `Valor: ${formatCurrency(totalValue)}`,
                                        'Sem orçamento',
                                        'Excesso: R$ 0,00'
                                      ];
                                    }
                                    const safeBudget = Number(budget) || 0;
                                    const excesso = Math.max(totalValue - safeBudget, 0);
                                    return [
                                      `Valor: ${formatCurrency(totalValue)}`,
                                      `Orçamento: ${formatCurrency(safeBudget)}`,
                                      `Excesso: ${formatCurrency(excesso)}`
                                    ];
                                  }
                                }
                              }
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                                ticks: {
                                  callback: (value: any) => `R$ ${value}`,
                                  font: { size: 10 },
                                },
                              },
                              x: {
                                ticks: {
                                  font: { size: 10 },
                                },
                              },
                            },
                          }}
                          height={140}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
          ) : null}
        </div>
      )}
    </PageShell>
  );
}