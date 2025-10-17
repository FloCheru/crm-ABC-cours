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
  ProfesseurDocuments,
  ProfesseurDashboard,
  MesRendezVous,
  MesDocuments,
  MonProfil,
  MesChoix,
  MesCoupons,
  FichePaie,
  MaDeclaration,
  MesEleves,
  ProfessorLayout,
  AdminLayout,
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
import { RoleBasedProtectedRoute } from "./components/auth/ProtectedRoute";
import { Navbar } from "./components/layout/Navbar";
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
    <>
      <Navbar />
      <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />

          {/* Routes admin avec layout nested */}
          <Route
            path="/admin"
            element={
              <RoleBasedProtectedRoute allowedRoles={["admin"]}>
                <AdminLayout />
              </RoleBasedProtectedRoute>
            }
          >
            <Route path="coupons" element={<Admin />} />
            <Route path="coupons/create" element={<CouponSeriesCreate />} />
            <Route path="coupons/list" element={<CouponsList />} />
            <Route path="coupons/:seriesId/coupons" element={<SeriesDetails />} />
            <Route path="professeurs" element={<Professeurs />} />
            <Route path="professeur-details" element={<ProfesseurDetails />} />
            <Route path="professeur-documents" element={<ProfesseurDocuments />} />
            <Route path="prospects" element={<Prospects />} />
            <Route path="prospect-details" element={<ProspectDetails />} />
            <Route path="clients" element={<Clients />} />
            <Route path="client-details" element={<ClientDetails />} />
            <Route path="ndrs" element={<Ndrs />} />
            <Route path="ndr-details" element={<NdrDetails />} />
            <Route path="family-selection" element={<FamilySelection />} />
            <Route path="beneficiaries-subjects" element={<BeneficiariesSubjects />} />
            <Route path="pricing-payment" element={<PricingPayment />} />
            <Route path="pdf-preview" element={<PdfPreview />} />
            <Route path="template-preview" element={<TemplatePreview />} />
            <Route path="under-development" element={<UnderDevelopment />} />
          </Route>

          {/* Deprecated: Ancien dashboard professeur (à migrer) */}
          <Route
            path="/professeur/dashboard"
            element={
              <RoleBasedProtectedRoute allowedRoles={["professor"]}>
                <ProfesseurDashboard />
              </RoleBasedProtectedRoute>
            }
          />

          {/* Routes professeur avec layout nested */}
          <Route
            path="/professor"
            element={
              <RoleBasedProtectedRoute allowedRoles={["professor"]}>
                <ProfessorLayout />
              </RoleBasedProtectedRoute>
            }
          >
            <Route path="profil" element={<MonProfil />} />
            <Route path="choix" element={<MesChoix />} />
            <Route path="coupons" element={<MesCoupons />} />
            <Route path="paie" element={<FichePaie />} />
            <Route path="declaration" element={<MaDeclaration />} />
            <Route path="eleves" element={<MesEleves />} />
            <Route path="rendez-vous" element={<MesRendezVous />} />
            <Route path="documents" element={<MesDocuments />} />
          </Route>
        </Routes>
      </>
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
