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
  impersonate as impersonateService,
} from '../services/authService';
import { apiClient } from '../services/apiClient';
import { supabaseBrowser } from '../lib/supabaseBrowser';
import { normalizeMeiFromSession } from '../lib/meiAccess';

const ORIGINAL_TOKEN_KEY = 'financas-pessoais-original-token';

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
  isImpersonating: boolean;
  setUser: (user: AuthUser | null) => void;
  setPhone: (phone: string) => void;
  signUp: (email: string, password: string, phone?: string, displayName?: string, inviteToken?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  initAuth: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  updatePhone: (phone: string) => Promise<void>;
  updateDisplayName: (displayName: string) => Promise<void>;
  impersonate: (targetUserId: string) => Promise<void>;
  stopImpersonating: () => Promise<void>;
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
  isImpersonating: false,

  setUser: (user) => set((state) => ({
    user,
    userId: user?.id || null,
    // Role vem apenas do backend/session; não confiar em user_metadata.
    role: state.role,
    empresaId: user?.user_metadata?.empresa_id || null,
    mei: state.mei,
  })),
  setPhone: (phone) => set({ phone }),

  signUp: async (email, password, phone?, displayName?, inviteToken?) => {
    const result = await signUpService({ email, password, phone, displayName, inviteToken });
    if (result.hadSession) {
      const session = await getSession();
      if (session?.user) {
        set({
          user: session.user,
          userId: session.user.id,
          phone: session.user.phone || session.user.user_metadata?.phone || result.phone || null,
          displayName: session.user.displayName || session.user.user_metadata?.display_name || result.displayName || null,
          role: normalizeRole(session.role || null),
          empresaId: session.empresaId || session.user.user_metadata?.empresa_id || null,
          mei: normalizeMeiFromSession(session.mei)
        });
        await useTransactionStore.getState().fetchTransactions();
        return;
      }
    }
    set({
      user: result.user,
      userId: result.userId,
      phone: result.phone,
      displayName: result.displayName,
      empresaId: null,
      role: null,
      mei: null
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
      mei: normalizeMeiFromSession(result.mei),
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
    const isImpersonating = Boolean(localStorage.getItem(ORIGINAL_TOKEN_KEY));
    
    console.log('Sessão atual:', session, 'Impersonating:', isImpersonating);
    if (session?.user) {
      const userId = session.user.id;
      const phone = session.user.phone || session.user.user_metadata?.phone || null;
      const displayName = session.user.displayName || session.user.user_metadata?.display_name || null;
      const role = normalizeRole(session.role || null);
      console.log('[AuthStore] initAuth session.role:', session.role, 'normalized:', role);
      const empresaId = session.empresaId || session.user.user_metadata?.empresa_id || null;
      const mei = normalizeMeiFromSession(session.mei);
      console.log('Usuário encontrado:', session.user.email);
      set({ 
        user: session.user, 
        userId, 
        phone, 
        displayName, 
        role, 
        empresaId, 
        mei, 
        sessionRestored: true,
        isImpersonating
      });
      await useTransactionStore.getState().fetchTransactions();
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
        sessionRestored: true,
        isImpersonating: false
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

  impersonate: async (targetUserId) => {
    console.log('Iniciando impersonação para:', targetUserId);
    try {
      // 1. Pede o hash ao backend
      const { token_hash } = await impersonateService(targetUserId);
      
      // 2. Faz backup do token atual (Admin)
      const currentToken = localStorage.getItem('financas-pessoais-auth-token');
      if (currentToken) {
        localStorage.setItem(ORIGINAL_TOKEN_KEY, currentToken);
      }
      
      // 3. Troca de identidade via verifyOtp
      const { data, error } = await supabaseBrowser.auth.verifyOtp({
        token_hash,
        type: 'magiclink'
      });
      
      if (error) throw error;
      if (!data.session) throw new Error('Falha ao obter sessão do usuário alvo');
      
      // 3.5 Sincroniza o token no apiClient (MUITO IMPORTANTE)
      apiClient.setAuthToken({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        user: data.session.user as any
      });
      
      // 4. Forçamos o recarregamento total
      await get().initAuth();
      
      console.log('Impersonação concluída com sucesso');
    } catch (error: any) {
      console.error('Erro ao impersonar:', error);
      // Limpa backup em caso de falha
      localStorage.removeItem(ORIGINAL_TOKEN_KEY);
      throw error;
    }
  },

  stopImpersonating: async () => {
    console.log('Encerrando impersonação...');
    const originalToken = localStorage.getItem(ORIGINAL_TOKEN_KEY);
    
    if (originalToken) {
      // 1. Restaura o token do Admin
      localStorage.setItem('financas-pessoais-auth-token', originalToken);
      localStorage.removeItem(ORIGINAL_TOKEN_KEY);
      
      // 1.5 Sincroniza o estado do Supabase Browser (opcional mas recomendado)
      try {
        const parsed = JSON.parse(originalToken);
        if (parsed.access_token && parsed.refresh_token) {
          await supabaseBrowser.auth.setSession({
            access_token: parsed.access_token,
            refresh_token: parsed.refresh_token
          });
        }
      } catch (e) {
        console.error('Erro ao restaurar sessão no supabaseBrowser:', e);
      }
      
      // 2. Recarrega os dados do Admin
      await get().initAuth();
      console.log('Retorno para conta Admin concluído');
    } else {
      console.warn('Nenhum token original encontrado para restaurar');
      await get().signOut();
    }
  },
}));
