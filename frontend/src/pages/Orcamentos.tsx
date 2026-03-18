import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import {
  fetchCategories,
  fetchCategoryBudgetsSummary,
  duplicateMonthlyBudgets,
  saveCategoryBudget,
  type Category,
  type CategoryBudgetSummary,
} from '../services/categoryService';
import { toast } from '../lib/toast';
import PageShell from '../components/PageShell';
import PageTitle from '../components/PageTitle';
import EmptyState from '../components/EmptyState';
import LoadingOverlay from '../components/LoadingOverlay';

const meses = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function Orcamentos() {
  const { userId } = useAuthStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [summary, setSummary] = useState<CategoryBudgetSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [duplicating, setDuplicating] = useState(false);
  const [budgetsByCategory, setBudgetsByCategory] = useState<Record<number, string>>({});
  const [savedBudgetsByCategory, setSavedBudgetsByCategory] = useState<Record<number, string>>({});
  const [savingBudgetByCategory, setSavingBudgetByCategory] = useState<Record<number, boolean>>({});
  const [addBudgetOpen, setAddBudgetOpen] = useState(false);
  const [newBudgetCategoryId, setNewBudgetCategoryId] = useState<number | null>(null);
  const [newBudgetValue, setNewBudgetValue] = useState('');
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  useEffect(() => {
    if (!userId) return;
    let mounted = true;
    setLoading(true);
    Promise.all([
      fetchCategories(userId),
      fetchCategoryBudgetsSummary(userId, { year: selectedYear, month: selectedMonth + 1 })
    ])
      .then(([cats, budgets]) => {
        if (!mounted) return;
        setCategories(cats);
        setSummary(budgets);
        const mapped: Record<number, string> = {};
        budgets.forEach((budget) => {
          mapped[budget.categorias_id] = budget.valor_orcado === null || budget.valor_orcado === undefined
            ? ''
            : String(Math.round(Number(budget.valor_orcado) * 100));
        });
        setBudgetsByCategory(mapped);
        setSavedBudgetsByCategory(mapped);
      })
      .catch((error) => console.error('Erro ao buscar orçamento mensal:', error))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [userId, selectedMonth, selectedYear]);

  const categoryMap = useMemo(() => {
    const map = new Map<number, Category>();
    categories.forEach((cat) => map.set(cat.id, cat));
    return map;
  }, [categories]);

  const categoriesWithBudget = useMemo(() => {
    return new Set(
      summary
        .filter((item) => Number(item.valor_orcado || 0) > 0)
        .map((item) => item.categorias_id)
    );
  }, [summary]);

  const rows = useMemo(() => {
    return summary
      .filter((item) => Number(item.valor_orcado || 0) > 0)
      .map((item) => {
        const categoria = categoryMap.get(item.categorias_id);
        const orcado = Number(item.valor_orcado || 0);
        const isEntrada = categoria?.tipo === 'entrada';
        const realizado = isEntrada
          ? Number(item.valor_recebido || 0)
          : Number(item.valor_gasto || 0);
        const diff = orcado - realizado;
        const progress = orcado > 0 ? (realizado / orcado) * 100 : 0;
        const status = orcado === 0
          ? 'Sem orçamento'
          : realizado > orcado
          ? 'Acima do orçamento'
          : 'Dentro do orçamento';
        return {
          id: item.categorias_id,
          nome: categoria?.nome || `Categoria ${item.categorias_id}`,
          tipo: categoria?.tipo || 'saída',
          orcado,
          realizado,
          diff,
          progress,
          status,
        };
      })
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [summary, categoryMap]);

  const totals = useMemo(() => {
    const totalOrcado = rows.reduce((acc, item) => acc + item.orcado, 0);
    const totalRealizado = rows.reduce((acc, item) => acc + item.realizado, 0);
    const totalExcesso = rows.reduce((acc, item) => acc + Math.max(item.realizado - item.orcado, 0), 0);
    return { totalOrcado, totalRealizado, totalExcesso };
  }, [rows]);

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const formatCurrencyFromDigits = (value: string): string => {
    if (!value) return '';
    const amount = parseFloat(value) / 100;
    return amount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const parseBudgetDigits = (value: string): string => value.replace(/\D/g, '');

  const parseBudgetValue = (value: string): number | null => {
    const numbers = value.replace(/\D/g, '');
    if (!numbers) return null;
    const parsed = parseFloat(numbers) / 100;
    if (Number.isNaN(parsed)) return null;
    return parsed;
  };

  const getMonthStartDate = () =>
    new Date(selectedYear, selectedMonth, 1).toISOString().split('T')[0];

  const refreshSummary = async () => {
    if (!userId) return;
    const budgets = await fetchCategoryBudgetsSummary(userId, { year: selectedYear, month: selectedMonth + 1 });
    setSummary(budgets);
    const mapped: Record<number, string> = {};
    budgets.forEach((budget) => {
      mapped[budget.categorias_id] = budget.valor_orcado === null || budget.valor_orcado === undefined
        ? ''
        : String(Math.round(Number(budget.valor_orcado) * 100));
    });
    setBudgetsByCategory(mapped);
    setSavedBudgetsByCategory(mapped);
  };

  const handleBudgetBlur = async (categoriaId: number) => {
    if (!userId) return;
    const currentValue = budgetsByCategory[categoriaId] ?? '';
    const savedValue = savedBudgetsByCategory[categoriaId] ?? '';
    if (currentValue === savedValue) return;
    if (savingBudgetByCategory[categoriaId]) return;

    const parsed = parseBudgetValue(currentValue);
    if (currentValue.trim() !== '' && parsed === null) {
      toast.error('Valor de orçamento inválido.');
      setBudgetsByCategory((prev) => ({ ...prev, [categoriaId]: savedValue }));
      return;
    }

    try {
      setSavingBudgetByCategory((prev) => ({ ...prev, [categoriaId]: true }));
      await saveCategoryBudget(userId, categoriaId, parsed, getMonthStartDate());
      await refreshSummary();
      toast.success('Orçamento salvo com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar orçamento:', error);
      setBudgetsByCategory((prev) => ({ ...prev, [categoriaId]: savedValue }));
      toast.error('Erro ao salvar orçamento. Tente novamente.');
    } finally {
      setSavingBudgetByCategory((prev) => ({ ...prev, [categoriaId]: false }));
    }
  };

  const handleCreateBudget = async () => {
    if (!userId || !newBudgetCategoryId) return;
    const parsed = parseBudgetValue(newBudgetValue);
    if (!parsed || parsed <= 0) {
      toast.error('Informe um valor válido.');
      return;
    }
    try {
      await saveCategoryBudget(userId, newBudgetCategoryId, parsed, getMonthStartDate());
      await refreshSummary();
      setAddBudgetOpen(false);
      setNewBudgetCategoryId(null);
      setNewBudgetValue('');
      toast.success('Orçamento criado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao criar orçamento:', error);
      toast.error('Erro ao criar orçamento. Tente novamente.');
    }
  };

  const handleDuplicateMonth = async () => {
    if (!userId || duplicating) return;
    setDuplicating(true);
    try {
      await duplicateMonthlyBudgets(userId, selectedYear, selectedMonth + 1);
      const budgets = await fetchCategoryBudgetsSummary(userId, { year: selectedYear, month: selectedMonth + 1 });
      setSummary(budgets);
      toast.success('Orçamentos duplicados com sucesso!');
    } catch (error: any) {
      console.error('Erro ao duplicar orçamentos:', error);
      toast.error('Erro ao duplicar orçamentos. Tente novamente.');
    } finally {
      setDuplicating(false);
    }
  };

  return (
    <PageShell>
      <PageTitle subtitle="Acompanhe seu planejamento financeiro e compare com o realizado.">
        Orçamento Mensal
      </PageTitle>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <select
            className="planner-input py-2 text-sm w-40"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
          >
            {meses.map((mes, idx) => (
              <option key={mes} value={idx}>{mes}</option>
            ))}
          </select>
          <select
            className="planner-input py-2 text-sm w-24"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {Array.from({ length: 5 }).map((_, idx) => {
              const year = now.getFullYear() - 2 + idx;
              return <option key={year} value={year}>{year}</option>;
            })}
          </select>
          <div className="flex items-center gap-2">
            <Link to="/categorias" className="planner-button-secondary">
              Adicionar Categoria
            </Link>
            <button
              type="button"
              className="planner-button-secondary"
              onClick={() => setAddBudgetOpen(true)}
            >
              Novo Orçamento
            </button>
            <button
              type="button"
              className="planner-button-secondary"
              onClick={handleDuplicateMonth}
              disabled={duplicating}
            >
              {duplicating ? 'Duplicando...' : 'Duplicar Mês Anterior'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5 mb-6">
        <div className="planner-card p-5 md:p-6">
          <span className="text-slate-500 dark:text-slate-400 text-sm">Total Planejado</span>
          <div className="mt-2 text-2xl font-bold dark:text-white">{formatCurrency(totals.totalOrcado)}</div>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {rows.filter((row) => row.orcado > 0).length} categorias com orçamento
          </span>
        </div>
        <div className="planner-card p-5 md:p-6">
          <span className="text-slate-500 dark:text-slate-400 text-sm">Total Realizado</span>
          <div className="mt-2 text-2xl font-bold text-emerald-400">{formatCurrency(totals.totalRealizado)}</div>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {totals.totalOrcado > 0 ? `${((totals.totalRealizado / totals.totalOrcado) * 100).toFixed(1)}% do planejado` : 'Sem orçamento'}
          </span>
        </div>
        <div className="planner-card p-5 md:p-6">
          <span className="text-slate-500 dark:text-slate-400 text-sm">Excesso</span>
          <div className="mt-2 text-2xl font-bold text-rose-400">{formatCurrency(totals.totalExcesso)}</div>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {rows.filter((row) => row.status === 'Acima do orçamento').length} categorias acima do orçamento
          </span>
        </div>
      </div>

      <div className="planner-card p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold dark:text-white">Orçamento por Categoria</h2>
          <span className="text-xs text-slate-400">{meses[selectedMonth]} / {selectedYear}</span>
        </div>

        {loading ? (
          <LoadingOverlay message="Carregando orçamentos..." />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="Nenhum orçamento neste mês"
            description="Adicione um orçamento por categoria ou duplique o mês anterior para começar."
            action={
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  className="planner-button"
                  onClick={() => setAddBudgetOpen(true)}
                >
                  Novo orçamento
                </button>
                <button
                  type="button"
                  className="planner-button-secondary"
                  onClick={handleDuplicateMonth}
                  disabled={duplicating}
                >
                  {duplicating ? 'Duplicando...' : 'Duplicar mês anterior'}
                </button>
              </div>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-200/70 dark:border-slate-800/60">
                  <th className="pb-3">Categoria</th>
                  <th className="pb-3">Planejado</th>
                  <th className="pb-3">Realizado</th>
                  <th className="pb-3">Diferença</th>
                  <th className="pb-3">Progresso</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-200/70 dark:border-slate-800/40 hover:bg-slate-100/60 dark:hover:bg-slate-900/40 transition">
                    <td className="py-3 font-semibold dark:text-white">{row.nome}</td>
                    <td className="py-3">
                      <input
                        className="planner-input w-24 md:w-28 px-2 py-1 text-sm text-right"
                        placeholder="R$ 0,00"
                        inputMode="numeric"
                        value={formatCurrencyFromDigits(budgetsByCategory[row.id] ?? '')}
                        onChange={(e) => {
                          const digits = parseBudgetDigits(e.target.value);
                          setBudgetsByCategory((prev) => ({ ...prev, [row.id]: digits }));
                        }}
                        onBlur={() => handleBudgetBlur(row.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            (e.target as HTMLInputElement).blur();
                          }
                        }}
                        disabled={!!savingBudgetByCategory[row.id]}
                        aria-label={`Orçamento da categoria ${row.nome}`}
                      />
                    </td>
                    <td className="py-3">{formatCurrency(row.realizado)}</td>
                    <td className="py-3">{row.orcado ? formatCurrency(row.diff) : '-'}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                      <div className="h-2 w-28 rounded-full bg-slate-200/70 dark:bg-slate-800/60">
                          <div
                            className={`h-2 rounded-full ${row.status === 'Acima do orçamento' ? 'bg-rose-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(row.progress, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400">
                          {row.orcado ? `${Math.round(row.progress)}%` : '-'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        row.status === 'Sem orçamento'
                          ? 'bg-slate-200/70 text-slate-700 dark:bg-slate-700/70 dark:text-slate-200'
                          : row.status === 'Acima do orçamento'
                          ? 'bg-rose-100/70 text-rose-700 dark:bg-rose-900/60 dark:text-rose-200'
                          : 'bg-emerald-100/70 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {addBudgetOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setAddBudgetOpen(false)}
        >
          <div
            className="planner-card p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold dark:text-white mb-4">Novo Orçamento</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Categoria</label>
                <select
                  className="planner-input py-2 text-sm"
                  value={newBudgetCategoryId ?? ''}
                  onChange={(e) => setNewBudgetCategoryId(Number(e.target.value))}
                >
                  <option value="">Selecione uma categoria</option>
                  {categories
                    .filter((cat) => !categoriesWithBudget.has(cat.id))
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.nome}</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Valor planejado</label>
                <input
                  className="planner-input text-sm"
                  placeholder="R$ 0,00"
                  value={newBudgetValue ? formatCurrencyFromDigits(newBudgetValue) : ''}
                  onChange={(e) => setNewBudgetValue(parseBudgetDigits(e.target.value))}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="planner-button-secondary"
                onClick={() => setAddBudgetOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="planner-button"
                onClick={handleCreateBudget}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
