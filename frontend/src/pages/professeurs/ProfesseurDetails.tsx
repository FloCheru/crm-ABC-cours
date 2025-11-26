import { useParams, useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { PageHeader } from "../../components";
import type { ProfessorProfile, TeachingSubject } from "../../types/professor";
import { professorService } from "../../services/professorService";
import { ProfessorProfileContent } from "../../components/professor/ProfessorProfileContent";
import { ProfessorCouponsContent } from "../../components/professor/ProfessorCouponsContent";
import { ProfessorAttestationsContent } from "../../components/professor/ProfessorAttestationsContent";
import { ProfessorElevesContent } from "../../components/professor/ProfessorElevesContent";

export const ProfesseurDetails: React.FC = () => {
  const navigate = useNavigate();
  const { professorId } = useParams<{ professorId: string }>();
  const [professor, setProfessor] = useState<ProfessorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [teachingSubjects, setTeachingSubjects] = useState<TeachingSubject[]>(
    []
  );

  // État pour la navigation principale (navbar horizontale professeur)
  const [mainTab, setMainTab] = useState<
    "profil" | "coupons" | "attestations" | "eleves"
  >("profil");

  useEffect(() => {
    if (professorId) {
      loadProfessorData();
    } else {
      setIsLoading(false);
    }
  }, [professorId]);

  const loadProfessorData = async () => {
    try {
      setIsLoading(true);
      const professor = await professorService.getProfessorById(professorId!);
      setProfessor(professor);
      setTeachingSubjects((professor as any).teachingSubjects || []);
    } catch (err) {
      console.error("Erreur lors du chargement du professeur:", err);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (!professorId) {
      navigate("/admin/professeurs", { replace: true });
    }
  }, [professorId, navigate]);

  if (isLoading) {
    return (
      <div>
        <PageHeader
          title="Chargement..."
          breadcrumb={[
            { label: "Professeurs", href: "/admin/professeurs" },
            { label: "Chargement..." },
          ]}
        />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-500">
            Chargement des détails du professeur...
          </div>
        </div>
      </div>
    );
  }

  if (!professorId || !professor) {
    return null;
  }

  return (
    <main className="bg-gray-50 min-h-screen">
      <PageHeader
        title={
          professor
            ? `Détails du Professeur - ${professor.lastName.toUpperCase()} ${professor.firstName
                .charAt(0)
                .toUpperCase()}${professor.firstName.slice(1).toLowerCase()}`
            : "Détails du Professeur"
        }
        breadcrumb={[
          { label: "Professeurs", href: "/admin/professeurs" },
          { label: "Détails" },
        ]}
        description={
          professor
            ? `Créé le ${new Date(professor.createdAt || "").toLocaleDateString(
                "fr-FR"
              )}${
                professor.updatedAt
                  ? ` • Modifié le ${new Date(
                      professor.updatedAt
                    ).toLocaleDateString("fr-FR")}`
                  : ""
              }`
            : undefined
        }
        backButton={{
          label: "Retour au tableau des professeurs",
          href: "/admin/professeurs",
        }}
      />

      {/* Navbar horizontale professeur */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 max-w-6xl">
          <nav className="flex gap-1">
            <button
              onClick={() => setMainTab("profil")}
              className={`px-6 py-4 text-sm font-medium transition-all ${
                mainTab === "profil"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 border-b-2 border-transparent hover:text-blue-600 hover:border-blue-200"
              }`}
            >
              Mon profil
            </button>
            <button
              onClick={() => setMainTab("coupons")}
              className={`px-6 py-4 text-sm font-medium transition-all ${
                mainTab === "coupons"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 border-b-2 border-transparent hover:text-blue-600 hover:border-blue-200"
              }`}
            >
              Mes coupons
            </button>
            <button
              onClick={() => setMainTab("attestations")}
              className={`px-6 py-4 text-sm font-medium transition-all ${
                mainTab === "attestations"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 border-b-2 border-transparent hover:text-blue-600 hover:border-blue-200"
              }`}
            >
              Mes Attestations
            </button>
            <button
              onClick={() => setMainTab("eleves")}
              className={`px-6 py-4 text-sm font-medium transition-all ${
                mainTab === "eleves"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 border-b-2 border-transparent hover:text-blue-600 hover:border-blue-200"
              }`}
            >
              Mes élèves
            </button>
          </nav>
        </div>
      </div>

      {/* Alerte RIB manquant */}
      {professor && (!professor.iban || !professor.employmentStatus) && (
        <div className="container mx-auto px-4 max-w-6xl mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <h4 className="font-semibold text-yellow-900 mb-1">
                  RIB à ajouter
                </h4>
                <p className="text-sm text-yellow-800">
                  Le professeur doit renseigner ses informations bancaires avant
                  toute saisie de coupon. Veuillez compléter l'onglet "Mon RIB"
                  ci-dessous.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section Mon profil */}
      {mainTab === "profil" && professorId && (
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <ProfessorProfileContent
            professorId={professorId}
            defaultTab="informations"
            teachingSubjects={teachingSubjects}
          />
        </div>
      )}

      {/* Section Mes coupons */}
      {mainTab === "coupons" && professorId && (
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <ProfessorCouponsContent
            professorId={professorId}
            iban={(professor as any)?.iban}
            employmentStatus={(professor as any)?.employmentStatus}
          />
        </div>
      )}

      {/* Section Mes Attestations */}
      {mainTab === "attestations" && professorId && (
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <ProfessorAttestationsContent professorId={professorId} />
        </div>
      )}

      {/* Section Mes élèves */}
      {mainTab === "eleves" && professorId && (
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <ProfessorElevesContent professorId={professorId} />
        </div>
      )}
    </main>
  );
};
