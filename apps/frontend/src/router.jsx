import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import LandingPage from './pages/LandingPage';
import LoginAdminPage from './pages/LoginAdmin';
import UserLoginPage from './pages/UserLoginPage';
import Auth2faPage from './pages/Auth2faPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import SentyaTutorialPage from './pages/SentyaTutorialPage';
import WorkshopsView from './components/WorkshopsView/WorkshopsView';
import SessionsView from './components/SessionsView/SessionsView';
import WorkshopEnrollments from './components/WorkshopEnrollments/WorkshopEnrollments';
import Layout from './components/Layout/Layout';
import LoadingPage from './pages/LoadingPage';
import NotFoundPage from './pages/NotFoundPage';
import { useEffect } from 'react';
import DashboardRouter from './components/DashboardRouter/DashBoardRouter';

// 🆕 Componente global para inicialización de auth
const AuthProvider = ({ children }) => {
  const { checkAuthOnLoad, isInitializing } = useAuth();

  useEffect(() => {
    checkAuthOnLoad();
  }, [checkAuthOnLoad]);

  // Mientras inicializa, mostrar loading
  if (isInitializing) {
    return <LoadingPage message="Verificando autenticación..." />;
  }

  return children;
};

// Componente de protección para usuarios regulares
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isInitializing } = useAuth();
  
  if (isInitializing) {
    return <LoadingPage message="Cargando..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Componente de protección para admins
const AdminProtectedRoute = ({ children }) => {
  const { isAuthenticated, isInitializing, role } = useAuth();
  
  if (isInitializing) {
    return <LoadingPage message="Verificando permisos de administrador..." />;
  }
  
  if (!isAuthenticated || role !== 'administrator') {
    return <Navigate to="/aossadmin" replace />;
  }
  
  return children;
};

// Componente para rutas públicas (evita acceso si ya está logueado)
const PublicRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isInitializing, role } = useAuth();
  
  if (isInitializing) {
    return <LoadingPage message="Verificando autenticación..." />;
  }
  
  if (isAuthenticated) {
    // Si es admin y está en una ruta de admin, ir al dashboard admin
    if (role === 'administrator' && adminOnly) {
      return <Navigate to="/aossadmin/dashboard" replace />;
    }
    // Si no es admin y está en una ruta de usuario, ir al dashboard usuario
    else if (role !== 'administrator' && !adminOnly) {
      return <Navigate to="/dashboard" replace />;
    }
  }
  
  return children;
};

// Wrapper que incluye AuthProvider en todas las rutas
const RouteWrapper = ({ children }) => {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
};

const LayoutWrapper = ({ children }) => {
  return <Layout>{children}</Layout>;
};

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <RouteWrapper>
        <LandingPage />
      </RouteWrapper>
    )
  },
  
  {
    path: "/login",
    element: (
      <RouteWrapper>
        <PublicRoute>
          <UserLoginPage />
        </PublicRoute>
      </RouteWrapper>
    )
  },
  
  {
    path: "/dashboard",
    element: (
      <RouteWrapper>
        <ProtectedRoute>
          <LayoutWrapper>
          <DashboardRouter />
          </LayoutWrapper>
        </ProtectedRoute>
      </RouteWrapper>
    )
  },

            //RUTA PARA TALLERES
  {
  path: "/workshops",
  element: (
    <RouteWrapper>
      <ProtectedRoute>
        <LayoutWrapper>
          <WorkshopsView />
        </LayoutWrapper>
      </ProtectedRoute>
    </RouteWrapper>
  )
},
          //RUTA PARA SESSIONES DE TALLERES
{
  path: "/workshops/:workshopId/sessions",
  element: (
    <RouteWrapper>
      <ProtectedRoute>
        <LayoutWrapper>
          <SessionsView />
        </LayoutWrapper>
      </ProtectedRoute>
    </RouteWrapper>
  )
},
          //RUTA PARA INSCRIPCIONES
{
  path: "/workshops/:workshopId/enrollments",
  element: (
    <RouteWrapper>
      <ProtectedRoute>
        <LayoutWrapper>
          <WorkshopEnrollments />
        </LayoutWrapper>
      </ProtectedRoute>
    </RouteWrapper>
  )
},

  {
    path: "/tutorial",
    element: (
      <RouteWrapper>
        <SentyaTutorialPage />
      </RouteWrapper>
    )
  },
  
  // RUTAS DE ADMINISTRACIÓN
  {
    path: "/aossadmin",
    element: (
      <RouteWrapper>
        <PublicRoute adminOnly={true}>
          <LoginAdminPage />
        </PublicRoute>
      </RouteWrapper>
    )
  },
  
  {
    path: "/aossadmin/2fa",
    element: (
      <RouteWrapper>
        <Auth2faPage />
      </RouteWrapper>
    )
  },
  
  {
    path: "/aossadmin/dashboard",
    element: (
      <RouteWrapper>
        <AdminProtectedRoute>
          <AdminDashboardPage />
        </AdminProtectedRoute>
      </RouteWrapper>
    )
  },
  
  {
    path: "*",
    element: (
      <RouteWrapper>
        <NotFoundPage />
      </RouteWrapper>
    )
  }
]);
