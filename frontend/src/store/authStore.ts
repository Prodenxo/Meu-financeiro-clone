import { create } from 'zustand';
import { useTransactionStore } from './transactionStore';
import type { UserRole } from '../lib/roles';
import { normalizeRole } from '../lib/roles';
import {
  signUp as signUpService,
  signIn as signInService,
  signOut as signOutService,
  getSession,
  resetPasswordForEmail as resetPasswordForEmailService,
  updatePassword as updatePasswordService,
  updatePhone as updatePhoneService,
  updateDisplayName as updateDisplayNameService,
} from '../services/authService';

interface AuthUser {
  id: string;
  email?: string | null;
  user_metadata?: {
    phone?: string | null;
    display_name?: string | null;
    empresa_id?: string | null;
  } | null;
}

interface AuthState {
  user: AuthUser | null;
  userId: string | null;
  phone: string | null;
  displayName: string | null;
  role: UserRole | null;
  empresaId: string | null;
  mei: boolean | null;
  sessionRestored: boolean;
  setUser: (user: AuthUser | null) => void;
  setPhone: (phone: string) => void;
  signUp: (email: string, password: string, phone?: string, displayName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  initAuth: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  updatePhone: (phone: string) => Promise<void>;
  updateDisplayName: (displayName: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  userId: null,
  phone: null,
  displayName: null,
  role: null,
  empresaId: null,
  mei: null,
  sessionRestored: false,

  setUser: (user) => set((state) => ({
    user,
    userId: user?.id || null,
    // Role vem apenas do backend/session; não confiar em user_metadata.
    role: state.role,
    empresaId: user?.user_metadata?.empresa_id || null,
    mei: state.mei,
  })),
  setPhone: (phone) => set({ phone }),

  signUp: async (email, password, phone?, displayName?) => {
    const result = await signUpService({ email, password, phone, displayName });
    set({
      user: result.user,
      userId: result.userId,
      phone: result.phone,
      displayName: result.displayName,
      empresaId: result.empresaId || null,
    });
  },

  signIn: async (email, password) => {
    console.log('Tentando login com:', email);
    const result = await signInService(email, password);
    console.log('Login bem sucedido:', result.user?.email);
    set({
      user: result.user,
      userId: result.userId,
      phone: result.phone,
      displayName: result.displayName,
      role: normalizeRole(result.role),
      empresaId: result.empresaId || null,
      mei: result.mei ?? true,
    });
    // Fetch transactions immediately after successful login
    await useTransactionStore.getState().fetchTransactions();
  },

  signOut: async () => {
    console.log('Realizando logout...');
    await signOutService();
    console.log('Logout concluído');
    set({ user: null, userId: null, phone: null, displayName: null, role: null, empresaId: null, mei: null });
  },

  initAuth: async () => {
    console.log('Iniciando verificação de autenticação...');
    const session = await getSession();
    console.log('Sessão atual:', session);
    if (session?.user) {
      const userId = session.user.id;
      const phone = session.user.user_metadata?.phone || null;
      const displayName = session.user.user_metadata?.display_name || null;
      const role = normalizeRole(session.role || null);
      console.log('[AuthStore] initAuth session.role:', session.role, 'normalized:', role);
      const empresaId = session.empresaId || session.user.user_metadata?.empresa_id || null;
      const mei = session.mei ?? true;
      console.log('Usuário encontrado:', session.user.email);
      set({ user: session.user, userId, phone, displayName, role, empresaId, mei, sessionRestored: true });
    } else {
      console.log('Nenhuma sessão encontrada');
      set({
        user: null,
        userId: null,
        phone: null,
        displayName: null,
        role: null,
        empresaId: null,
        mei: null,
        sessionRestored: true
      });
    }
  },

  resetPasswordForEmail: async (email) => {
    console.log('Solicitando reset de senha para:', email);
    await resetPasswordForEmailService(email);
    console.log('Email de reset de senha enviado com sucesso');
  },

  updatePassword: async (newPassword) => {
    console.log('Atualizando senha...');
    await updatePasswordService(newPassword);
    console.log('Senha atualizada com sucesso');
  },

  updatePhone: async (phone) => {
    console.log('Atualizando telefone...');
    const userId = get().userId;
    if (!userId) throw new Error('Usuário não autenticado');
    const cleanedPhone = await updatePhoneService(userId, phone);
    set({ phone: cleanedPhone });
    console.log('Telefone atualizado com sucesso');
  },

  updateDisplayName: async (displayName) => {
    console.log('Atualizando nome de exibição...');
    await updateDisplayNameService(displayName);
    set({ displayName });
    console.log('Nome de exibição atualizado com sucesso');
  },
}));

// Initialize auth state from session
getSession().then((session) => {
  if (session) {
    const userId = session.user.id;
    const phone = session.user.user_metadata?.phone || null;
    const displayName = session.user.user_metadata?.display_name || null;
    const role = normalizeRole(session.role || null);
    console.log('[AuthStore] bootstrap session.role:', session.role, 'normalized:', role);
    const empresaId = session.empresaId || session.user.user_metadata?.empresa_id || null;
    const mei = session.mei ?? true;
    useAuthStore.setState({ 
      user: session.user,
      userId,
      phone,
      displayName,
      role,
      empresaId,
      mei,
      sessionRestored: true,
    });
    // Fetch transactions if there's an active session
    useTransactionStore.getState().fetchTransactions();
  } else {
    useAuthStore.setState({ role: null, empresaId: null, mei: null, sessionRestored: true });
  }
}).catch(() => {
  useAuthStore.setState({ sessionRestored: true });
});
