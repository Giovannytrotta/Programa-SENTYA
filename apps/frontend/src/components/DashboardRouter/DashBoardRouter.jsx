// src/components/DashboardRouter.jsx
import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import UserDashboard from '../Dashboards/ClientDashboard/UserDashboard';

const DashboardRouter = () => {
  const { user } = useAuth();
  const role = user?.rol || user?.role;

  // Admin
  if (role === 'administrator') {
    return (
      <div style={{ padding: '40px', color: 'red', textAlign: 'center' }}>
        <h1>🔧 Dashboard de Administrador</h1>
        <p>Rol detectado: {role}</p>
        <p>CSS ID: {user?.css_id || 'N/A'}</p>
      </div>
    );
  }

  // Coordinador
  if (role === 'coordinator') {
    return (
      <div style={{ padding: '40px', color: 'red', textAlign: 'center' }}>
        <h1>📊 Dashboard de Coordinador</h1>
        <p>Rol detectado: {role}</p>
        <p>CSS ID: {user?.css_id || 'N/A'}</p>
      </div>
    );
  }

  // Profesional
  if (role === 'professional') {
    return (
      <div style={{ padding: '40px', color: 'red', textAlign: 'center' }}>
        <h1>🎨 Dashboard de Profesional</h1>
        <p>Rol detectado: {role}</p>
        <p>CSS ID: {user?.css_id || 'N/A'}</p>
      </div>
    );
  }

  // Técnico CSS
  if (role === 'css_technician') {
    return (
      <div style={{ padding: '40px', color: 'red', textAlign: 'center' }}>
        <h1>👁️ Dashboard de Técnico CSS</h1>
        <p>Rol detectado: {role}</p>
        <p>CSS ID: {user?.css_id || 'N/A'}</p>
      </div>
    );
  }

  // Cliente (default)
  return (
     <UserDashboard />
  );
};

export default DashboardRouter;