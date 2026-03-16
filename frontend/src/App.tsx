import { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { hasRole } from './lib/roles';
import { useThemeStore } from './store/themeStore';
import Login from './pages/Login';
import LoginOnly from './pages/LoginOnly';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Orcamentos from './pages/Orcamentos';
import Categorias from './pages/Categorias';
import Agenda from './pages/Agenda';
import Settings from './pages/Settings';
import ManageUsers from './pages/ManageUsers';
import AdminUserData from './pages/AdminUserData';
import GuidesMei from './pages/GuidesMei';
import Layout from './Layout/Layout';
import { handleGoogleAuthCallback } from './lib/google-auth-flow';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
        await handleGoogleAuthCallback();
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

export function AppRoutes() {
  const { user, role, mei } = useAuthStore();
  const canAccessMeiArea = role === 'superadmin'
    || role === 'admin'
    || (role === 'usuario' && mei !== false);

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
                  <Route path="/orcamentos" element={<Orcamentos />} />
                  <Route path="/categorias" element={<Categorias />} />
                  <Route path="/agenda" element={<Agenda />} />
                  <Route
                    path="/guias-mei"
                    element={canAccessMeiArea ? <GuidesMei /> : <Navigate to="/" replace />}
                  />
                  <Route path="/settings" element={<Settings />} />
                  <Route
                    path="/settings/users"
                    element={hasRole(role, ['admin']) ? <ManageUsers /> : <Navigate to="/settings" replace />}
                  />
                  <Route
                    path="/settings/usuarios-dados"
                    element={hasRole(role, ['admin']) ? <AdminUserData /> : <Navigate to="/settings" replace />}
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