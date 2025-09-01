// Import necessary components and functions from react-router-dom.
import {
    createBrowserRouter,
    createRoutesFromElements,
    Route,
} from "react-router-dom";

import LoginAdminPage from "./pages/LoginAdmin";
import App from "./App"

export const router = createBrowserRouter(
    createRoutesFromElements(
        <>
            <Route path="/" element={<App/>} />
            <Route path="/aossadmin" element={<LoginAdminPage />} />
        </>
    )
);