// Import necessary components and functions from react-router-dom.
import {
    createBrowserRouter,
    createRoutesFromElements,
    Route,
} from "react-router-dom";

import LoginAdminPage from "./pages/LoginAdmin";
import App from "./App"
import Auth2faPage from "./pages/Auth2faPage";
import AdminDashboard from "./components/AdminDashboard/AdminDashboard";


export const router = createBrowserRouter(
    createRoutesFromElements(
        <>
            <Route path="/" element={<App/>} />
            <Route path="/aossadmin" element={<LoginAdminPage />} />
            <Route path="/aossadmin/2fa" element={<Auth2faPage/>} />
            <Route path="/aossadmin/dashboard" element={<AdminDashboard/>} />
        </>
    )
);