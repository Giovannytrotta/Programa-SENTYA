import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { StoreProvider } from './store/useGlobalReducer';
import { router } from './router.jsx';
import Notifications from './components/Notifications/Notifications';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* ENVOLVER TODO EN EL CONTEXTO GLOBAL */}
    <StoreProvider>
      {/* Notificaciones globales */}
      <Notifications />
      {/* Router */}
      <RouterProvider router={router} />
    </StoreProvider>
  </React.StrictMode>
);
