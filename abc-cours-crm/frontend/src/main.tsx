import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import {
  Admin,
  Login,
  UnderDevelopment,
  CouponSeriesCreate,
  CouponsList,
  SettlementCreate,
  SettlementDashboard,
  SettlementDetails,
  Prospects,
} from "./pages";
import { SeriesDetails } from "./pages/admin/coupons/SeriesDetails";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuthStore } from "./stores";
import { useAuthInitialization } from "./hooks/useAuthInitialization";
import { useEffect } from "react";

// Basename vide pour Vercel (domaine dédié)
const basename = "";

// Composant pour initialiser l'auth au démarrage
function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  
  // Initialiser l'authentification et la gestion automatique de déconnexion
  useAuthInitialization();
  
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
            path="/admin/coupons/list"
            element={
              <ProtectedRoute>
                <CouponsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/coupons/:seriesId/coupons"
            element={
              <ProtectedRoute>
                <SeriesDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/prospects"
            element={
              <ProtectedRoute>
                <Prospects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <SettlementDashboard />
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
            path="/admin/dashboard/:noteId"
            element={
              <ProtectedRoute>
                <SettlementDetails />
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
