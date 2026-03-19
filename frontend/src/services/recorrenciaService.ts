import { apiClient } from './apiClient';

export interface Recorrencia {
  id: string;
  user_id: string;
  dia_do_mes: number;
  valor: number;
  classificacao: string;
  tipo: 'entrada' | 'saída' | 'saida';
  status: string;
  obs: string | null;
  categoria: string | null;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface CreateRecorrenciaInput {
  dia_do_mes: number;
  valor: number;
  classificacao: string;
  tipo: 'entrada' | 'saída' | 'saida';
  status?: string;
  obs?: string;
  categoria?: string;
  ativo?: boolean;
}

export interface UpdateRecorrenciaInput {
  dia_do_mes?: number;
  valor?: number;
  classificacao?: string;
  tipo?: 'entrada' | 'saída' | 'saida';
  status?: string;
  obs?: string;
  categoria?: string;
  ativo?: boolean;
}

export async function fetchRecorrencias(): Promise<Recorrencia[]> {
  const data = await apiClient.get<Recorrencia[]>('/recorrencias');
  return Array.isArray(data) ? data : [];
}

export async function createRecorrencia(payload: CreateRecorrenciaInput): Promise<Recorrencia> {
  return apiClient.post<Recorrencia>('/recorrencias', payload);
}

export async function updateRecorrencia(
  id: string,
  payload: UpdateRecorrenciaInput
): Promise<Recorrencia> {
  return apiClient.put<Recorrencia>(`/recorrencias/${id}`, payload);
}

export async function deleteRecorrencia(id: string): Promise<void> {
  await apiClient.delete(`/recorrencias/${id}`);
}
