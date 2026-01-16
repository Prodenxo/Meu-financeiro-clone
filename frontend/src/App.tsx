import { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import Login from './pages/Login';
import LoginOnly from './pages/LoginOnly';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Categorias from './pages/Categorias';
import Agenda from './pages/Agenda';
import Settings from './pages/Settings';
import Layout from './Layout/Layout';
import { handleGoogleAuthCallback } from './lib/google-auth-flow';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Função auxiliar para detectar tokens de recuperação
function hasRecoveryTokens(): boolean {
  const hash = window.location.hash;
  const searchParams = new URLSearchParams(window.location.search);
  
  return (
    hash.includes('type=recovery') || 
    hash.includes('access_token') ||
    searchParams.get('type') === 'recovery' ||
    searchParams.get('token') !== null
  );
}

// Função auxiliar para detectar parâmetros OAuth do Google
function hasOAuthParams(): boolean {
  const searchParams = new URLSearchParams(window.location.search);
  return searchParams.get('code') !== null && searchParams.get('state') !== null;
}

// Função auxiliar para aguardar token estar disponível no localStorage
async function waitForToken(maxAttempts: number = 10, initialDelay: number = 100): Promise<string | null> {
  const TOKEN_STORAGE_KEY = 'financas-pessoais-auth-token';
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const tokenData = localStorage.getItem(TOKEN_STORAGE_KEY);
    
    if (tokenData) {
      try {
        const parsed = JSON.parse(tokenData);
        if (parsed.access_token) {
          console.log(`[waitForToken] Token encontrado na tentativa ${attempt + 1}`);
          return parsed.access_token;
        }
      } catch (error) {
        console.warn(`[waitForToken] Erro ao parsear token na tentativa ${attempt + 1}:`, error);
      }
    }
    
    // Delay exponencial: 100ms, 200ms, 400ms, etc.
    const delay = initialDelay * Math.pow(2, attempt);
    console.log(`[waitForToken] Tentativa ${attempt + 1}/${maxAttempts}: Token não encontrado, aguardando ${delay}ms...`);
    
    if (attempt < maxAttempts - 1) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  console.error(`[waitForToken] Token não encontrado após ${maxAttempts} tentativas`);
  return null;
}

// Componente para detectar e redirecionar tokens de recuperação (Camada 3)
function PasswordRecoveryRedirect() {
  const location = useLocation();
  const navigate = useNavigate();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Verificar se há tokens de recuperação na URL
    if (!hasRecoveryTokens()) {
      return;
    }

    // Se estiver na raiz ou em outra página e houver tokens de recuperação, redirecionar
    if (location.pathname !== '/reset-password' && !hasRedirected.current) {
      console.log('[Camada 3] Tokens de recuperação detectados, redirecionando para /reset-password');
      hasRedirected.current = true;
      
      const hash = window.location.hash;
      const search = window.location.search;
      // Preservar hash e query params ao redirecionar
      const redirectPath = `/reset-password${hash ? hash : ''}${search ? search : ''}`;
      navigate(redirectPath, { replace: true });
    }
  }, [location, navigate]);

  return null;
}

// Componente para processar callback OAuth do Google
function GoogleOAuthCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const hasProcessed = useRef(false);
  const isRestoring = useRef(false);
  const { user, sessionRestored, initAuth } = useAuthStore();
  const sessionRestoredRef = useRef(sessionRestored);
  
  // Atualizar ref quando sessionRestored mudar
  useEffect(() => {
    sessionRestoredRef.current = sessionRestored;
  }, [sessionRestored]);

  useEffect(() => {
    // Verificar se há parâmetros OAuth na URL primeiro
    if (!hasOAuthParams() || hasProcessed.current) {
      if (!hasOAuthParams()) {
        // Não há parâmetros OAuth, não fazer nada
        return;
      }
      if (hasProcessed.current) {
        console.log('[Google OAuth Callback Component] Callback já foi processado anteriormente');
        return;
      }
    }

    console.log('[Google OAuth Callback Component] ===== PARÂMETROS OAuth DETECTADOS =====');
    console.log('[Google OAuth Callback Component] URL atual:', window.location.href);
    console.log('[Google OAuth Callback Component] Parâmetros da URL:', window.location.search);
    console.log('[Google OAuth Callback Component] Estado atual:', {
      sessionRestored,
      hasUser: !!user,
      userEmail: user?.email
    });
    
    hasProcessed.current = true;

    // Função auxiliar para garantir redirecionamento
    const ensureRedirect = (path: string = '/settings') => {
      console.log('[Google OAuth Callback Component] Garantindo redirecionamento para:', path);
      try {
        // Limpar parâmetros da URL antes de redirecionar
        const cleanUrl = window.location.origin + path;
        window.history.replaceState({}, document.title, cleanUrl);
        
        // Tentar usar navigate primeiro
        navigate(path, { replace: true });
        
        // Fallback: usar window.location se navigate não funcionar após um tempo
        setTimeout(() => {
          if (window.location.pathname !== path && window.location.search.includes('code=')) {
            console.warn('[Google OAuth Callback Component] navigate não funcionou, usando window.location.href');
            window.location.href = path;
          }
        }, 500);
      } catch (redirectError) {
        console.error('[Google OAuth Callback Component] Erro ao redirecionar, usando window.location.href:', redirectError);
        window.location.href = path;
      }
    };

    const processCallback = async () => {
      try {
        console.log('[Google OAuth Callback Component] ===== INICIANDO PROCESSAMENTO DO CALLBACK =====');
        
        // Aguardar que a sessão seja restaurada se ainda não estiver
        if (!sessionRestoredRef.current) {
          console.log('[Google OAuth Callback Component] Sessão não restaurada, aguardando...');
          let attempts = 0;
          const maxAttempts = 20; // 2 segundos máximo
          
          while (!sessionRestoredRef.current && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
            // Re-verificar sessionRestored do store
            const currentState = useAuthStore.getState();
            sessionRestoredRef.current = currentState.sessionRestored;
            if (sessionRestoredRef.current) {
              console.log('[Google OAuth Callback Component] Sessão restaurada após aguardar');
              break;
            }
          }
        }

        // Tentar restaurar a sessão se ainda não estiver disponível
        if (isRestoring.current === false) {
          const tokenData = localStorage.getItem('financas-pessoais-auth-token');
          if (!tokenData) {
            console.log('[Google OAuth Callback Component] Token não encontrado, tentando restaurar sessão...');
            isRestoring.current = true;
            try {
              await initAuth();
              console.log('[Google OAuth Callback Component] Sessão restaurada via initAuth()');
            } catch (error) {
              console.error('[Google OAuth Callback Component] Erro ao restaurar sessão:', error);
            } finally {
              isRestoring.current = false;
            }
          }
        }

        // Aguardar token estar disponível com polling
        console.log('[Google OAuth Callback Component] Aguardando token estar disponível...');
        const token = await waitForToken(10, 100);
        
        if (!token) {
          console.error('[Google OAuth Callback Component] Token não disponível após todas as tentativas');
          console.log('[Google OAuth Callback Component] Redirecionando para /settings mesmo sem token...');
          ensureRedirect('/settings');
          return;
        }

        console.log('[Google OAuth Callback Component] Token confirmado disponível, processando callback...');
        console.log('[Google OAuth Callback Component] Chamando handleGoogleAuthCallback() agora...');
        
        let result;
        try {
          result = await handleGoogleAuthCallback();
          console.log('[Google OAuth Callback Component] handleGoogleAuthCallback() retornou:', result);
        } catch (callbackError: any) {
          console.error('[Google OAuth Callback Component] ❌ Erro ao chamar handleGoogleAuthCallback():', {
            error: callbackError,
            message: callbackError?.message,
            stack: callbackError?.stack,
            name: callbackError?.name
          });
          throw callbackError;
        }
        
        if (result.success) {
          console.log('[Google OAuth Callback Component] ✅ Callback processado com sucesso!');
          ensureRedirect('/settings');
        } else {
          console.error('[Google OAuth Callback Component] ❌ Erro ao processar callback:', result.error);
          // Redirecionar para settings mesmo em caso de erro para mostrar mensagem
          ensureRedirect('/settings');
        }
      } catch (error: any) {
        console.error('[Google OAuth Callback Component] ===== ERRO CAPTURADO NO processCallback =====');
        console.error('[Google OAuth Callback Component] Erro completo:', {
          error,
          message: error?.message,
          stack: error?.stack,
          name: error?.name,
          type: typeof error
        });
        // SEMPRE redirecionar, mesmo em caso de erro
        ensureRedirect('/settings');
      }
    };

    // Timeout de segurança: sempre redirecionar após 10 segundos, mesmo se houver erro
    const safetyTimeout = setTimeout(() => {
      if (hasProcessed.current && window.location.search.includes('code=')) {
        console.warn('[Google OAuth Callback Component] ⚠️ Timeout de segurança: redirecionando após 10 segundos');
        ensureRedirect('/settings');
      }
    }, 10000);

    processCallback().finally(() => {
      clearTimeout(safetyTimeout);
    });
  }, [location, navigate, user, sessionRestored, initAuth]);

  return null;
}

function AppRoutes() {
  const { user } = useAuthStore();

  return (
    <>
      <PasswordRecoveryRedirect />
      <GoogleOAuthCallback />
      <Routes>
        {/* Rotas públicas sempre acessíveis */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {!user ? (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="/login-only" element={<LoginOnly />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          <Route
            path="/*"
            element={
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/transacoes" element={<Transactions />} />
                  <Route path="/categorias" element={<Categorias />} />
                  <Route path="/agenda" element={<Agenda />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            }
          />
        )}
      </Routes>
    </>
  );
}

function App() {
  const { sessionRestored } = useAuthStore();
  const { isDarkMode } = useThemeStore();

  // Camada 2: Detecção de tokens ANTES do BrowserRouter renderizar
  useEffect(() => {
    if (hasRecoveryTokens() && window.location.pathname !== '/reset-password') {
      console.log('[Camada 2] Tokens de recuperação detectados antes do Router, redirecionando...');
      const hash = window.location.hash;
      const search = window.location.search;
      const redirectPath = `/reset-password${hash ? hash : ''}${search ? search : ''}`;
      // Usar window.location para garantir redirecionamento mesmo se Router não estiver pronto
      window.location.replace(redirectPath);
    }
  }, []);

  if (!sessionRestored) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div>Carregando...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <ToastContainer
        position="top-right"
        autoClose={3500}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnFocusLoss
        pauseOnHover
        draggable
        theme={isDarkMode ? 'dark' : 'light'}
      />
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;