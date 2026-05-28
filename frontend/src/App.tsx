import { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { hasRole } from './lib/roles';
import { canAccessMeiArea } from './lib/meiAccess';
import { useThemeStore } from './store/themeStore';
import Login from './pages/Login';
import LoginOnly from './pages/LoginOnly';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Privacidade from './pages/Privacidade';
import Termos from './pages/Termos';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Orcamentos from './pages/Orcamentos';
import Categorias from './pages/Categorias';
import Agenda from './pages/Agenda';
import Recorrencias from './pages/Recorrencias';
import Settings from './pages/Settings';
import ManageUsers from './pages/ManageUsers';
import AdminUserData from './pages/AdminUserData';
import QuickOnboarding from './pages/QuickOnboarding';
import GuidesMei from './pages/GuidesMei';
import MeiCatalogoClientes from './pages/MeiCatalogoClientes';
import MeiCatalogoServicosProdutos from './pages/MeiCatalogoServicosProdutos';
import Layout from './Layout/Layout';
import { handleGoogleAuthCallback } from './lib/google-auth-flow';
import {
  captureGoogleCalendarReturnFromUrl,
  consumeGoogleCalendarOAuthReturn,
} from './lib/google-calendar-oauth-return';
import { toast } from './lib/toast';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LoadingOverlay from './components/LoadingOverlay';

const buildRedirectPath = (pathname: string) => {
  const hash = window.location.hash;
  const search = window.location.search;
  return `${pathname}${hash || ''}${search || ''}`;
};

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

function hasOAuthParams(): boolean {
  const searchParams = new URLSearchParams(window.location.search);
  return searchParams.get('code') !== null && searchParams.get('state') !== null;
}

function PasswordRecoveryRedirect() {
  const location = useLocation();
  const navigate = useNavigate();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!hasRecoveryTokens()) {
      return;
    }

    if (location.pathname !== '/reset-password' && !hasRedirected.current) {
      hasRedirected.current = true;
      navigate(buildRedirectPath('/reset-password'), { replace: true });
    }
  }, [location, navigate]);

  return null;
}

function GoogleOAuthCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (!hasOAuthParams() || hasProcessed.current) {
      return;
    }
    hasProcessed.current = true;
    let isActive = true;

    const redirectToSettings = () => {
      if (!isActive) return;
      navigate('/settings', { replace: true });
    };

    const processCallback = async () => {
      try {
        const result = await handleGoogleAuthCallback();
        if (result.success) {
          toast.success('Google Agenda vinculada com sucesso!');
        } else if (result.error) {
          toast.error(result.error);
        }
      } finally {
        redirectToSettings();
      }
    };

    const safetyTimeout = window.setTimeout(redirectToSettings, 10000);
    void processCallback().finally(() => window.clearTimeout(safetyTimeout));

    return () => {
      isActive = false;
      window.clearTimeout(safetyTimeout);
    };
  }, [location.search, navigate]);

  return null;
}

function GoogleCalendarOAuthReturnHandler() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const location = useLocation();
  const handled = useRef(false);

  useEffect(() => {
    if (!user || handled.current) return;

    const status = consumeGoogleCalendarOAuthReturn();
    if (!status) return;

    handled.current = true;

    if (status === 'connected') {
      toast.success('Google Agenda vinculada com sucesso!');
      window.dispatchEvent(new CustomEvent('mf-google-calendar-oauth-done'));
      const onSettings =
        location.pathname.startsWith('/settings') ||
        location.pathname.startsWith('/configuracoes');
      if (!onSettings) {
        navigate('/settings', { replace: true });
      }
      return;
    }

    toast.error('Não foi possível vincular o Google Agenda. Tente novamente.');
  }, [user, navigate, location.pathname]);

  return null;
}

export function AppRoutes() {
  const location = useLocation();
  const { user, role, mei } = useAuthStore();
  const showMeiNav = canAccessMeiArea(role, mei);

  // Rotas legais: sempre públicas (evita catch-all → /login)
  const legalPath = location.pathname.replace(/\/$/, '') || '/';
  if (legalPath === '/privacidade') {
    return <Privacidade />;
  }
  if (legalPath === '/termos') {
    return <Termos />;
  }

  return (
    <>
      <PasswordRecoveryRedirect />
      <GoogleOAuthCallback />
      <GoogleCalendarOAuthReturnHandler />
      <Routes>
        {/* Rotas públicas sempre acessíveis */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/privacidade" element={<Privacidade />} />
        <Route path="/termos" element={<Termos />} />

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
                  <Route path="/orcamentos" element={<Orcamentos />} />
                  <Route path="/categorias" element={<Categorias />} />
                  <Route path="/agenda" element={<Agenda />} />
                  <Route path="/recorrencias" element={<Recorrencias />} />
                  <Route
                    path="/guias-mei"
                    element={
                      showMeiNav ? (
                        <GuidesMei />
                      ) : (
                        <Navigate to="/" replace state={{ accessBlock: 'mei-required' as const }} />
                      )
                    }
                  />
                  <Route
                    path="/mei-catalogo/clientes"
                    element={
                      showMeiNav ? (
                        <MeiCatalogoClientes />
                      ) : (
                        <Navigate to="/" replace state={{ accessBlock: 'mei-required' as const }} />
                      )
                    }
                  />
                  <Route
                    path="/mei-catalogo/servicos-produtos"
                    element={
                      showMeiNav ? (
                        <MeiCatalogoServicosProdutos />
                      ) : (
                        <Navigate to="/" replace state={{ accessBlock: 'mei-required' as const }} />
                      )
                    }
                  />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/configuracoes" element={<Settings />} />
                  <Route
                    path="/settings/users"
                    element={
                      hasRole(role, ['admin']) ? (
                        <ManageUsers />
                      ) : (
                        <Navigate
                          to="/settings"
                          replace
                          state={{ accessBlock: 'admin-settings-restricted' as const }}
                        />
                      )
                    }
                  />
                  <Route
                    path="/settings/quick-onboarding"
                    element={
                      hasRole(role, ['admin']) ? (
                        <QuickOnboarding />
                      ) : (
                        <Navigate
                          to="/settings"
                          replace
                          state={{ accessBlock: 'admin-settings-restricted' as const }}
                        />
                      )
                    }
                  />
                  <Route
                    path="/settings/usuarios-dados"
                    element={
                      hasRole(role, ['admin']) ? (
                        <AdminUserData />
                      ) : (
                        <Navigate
                          to="/settings"
                          replace
                          state={{ accessBlock: 'admin-settings-restricted' as const }}
                        />
                      )
                    }
                  />
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
  captureGoogleCalendarReturnFromUrl();

  const { sessionRestored, initAuth } = useAuthStore();
  const { isDarkMode } = useThemeStore();
  const initDone = useRef(false);

  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;
    void initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (hasRecoveryTokens() && window.location.pathname !== '/reset-password') {
      window.location.replace(buildRedirectPath('/reset-password'));
    }
  }, []);

  if (!sessionRestored) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50/80 px-4 dark:bg-slate-950/80">
        <div className="w-full max-w-md">
          <LoadingOverlay message="A restaurar a sessão…" className="min-h-[160px] shadow-sm dark:shadow-none" />
        </div>
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