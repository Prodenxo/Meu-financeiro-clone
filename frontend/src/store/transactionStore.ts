import { create } from 'zustand';
import {
  fetchTransactions as fetchTransactionsService,
  createTransaction as createTransactionService,
  updateTransaction as updateTransactionService,
  deleteTransaction as deleteTransactionService,
  type Transaction,
  type CreateTransactionInput,
  type UpdateTransactionInput,
} from '../services/transactionService';
import { useAuthStore } from './authStore';
import { createEventFromTransaction, checkGoogleAuth } from '../lib/google-calendar';

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

interface TransactionState {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  googleAuthRequired: boolean;
  fetchTransactions: () => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'criado_em' | 'user_id'>) => Promise<{ data: Transaction | null; error: string | null }>;
  updateTransaction: (id: number, transaction: Partial<Transaction>) => Promise<{ data: Transaction | null; error: string | null }>;
  deleteTransaction: (id: number) => Promise<{ data: null; error: string | null }>;
  clearGoogleAuthRequired: () => void;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  loading: false,
  error: null,
  googleAuthRequired: false,

  fetchTransactions: async () => {
    const userId = useAuthStore.getState().userId;
    if (!userId) {
      set({ error: 'Usuário não autenticado' });
      return;
    }

    set({ loading: true, error: null });
    try {
      const transactions = await fetchTransactionsService(userId);
      const filteredTransactions = transactions.filter((t) => t.user_id === userId);
      set({ transactions: filteredTransactions, loading: false });
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Erro ao carregar transações'), loading: false });
    }
  },

  addTransaction: async (transaction) => {
    const userId = useAuthStore.getState().userId;
    if (!userId) {
      const errorMsg = 'Usuário não autenticado';
      console.error('[TransactionStore] Erro:', errorMsg);
      set({ error: errorMsg });
      return { data: null, error: errorMsg };
    }

    console.log('[TransactionStore] Adicionando transação:', {
      userId,
      transaction: {
        tipo: transaction.tipo,
        valor: transaction.valor,
        classificacao: transaction.classificacao,
        data: transaction.data,
        status: transaction.status,
        obs: transaction.obs
      }
    });

    try {
      console.log('[TransactionStore] Chamando createTransactionService...');
      const data = await createTransactionService(userId, transaction as CreateTransactionInput);
      console.log('[TransactionStore] ✅ Transação criada com sucesso:', data);

      // Criar evento no Google Calendar se status for a_receber ou a_pagar
      if (transaction.status === 'a_receber' || transaction.status === 'a_pagar') {
        console.log('[TransactionStore] Verificando autenticação Google Calendar...');
        const { authenticated } = await checkGoogleAuth();
        if (authenticated) {
          try {
            console.log('[TransactionStore] Criando evento no Google Calendar...');
            await createEventFromTransaction(transaction);
            console.log('[TransactionStore] ✅ Evento criado no Google Calendar');
          } catch (calendarError: unknown) {
            console.error('[TransactionStore] Erro ao criar evento no Google Calendar:', calendarError);
            // Não falhar a transação se o evento não for criado
          }
        } else {
          console.log('[TransactionStore] Google Calendar não autenticado, marcando como necessário');
          set({ googleAuthRequired: true });
        }
      }

      console.log('[TransactionStore] Atualizando lista de transações...');
      await get().fetchTransactions();
      console.log('[TransactionStore] ✅ Lista de transações atualizada');
      return { data, error: null };
    } catch (error: unknown) {
      const errorMsg = getErrorMessage(error, 'Erro desconhecido ao adicionar transação');
      console.error('[TransactionStore] ❌ Erro ao adicionar transação:', {
        error,
        message: errorMsg,
        stack: error instanceof Error ? error.stack : undefined,
        transaction
      });
      set({ error: errorMsg });
      return { data: null, error: errorMsg };
    }
  },

  updateTransaction: async (id, transaction) => {
    const userId = useAuthStore.getState().userId;
    if (!userId) {
      set({ error: 'Usuário não autenticado' });
      return { data: null, error: 'Usuário não autenticado' };
    }

    try {
      const data = await updateTransactionService(userId, id, transaction as UpdateTransactionInput);
      await get().fetchTransactions();
      return { data, error: null };
    } catch (error: unknown) {
      const errorMsg = getErrorMessage(error, 'Erro ao atualizar transação');
      set({ error: errorMsg });
      return { data: null, error: errorMsg };
    }
  },

  deleteTransaction: async (id) => {
    const userId = useAuthStore.getState().userId;
    if (!userId) {
      set({ error: 'Usuário não autenticado' });
      return { data: null, error: 'Usuário não autenticado' };
    }

    try {
      await deleteTransactionService(userId, id);
      await get().fetchTransactions();
      return { data: null, error: null };
    } catch (error: unknown) {
      const errorMsg = getErrorMessage(error, 'Erro ao remover transação');
      set({ error: errorMsg });
      return { data: null, error: errorMsg };
    }
  },

  clearGoogleAuthRequired: () => set({ googleAuthRequired: false }),
}));