import { apiClient } from './apiClient';

export interface Category {
  id: number;
  nome: string;
  tipo: string;
  user_id: string | null;
}

export interface CreateCategoryInput {
  nome: string;
  tipo: 'entrada' | 'saída' | 'saida';
}

export interface CategoryBudget {
  categorias_id: number;
  valor_orcado: number | null;
}

export interface CategoryBudgetSummary {
  categorias_id: number;
  valor_orcado: number | null;
  valor_gasto: number;
  valor_recebido?: number;
}

function normalizeTipo (tipo: CreateCategoryInput['tipo']): 'entrada' | 'saida' | 'saída' {
  if (tipo === 'saída') return 'saida'
  return tipo
}

/**
 * Busca todas as categorias (globais + do usuário)
 */
export async function fetchCategories(userId: string): Promise<Category[]> {
  const data = await apiClient.get<Category[]>('/categories');
  return data || [];
}

/**
 * Busca categorias por tipo
 */
export async function fetchCategoriesByType(
  userId: string,
  tipo: 'entrada' | 'saída' | 'saida'
): Promise<Category[]> {
  const data = await apiClient.get<Category[]>(`/categories?type=${normalizeTipo(tipo as CreateCategoryInput['tipo'])}`);
  return data || [];
}

/**
 * Cria uma nova categoria
 */
export async function createCategory(
  userId: string,
  category: CreateCategoryInput
): Promise<Category> {
  const data = await apiClient.post<Category>('/categories', { ...category, tipo: normalizeTipo(category.tipo) });
  return data;
}

/**
 * Atualiza uma categoria existente
 */
export async function updateCategory(
  userId: string,
  id: number,
  category: CreateCategoryInput
): Promise<Category> {
  const data = await apiClient.put<Category>('/categories', { id, ...category, tipo: normalizeTipo(category.tipo) });
  return data;
}

/**
 * Deleta uma categoria
 */
export async function deleteCategory(
  userId: string,
  id: number
): Promise<void> {
  await apiClient.delete('/categories', { id });
}

/**
 * Busca os orçamentos do usuário por categoria
 */
export async function fetchCategoryBudgets(userId: string): Promise<CategoryBudget[]> {
  const data = await apiClient.get<CategoryBudget[]>('/categories/budgets');
  return data || [];
}

/**
 * Cria ou atualiza o orçamento de uma categoria
 */
export async function saveCategoryBudget(
  userId: string,
  categoriasId: number,
  valorOrcado: number | null
): Promise<CategoryBudget> {
  const data = await apiClient.post<CategoryBudget>('/categories/budgets', {
    categorias_id: categoriasId,
    valor_orcado: valorOrcado
  });
  return data;
}

/**
 * Busca o resumo de orçamento vs gasto do mês atual
 */
export async function fetchCategoryBudgetsSummary(userId: string): Promise<CategoryBudgetSummary[]> {
  const data = await apiClient.get<CategoryBudgetSummary[]>('/categories/budgets/summary');
  return data || [];
}
