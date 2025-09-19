// router.jsx
import { createBrowserRouter } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import LandingPage from './pages/LandingPage';
import LoginAdminPage from './pages/LoginAdmin';
import Auth2faPage from './pages/Auth2faPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import SentyaTutorialPage from './pages/SentyaTutorialPage';


// Componente de protección para rutas autenticadas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.4) 0%, rgba(5, 150, 105, 0.3) 50%, rgba(249, 115, 22, 0.3) 100%)'
      }}>
        <div style={{
          background: 'rgba(248, 250, 252, 0.15)',
          backdropFilter: 'blur(24px)',
          borderRadius: '24px',
          border: '1px solid rgba(248, 250, 252, 0.25)',
          padding: '48px',
          textAlign: 'center',
          color: 'rgba(248, 250, 252, 0.9)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(248, 250, 252, 0.2)',
            borderTop: '3px solid rgba(37, 99, 235, 0.8)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>
            Cargando...
          </p>
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    // Redirigir al login si no está autenticado
    window.location.href = '/aossadmin';
    return null;
  }
  
  return children;
};

// Componente de protección para rutas públicas (ya autenticado)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.4) 0%, rgba(5, 150, 105, 0.3) 50%, rgba(249, 115, 22, 0.3) 100%)'
      }}>
        <div style={{
          background: 'rgba(248, 250, 252, 0.15)',
          backdropFilter: 'blur(24px)',
          borderRadius: '24px',
          border: '1px solid rgba(248, 250, 252, 0.25)',
          padding: '48px',
          textAlign: 'center',
          color: 'rgba(248, 250, 252, 0.9)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(248, 250, 252, 0.2)',
            borderTop: '3px solid rgba(37, 99, 235, 0.8)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>
            Verificando autenticación...
          </p>
        </div>
      </div>
    );
  }
  
  if (isAuthenticated) {
    // Redirigir al dashboard si ya está autenticado
    window.location.href = '/aossadmin/dashboard';
    return null;
  }
  
  return children;
};

export const router = createBrowserRouter([
  // Ruta raíz - Landing page público
  {
    path: "/",
    element: <LandingPage />
  },
  //Ruta de Tutorial
  {
    path: "/tutorial",
    element: <SentyaTutorialPage />
  },
  // Rutas de administración
  {
    path: "/aossadmin",
    element: (
      <PublicRoute>
        <LoginAdminPage />
      </PublicRoute>
    )
  },
  
  // Ruta para autenticación 2FA
  {
    path: "/aossadmin/2fa",
    element: <Auth2faPage />
  },
  
  // Dashboard protegido
  {
    path: "/aossadmin/dashboard",
    element: (
      <ProtectedRoute>
        <AdminDashboardPage />
      </ProtectedRoute>
    )
  },
  
  // Ruta 404 - Página no encontrada
  {
    path: "*",
    element: (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.4) 0%, rgba(5, 150, 105, 0.3) 50%, rgba(249, 115, 22, 0.3) 100%)',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
      }}>
        <div style={{
          background: 'rgba(248, 250, 252, 0.15)',
          backdropFilter: 'blur(24px)',
          borderRadius: '24px',
          border: '1px solid rgba(248, 250, 252, 0.25)',
          padding: '64px 48px',
          textAlign: 'center',
          maxWidth: '480px',
          margin: '20px'
        }}>
          <div style={{
            fontSize: '72px',
            fontWeight: '900',
            background: 'linear-gradient(135deg, #2563eb 0%, #059669 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '24px',
            lineHeight: 1
          }}>
            404
          </div>
          <h1 style={{
            color: 'rgba(248, 250, 252, 0.95)',
            fontSize: '1.5rem',
            fontWeight: '700',
            margin: '0 0 12px 0'
          }}>
            Página no encontrada
          </h1>
          <p style={{
            color: 'rgba(248, 250, 252, 0.7)',
            fontSize: '1rem',
            margin: '0 0 32px 0',
            lineHeight: 1.6
          }}>
            La página que estás buscando no existe o ha sido movida.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              padding: '16px 32px',
              background: 'linear-gradient(135deg, #2563eb 0%, #059669 100%)',
              border: 'none',
              borderRadius: '16px',
              color: 'white',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textDecoration: 'none',
              display: 'inline-block'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 28px rgba(37, 99, 235, 0.35)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }
]);