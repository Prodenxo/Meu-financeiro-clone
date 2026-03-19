import { create } from 'zustand';
import {
  fetchRecorrencias as fetchRecorrenciasService,
  createRecorrencia as createRecorrenciaService,
  updateRecorrencia as updateRecorrenciaService,
  deleteRecorrencia as deleteRecorrenciaService,
  type Recorrencia,
  type CreateRecorrenciaInput,
  type UpdateRecorrenciaInput,
} from '../services/recorrenciaService';
import { useAuthStore } from './authStore';

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

interface RecorrenciaState {
  recorrencias: Recorrencia[];
  loading: boolean;
  error: string | null;
  fetchRecorrencias: () => Promise<void>;
  addRecorrencia: (payload: CreateRecorrenciaInput) => Promise<{ data: Recorrencia | null; error: string | null }>;
  updateRecorrencia: (id: string, payload: UpdateRecorrenciaInput) => Promise<{ data: Recorrencia | null; error: string | null }>;
  removeRecorrencia: (id: string) => Promise<{ error: string | null }>;
}

export const useRecorrenciaStore = create<RecorrenciaState>((set, get) => ({
  recorrencias: [],
  loading: false,
  error: null,

  fetchRecorrencias: async () => {
    const userId = useAuthStore.getState().userId;
    if (!userId) {
      set({ error: 'Usuário não autenticado' });
      return;
    }
    set({ loading: true, error: null });
    try {
      const data = await fetchRecorrenciasService();
      set({ recorrencias: data ?? [], loading: false });
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Erro ao carregar recorrências'), loading: false });
    }
  },

  addRecorrencia: async (payload) => {
    const userId = useAuthStore.getState().userId;
    if (!userId) {
      set({ error: 'Usuário não autenticado' });
      return { data: null, error: 'Usuário não autenticado' };
    }
    try {
      const data = await createRecorrenciaService(payload);
      await get().fetchRecorrencias();
      return { data, error: null };
    } catch (error: unknown) {
      const msg = getErrorMessage(error, 'Erro ao criar recorrência');
      set({ error: msg });
      return { data: null, error: msg };
    }
  },

  updateRecorrencia: async (id, payload) => {
    const userId = useAuthStore.getState().userId;
    if (!userId) {
      set({ error: 'Usuário não autenticado' });
      return { data: null, error: 'Usuário não autenticado' };
    }
    try {
      const data = await updateRecorrenciaService(id, payload);
      await get().fetchRecorrencias();
      return { data, error: null };
    } catch (error: unknown) {
      const msg = getErrorMessage(error, 'Erro ao atualizar recorrência');
      set({ error: msg });
      return { data: null, error: msg };
    }
  },

  removeRecorrencia: async (id) => {
    const userId = useAuthStore.getState().userId;
    if (!userId) {
      set({ error: 'Usuário não autenticado' });
      return { error: 'Usuário não autenticado' };
    }
    try {
      await deleteRecorrenciaService(id);
      await get().fetchRecorrencias();
      return { error: null };
    } catch (error: unknown) {
      const msg = getErrorMessage(error, 'Erro ao remover recorrência');
      set({ error: msg });
      return { error: msg };
    }
  },
}));
