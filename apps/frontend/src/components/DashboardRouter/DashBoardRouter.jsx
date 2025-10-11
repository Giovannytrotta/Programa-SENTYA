// src/components/DashboardRouter.jsx
import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import UserDashboard from '../Dashboards/UserDashboard/UserDashboard';
import ProfessionalDashboard from '../Dashboards/ProfessionalDashboard/ProfessionalDashboard';
import AdminDashboardPanel from '../Dashboards/AdminDashboard/AdminDashboardPanel';

const DashboardRouter = () => {
  const { user } = useAuth();
  const role = user?.rol || user?.role;

  // Admin
  if (role === 'administrator') {
    return (
      <AdminDashboardPanel />
    );
  }

  // Coordinador
  if (role === 'coordinator') {
    return (
      <AdminDashboardPanel />
    );
  }

  // Profesional
  if (role === 'professional') {
    return (
      <ProfessionalDashboard />
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