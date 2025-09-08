import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider } from "react-router-dom";  
import { router } from "./routes";
import { StoreProvider } from './hooks/useGlobalReducer';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StoreProvider> 
    <RouterProvider router={router}>
    </RouterProvider>
    </StoreProvider>
  </StrictMode>,
)
