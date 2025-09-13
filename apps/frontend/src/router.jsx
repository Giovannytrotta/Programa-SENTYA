// router.js
import {
    createBrowserRouter,
    createRoutesFromElements,
    Route,
    Navigate
} from "react-router-dom";
import { useAuth } from './hooks/useAuth';

// Componentes principales
import App from "./App";                                    // Landing page
import LoginAdminPage from "./pages/LoginAdmin";            // Login admin
import Auth2faPage from "./pages/Auth2faPage";             // 2FA admin  
import AdminDashboard from "./components/AdminDashboard/AdminDashboard"; // Dashboard admin

// Componente para proteger rutas de ADMIN
const AdminProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading, role } = useAuth();
    
    // Mientras verifica autenticación
    if (isLoading) {
        return (
            <div className="loading-container" style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                flexDirection: 'column',
                gap: '1rem'
            }}>
                <div className="spinner" style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid #e2e8f0',
                    borderTop: '4px solid #3b82f6',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }}></div>
                <p>Verificando autenticación...</p>
            </div>
        );
    }
    
    // Si no está autenticado, redirigir al login admin
    if (!isAuthenticated) {
        return <Navigate to="/aossadmin" replace />;
    }
    
    // Si está autenticado pero no es admin, denegar acceso
    if (role && role !== 'administrator') {
        return (
            <div className="access-denied" style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                flexDirection: 'column',
                gap: '1rem'
            }}>
                <h2>Acceso Denegado</h2>
                <p>No tienes permisos de administrador</p>
                <button 
                    onClick={() => window.location.href = '/'}
                    style={{
                        padding: '0.5rem 1rem',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                    }}
                >
                    Volver al inicio
                </button>
            </div>
        );
    }
    
    // Si es admin autenticado, mostrar contenido
    return children;
};

// Componente que previene que usuarios logueados vean login de nuevo
const PublicRoute = ({ children, redirectTo = "/" }) => {
    const { isAuthenticated, role } = useAuth();
    
    // Si ya está logueado, redirigir según rol
    if (isAuthenticated) {
        if (role === 'administrator') {
            return <Navigate to="/aossadmin/dashboard" replace />;
        } else {
            return <Navigate to={redirectTo} replace />;
        }
    }
    
    // Si no está logueado, mostrar la página
    return children;
};

export const router = createBrowserRouter(
    createRoutesFromElements(
        <>
            {/* ====== RUTAS PÚBLICAS (USUARIOS NORMALES) ====== */}
            
            {/* Landing page principal */}
            <Route path="/" element={<App />} />
            
            {/* Aquí podrías agregar más rutas públicas */}
            {/* <Route path="/about" element={<AboutPage />} /> */}
            {/* <Route path="/contact" element={<ContactPage />} /> */}
            {/* <Route path="/login" element={<UserLoginPage />} /> */}
            
            
            {/* ====== RUTAS DE ADMINISTRACIÓN ====== */}
            
            {/* Login de admin - solo accesible si NO está logueado como admin */}
            <Route 
                path="/aossadmin" 
                element={
                    <PublicRoute redirectTo="/aossadmin/dashboard">
                        <LoginAdminPage />
                    </PublicRoute>
                } 
            />
            
            {/* 2FA de admin - accesible durante el proceso de login */}
            <Route path="/aossadmin/2fa" element={<Auth2faPage />} />
            
            {/* Dashboard de admin - PROTEGIDO */}
            <Route 
                path="/aossadmin/dashboard" 
                element={
                    <AdminProtectedRoute>
                        <AdminDashboard />
                    </AdminProtectedRoute>
                } 
            />
            
            {/* Otras rutas de admin - PROTEGIDAS */}
            <Route 
                path="/aossadmin/users" 
                element={
                    <AdminProtectedRoute>
                        <div style={{ padding: '2rem', textAlign: 'center' }}>
                            <h2>Gestión de Usuarios</h2>
                            <p>Próximamente: Interface de gestión de usuarios</p>
                        </div>
                    </AdminProtectedRoute>
                } 
            />
            
            <Route 
                path="/aossadmin/settings" 
                element={
                    <AdminProtectedRoute>
                        <div style={{ padding: '2rem', textAlign: 'center' }}>
                            <h2>Configuración</h2>
                            <p>Próximamente: Panel de configuración</p>
                        </div>
                    </AdminProtectedRoute>
                } 
            />
            
            
            {/* ====== RUTAS DE ERROR ====== */}
            
            {/* 404 - Página no encontrada */}
            <Route 
                path="*" 
                element={
                    <div className="not-found" style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100vh',
                        flexDirection: 'column',
                        gap: '1rem'
                    }}>
                        <h1>404 - Página no encontrada</h1>
                        <a href="/" style={{
                            color: '#3b82f6',
                            textDecoration: 'none',
                            padding: '0.5rem 1rem',
                            border: '1px solid #3b82f6',
                            borderRadius: '6px'
                        }}>
                            Volver al inicio
                        </a>
                    </div>
                } 
            />
        </>
    )
);

// CSS adicional para animaciones
const styles = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

// Inyectar CSS si no existe
if (!document.querySelector('#router-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'router-styles';
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}