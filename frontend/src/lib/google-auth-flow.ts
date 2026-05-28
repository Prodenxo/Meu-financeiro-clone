import { apiClient } from '../services/apiClient';
import { startGoogleAuth, checkGoogleAuth } from './google-calendar';
import { buildGoogleOAuthReturnTo } from './google-calendar-oauth-return';

const TOKEN_STORAGE_KEY = 'financas-pessoais-auth-token';

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

const getStoredAccessToken = (): string | null => {
  const tokenData = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!tokenData) return null;
  try {
    const parsed = JSON.parse(tokenData);
    return parsed.access_token || null;
  } catch {
    return null;
  }
};

const waitForAccessToken = async (attempts = 4, delayMs = 150): Promise<string | null> => {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const token = getStoredAccessToken();
    if (token) return token;
    if (attempt < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return null;
};

/**
 * Inicia o fluxo de autenticação OAuth do Google Calendar
 * Redireciona o usuário para a página de autorização do Google
 */
export async function initiateGoogleAuthFlow(): Promise<void> {
  const { url, error } = await startGoogleAuth(buildGoogleOAuthReturnTo());

  if (error) {
    throw new Error(error);
  }

  if (url) {
    window.location.href = url;
  } else {
    throw new Error('URL de autenticação não retornada');
  }
}

/**
 * Processa o callback OAuth após o usuário autorizar no Google
 * Esta função deve ser chamada na página de callback
 */
export async function handleGoogleAuthCallback(): Promise<{ success: boolean; error?: string }> {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  const error = urlParams.get('error');

  if (error) {
    return { success: false, error: `Erro na autorização: ${error}` };
  }

  if (!code || !state) {
    return { success: false, error: 'Código de autorização não encontrado' };
  }

  try {
    const token = await waitForAccessToken();
    if (!token) {
      return {
        success: false,
        error: 'Token de autenticação não disponível. Faça login novamente e tente conectar o Google.'
      };
    }

    await apiClient.post<{ success: boolean }>('/google-calendar/callback', { code, state });
    window.history.replaceState({}, document.title, window.location.pathname);
    return { success: true };
  } catch (callbackError: unknown) {
    return {
      success: false,
      error: getErrorMessage(callbackError, 'Erro ao processar callback do Google Calendar')
    };
  }
}

/**
 * Verifica se o usuário está autenticado no Google Calendar
 */
export async function isGoogleAuthenticated(): Promise<boolean> {
  const { authenticated } = await checkGoogleAuth();
  return authenticated;
}
