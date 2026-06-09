import { apiClient } from './apiClient';
import { normalizeMeiFromSession } from '../lib/meiAccess';
import {
  flagLoginPageForAccessExpired,
  flagLoginPageForLoginReason,
  isAccessExpiredAuthError,
  isProfileBlockedAuthError
} from '../utils/authAccessExpired';

export interface SignUpInput {
  email: string;
  password: string;
  phone?: string;
  displayName?: string;
  inviteToken?: string;
}

/**
 * Registra um novo usuário
 */
export async function signUp(input: SignUpInput) {
  const result = await apiClient.post<{
    user: any;
    userId: string;
    phone: string | null;
    displayName: string | null;
    session?: {
      access_token: string;
      refresh_token?: string;
      expires_at?: number;
    } | null;
  }>('/auth/signup', input);

  if (result.session?.access_token) {
    apiClient.setAuthToken({
      access_token: result.session.access_token,
      refresh_token: result.session.refresh_token,
      expires_at: result.session.expires_at,
      user: result.user
    });
  }

  return {
    user: result.user,
    userId: result.userId,
    phone: result.phone,
    displayName: result.displayName,
    hadSession: Boolean(result.session?.access_token)
  };
}

/**
 * Faz login do usuário
 */
export async function signIn(email: string, password: string) {
  try {
    console.log('Tentando fazer login...');
    const result = await apiClient.post<{
      user: any;
      userId: string | null;
      phone: string | null;
      displayName: string | null;
      role: 'superadmin' | 'admin' | 'usuario' | 'outsider';
      empresaId: string | null;
    mei?: boolean | null;
      session: any;
    }>('/auth/signin', { email, password });

    console.log('Resposta do login:', { 
      hasUser: !!result.user, 
      hasSession: !!result.session,
      hasAccessToken: !!result.session?.access_token 
    });

    // Salvar token no localStorage
    if (result.session?.access_token) {
      apiClient.setAuthToken({
        access_token: result.session.access_token,
        refresh_token: result.session.refresh_token,
        expires_at: result.session.expires_at,
        user: result.user,
      });
      console.log('Token salvo no localStorage');
    } else {
      console.warn('Sessão não contém access_token:', result.session);
    }

    return {
      user: result.user,
      userId: result.userId,
      phone: result.phone,
      displayName: result.displayName,
      role: result.role,
      empresaId: result.empresaId || null,
      mei: normalizeMeiFromSession(result.mei),
    };
  } catch (error: any) {
    console.error('Erro ao fazer login:', error);
    throw error;
  }
}

/**
 * Faz logout do usuário
 */
export async function signOut() {
  try {
    await apiClient.post('/auth/signout');
  } catch (error) {
    // Continuar mesmo se a chamada falhar
    console.error('Erro ao fazer logout no backend:', error);
  }
  // Sempre remover token local
  apiClient.clearAuthToken();
}

/**
 * Obtém a sessão atual
 */
export async function getSession() {
  try {
    // Verificar se há token no localStorage primeiro
    const tokenData = localStorage.getItem('financas-pessoais-auth-token');
    if (!tokenData) {
      return null;
    }

    const parsed = JSON.parse(tokenData);
    if (!parsed.access_token) {
      return null;
    }

    // Tentar verificar se o token ainda é válido
    const result = await apiClient.get<{ session: any }>('/auth/session');
    
    // Se houver sessão, atualizar token no localStorage
    if (result.session?.user) {
      // Atualizar dados do usuário, mantendo o token existente
      apiClient.setAuthToken({
        access_token: parsed.access_token,
        refresh_token: parsed.refresh_token,
        expires_at: parsed.expires_at,
        user: result.session.user,
      });
      
      return {
        user: result.session.user,
        access_token: parsed.access_token,
        refresh_token: parsed.refresh_token,
        expires_at: parsed.expires_at,
        role: result.session.role,
        empresaId: result.session.empresaId || null,
        mei: normalizeMeiFromSession(result.session.mei),
      };
    }
    
    return null;
  } catch (error) {
    if (isAccessExpiredAuthError(error)) {
      flagLoginPageForAccessExpired();
    } else if (isProfileBlockedAuthError(error)) {
      flagLoginPageForLoginReason('profile_blocked');
    }
    apiClient.clearAuthToken();
    return null;
  }
}

/**
 * Solicita reset de senha
 */
export async function resetPasswordForEmail(email: string) {
  await apiClient.post('/auth/reset-password', { email });
}

/**
 * Atualiza a senha do usuário
 */
export async function updatePassword(newPassword: string) {
  await apiClient.post('/auth/update-password', { newPassword });
}

/**
 * Atualiza o telefone do usuário
 */
export async function updatePhone(userId: string, phone: string) {
  const result = await apiClient.post<{ phone: string }>('/auth/update-phone', { phone });
  return result.phone;
}

/**
 * Atualiza o nome de exibição do usuário
 */
export async function updateDisplayName(displayName: string) {
  await apiClient.post('/auth/update-display-name', { displayName });
}

/**
 * Solicita um token de impersonação para acessar a conta de outro usuário
 */
export async function impersonate(userId: string) {
  const result = await apiClient.post<{
    email: string;
    token_hash: string;
    redirect_to: string;
  }>('/auth/impersonate', { userId });
  
  return result;
}
