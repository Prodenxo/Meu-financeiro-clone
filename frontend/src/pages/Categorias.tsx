import React, { useEffect, useState } from 'react';
import Layout from '../Layout/Layout';
import { useAuthStore } from '../store/authStore';
import { toast } from 'react-toastify';
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  fetchCategoryBudgetsSummary,
  saveCategoryBudget,
  type Category,
} from '../services/categoryService';

function CategoriaModal({ open, onClose, onSave, categoria }: { open: boolean, onClose: () => void, onSave: (cat: { nome: string, tipo: string }) => void, categoria?: Category | null }) {
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<'entrada' | 'saída'>('saída');

  useEffect(() => {
    if (open) {
      if (categoria) {
        setNome(categoria.nome);
        // Normalizar tipo para garantir compatibilidade (aceita 'saida' ou 'saída')
        setTipo(categoria.tipo === 'entrada' ? 'entrada' : 'saída');
      } else {
        setNome('');
        setTipo('saída');
      }
    }
  }, [open, categoria]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl p-8 w-full max-w-md relative shadow-xl ring-1 ring-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="absolute top-3 right-3 text-gray-400 dark:text-gray-300" onClick={onClose}>×</button>
        <h2 className="text-xl font-bold mb-4 dark:text-white">{categoria ? 'Editar Categoria' : 'Adicionar Categoria'}</h2>
        <label className="block mb-2 font-medium dark:text-gray-200">Nome da Categoria</label>
        <input
          className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2 mb-4"
          value={nome}
          onChange={e => setNome(e.target.value)}
          placeholder="Nome da categoria"
        />
        <label className="block mb-2 font-medium dark:text-gray-200">Tipo da Categoria</label>
        <div className="flex gap-4 mb-6">
          <button
            type="button"
            className={`px-4 py-2 rounded ${tipo === 'entrada' ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-700 dark:text-gray-200'}`}
            onClick={() => setTipo('entrada')}
          >Entrada</button>
          <button
            type="button"
            className={`px-4 py-2 rounded ${tipo === 'saída' ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-gray-700 dark:text-gray-200'}`}
            onClick={() => setTipo('saída')}
          >Saída</button>
        </div>
        <button
          className="w-full bg-green-500 text-white py-2 rounded font-semibold"
          onClick={() => {
            if (nome.trim()) onSave({ nome, tipo });
          }}
        >
          Salvar Categoria
        </button>
      </div>
    </div>
  );
}

export default function Categorias() {
  const [categorias, setCategorias] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [budgetsByCategory, setBudgetsByCategory] = useState<Record<number, string>>({});
  const [savedBudgetsByCategory, setSavedBudgetsByCategory] = useState<Record<number, string>>({});
  const [spentByCategory, setSpentByCategory] = useState<Record<number, number>>({});
  const [savingBudgetByCategory, setSavingBudgetByCategory] = useState<Record<number, boolean>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<Category | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingCategoria, setDeletingCategoria] = useState<Category | null>(null);
  const { userId } = useAuthStore();

  async function loadCategorias() {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await fetchCategories(userId);
      setCategorias(data);
    } catch (error: any) {
      console.error('Erro ao carregar categorias:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadBudgetSummary() {
    if (!userId) {
      setBudgetsByCategory({});
      setSavedBudgetsByCategory({});
      setSpentByCategory({});
      return;
    }

    try {
      const data = await fetchCategoryBudgetsSummary(userId);
      const mapped: Record<number, string> = {};
      const spentMapped: Record<number, number> = {};
      data.forEach((budget) => {
        mapped[budget.categorias_id] = budget.valor_orcado === null || budget.valor_orcado === undefined
          ? ''
          : String(Math.round(Number(budget.valor_orcado) * 100));
        spentMapped[budget.categorias_id] = Number(budget.valor_gasto || 0);
      });
      setBudgetsByCategory(mapped);
      setSavedBudgetsByCategory(mapped);
      setSpentByCategory(spentMapped);
    } catch (error: any) {
      console.error('Erro ao carregar orçamentos:', error);
    }
  }

  const formatCurrency = (value: string): string => {
    if (!value) return '';
    const amount = parseFloat(value) / 100;
    return amount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const parseCurrencyToNumber = (value: string): number | null => {
    const numbers = value.replace(/\D/g, '');
    if (!numbers) return null;
    const parsed = parseFloat(numbers) / 100;
    if (Number.isNaN(parsed)) return null;
    return parsed;
  };

  const parseBudgetValue = (value: string): number | null => {
    return parseCurrencyToNumber(value);
  };

  const parseBudgetDigits = (value: string): string => value.replace(/\D/g, '');

  async function handleBudgetBlur(categoriaId: number) {
    if (!userId) return;
    const currentValue = budgetsByCategory[categoriaId] ?? '';
    const savedValue = savedBudgetsByCategory[categoriaId] ?? '';

    if (currentValue === savedValue) return;

    if (savingBudgetByCategory[categoriaId]) return;

    const parsed = parseBudgetValue(currentValue);
    if (currentValue.trim() !== '' && parsed === null) {
      alert('Valor de orçamento inválido.');
      setBudgetsByCategory((prev) => ({ ...prev, [categoriaId]: savedValue }));
      return;
    }

    try {
      setSavingBudgetByCategory((prev) => ({ ...prev, [categoriaId]: true }));
      const toastId = toast.loading('Salvando orçamento...');
      const data = await saveCategoryBudget(userId, categoriaId, parsed);
      const nextValue = data.valor_orcado === null || data.valor_orcado === undefined
        ? ''
        : String(Math.round(Number(data.valor_orcado) * 100));
      setBudgetsByCategory((prev) => ({ ...prev, [categoriaId]: nextValue }));
      setSavedBudgetsByCategory((prev) => ({ ...prev, [categoriaId]: nextValue }));
      await loadBudgetSummary();
      toast.update(toastId, { render: 'Orçamento salvo com sucesso!', type: 'success', isLoading: false, autoClose: 2000 });
    } catch (error: any) {
      console.error('Erro ao salvar orçamento:', error);
      setBudgetsByCategory((prev) => ({ ...prev, [categoriaId]: savedValue }));
      toast.error('Erro ao salvar orçamento. Tente novamente.');
    } finally {
      setSavingBudgetByCategory((prev) => ({ ...prev, [categoriaId]: false }));
    }
  }

  useEffect(() => {
    loadCategorias();
  }, [userId]);

  useEffect(() => {
    loadBudgetSummary();
  }, [userId]);

  async function handleSaveCategoria({ nome, tipo }: { nome: string, tipo: string }) {
    if (!userId) return;

    try {
      if (editingCategoria) {
        await updateCategory(userId, editingCategoria.id, { nome, tipo });
      } else {
        await createCategory(userId, { nome, tipo });
      }
      setModalOpen(false);
      setEditingCategoria(null);
      loadCategorias();
    } catch (error: any) {
      console.error('Erro ao salvar categoria:', error);
    }
  }

  async function handleDeleteCategoria(id: number) {
    if (!userId) return;

    try {
      await deleteCategory(userId, id);
      setDeleteModalOpen(false);
      setDeletingCategoria(null);
      loadCategorias();
    } catch (error: any) {
      console.error('Erro ao excluir categoria:', error);
    }
  }

  function handleEditCategoria(categoria: Category) {
    // Só pode editar categorias pessoais
    if (categoria.user_id === null) {
      alert('Não é possível editar categorias globais. Crie uma categoria personalizada.');
      return;
    }
    setEditingCategoria(categoria);
    setModalOpen(true);
  }

  function handleDeleteClick(categoria: Category) {
    // Só pode excluir categorias pessoais
    if (categoria.user_id === null) {
      alert('Não é possível excluir categorias globais.');
      return;
    }
    setDeletingCategoria(categoria);
    setDeleteModalOpen(true);
  }

  return (
    <Layout>
      <CategoriaModal 
        open={modalOpen} 
        onClose={() => {
          setModalOpen(false);
          setEditingCategoria(null);
        }} 
        onSave={handleSaveCategoria}
        categoria={editingCategoria}
      />
      
      {deleteModalOpen && deletingCategoria && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
          onClick={() => {
            setDeleteModalOpen(false);
            setDeletingCategoria(null);
          }}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 w-full max-w-md relative shadow-xl ring-1 ring-black/5"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="absolute top-3 right-3 text-gray-400 dark:text-gray-300" onClick={() => {
              setDeleteModalOpen(false);
              setDeletingCategoria(null);
            }}>×</button>
            <h2 className="text-xl font-bold mb-4 text-red-600 dark:text-red-400">Confirmar Exclusão</h2>
            <div className="mb-4 dark:text-gray-200">
              <div><b>Nome:</b> {deletingCategoria.nome}</div>
              <div><b>Tipo:</b> {deletingCategoria.tipo === 'entrada' ? 'Entrada' : 'Saída'}</div>
            </div>
            <div className="flex gap-3">
              <button
                className="flex-1 bg-green-600 text-white py-2.5 rounded-lg font-semibold hover:bg-green-700"
                onClick={() => handleDeleteCategoria(deletingCategoria.id)}
              >
                Sim, excluir
              </button>
              <button
                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg font-semibold hover:bg-red-700"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setDeletingCategoria(null);
                }}
              >
                Não
              </button>
            </div>
          </div>
        </div>
      )}
      
      <h1 className="text-xl md:text-2xl font-bold mb-2 mt-2 dark:text-white">Categorias</h1>
      <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 mb-4 md:mb-6">
        A IA já identifica categorias automaticamente. Você pode personalizar também.
      </p>
      
      {/* Botão criar categoria - grande em mobile */}
      <button 
        className="w-full md:w-auto mb-6 px-6 py-4 md:py-2 bg-blue-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition text-base md:text-sm" 
        onClick={() => {
          setEditingCategoria(null);
          setModalOpen(true);
        }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Criar Categoria
      </button>
      
      <div className="space-y-3 md:space-y-4">
        {loading ? (
          <div className="dark:text-gray-200">Carregando categorias...</div>
        ) : (
          categorias.map(cat => (
            <div key={cat.id} className="bg-gray-100 dark:bg-gray-800 rounded-xl flex flex-col md:flex-row md:items-center md:justify-between p-4 md:px-6 md:py-4 shadow border-l-4 border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-3 mb-3 md:mb-0">
                <span className="font-semibold text-base md:text-lg dark:text-white">{cat.nome}</span>
                {cat.user_id === null && (
                  <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                    Global
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 justify-between md:justify-end">
                <span className={`px-3 md:px-4 py-1 rounded-full font-semibold text-white text-xs md:text-sm ${cat.tipo === 'entrada' ? 'bg-green-500' : 'bg-red-500'}`}>
                  {cat.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Orçamento</span>
                  <input
                    className="w-24 md:w-28 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-2 py-1 text-sm text-right"
                    placeholder="R$ 0,00"
                    inputMode="numeric"
                    value={formatCurrency(budgetsByCategory[cat.id] ?? '')}
                    onChange={(e) => {
                      const digits = parseBudgetDigits(e.target.value);
                      setBudgetsByCategory((prev) => ({ ...prev, [cat.id]: digits }));
                    }}
                    onBlur={() => handleBudgetBlur(cat.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                    disabled={!!savingBudgetByCategory[cat.id]}
                    aria-label={`Orçamento da categoria ${cat.nome}`}
                  />
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {(() => {
                    const spentValue = spentByCategory[cat.id] ?? 0;
                    const parsedBudget = parseBudgetValue(budgetsByCategory[cat.id] ?? '');
                    const spentLabel = spentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    if (parsedBudget === null) {
                      return `Gasto R$ ${spentLabel}`;
                    }
                    const budgetLabel = parsedBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    return `Gasto R$ ${spentLabel} / Orçado R$ ${budgetLabel}`;
                  })()}
                </div>
                {cat.user_id !== null && (
                  <>
                    <button
                      className="p-2 md:px-3 md:py-1 rounded bg-gray-200 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                      onClick={() => handleEditCategoria(cat)}
                      title="Editar"
                    >
                      <svg className="w-4 h-4 md:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span className="hidden md:inline">Editar</span>
                    </button>
                    <button
                      className="p-2 md:px-3 md:py-1 rounded bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800"
                      onClick={() => handleDeleteClick(cat)}
                      title="Excluir"
                    >
                      <svg className="w-4 h-4 md:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span className="hidden md:inline">Excluir</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </Layout>
  );
} 