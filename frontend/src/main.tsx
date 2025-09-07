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
  SettlementDashboard,
  SettlementDetails,
  PdfPreview,
  Prospects,
  ProspectDetails,
  Clients,
  ClientDetails,
} from "./pages";
import { AddStudent } from "./pages/families";
import { NDRCreationWizard } from "./pages/admin/dashboard/create/NDRCreationWizard";
import { TemplatePreview } from "./pages/admin/TemplatePreview";
import { SeriesDetails } from "./pages/admin/coupons/SeriesDetails";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuthStore } from "./stores";
import { useAuthInitialization } from "./hooks/useAuthInitialization";
import { useActivityReset } from "./hooks/useActivityReset";
import { useEffect } from "react";

// Basename vide pour Vercel (domaine dédié)
const basename = "";

// Composant interne qui utilise useLocation (dans le Router)
function AppRoutes() {
  // Étendre automatiquement la session à chaque navigation
  useActivityReset();
  
  return (
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
            path="/families/:familyId"
            element={
              <ProtectedRoute>
                <ProspectDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/families/:familyId/add-student"
            element={
              <ProtectedRoute>
                <AddStudent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients"
            element={
              <ProtectedRoute>
                <Clients />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients/:clientId"
            element={
              <ProtectedRoute>
                <ClientDetails />
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
            path="/admin/dashboard/create/wizard"
            element={
              <ProtectedRoute>
                <NDRCreationWizard />
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
            path="/admin/pdf-preview"
            element={
              <ProtectedRoute>
                <PdfPreview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/template-preview"
            element={
              <ProtectedRoute>
                <TemplatePreview />
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
  );
}

// Composant principal App
function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  
  // Initialiser l'authentification et la gestion automatique de déconnexion
  useAuthInitialization();
  
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);
  
  return (
    <BrowserRouter basename={basename}>
      <AppRoutes />
    </BrowserRouter>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
