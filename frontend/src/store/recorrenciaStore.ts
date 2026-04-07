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

const SESSION_ERROR = new Error('401 Unauthorized');

interface RecorrenciaState {
  recorrencias: Recorrencia[];
  loading: boolean;
  error: unknown | null;
  fetchRecorrencias: () => Promise<void>;
  addRecorrencia: (
    payload: CreateRecorrenciaInput
  ) => Promise<{ data: Recorrencia | null; error: unknown | null }>;
  updateRecorrencia: (
    id: string,
    payload: UpdateRecorrenciaInput
  ) => Promise<{ data: Recorrencia | null; error: unknown | null }>;
  removeRecorrencia: (id: string) => Promise<{ error: unknown | null }>;
}

export const useRecorrenciaStore = create<RecorrenciaState>((set, get) => ({
  recorrencias: [],
  loading: false,
  error: null,

  fetchRecorrencias: async () => {
    const userId = useAuthStore.getState().userId;
    if (!userId) {
      set({ error: SESSION_ERROR });
      return;
    }
    set({ loading: true, error: null });
    try {
      const data = await fetchRecorrenciasService();
      set({ recorrencias: data ?? [], loading: false });
    } catch (error: unknown) {
      set({ error, loading: false });
    }
  },

  addRecorrencia: async (payload) => {
    const userId = useAuthStore.getState().userId;
    if (!userId) {
      set({ error: SESSION_ERROR });
      return { data: null, error: SESSION_ERROR };
    }
    try {
      const data = await createRecorrenciaService(payload);
      await get().fetchRecorrencias();
      return { data, error: null };
    } catch (error: unknown) {
      set({ error });
      return { data: null, error };
    }
  },

  updateRecorrencia: async (id, payload) => {
    const userId = useAuthStore.getState().userId;
    if (!userId) {
      set({ error: SESSION_ERROR });
      return { data: null, error: SESSION_ERROR };
    }
    try {
      const data = await updateRecorrenciaService(id, payload);
      await get().fetchRecorrencias();
      return { data, error: null };
    } catch (error: unknown) {
      set({ error });
      return { data: null, error };
    }
  },

  removeRecorrencia: async (id) => {
    const userId = useAuthStore.getState().userId;
    if (!userId) {
      set({ error: SESSION_ERROR });
      return { error: SESSION_ERROR };
    }
    try {
      await deleteRecorrenciaService(id);
      await get().fetchRecorrencias();
      return { error: null };
    } catch (error: unknown) {
      set({ error });
      return { error };
    }
  },
}));
