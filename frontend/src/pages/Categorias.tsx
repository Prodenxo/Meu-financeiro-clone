import React, { useEffect, useState } from 'react';
import { Grid3x3 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  fetchCategoryBudgetsSummary,
  type Category,
} from '../services/categoryService';
import PageShell from '../components/PageShell';
import PageTitle from '../components/PageTitle';
import EmptyState from '../components/EmptyState';
import LoadingOverlay from '../components/LoadingOverlay';
import FetchErrorBanner from '../components/FetchErrorBanner';

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
        className="planner-card p-8 w-full max-w-md relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="absolute top-3 right-3 text-slate-400 dark:text-slate-300" onClick={onClose}>×</button>
        <h2 className="text-xl font-bold mb-4 dark:text-white">{categoria ? 'Editar Categoria' : 'Adicionar Categoria'}</h2>
        <label className="block mb-2 font-medium dark:text-gray-200">Nome da Categoria</label>
        <input
          className="planner-input mb-4"
          value={nome}
          onChange={e => setNome(e.target.value)}
          placeholder="Nome da categoria"
        />
        <label className="block mb-2 font-medium dark:text-gray-200">Tipo da Categoria</label>
        <div className="flex gap-4 mb-6">
          <button
            type="button"
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              tipo === 'entrada'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 dark:text-gray-200'
            }`}
            onClick={() => setTipo('entrada')}
          >Entrada</button>
          <button
            type="button"
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              tipo === 'saída'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 dark:text-gray-200'
            }`}
            onClick={() => setTipo('saída')}
          >Saída</button>
        </div>
        <button
          className="w-full planner-button"
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
  const [loadError, setLoadError] = useState<unknown | null>(null);
  const [budgetLoadError, setBudgetLoadError] = useState<unknown | null>(null);
  const [spentByCategory, setSpentByCategory] = useState<Record<number, number>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<Category | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingCategoria, setDeletingCategoria] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { userId } = useAuthStore();

  async function loadCategorias() {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchCategories(userId);
      setCategorias(data);
    } catch (error: unknown) {
      console.error('Erro ao carregar categorias:', error);
      setLoadError(error);
    } finally {
      setLoading(false);
    }
  }

  async function loadBudgetSummary() {
    if (!userId) {
      setSpentByCategory({});
      setBudgetLoadError(null);
      return;
    }

    setBudgetLoadError(null);
    try {
      const data = await fetchCategoryBudgetsSummary(userId);
      const spentMapped: Record<number, number> = {};
      data.forEach((budget) => {
        spentMapped[budget.categorias_id] = Number(budget.valor_gasto || 0);
      });
      setSpentByCategory(spentMapped);
    } catch (error: unknown) {
      console.error('Erro ao carregar orçamentos:', error);
      setBudgetLoadError(error);
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
    setEditingCategoria(categoria);
    setModalOpen(true);
  }

  function handleDeleteClick(categoria: Category) {
    setDeletingCategoria(categoria);
    setDeleteModalOpen(true);
  }

  const normalizeSearch = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const trimmedSearch = searchTerm.trim();
  const categoriasFiltradas = trimmedSearch
    ? categorias.filter((cat) =>
        normalizeSearch(cat.nome).includes(normalizeSearch(trimmedSearch))
      )
    : categorias;

  return (
    <>
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
            className="planner-card p-8 w-full max-w-md relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="absolute top-3 right-3 text-slate-400 dark:text-slate-300" onClick={() => {
              setDeleteModalOpen(false);
              setDeletingCategoria(null);
            }}>×</button>
            <h2 className="text-xl font-bold mb-4 text-rose-600 dark:text-rose-400">Confirmar Exclusão</h2>
            <div className="mb-4 dark:text-gray-200">
              <div><b>Nome:</b> {deletingCategoria.nome}</div>
              <div><b>Tipo:</b> {deletingCategoria.tipo === 'entrada' ? 'Entrada' : 'Saída'}</div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                className="flex-1 planner-button-danger"
                onClick={() => handleDeleteCategoria(deletingCategoria.id)}
              >
                Sim, excluir
              </button>
              <button
                className="flex-1 planner-button-secondary"
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

      <PageShell>
      <PageTitle subtitle="A IA já identifica categorias automaticamente. Você pode personalizar também.">
        Categorias
      </PageTitle>

      {loadError && !loading ? (
        <FetchErrorBanner error={loadError} onRetry={() => void loadCategorias()} surfaceId="categorias.load" />
      ) : null}
      {budgetLoadError ? (
        <FetchErrorBanner
          error={budgetLoadError}
          onRetry={() => void loadBudgetSummary()}
          surfaceId="categorias.budgetSummary"
        />
      ) : null}

      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
        <div className="flex-1">
          <input
            className="planner-input md:py-2 text-base md:text-sm"
            placeholder="Pesquisar categoria"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Pesquisar categoria"
          />
        </div>
        {/* Botão criar categoria - grande em mobile */}
        <button
          className="w-full md:w-auto planner-button text-base md:text-sm"
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
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {loading ? (
          <LoadingOverlay message="Carregando categorias..." />
        ) : loadError ? null : categoriasFiltradas.length === 0 ? (
          <div className="lg:col-span-2">
            <EmptyState
              icon={Grid3x3}
              title="Nenhuma categoria encontrada"
              description="Crie categorias para organizar suas entradas e saídas."
              action={
              <button
                type="button"
                className="planner-button"
                onClick={() => { setEditingCategoria(null); setModalOpen(true); }}
              >
                Criar categoria
              </button>
            }
            />
          </div>
        ) : (
          <>
            {categoriasFiltradas.map(cat => (
              <div key={cat.id} className="planner-card h-full p-4 md:px-5 md:py-4 border-l-4 border-blue-600/70">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-center">
                  <div className="flex flex-wrap items-center gap-2 md:col-span-8">
                    <span className="font-semibold text-base md:text-lg dark:text-white">{cat.nome}</span>
                    <span className={`px-3 py-1 rounded-full font-semibold text-white text-xs ${cat.tipo === 'entrada' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                      {cat.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 md:col-span-4 md:justify-end">
                    <button
                      className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 dark:text-gray-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-semibold"
                      onClick={() => handleEditCategoria(cat)}
                      title="Editar"
                    >
                      Editar
                    </button>
                    <button
                      className="px-3 py-2 rounded-xl bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-800 text-sm font-semibold"
                      onClick={() => handleDeleteClick(cat)}
                      title="Excluir"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
      </PageShell>
    </>
  );
} 