// apps/frontend/src/utils/navConfig.js

import { 
  Home, 
  Users, 
  BookOpen,  
  Building2, 
  BarChart3, 
  ClipboardCheck,
  Calendar,
  GraduationCap,
  BookAudio
} from 'lucide-react';

export const getNavLinks = (role) => {
  const links = {
    administrator: [
      { path: '/dashboard', icon: Home, label: 'Panel Admin' },
      { path: '/users', icon: Users, label: 'Usuarios' },
      { path: '/workshops', icon: BookOpen, label: 'Talleres' }, // ← NUEVO
      { path: '/css', icon: Building2, label: 'Centros' },
      { path: '/reports', icon: BarChart3, label: 'Reportes' }
    ],
    coordinator: [
      { path: '/dashboard', icon: Home, label: 'Inicio' },
      { path: '/workshops', icon: BookOpen, label: 'Talleres' }, // ← NUEVO
      { path: '/users', icon: Users, label: 'Usuarios' },
      { path: '/css', icon: Building2, label: 'Centros' },
      { path: '/reports', icon: BarChart3, label: 'Reportes' }
    ],
    professional: [
      { path: '/dashboard', icon: Home, label: 'Inicio' },
      { path: '/my-workshops', icon: GraduationCap, label: 'Mis Talleres' },
      { path: '/attendance', icon: ClipboardCheck, label: 'Asistencias' },
      { path: '/schedule', icon: Calendar, label: 'Horarios' }
    ],
    client: [
      { path: '/dashboard', icon: Home, label: 'Inicio' },
      { path: '/workshops', icon: BookOpen, label: 'Talleres' },
      { path: '/my-workshops', icon: GraduationCap, label: 'Mis Talleres' }
    ],
    css_technician: [
      { path: '/dashboard', icon: Home, label: 'Inicio' },
      { path: '/workshops', icon: BookOpen, label: 'Ver Talleres' }, // ← NUEVO
      { path: '/css', icon: Building2, label: 'Centros' },
      { path: '/reports', icon: BarChart3, label: 'Reportes' }
    ]
  };
  
  return links[role] || links.client;
};