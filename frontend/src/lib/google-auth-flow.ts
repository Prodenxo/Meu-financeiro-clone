import { apiClient } from '../services/apiClient';
import { startGoogleAuth, checkGoogleAuth } from './google-calendar';

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

/**
 * Verifica e aguarda token estar disponível no localStorage
 */
async function ensureTokenAvailable(maxAttempts: number = 5, delay: number = 200): Promise<string> {
  const TOKEN_STORAGE_KEY = 'financas-pessoais-auth-token';
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const tokenData = localStorage.getItem(TOKEN_STORAGE_KEY);
    
    if (tokenData) {
      try {
        const parsed = JSON.parse(tokenData);
        if (parsed.access_token) {
          console.log(`[ensureTokenAvailable] Token encontrado na tentativa ${attempt + 1}`);
          return parsed.access_token;
        }
      } catch (error) {
        console.warn(`[ensureTokenAvailable] Erro ao parsear token na tentativa ${attempt + 1}:`, error);
      }
    }
    
    if (attempt < maxAttempts - 1) {
      console.log(`[ensureTokenAvailable] Tentativa ${attempt + 1}/${maxAttempts}: Token não encontrado, aguardando ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Token não disponível após múltiplas tentativas');
}

/**
 * Inicia o fluxo de autenticação OAuth do Google Calendar
 * Redireciona o usuário para a página de autorização do Google
 */
export async function initiateGoogleAuthFlow(): Promise<void> {
  const { url, error } = await startGoogleAuth();
  
  if (error) {
    console.error('Erro ao iniciar autenticação:', error);
    throw new Error(error);
  }
  
  if (url) {
    // Redirecionar para a URL de autorização do Google
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
  console.log('[Google OAuth] ===== handleGoogleAuthCallback INICIADO =====');
  console.log('[Google OAuth] URL atual:', window.location.href);
  
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  const error = urlParams.get('error');

  console.log('[Google OAuth] Parâmetros da URL:', {
    hasCode: !!code,
    hasState: !!state,
    hasError: !!error,
    codePreview: code ? `${code.substring(0, 10)}...` : null,
    statePreview: state ? `${state.substring(0, 10)}...` : null,
    errorValue: error
  });

  if (error) {
    console.error('[Google OAuth] Erro na autorização do Google:', error);
    return { success: false, error: `Erro na autorização: ${error}` };
  }

  if (!code || !state) {
    console.error('[Google OAuth] Código ou state não encontrado na URL');
    return { success: false, error: 'Código de autorização não encontrado' };
  }

  console.log('[Google OAuth] Parâmetros OAuth válidos, continuando processamento...');

  try {
    // Verificar e aguardar token estar disponível com retry
    console.log('[Google OAuth] Verificando disponibilidade do token...');
    let accessToken: string;
    
    try {
      accessToken = await ensureTokenAvailable(5, 200);
      console.log('[Google OAuth] Token confirmado disponível');
    } catch (tokenError: unknown) {
      const errorMsg = 'Token de autenticação não encontrado após múltiplas tentativas. Por favor, faça login novamente.';
      console.error('[Google OAuth]', errorMsg, tokenError);
      return { success: false, error: errorMsg };
    }

    // Verificar token novamente antes de fazer a requisição (verificação final)
    const tokenData = localStorage.getItem('financas-pessoais-auth-token');
    if (!tokenData) {
      const errorMsg = 'Token não encontrado no momento da requisição. Por favor, faça login novamente.';
      console.error('[Google OAuth]', errorMsg);
      return { success: false, error: errorMsg };
    }

    let parsedToken;
    try {
      parsedToken = JSON.parse(tokenData);
      if (!parsedToken.access_token || parsedToken.access_token !== accessToken) {
        console.warn('[Google OAuth] Token mudou entre verificações, usando token mais recente');
        if (!parsedToken.access_token) {
          throw new Error('Token inválido');
        }
        accessToken = parsedToken.access_token;
      }
    } catch (parseError) {
      const errorMsg = 'Token de autenticação inválido. Por favor, faça login novamente.';
      console.error('[Google OAuth]', errorMsg, parseError);
      return { success: false, error: errorMsg };
    }

    // Logs detalhados do token antes de fazer a requisição
    const tokenPreview = accessToken 
      ? `${accessToken.substring(0, 20)}...${accessToken.substring(accessToken.length - 10)}`
      : 'null';
    
    console.log('[Google OAuth] Token verificado e válido, processando callback...', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!parsedToken.refresh_token,
      hasExpiresAt: !!parsedToken.expires_at,
      tokenPreview,
      code: code ? `${code.substring(0, 10)}...` : 'null',
      state: state ? `${state.substring(0, 10)}...` : 'null'
    });
    
    // Processar callback via Edge Function
    console.log('[Google OAuth] ===== INICIANDO REQUISIÇÃO PARA EDGE FUNCTION =====');
    console.log('[Google OAuth] Enviando requisição para /google-calendar/callback...');
    console.log('[Google OAuth] Payload:', { 
      hasCode: !!code, 
      hasState: !!state,
      codeLength: code?.length || 0,
      stateLength: state?.length || 0
    });
    
    let data: { success: boolean };
    
    try {
      // Tentar primeiro com apiClient
      console.log('[Google OAuth] Tentativa 1: Usando apiClient.post()...');
      console.log('[Google OAuth] Chamando apiClient.post("google-calendar", "/callback", {...})');
      data = await apiClient.post<{ success: boolean }>('/google-calendar/callback', { code, state });
      console.log('[Google OAuth] ✅ apiClient.post() executado com sucesso!');
      console.log('[Google OAuth] Resposta recebida:', data);
    } catch (apiClientError: unknown) {
      const errorMessage = getErrorMessage(apiClientError, 'Erro desconhecido no callback OAuth');
      console.error('[Google OAuth] ❌ apiClient.post() falhou:', {
        error: apiClientError,
        message: errorMessage,
        stack: apiClientError instanceof Error ? apiClientError.stack : undefined,
        name: apiClientError instanceof Error ? apiClientError.name : undefined
      });
      // Capturar TODOS os erros, não apenas de autorização
      console.log('[Google OAuth] Tipo de erro do apiClient:', {
        isAuthError: errorMessage.includes('Missing authorization header') || 
                     errorMessage.includes('401') ||
                     errorMessage.includes('Não autenticado'),
        errorMessage,
        errorType: typeof apiClientError
      });
      
      // Se apiClient falhar, apenas relançar para fluxo de erro
      console.error('[Google OAuth] Erro do apiClient, relançando erro:', apiClientError);
      throw apiClientError;
    }
    
    // Limpar parâmetros da URL
    window.history.replaceState({}, document.title, window.location.pathname);

    return { success: true };
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error, 'Erro ao processar callback');
    console.error('[Google OAuth] ===== ERRO CAPTURADO NO TRY-CATCH EXTERNO =====');
    console.error('[Google OAuth] Erro completo:', {
      error,
      message: errorMessage,
      name: error instanceof Error ? error.name : undefined,
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error
    });
    
    // Mensagens de erro mais específicas
    let userMessage = errorMessage;
    
    if (errorMessage.includes('Missing authorization header') || errorMessage.includes('401')) {
      userMessage = 'Erro de autenticação: Token não encontrado ou inválido. Por favor, faça login novamente.';
    } else if (errorMessage.includes('Não autenticado')) {
      userMessage = 'Você precisa estar logado para conectar o Google Calendar. Por favor, faça login novamente.';
    }
    
    console.error('[Google OAuth] Retornando erro:', userMessage);
    return { success: false, error: userMessage };
  }
}

/**
 * Verifica se o usuário está autenticado no Google Calendar
 */
export async function isGoogleAuthenticated(): Promise<boolean> {
  const { authenticated } = await checkGoogleAuth();
  return authenticated;
}
