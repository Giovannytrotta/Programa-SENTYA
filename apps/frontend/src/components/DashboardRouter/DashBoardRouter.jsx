// src/components/DashboardRouter.jsx
import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import UserDashboard from '../Dashboards/UserDashboard/UserDashboard';
import ProfessionalDashboard from '../Dashboards/ProfessionalDashboard/ProfessionalDashboard';
import AdminDashboardPanel from '../Dashboards/AdminDashboard/AdminDashboardPanel';
import CSSTechnicianDashboard from '../Dashboards/CSSTechnicianDashboard/CSSTechnicianDashboard';

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
    <CSSTechnicianDashboard />
    );
  }

  // Cliente (default)
  return (
     <UserDashboard />
  );
};

export default DashboardRouter;