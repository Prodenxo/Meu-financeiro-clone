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
