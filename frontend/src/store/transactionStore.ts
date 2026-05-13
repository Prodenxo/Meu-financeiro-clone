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

/** Sessão ausente — mapeado para copy canónica `sessao` via `mapUnknownErrorToUserFacing`. */
const SESSION_ERROR = new Error('401 Unauthorized');

interface TransactionState {
  transactions: Transaction[];
  loading: boolean;
  error: unknown | null;
  googleAuthRequired: boolean;
  fetchTransactions: () => Promise<void>;
  addTransaction: (
    transaction: Omit<Transaction, 'id' | 'criado_em' | 'user_id'>
  ) => Promise<{ data: Transaction | null; error: unknown | null }>;
  updateTransaction: (
    id: number,
    transaction: Partial<Transaction>
  ) => Promise<{ data: Transaction | null; error: unknown | null }>;
  deleteTransaction: (id: number) => Promise<{ data: null; error: unknown | null }>;
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
      set({ error: SESSION_ERROR });
      return;
    }

    set({ loading: true, error: null });
    try {
      const transactions = await fetchTransactionsService(userId);
      const uid = String(userId);
      const filteredTransactions = transactions.filter(
        (t) => t.user_id != null && String(t.user_id) === uid,
      );
      set({ transactions: filteredTransactions, loading: false });
    } catch (error: unknown) {
      set({ error, loading: false });
    }
  },

  addTransaction: async (transaction) => {
    const userId = useAuthStore.getState().userId;
    if (!userId) {
      console.error('[TransactionStore] Erro: utilizador não autenticado');
      set({ error: SESSION_ERROR });
      return { data: null, error: SESSION_ERROR };
    }

    console.log('[TransactionStore] Adicionando transação:', {
      userId,
      transaction: {
        tipo: transaction.tipo,
        valor: transaction.valor,
        classificacao: transaction.classificacao,
        data: transaction.data,
        status: transaction.status,
        obs: transaction.obs,
      },
    });

    try {
      console.log('[TransactionStore] Chamando createTransactionService...');
      const data = await createTransactionService(userId, transaction as CreateTransactionInput);
      console.log('[TransactionStore] ✅ Transação criada com sucesso:', data);

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
      console.error('[TransactionStore] ❌ Erro ao adicionar transação:', {
        error,
        stack: error instanceof Error ? error.stack : undefined,
        transaction,
      });
      set({ error });
      return { data: null, error };
    }
  },

  updateTransaction: async (id, transaction) => {
    const userId = useAuthStore.getState().userId;
    if (!userId) {
      set({ error: SESSION_ERROR });
      return { data: null, error: SESSION_ERROR };
    }

    try {
      const data = await updateTransactionService(userId, id, transaction as UpdateTransactionInput);
      await get().fetchTransactions();
      return { data, error: null };
    } catch (error: unknown) {
      set({ error });
      return { data: null, error };
    }
  },

  deleteTransaction: async (id) => {
    const userId = useAuthStore.getState().userId;
    if (!userId) {
      set({ error: SESSION_ERROR });
      return { data: null, error: SESSION_ERROR };
    }

    try {
      await deleteTransactionService(userId, id);
      await get().fetchTransactions();
      return { data: null, error: null };
    } catch (error: unknown) {
      set({ error });
      return { data: null, error };
    }
  },

  clearGoogleAuthRequired: () => set({ googleAuthRequired: false }),
}));
