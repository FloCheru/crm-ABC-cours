import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import {
  Admin,
  Login,
  UnderDevelopment,
  CouponSeriesCreate,
  Dashboard,
  SettlementCreate,
} from "./pages";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuthStore } from "./stores";
import { useEffect } from "react";

// Basename vide pour Vercel (domaine dédié)
const basename = "";

// Composant pour initialiser l'auth au démarrage
function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);
  
  return (
    <BrowserRouter basename={basename}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/admin/coupons"
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/coupons/create"
            element={
              <ProtectedRoute>
                <CouponSeriesCreate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard/create"
            element={
              <ProtectedRoute>
                <SettlementCreate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/under-development"
            element={
              <ProtectedRoute>
                <UnderDevelopment />
              </ProtectedRoute>
            }
          />
        </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
