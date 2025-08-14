import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import {
  Admin,
  Login,
  CouponSeriesCreate,
  Dashboard,
  SettlementCreate,
} from "./pages";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RefreshProvider } from "./contexts/RefreshContext";

// Basename dynamique selon l'environnement
const basename = import.meta.env.PROD ? "/crm-ABC-cours/" : "";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RefreshProvider>
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
        </Routes>
      </BrowserRouter>
    </RefreshProvider>
  </StrictMode>
);
