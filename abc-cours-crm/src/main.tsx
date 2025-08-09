import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import {
  Admin,
  Login,
  CouponSeriesCreate,
  UnderDevelopment,
  PaymentNotes,
} from "./pages";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Basename dynamique selon l'environnement
const basename = import.meta.env.PROD ? "/crm-ABC-cours/" : "";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
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
          path="/under-development"
          element={
            <ProtectedRoute>
              <UnderDevelopment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/payment-notes"
          element={
            <ProtectedRoute>
              <PaymentNotes />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
