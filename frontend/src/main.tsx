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
  PdfPreview,
  Prospects,
  ProspectDetails,
  Clients,
  ClientDetails,
  Professeurs,
  ProfesseurDetails,
} from "./pages";
import {
  Ndrs,
  NdrDetails,
  FamilySelection,
  BeneficiariesSubjects,
  PricingPayment
} from "./pages/admin/ndrs";
// import { NDRCreationWizard } from "./pages/admin/dashboard/create/NDRCreationWizard"; // Supprimé
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
            path="/prospectDetails"
            element={
              <ProtectedRoute>
                <ProspectDetails />
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
            path="/clientDetails"
            element={
              <ProtectedRoute>
                <ClientDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/professeurs"
            element={
              <ProtectedRoute>
                <Professeurs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/professeurDetails"
            element={
              <ProtectedRoute>
                <ProfesseurDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ndrs"
            element={
              <ProtectedRoute>
                <Ndrs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ndrDetails"
            element={
              <ProtectedRoute>
                <NdrDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/family-selection"
            element={
              <ProtectedRoute>
                <FamilySelection />
              </ProtectedRoute>
            }
          />
          <Route
            path="/beneficiaries-subjects"
            element={
              <ProtectedRoute>
                <BeneficiariesSubjects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pricing-payment"
            element={
              <ProtectedRoute>
                <PricingPayment />
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
