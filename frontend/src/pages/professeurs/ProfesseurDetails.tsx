import { useNavigate, useParams } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { PageHeader } from "../../components";
import type { ProfessorProfile, EmploymentStatus, WeeklySchedule, TeachingSubject } from "../../types/professor";
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
  getFilterOptionByValue
} from "../../constants/professorFilters";

export const ProfesseurDetails: React.FC = () => {
  const navigate = useNavigate();
  const { professorId } = useParams<{ professorId: string }>();
  const [professor, setProfessor] = useState<ProfessorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setError] = useState<string>("");
  const [formData, setFormData] = useState<Partial<ProfessorProfile>>({});
  const [isSaving, setIsSaving] = useState(false);

  // État pour la navigation principale (navbar horizontale professeur)
  const [mainTab, setMainTab] = useState<'profil' | 'coupons' | 'attestations' | 'eleves'>('profil');

  // États pour les rendez-vous
  const [rdvs, setRdvs] = useState<RendezVous[]>([]);
  const [isLoadingRdvs, setIsLoadingRdvs] = useState(false);

  // États pour les matières
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [teachingSubjects, setTeachingSubjects] = useState<TeachingSubject[]>([]);

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
    setFormData((prev: Partial<ProfessorProfile>) => ({ ...prev, [field]: value }));
  };

  const toggleDepartment = (code: string) => {
    const current = formData.availableDepartments || [];
    const updated = current.includes(code)
      ? current.filter((c) => c !== code)
      : [...current, code];
    handleInputChange('availableDepartments', updated);
  };

  const handleAvailabilityChange = (schedule: WeeklySchedule) => {
    handleInputChange('weeklyAvailability', schedule);
  };

  // Handlers pour les matières
  const isSubjectSelected = (subjectId: string): boolean => {
    return teachingSubjects.some(ts => ts.subjectId === subjectId);
  };

  const getGradesForSubject = (subjectId: string): string[] => {
    return teachingSubjects.find(ts => ts.subjectId === subjectId)?.grades || [];
  };

  const handleToggleSubject = (subject: Subject) => {
    if (isSubjectSelected(subject._id)) {
      setTeachingSubjects(prev => prev.filter(ts => ts.subjectId !== subject._id));
    } else {
      setTeachingSubjects(prev => [
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
    setTeachingSubjects(prev =>
      prev.map(ts =>
        ts.subjectId === subjectId
          ? { ...ts, grades, levels: deriveLevelsFromGrades(grades) }
          : ts
      )
    );
  };

  const deriveLevelsFromGrades = (grades: string[]): SchoolCategory[] => {
    const levels = new Set<SchoolCategory>();
    grades.forEach(grade => {
      if (['CP', 'CE1', 'CE2', 'CM1', 'CM2'].includes(grade)) {
        levels.add('primaire');
      }
      if (['6ème', '5ème', '4ème', '3ème'].includes(grade)) {
        levels.add('college');
      }
      if (['Seconde', 'Première', 'Terminale'].includes(grade)) {
        levels.add('lycee');
      }
      if (['L1', 'L2', 'L3', 'M1', 'M2', 'Doctorat', 'Autre'].includes(grade)) {
        levels.add('superieur');
      }
    });
    return Array.from(levels);
  };

  const handleSaveSubjects = async () => {
    try {
      setIsSaving(true);
      await professorService.updateProfessorSubjects(professorId!, teachingSubjects);
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
    type: 'text' | 'email' | 'tel' | 'date' | 'select' = 'text',
    options?: { value: string; label: string }[],
    isFullWidth = false
  ) => {
    const fieldValue = formData[field];
    return (
      <div className={isFullWidth ? 'col-span-2' : ''}>
        <label className="text-xs text-gray-500 mb-1 block">{label}</label>
        {type === 'select' ? (
          <select
            value={String(fieldValue || '')}
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
            value={String(fieldValue || '')}
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
            ? `Détails du Professeur - ${professor.lastName.toUpperCase()} ${professor.firstName.charAt(0).toUpperCase()}${professor.firstName.slice(1).toLowerCase()}`
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
              onClick={() => setMainTab('profil')}
              className={`px-6 py-4 text-sm font-medium transition-all ${
                mainTab === 'profil'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 border-b-2 border-transparent hover:text-blue-600 hover:border-blue-200'
              }`}
            >
              Mon profil
            </button>
            <button
              onClick={() => setMainTab('coupons')}
              className={`px-6 py-4 text-sm font-medium transition-all ${
                mainTab === 'coupons'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 border-b-2 border-transparent hover:text-blue-600 hover:border-blue-200'
              }`}
            >
              Mes coupons
            </button>
            <button
              onClick={() => setMainTab('attestations')}
              className={`px-6 py-4 text-sm font-medium transition-all ${
                mainTab === 'attestations'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 border-b-2 border-transparent hover:text-blue-600 hover:border-blue-200'
              }`}
            >
              Mes Attestations
            </button>
            <button
              onClick={() => setMainTab('eleves')}
              className={`px-6 py-4 text-sm font-medium transition-all ${
                mainTab === 'eleves'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 border-b-2 border-transparent hover:text-blue-600 hover:border-blue-200'
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
                  Le professeur doit renseigner ses informations bancaires avant toute saisie de coupon.
                  Veuillez compléter l'onglet "Mon RIB" ci-dessous.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section Mon profil */}
      {mainTab === 'profil' && (
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <Tabs defaultValue="identite" className="w-full">
            <TabsList className="bg-transparent border-b border-gray-200 rounded-none p-0 h-auto w-full justify-start">
            <TabsTrigger
              value="identite"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3"
            >
              Identité
            </TabsTrigger>
            <TabsTrigger
              value="coordonnees"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3"
            >
              Coordonnées
            </TabsTrigger>
            <TabsTrigger
              value="rib"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3"
            >
              Mon RIB
            </TabsTrigger>
            <TabsTrigger
              value="statut"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3"
            >
              Statut
            </TabsTrigger>
            <TabsTrigger
              value="deplacements"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3"
            >
              Déplacements
            </TabsTrigger>
            <TabsTrigger
              value="disponibilites"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3"
            >
              Disponibilités
            </TabsTrigger>
            <TabsTrigger
              value="choix"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3"
            >
              Choix
            </TabsTrigger>
            <TabsTrigger
              value="rdv"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3"
            >
              Rendez-vous
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Identité */}
          <TabsContent value="identite" className="mt-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Identité</h3>
                <p className="text-sm text-gray-500">
                  Informations personnelles du professeur
                </p>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                {renderEditField('Genre *', 'gender', 'select', [
                  { value: 'M.', label: 'M.' },
                  { value: 'Mme', label: 'Mme' },
                ])}
                {renderEditField('Prénom *', 'firstName')}
                {renderEditField('Nom *', 'lastName')}
                {renderEditField('Nom de naissance (si différent)', 'birthName')}
                {renderEditField('Date de naissance *', 'birthDate', 'date')}
                {renderEditField('N° de sécurité sociale', 'socialSecurityNumber')}
                {renderEditField('Pays de naissance', 'birthCountry', 'text', undefined, true)}
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? 'Enregistrement...' : 'Sauvegarder'}
                </button>
              </div>
            </div>
          </TabsContent>

          {/* Tab 2: Coordonnées */}
          <TabsContent value="coordonnees" className="mt-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Coordonnées</h3>
                <p className="text-sm text-gray-500">
                  Informations de contact et adresse
                </p>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                {renderEditField('Email *', 'email', 'email')}
                {renderEditField('Tél principal *', 'phone', 'tel')}
                {renderEditField('Tél secondaire', 'secondaryPhone', 'tel')}
                {renderEditField('Code postal *', 'postalCode')}
                {renderEditField('Adresse', 'primaryAddress.street', 'text', undefined, true)}
                {renderEditField('Complément d\'adresse', 'primaryAddress.complement', 'text', undefined, true)}
                {renderEditField('Commune', 'primaryAddress.city')}
                {renderEditField('Commune INSEE', 'primaryAddress.inseeCode')}
                {renderEditField('Bureau distributeur', 'primaryAddress.distributionOffice', 'text', undefined, true)}
                {renderEditField('Déplacement', 'transportMode', 'select', [
                  { value: '', label: 'Sélectionner...' },
                  ...TRANSPORT_MODES
                ])}
                {renderEditField('Cours', 'courseLocation', 'select', [
                  { value: '', label: 'Sélectionner...' },
                  { value: 'domicile', label: 'À domicile' },
                  { value: 'visio', label: 'En visio' },
                ])}
                {renderEditField('Adresse secondaire', 'secondaryAddress.street', 'text', undefined, true)}
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? 'Enregistrement...' : 'Sauvegarder'}
                </button>
              </div>
            </div>
          </TabsContent>

          {/* Tab 3: Mon RIB */}
          <TabsContent value="rib" className="mt-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Mon RIB</h3>
                <p className="text-sm text-gray-500">
                  Informations bancaires et statut professionnel
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    Statut professionnel *
                  </label>
                  <select
                    value={formData.employmentStatus || ''}
                    onChange={(e) =>
                      handleInputChange('employmentStatus', e.target.value as EmploymentStatus)
                    }
                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="salarie">Salarié</option>
                    <option value="auto-entrepreneur">Auto-entrepreneur</option>
                  </select>
                </div>

                {formData.employmentStatus === 'auto-entrepreneur' && (
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                      SIRET * (14 chiffres)
                    </label>
                    <input
                      type="text"
                      value={formData.siret || ''}
                      onChange={(e) => handleInputChange('siret', e.target.value)}
                      pattern="[0-9]{14}"
                      title="14 chiffres requis"
                      maxLength={14}
                      className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="12345678901234"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    Nom de la banque
                  </label>
                  <input
                    type="text"
                    value={formData.bankName || ''}
                    onChange={(e) => handleInputChange('bankName', e.target.value)}
                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Ex: Crédit Agricole"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    IBAN * (27 caractères pour la France)
                  </label>
                  <input
                    type="text"
                    value={formData.iban || ''}
                    onChange={(e) => handleInputChange('iban', e.target.value.toUpperCase())}
                    pattern="FR[0-9]{25}"
                    title="Format IBAN français: FR suivi de 25 chiffres"
                    maxLength={27}
                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
                    placeholder="FR7612345678901234567890123"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    BIC/SWIFT (8 ou 11 caractères)
                  </label>
                  <input
                    type="text"
                    value={formData.bic || ''}
                    onChange={(e) => handleInputChange('bic', e.target.value.toUpperCase())}
                    pattern="[A-Z]{6}[A-Z0-9]{2,5}"
                    title="Format BIC: 8 ou 11 caractères alphanumériques"
                    maxLength={11}
                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
                    placeholder="AGRIFRPP"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? 'Enregistrement...' : 'Sauvegarder'}
                </button>
              </div>
            </div>
          </TabsContent>

          {/* Tab 4: Statut */}
          <TabsContent value="statut" className="mt-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Statut</h3>
                <p className="text-sm text-gray-500">
                  Informations sur le statut professionnel et administratif
                </p>
              </div>

              <div className="space-y-6">
                {/* Encart 1: Statut d'emploi */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <label className="text-sm font-medium text-gray-900 mb-3 block">
                    Statut d'emploi
                  </label>
                  <select
                    value={formData.employmentStatus || ''}
                    onChange={(e) =>
                      handleInputChange('employmentStatus', e.target.value as EmploymentStatus)
                    }
                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="">Sélectionner...</option>
                    {EMPLOYMENT_STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Encart 2: Statut (active/inactive/pending/suspended) */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <label className="text-sm font-medium text-gray-900 mb-3 block">
                    Statut du professeur
                  </label>
                  <select
                    value={formData.status || 'pending'}
                    onChange={(e) =>
                      handleInputChange('status', e.target.value)
                    }
                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                    <option value="pending">En attente</option>
                    <option value="suspended">Suspendu</option>
                  </select>
                </div>

                {/* Encart 3: Situation professionnelle */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <label className="text-sm font-medium text-gray-900 mb-3 block">
                    Situation professionnelle
                  </label>
                  <select
                    value={formData.currentSituation || ''}
                    onChange={(e) =>
                      handleInputChange('currentSituation', e.target.value)
                    }
                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="">Sélectionner...</option>
                    {CURRENT_SITUATION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? 'Enregistrement...' : 'Sauvegarder'}
                </button>
              </div>
            </div>
          </TabsContent>

          {/* Tab 5: Déplacements */}
          <TabsContent value="deplacements" className="mt-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Déplacements</h3>
                <p className="text-sm text-gray-500">
                  Départements où le professeur peut se déplacer pour donner des cours
                </p>
              </div>

              <div className="grid grid-flow-col grid-rows-[repeat(101,minmax(0,1fr))] sm:grid-rows-[repeat(51,minmax(0,1fr))] lg:grid-rows-[repeat(34,minmax(0,1fr))] gap-3 auto-cols-fr">
                {FRENCH_DEPARTMENTS.map((dept) => (
                  <div key={dept.code} className="flex items-center space-x-2">
                    <Checkbox
                      id={`dept-${dept.code}`}
                      checked={formData.availableDepartments?.includes(dept.code) || false}
                      onCheckedChange={() => toggleDepartment(dept.code)}
                    />
                    <Label
                      htmlFor={`dept-${dept.code}`}
                      className="text-sm cursor-pointer"
                    >
                      {dept.code} - {dept.name}
                    </Label>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? 'Enregistrement...' : 'Sauvegarder'}
                </button>
              </div>
            </div>
          </TabsContent>

          {/* Tab 6: Disponibilités */}
          <TabsContent value="disponibilites" className="mt-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Disponibilités</h3>
                <p className="text-sm text-gray-500">
                  Créneaux horaires disponibles dans la semaine
                </p>
              </div>

              <AvailabilityForm
                value={formData.weeklyAvailability || {}}
                onChange={handleAvailabilityChange}
              />

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? 'Enregistrement...' : 'Sauvegarder'}
                </button>
              </div>
            </div>
          </TabsContent>

          {/* Tab 7: Choix */}
          <TabsContent value="choix" className="mt-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Matières enseignées</h3>
                <p className="text-sm text-gray-500">
                  Matières et niveaux scolaires enseignés par le professeur
                </p>
              </div>

              {teachingSubjects.length === 0 && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Sélectionnez au moins une matière avec ses niveaux
                  </p>
                </div>
              )}

              {teachingSubjects.filter(ts => ts.grades.length === 0).length > 0 && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    {teachingSubjects.filter(ts => ts.grades.length === 0).length} matière(s) sélectionnée(s) sans niveaux.
                    Veuillez sélectionner au moins un niveau par matière.
                  </p>
                </div>
              )}

              <div className="space-y-4">
                {allSubjects.map(subject => {
                  const isSelected = isSubjectSelected(subject._id);
                  const selectedGrades = getGradesForSubject(subject._id);

                  return (
                    <div
                      key={subject._id}
                      className={`border rounded-lg p-4 transition-colors ${
                        isSelected ? 'border-blue-600 bg-blue-50' : 'border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <Checkbox
                          id={`subject-${subject._id}`}
                          checked={isSelected}
                          onCheckedChange={() => handleToggleSubject(subject)}
                        />
                        <Label
                          htmlFor={`subject-${subject._id}`}
                          className="text-base font-medium cursor-pointer flex-1"
                        >
                          {subject.name}
                        </Label>
                        {isSelected && selectedGrades.length > 0 && (
                          <Badge variant="secondary">{selectedGrades.length} niveau(x)</Badge>
                        )}
                      </div>

                      {isSelected && (
                        <SubjectLevelsSelector
                          selectedGrades={selectedGrades}
                          onChange={grades => handleGradesChange(subject._id, grades)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveSubjects}
                  disabled={isSaving || teachingSubjects.some(ts => ts.grades.length === 0)}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? 'Enregistrement...' : 'Sauvegarder'}
                </button>
              </div>
            </div>
          </TabsContent>

          {/* Tab 8: Rendez-vous */}
          <TabsContent value="rdv" className="mt-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Rendez-vous
                  </h3>
                  <p className="text-sm text-gray-500">
                    Tous les rendez-vous du professeur
                  </p>
                </div>
                {currentUserRole === "admin" && (
                  <button
                    onClick={() => console.log('TODO: implement RDV modal')}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 flex items-center gap-2"
                  >
                    + Ajouter un rendez-vous
                  </button>
                )}
              </div>

              {isLoadingRdvs ? (
                <div className="text-center py-8 text-gray-500">
                  Chargement des rendez-vous...
                </div>
              ) : rdvs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Aucun rendez-vous pour ce professeur
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Heure
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type RDV
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Avec
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Statut
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Notes
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {rdvs.map((rdv) => (
                        <tr key={rdv._id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(rdv.date).toLocaleDateString("fr-FR")}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {rdv.time}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {getRdvTypeLabel(rdv)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {getRdvPartnerName(rdv)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                rdv.status === "planifie"
                                  ? "bg-blue-100 text-blue-800"
                                  : rdv.status === "realise"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {rdv.status === "planifie"
                                ? "Planifié"
                                : rdv.status === "realise"
                                ? "Réalisé"
                                : "Annulé"}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900 max-w-xs truncate">
                            {rdv.notes || "-"}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            <div className="flex gap-2">
                              {canEditRdv(rdv) ? (
                                <>
                                  <button
                                    onClick={() => console.log('TODO: implement edit RDV', rdv)}
                                    className="text-blue-600 hover:text-blue-900"
                                    title="Modifier"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={() => handleDeleteRdv(rdv._id)}
                                    className="text-red-600 hover:text-red-900"
                                    title="Supprimer"
                                  >
                                    🗑️
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => console.log('TODO: implement view RDV', rdv)}
                                  className="text-gray-600 hover:text-gray-900"
                                  title="Consulter"
                                >
                                  👁️
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        </div>
      )}

      {/* Section Mes coupons */}
      {mainTab === 'coupons' && (
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Mes coupons</h2>
            <p className="text-gray-600">Section en cours de développement...</p>
          </div>
        </div>
      )}

      {/* Section Mes Attestations */}
      {mainTab === 'attestations' && (
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Mes Attestations</h2>
            <p className="text-gray-600">Section en cours de développement...</p>
          </div>
        </div>
      )}

      {/* Section Mes élèves */}
      {mainTab === 'eleves' && (
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Mes élèves</h2>
            <p className="text-gray-600">Section en cours de développement...</p>
          </div>
        </div>
      )}
    </main>
  );
};