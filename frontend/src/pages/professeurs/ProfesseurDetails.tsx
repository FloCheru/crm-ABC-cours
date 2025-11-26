import { useNavigate, useParams } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { PageHeader } from "../../components";
import type {
  ProfessorProfile,
  EmploymentStatus,
  WeeklySchedule,
  TeachingSubject,
} from "../../types/professor";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { Label } from "../../components/ui/label";
import { Checkbox } from "../../components/ui/checkbox";
import type { RendezVous } from "../../types/rdv";
import rdvService from "../../services/rdvService";
import { professorService } from "../../services/professorService";
import { useAuthStore } from "../../stores";
import { FRENCH_DEPARTMENTS } from "../../constants/departments";
import { TRANSPORT_MODES } from "../../constants/transportModes";
import { AvailabilityForm } from "../../components/professor/AvailabilityForm";
import { SubjectLevelsSelector } from "../../components/professor/SubjectLevelsSelector";
import { subjectService } from "../../services/subjectService";
import type { Subject } from "../../types/subject";
import type { SchoolCategory } from "../../constants/schoolLevels";
import { Badge } from "../../components/ui/badge";
import {
  EMPLOYMENT_STATUS_OPTIONS,
  CURRENT_SITUATION_OPTIONS,
  getFilterOptionByValue,
} from "../../constants/professorFilters";
import { ProfessorProfileContent } from "../../components/professor/ProfessorProfileContent";
import { ProfessorCouponsContent } from "../../components/professor/ProfessorCouponsContent";
import { ProfessorAttestationsContent } from "../../components/professor/ProfessorAttestationsContent";
import { ProfessorElevesContent } from "../../components/professor/ProfessorElevesContent";

export const ProfesseurDetails: React.FC = () => {
  const navigate = useNavigate();
  const { professorId } = useParams<{ professorId: string }>();
  const [professor, setProfessor] = useState<ProfessorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setError] = useState<string>("");
  const [formData, setFormData] = useState<Partial<ProfessorProfile>>({});
  const [isSaving, setIsSaving] = useState(false);

  // État pour la navigation principale (navbar horizontale professeur)
  const [mainTab, setMainTab] = useState<
    "profil" | "coupons" | "attestations" | "eleves"
  >("profil");

  // États pour les rendez-vous
  const [rdvs, setRdvs] = useState<RendezVous[]>([]);
  const [isLoadingRdvs, setIsLoadingRdvs] = useState(false);

  // États pour les matières
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [teachingSubjects, setTeachingSubjects] = useState<TeachingSubject[]>(
    []
  );

  // Récupérer le rôle de l'utilisateur connecté
  const user = useAuthStore((state) => state.user);
  const currentUserRole = user?.role || "admin";

  useEffect(() => {
    if (professorId) {
      loadProfessorData();
      loadRdvs();
      loadSubjects();
    } else {
      setError("ID de professeur manquant");
      setIsLoading(false);
    }
  }, [professorId]);

  const loadProfessorData = async () => {
    try {
      setIsLoading(true);
      const professor = await professorService.getProfessorById(professorId!);
      setProfessor(professor);
      setFormData(professor);
      // Charger les matières du professeur
      setTeachingSubjects((professor as any).teachingSubjects || []);
    } catch (err) {
      console.error("Erreur lors du chargement du professeur:", err);
      setError("Impossible de charger les détails du professeur");
    } finally {
      setIsLoading(false);
    }
  };

  const loadSubjects = async () => {
    try {
      const subjects = await subjectService.getActiveSubjects();
      setAllSubjects(subjects);
    } catch (err) {
      console.error("Erreur lors du chargement des matières:", err);
    }
  };

  React.useEffect(() => {
    if (!professorId) {
      navigate("/admin/professeurs", { replace: true });
    }
  }, [professorId, navigate]);

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Appel réel à l'API pour mettre à jour le professeur
      const updatedProfessor = await professorService.updateProfessor(
        professorId!,
        formData
      );

      // Mettre à jour l'état local avec les données retournées par le serveur
      setProfessor(updatedProfessor as ProfessorProfile);
      setFormData(updatedProfessor as ProfessorProfile);
    } catch (err) {
      console.error("Erreur lors de la sauvegarde:", err);
      alert("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof ProfessorProfile, value: any) => {
    setFormData((prev: Partial<ProfessorProfile>) => ({
      ...prev,
      [field]: value,
    }));
  };

  const toggleDepartment = (code: string) => {
    const current = formData.availableDepartments || [];
    const updated = current.includes(code)
      ? current.filter((c) => c !== code)
      : [...current, code];
    handleInputChange("availableDepartments", updated);
  };

  const handleAvailabilityChange = (schedule: WeeklySchedule) => {
    handleInputChange("weeklyAvailability", schedule);
  };

  // Handlers pour les matières
  const isSubjectSelected = (subjectId: string): boolean => {
    return teachingSubjects.some((ts) => ts.subjectId === subjectId);
  };

  const getGradesForSubject = (subjectId: string): string[] => {
    return (
      teachingSubjects.find((ts) => ts.subjectId === subjectId)?.grades || []
    );
  };

  const handleToggleSubject = (subject: Subject) => {
    if (isSubjectSelected(subject._id)) {
      setTeachingSubjects((prev) =>
        prev.filter((ts) => ts.subjectId !== subject._id)
      );
    } else {
      setTeachingSubjects((prev) => [
        ...prev,
        {
          subjectId: subject._id,
          subjectName: subject.name,
          grades: [],
          levels: [],
        },
      ]);
    }
  };

  const handleGradesChange = (subjectId: string, grades: string[]) => {
    setTeachingSubjects((prev) =>
      prev.map((ts) =>
        ts.subjectId === subjectId
          ? { ...ts, grades, levels: deriveLevelsFromGrades(grades) }
          : ts
      )
    );
  };

  const deriveLevelsFromGrades = (grades: string[]): SchoolCategory[] => {
    const levels = new Set<SchoolCategory>();
    grades.forEach((grade) => {
      if (["CP", "CE1", "CE2", "CM1", "CM2"].includes(grade)) {
        levels.add("primaire");
      }
      if (["6ème", "5ème", "4ème", "3ème"].includes(grade)) {
        levels.add("college");
      }
      if (["Seconde", "Première", "Terminale"].includes(grade)) {
        levels.add("lycee");
      }
      if (["L1", "L2", "L3", "M1", "M2", "Doctorat", "Autre"].includes(grade)) {
        levels.add("superieur");
      }
    });
    return Array.from(levels);
  };

  const handleSaveSubjects = async () => {
    try {
      setIsSaving(true);
      await professorService.updateProfessorSubjects(
        professorId!,
        teachingSubjects
      );
    } catch (err) {
      console.error("Erreur lors de la sauvegarde des matières:", err);
      alert("Erreur lors de la sauvegarde des matières");
    } finally {
      setIsSaving(false);
    }
  };

  const loadRdvs = async () => {
    if (!professorId) return;

    try {
      setIsLoadingRdvs(true);
      const rdvsList = await rdvService.getRdvsByProfessor(professorId);
      setRdvs(rdvsList);
    } catch (err) {
      console.error("Erreur lors du chargement des RDV:", err);
    } finally {
      setIsLoadingRdvs(false);
    }
  };

  const handleDeleteRdv = async (rdvId: string) => {
    if (
      !window.confirm("Êtes-vous sûr de vouloir supprimer ce rendez-vous ?")
    ) {
      return;
    }

    try {
      await rdvService.deleteRdv(rdvId);
      loadRdvs();
    } catch (err) {
      console.error("Erreur lors de la suppression du RDV:", err);
      alert("Impossible de supprimer le rendez-vous");
    }
  };

  const canEditRdv = (rdv: RendezVous): boolean => {
    if (currentUserRole === "admin") return true;
    if (
      currentUserRole === "professor" &&
      rdv.entityType === "professor-student"
    )
      return true;
    return false;
  };

  const getRdvTypeLabel = (rdv: RendezVous): string => {
    switch (rdv.entityType) {
      case "admin-professor":
        return "Admin ↔ Prof";
      case "professor-student":
        return "Prof ↔ Élève";
      case "admin-family":
        return "Admin ↔ Famille";
      default:
        return "Autre";
    }
  };

  const getRdvPartnerName = (rdv: RendezVous): string => {
    if (rdv.entityType === "admin-professor") {
      return "Admin ABC";
    } else if (rdv.entityType === "professor-student") {
      return "Élève";
    }
    return "-";
  };

  const renderField = (
    label: string,
    value: string | undefined,
    isFullWidth = false
  ) => {
    // Déterminer le style selon le label
    let textStyle = "text-base text-gray-900";
    if (label === "Nom *") {
      textStyle = "text-base text-gray-900 uppercase font-medium";
    } else if (label === "Prénom *") {
      textStyle = "text-base text-gray-900 capitalize font-medium";
    }

    return (
      <div className={isFullWidth ? "col-span-2" : ""}>
        <div className="text-xs text-gray-500 mb-1">{label}</div>
        <div className={textStyle}>{value || "-"}</div>
      </div>
    );
  };

  const renderEditField = (
    label: string,
    field: keyof ProfessorProfile,
    type: "text" | "email" | "tel" | "date" | "select" = "text",
    options?: { value: string; label: string }[],
    isFullWidth = false
  ) => {
    const fieldValue = formData[field];
    return (
      <div className={isFullWidth ? "col-span-2" : ""}>
        <label className="text-xs text-gray-500 mb-1 block">{label}</label>
        {type === "select" ? (
          <select
            value={String(fieldValue || "")}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            {options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            value={String(fieldValue || "")}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        )}
      </div>
    );
  };

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
