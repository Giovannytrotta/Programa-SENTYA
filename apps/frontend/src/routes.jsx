// Import necessary components and functions from react-router-dom.

import {
    createBrowserRouter,
    createRoutesFromElements,
    Route,
} from "react-router-dom";
import { NotFound } from "./pages/404";
import App from "./App";

export const router = createBrowserRouter(
    createRoutesFromElements(
   
<Route path= "/" element={<App/>} errorElement={<NotFound />}/> 
       
    
    )
);