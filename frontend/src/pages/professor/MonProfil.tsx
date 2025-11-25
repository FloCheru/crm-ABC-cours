import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { ProfessorProfile, EmploymentStatus, EducationInfo, ExperienceInfo } from "../../types/professor";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { Checkbox } from "../../components/ui/checkbox";
import { Label } from "../../components/ui/label";
import { FRENCH_DEPARTMENTS } from "../../constants/departments";
import { TRANSPORT_MODES } from "../../constants/transportModes";
import { getSimulatedProfessor } from "../../utils/professorSimulation";
import { professorService } from "../../services/professorService";
import { DocumentUpload } from "../../components/documents/DocumentUpload";
import { Download, Trash2, FileIcon, Eye } from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";
import { AlertCircle, Save, X, Plus } from "lucide-react";
import { Input } from "../../components/ui/input";
import { SubjectLevelsSelector } from "../../components/professor/SubjectLevelsSelector";
import { subjectService } from "../../services/subjectService";
import type { Subject } from "../../types/subject";
import type { TeachingSubject } from "../../types/professor";
import type { SchoolCategory } from "../../constants/schoolLevels";
import { getDepartmentFromPostalCode } from "../../utils/postalCodeUtils";
import { DepartmentCombobox } from "../../components/professor/DepartmentCombobox";
import { CommuneCombobox } from "../../components/professor/CommuneCombobox";
import { geoApiService, type Commune } from "../../services/geoApiService";
import { X as XIcon } from "lucide-react";

interface Document {
  _id: string;
  filename: string;
  category: string;
  uploadDate: string;
  size: number;
  contentType: string;
}

export const MonProfil: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<Partial<ProfessorProfile>>({});
  const tabFromUrl = searchParams.get("tab") || "informations";
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  const [isSaving, setIsSaving] = useState(false);

  // État pour gérer l'édition par onglet
  const [editingTab, setEditingTab] = useState<string | null>(null);

  // État pour afficher le combobox de départements
  const [showDepartmentCombobox, setShowDepartmentCombobox] = useState(false);

  // États pour gérer l'affichage des combobox de communes (un par département)
  const [showCommuneCombobox, setShowCommuneCombobox] = useState<
    Record<string, boolean>
  >({});

  // Cache des communes chargées par département
  const [communesByDept, setCommunesByDept] = useState<
    Record<string, Commune[]>
  >({});

  // États pour Documents
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // États pour Choix (Matières)
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [teachingSubjects, setTeachingSubjects] = useState<TeachingSubject[]>(
    []
  );

  // États pour matières personnalisées
  const [customSubjectName, setCustomSubjectName] = useState("");
  const [isAddingCustomSubject, setIsAddingCustomSubject] = useState(false);

  // États pour CV (Formations et Expériences)
  const [newEducation, setNewEducation] = useState<Partial<EducationInfo>>({});
  const [newExperience, setNewExperience] = useState<Partial<ExperienceInfo>>({});

  // Détecter le mode simulation
  const simulatedProfessor = getSimulatedProfessor();
  const isSimulationMode = !!simulatedProfessor;

  // Synchroniser activeTab avec l'URL quand elle change
  useEffect(() => {
    const tab = searchParams.get("tab") || "informations";
    setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    loadProfile();
    loadDocuments();
    loadChoixData();
  }, [isSimulationMode, simulatedProfessor?.id]);

  // Présélectionner les départements quand on arrive sur l'onglet Déplacement
  useEffect(() => {
    if (activeTab === "deplacement") {
      console.log("[MonProfil] Onglet Déplacement activé");
      console.log(
        "[MonProfil] formData.primaryAddress:",
        formData.primaryAddress
      );
      console.log(
        "[MonProfil] formData.secondaryAddress:",
        formData.secondaryAddress
      );
      console.log(
        "[MonProfil] formData.availableDepartments avant présélection:",
        formData.availableDepartments
      );

      // Présélectionner les départements basés sur les adresses actuelles
      const preselectedDepts = preselectDepartmentsFromAddresses(
        formData.primaryAddress?.postalCode,
        formData.secondaryAddress?.postalCode
      );

      console.log(
        "[MonProfil] Départements présélectionnés à partir des adresses:",
        preselectedDepts
      );

      // Fusionner avec les départements existants
      if (preselectedDepts.length > 0) {
        const updatedDepts = Array.from(
          new Set([
            ...(formData.availableDepartments || []),
            ...preselectedDepts,
          ])
        );

        console.log(
          "[MonProfil] Départements après fusion (tab deplacement):",
          updatedDepts
        );

        setFormData((prev) => ({
          ...prev,
          availableDepartments: updatedDepts,
        }));
      }
    }
  }, [activeTab]);

  // Fonction helper pour présélectionner les départements depuis les adresses
  const preselectDepartmentsFromAddresses = (
    primaryPostalCode?: string,
    secondaryPostalCode?: string
  ): string[] => {
    const preselectedDepts: string[] = [];

    console.log("[preselectDepartments] Début de la présélection");
    console.log("[preselectDepartments] primaryPostalCode:", primaryPostalCode);
    console.log(
      "[preselectDepartments] secondaryPostalCode:",
      secondaryPostalCode
    );

    // Adresse principale
    if (primaryPostalCode) {
      const deptCode = getDepartmentFromPostalCode(primaryPostalCode);
      console.log(
        "[preselectDepartments] Département de l'adresse principale:",
        deptCode
      );
      if (deptCode) {
        // Cas spécial Corse : code postal "20xxx" → présélectionner 2A et 2B
        if (deptCode === "20") {
          console.log(
            "[preselectDepartments] Corse détectée (adresse principale), ajout de 2A et 2B"
          );
          preselectedDepts.push("2A", "2B");
        } else {
          console.log("[preselectDepartments] Ajout du département:", deptCode);
          preselectedDepts.push(deptCode);
        }
      }
    } else {
      console.log(
        "[preselectDepartments] Pas de code postal pour l'adresse principale"
      );
    }

    // Adresse secondaire
    if (secondaryPostalCode) {
      const deptCode = getDepartmentFromPostalCode(secondaryPostalCode);
      console.log(
        "[preselectDepartments] Département de l'adresse secondaire:",
        deptCode
      );
      if (deptCode) {
        // Cas spécial Corse
        if (deptCode === "20") {
          console.log(
            "[preselectDepartments] Corse détectée (adresse secondaire), ajout de 2A et 2B"
          );
          preselectedDepts.push("2A", "2B");
        } else {
          console.log("[preselectDepartments] Ajout du département:", deptCode);
          preselectedDepts.push(deptCode);
        }
      }
    } else {
      console.log(
        "[preselectDepartments] Pas de code postal pour l'adresse secondaire"
      );
    }

    console.log(
      "[preselectDepartments] Départements présélectionnés:",
      preselectedDepts
    );
    return preselectedDepts;
  };

  const loadProfile = async () => {
    try {
      setIsLoading(true);

      console.log(
        "[MonProfil] loadProfile - isSimulationMode:",
        isSimulationMode
      );
      console.log(
        "[MonProfil] loadProfile - simulatedProfessor:",
        simulatedProfessor
      );

      // Charger le professeur : simulé ou connecté
      const professor =
        isSimulationMode && simulatedProfessor
          ? await professorService.getProfessorById(simulatedProfessor.id)
          : await professorService.getMyProfile();

      console.log(
        "[MonProfil] Professeur chargé (",
        isSimulationMode ? "simulation" : "connecté",
        "):",
        professor
      );

      // Cast en ProfessorProfile pour accéder aux champs d'adresse
      const professorProfile = professor as unknown as ProfessorProfile;

      console.log(
        "[MonProfil] Adresse principale:",
        professorProfile.primaryAddress
      );
      console.log(
        "[MonProfil] Adresse secondaire:",
        professorProfile.secondaryAddress
      );
      console.log(
        "[MonProfil] availableDepartments avant présélection:",
        professorProfile.availableDepartments
      );

      // Présélectionner les départements basés sur les adresses du professeur
      const preselectedDepts = preselectDepartmentsFromAddresses(
        professorProfile.primaryAddress?.postalCode,
        professorProfile.secondaryAddress?.postalCode
      );

      const mergedDepartments = Array.from(
        new Set([
          ...(professorProfile.availableDepartments || []),
          ...preselectedDepts,
        ])
      );

      console.log("[MonProfil] Départements après fusion:", mergedDepartments);

      setFormData({
        ...professorProfile,
        availableDepartments: mergedDepartments,
      } as Partial<ProfessorProfile>);
    } catch (err) {
      console.error("Erreur lors du chargement du profil:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDocuments = async () => {
    try {
      setIsLoadingDocuments(true);
      setError(null);

      // TODO: Remplacer par l'appel API réel
      // const docs = await professorService.getDocuments(professorId!);

      // Données mockées pour le moment
      const mockDocuments: Document[] = [
        {
          _id: "1",
          filename: "Mon_CV.pdf",
          category: "CV",
          uploadDate: new Date("2024-01-15").toISOString(),
          size: 245000,
          contentType: "application/pdf",
        },
        {
          _id: "2",
          filename: "Diplome_Master_Mathematiques.pdf",
          category: "Diplôme",
          uploadDate: new Date("2024-01-20").toISOString(),
          size: 1200000,
          contentType: "application/pdf",
        },
        {
          _id: "3",
          filename: "RIB_Banque_Postale.pdf",
          category: "RIB",
          uploadDate: new Date("2024-02-01").toISOString(),
          size: 89000,
          contentType: "application/pdf",
        },
      ];

      setDocuments(mockDocuments);
    } catch (err) {
      console.error("Erreur lors du chargement des documents:", err);
      setError("Impossible de charger vos documents");
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  const loadChoixData = async () => {
    try {
      const [subjects, mySubjects] = await Promise.all([
        subjectService.getActiveSubjects(),
        professorService.getMySubjects(),
      ]);

      console.log("Subjects loaded:", subjects);
      console.log("My subjects loaded:", mySubjects);

      // Si aucune matière n'est retournée, utiliser des données de test
      if (!subjects || subjects.length === 0) {
        console.warn(
          "⚠️ Aucune matière trouvée - Utilisation de données de test"
        );
        const mockSubjects: Subject[] = [
          { _id: "1", name: "Mathématiques", category: "Sciences" },
          { _id: "2", name: "Français", category: "Langues" },
          { _id: "3", name: "Anglais", category: "Langues" },
          {
            _id: "4",
            name: "Histoire-Géographie",
            category: "Sciences humaines",
          },
          { _id: "5", name: "Physique-Chimie", category: "Sciences" },
          { _id: "6", name: "SVT", category: "Sciences" },
          { _id: "7", name: "Philosophie", category: "Lettres" },
          { _id: "8", name: "Espagnol", category: "Langues" },
        ];
        setAllSubjects(mockSubjects);
      } else {
        setAllSubjects(subjects);
      }

      setTeachingSubjects(mySubjects || []);
    } catch (error) {
      console.error("❌ Erreur de chargement des matières:", error);
      // En cas d'erreur, utiliser des données de test
      const mockSubjects: Subject[] = [
        { _id: "1", name: "Mathématiques", category: "Sciences" },
        { _id: "2", name: "Français", category: "Langues" },
        { _id: "3", name: "Anglais", category: "Langues" },
        {
          _id: "4",
          name: "Histoire-Géographie",
          category: "Sciences humaines",
        },
        { _id: "5", name: "Physique-Chimie", category: "Sciences" },
        { _id: "6", name: "SVT", category: "Sciences" },
        { _id: "7", name: "Philosophie", category: "Lettres" },
        { _id: "8", name: "Espagnol", category: "Langues" },
      ];
      setAllSubjects(mockSubjects);
      setTeachingSubjects([]);
    }
  };

  const handleSave = async (section: string) => {
    try {
      setIsSaving(true);
      console.log("[MonProfil] Sauvegarde du profil...", section, formData);

      // Appeler le service pour mettre à jour le profil
      await professorService.updateMyProfile(formData);

      console.log("[MonProfil] ✅ Profil sauvegardé avec succès");
      setEditingTab(null);
    } catch (err) {
      console.error("[MonProfil] ❌ Erreur lors de la sauvegarde:", err);
      alert("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSubjects = async () => {
    if (!hasValidSelection()) return;

    try {
      setIsSaving(true);
      await professorService.updateMySubjects(teachingSubjects);
      alert("Vos choix ont été enregistrés avec succès !");
      setEditingTab(null);
    } catch (error) {
      console.error("Erreur de sauvegarde:", error);
      alert("Erreur lors de la sauvegarde. Veuillez réessayer.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingTab(null);
    loadProfile(); // Recharger les données originales
  };

  const handleInputChange = (
    field: keyof ProfessorProfile | string,
    value: any
  ) => {
    // Gérer les champs imbriqués (primaryAddress.*, secondaryAddress.*)
    if (field.includes(".")) {
      const [parent, child] = field.split(".") as [string, string];
      setFormData((prev: Partial<ProfessorProfile>) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof ProfessorProfile] as any),
          [child]: value,
        },
      }));
    } else {
      setFormData((prev: Partial<ProfessorProfile>) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  // Handlers pour CV (Formations et Expériences)
  const handleAddEducation = () => {
    if (
      !newEducation.degree ||
      !newEducation.institution ||
      !newEducation.year
    ) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const currentEducation = formData.education || [];
    handleInputChange("education", [
      ...currentEducation,
      newEducation as EducationInfo,
    ]);
    setNewEducation({});
  };

  const handleRemoveEducation = (index: number) => {
    const currentEducation = formData.education || [];
    const updated = currentEducation.filter((_, i) => i !== index);
    handleInputChange("education", updated);
  };

  const handleAddExperience = () => {
    if (
      !newExperience.position ||
      !newExperience.company ||
      !newExperience.startDate
    ) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const currentExperience = formData.experience || [];
    handleInputChange("experience", [
      ...currentExperience,
      newExperience as ExperienceInfo,
    ]);
    setNewExperience({});
  };

  const handleRemoveExperience = (index: number) => {
    const currentExperience = formData.experience || [];
    const updated = currentExperience.filter((_, i) => i !== index);
    handleInputChange("experience", updated);
  };

  const toggleDepartment = (code: string) => {
    const current = formData.availableDepartments || [];
    const updated = current.includes(code)
      ? current.filter((c) => c !== code)
      : [...current, code];
    handleInputChange("availableDepartments", updated);
  };

  const getProtectedDepartments = (): string[] => {
    const protectedDepts: string[] = [];

    // Département de l'adresse principale
    if (formData.primaryAddress?.postalCode) {
      const dept = getDepartmentFromPostalCode(
        formData.primaryAddress.postalCode
      );
      if (dept === "20") {
        protectedDepts.push("2A", "2B"); // Cas Corse
      } else if (dept) {
        protectedDepts.push(dept);
      }
    }

    // Département de l'adresse secondaire
    if (formData.secondaryAddress?.postalCode) {
      const dept = getDepartmentFromPostalCode(
        formData.secondaryAddress.postalCode
      );
      if (dept === "20") {
        protectedDepts.push("2A", "2B");
      } else if (dept) {
        protectedDepts.push(dept);
      }
    }

    return [...new Set(protectedDepts)]; // Déduplique
  };

  const handleRemoveDepartment = (deptCode: string) => {
    const protectedDepts = getProtectedDepartments();
    if (protectedDepts.includes(deptCode)) {
      alert("Impossible de supprimer ce département (lié à vos adresses)");
      return;
    }

    const updated = (formData.availableDepartments || []).filter(
      (code) => code !== deptCode
    );

    // Également supprimer les communes associées
    const deptCommunes = communesByDept[deptCode]?.map((c) => c.code) || [];
    const updatedCities = (formData.availableCities || []).filter(
      (code) => !deptCommunes.includes(code)
    );

    handleInputChange("availableDepartments", updated);
    handleInputChange("availableCities", updatedCities);
  };

  // Handlers pour les communes
  const toggleCity = (cityCode: string) => {
    const current = formData.availableCities || [];
    const updated = current.includes(cityCode)
      ? current.filter((c) => c !== cityCode)
      : [...current, cityCode];
    handleInputChange("availableCities", updated);
  };

  const loadCommunesForDepartment = async (deptCode: string) => {
    if (communesByDept[deptCode]) return; // Déjà chargé

    const communes = await geoApiService.getCommunesByDepartment(deptCode);
    setCommunesByDept((prev) => ({ ...prev, [deptCode]: communes }));
  };

  const getCommunesForDepartment = (deptCode: string): string[] => {
    const communes = communesByDept[deptCode] || [];
    return (formData.availableCities || []).filter((cityCode) =>
      communes.some((c) => c.code === cityCode)
    );
  };

  const getCommuneDisplayName = (commune: Commune): string => {
    return `${commune.nom} (${commune.codesPostaux?.[0] || commune.code})`;
  };

  // Handlers pour les matières (Choix)
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

  const hasValidSelection = (): boolean => {
    return (
      teachingSubjects.length > 0 &&
      teachingSubjects.every((ts) => ts.grades.length > 0)
    );
  };

  // Handlers pour les matières personnalisées
  const handleAddCustomSubject = () => {
    if (!customSubjectName.trim()) {
      alert("Veuillez saisir le nom de la matière");
      return;
    }

    const tempId = `custom-${Date.now()}`;

    setTeachingSubjects((prev) => [
      ...prev,
      {
        subjectId: tempId,
        subjectName: customSubjectName.trim(),
        grades: [],
        levels: [],
        isCustom: true,
      },
    ]);

    setCustomSubjectName("");
    setIsAddingCustomSubject(false);
  };

  const handleRemoveCustomSubject = (subjectId: string) => {
    setTeachingSubjects((prev) =>
      prev.filter((ts) => ts.subjectId !== subjectId)
    );
  };

  // Handlers pour les documents
  const handleFileUpload = async (file: File, category: string) => {
    try {
      setError(null);
      console.log("Upload fichier:", file.name, "Catégorie:", category);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await loadDocuments();
      alert("Document uploadé avec succès !");
    } catch (err) {
      console.error("Erreur lors de l'upload:", err);
      throw new Error("Erreur lors de l'upload du document");
    }
  };

  const handleDownload = async (documentId: string, filename: string) => {
    console.log("Téléchargement du document:", documentId, filename);
    alert("Fonctionnalité de téléchargement à implémenter avec le backend");
  };

  const handleView = async (documentId: string) => {
    console.log("Visualisation du document:", documentId);
    alert("Fonctionnalité de visualisation à implémenter avec le backend");
  };

  const handleDelete = async (documentId: string, filename: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer "${filename}" ?`)) {
      return;
    }
    console.log("Suppression du document:", documentId);
    await loadDocuments();
    alert("Document supprimé avec succès !");
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (contentType: string) => {
    if (contentType === "application/pdf") {
      return <FileIcon className="w-5 h-5 text-red-600" />;
    }
    if (contentType.startsWith("image/")) {
      return <FileIcon className="w-5 h-5 text-blue-600" />;
    }
    return <FileIcon className="w-5 h-5 text-gray-600" />;
  };

  const renderEditField = (
    label: string,
    field: keyof ProfessorProfile | string,
    type: "text" | "email" | "tel" | "date" | "select" = "text",
    options?: { value: string; label: string }[],
    isFullWidth = false
  ) => {
    // Supporter les champs imbriqués (ex: "primaryAddress.postalCode")
    const fieldValue = field.includes(".")
      ? field.split(".").reduce((obj, key) => obj?.[key], formData as any)
      : formData[field as keyof ProfessorProfile];

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

  const renderField = (label: string, field: string, isFullWidth = false) => {
    const value = field.includes(".")
      ? field.split(".").reduce((obj, key) => obj?.[key], formData as any)
      : formData[field as keyof ProfessorProfile];

    return (
      <div className={isFullWidth ? "col-span-2" : ""}>
        <div className="text-xs text-gray-500 mb-1">{label}</div>
        <div className="text-base text-gray-900">{value || "-"}</div>
      </div>
    );
  };

  const selectedCount = teachingSubjects.filter(
    (ts) => ts.grades.length > 0
  ).length;
  const invalidCount = teachingSubjects.filter(
    (ts) => ts.grades.length === 0
  ).length;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 max-w-6xl py-8">
        <div className="text-center text-gray-500 py-8">
          Chargement de votre profil...
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 max-w-6xl py-8">
      <h1 className="text-2xl font-bold mb-6">Mon Profil</h1>

      <Tabs
        value={activeTab}
        onValueChange={(tab: string) => {
          setActiveTab(tab);
          navigate(`?tab=${tab}`, { replace: true });
        }}
        className="w-full"
      >
        <TabsList className="bg-transparent border-b border-gray-200 rounded-none p-0 h-auto w-full justify-start">
          <TabsTrigger
            value="informations"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3"
          >
            Mes Informations
          </TabsTrigger>
          <TabsTrigger
            value="documents"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3"
          >
            Mes Documents
          </TabsTrigger>
          <TabsTrigger
            value="choix"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3"
          >
            Mes Choix
          </TabsTrigger>
          <TabsTrigger
            value="deplacement"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3"
          >
            Mes Déplacements
          </TabsTrigger>
          <TabsTrigger
            value="status"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3"
          >
            Mon Statut
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Informations (fusion Identité + Coordonnées) */}
        <TabsContent value="informations" className="mt-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Informations personnelles
                </h3>
                <p className="text-sm text-gray-500">
                  Vos informations d'identité et coordonnées
                </p>
              </div>
              {!isSimulationMode && editingTab !== "informations" && (
                <button
                  onClick={() => setEditingTab("informations")}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                >
                  Modifier ✏️
                </button>
              )}
            </div>

            {editingTab === "informations" ? (
              <>
                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                  {/* Identité */}
                  {renderEditField("Genre *", "gender", "select", [
                    { value: "M.", label: "M." },
                    { value: "Mme", label: "Mme" },
                  ])}
                  {renderEditField("Prénom *", "firstName")}
                  {renderEditField("Nom *", "lastName")}
                  {renderEditField(
                    "Nom de naissance (si différent)",
                    "birthName"
                  )}
                  {renderEditField("Date de naissance *", "birthDate", "date")}
                  {renderEditField(
                    "N° de sécurité sociale",
                    "socialSecurityNumber"
                  )}
                  {renderEditField(
                    "Pays de naissance",
                    "birthCountry",
                    "text",
                    undefined,
                    true
                  )}

                  <div className="col-span-2 my-4">
                    <Separator />
                  </div>

                  {/* Coordonnées */}
                  {renderEditField("Email *", "email", "email")}
                  {renderEditField("Tél principal *", "phone", "tel")}
                  {renderEditField("Tél secondaire", "secondaryPhone", "tel")}
                  {renderEditField(
                    "Code postal *",
                    "primaryAddress.postalCode"
                  )}
                  {renderEditField(
                    "Adresse",
                    "primaryAddress.street",
                    "text",
                    undefined,
                    true
                  )}
                  {renderEditField(
                    "Complément d'adresse",
                    "primaryAddress.addressComplement",
                    "text",
                    undefined,
                    true
                  )}
                  {renderEditField("Commune", "primaryAddress.city")}
                  {renderEditField("Déplacement", "transportMode", "select", [
                    { value: "", label: "Sélectionner..." },
                    ...TRANSPORT_MODES,
                  ])}
                  {renderEditField("Cours", "courseLocation", "select", [
                    { value: "", label: "Sélectionner..." },
                    { value: "domicile", label: "À domicile" },
                    { value: "visio", label: "En visio" },
                  ])}

                  <div className="col-span-2 my-4">
                    <Separator />
                    <div className="text-sm font-medium text-gray-700 mt-4 mb-2">
                      Adresse secondaire (optionnelle)
                    </div>
                    <Alert className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Remplir uniquement si vous souhaitez donner des cours dans un autre département
                      </AlertDescription>
                    </Alert>
                  </div>

                  {renderEditField(
                    "Code postal secondaire",
                    "secondaryAddress.postalCode"
                  )}
                  {renderEditField(
                    "Adresse secondaire",
                    "secondaryAddress.street",
                    "text",
                    undefined,
                    true
                  )}
                  {renderEditField(
                    "Complément d'adresse",
                    "secondaryAddress.addressComplement",
                    "text",
                    undefined,
                    true
                  )}
                  {renderEditField("Commune", "secondaryAddress.city")}
                </div>

                {/* Profil Académique - Section CV */}
                <div className="col-span-2 my-6">
                  <Separator />
                  <div className="text-sm font-medium text-gray-700 mt-4 mb-4">
                    Mon Profil Académique
                  </div>

                  {/* Activité Actuelle */}
                  <div className="mb-6">
                    <label className="text-xs text-gray-500 mb-1 block">
                      Activité Actuelle
                    </label>
                    <select
                      value={formData.currentSituation || ""}
                      onChange={(e) =>
                        handleInputChange("currentSituation", e.target.value)
                      }
                      className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="">Sélectionner...</option>
                      <option value="enseignant_education_nationale">
                        Enseignant en Éducation Nationale
                      </option>
                      <option value="enseignant_vacataire_contractuel">
                        Enseignant Vacataire/Contractuel
                      </option>
                      <option value="etudiant_master_professorat">
                        Étudiant Master Professorat
                      </option>
                      <option value="enseignant_avec_activite_domicile">
                        Enseignant avec Activité à Domicile
                      </option>
                      <option value="enseignant_activite_professionnelle">
                        Enseignant avec Autre Activité
                      </option>
                      <option value="enseignant_formation_professionnelle">
                        En Formation Professionnelle
                      </option>
                      <option value="etudiant">Étudiant</option>
                    </select>
                  </div>

                  {/* Formations */}
                  <div className="mb-6">
                    <div className="text-sm font-medium text-gray-700 mb-3">
                      Formations
                    </div>

                    {/* Liste des formations existantes */}
                    {formData.education && formData.education.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {formData.education.map((edu, idx) => (
                          <div
                            key={idx}
                            className="flex items-start justify-between bg-gray-50 p-3 rounded-md"
                          >
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                {edu.degree} • {edu.institution}
                              </div>
                              <div className="text-xs text-gray-500">
                                {edu.year}
                                {edu.description && ` • ${edu.description}`}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveEducation(idx)}
                              className="h-6 w-6 p-0 ml-2"
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Formulaire d'ajout */}
                    <div className="border border-gray-200 rounded-md p-3 bg-gray-50 space-y-2">
                      <Input
                        placeholder="Diplôme (ex: Master, Licence, Bac)"
                        value={newEducation.degree || ""}
                        onChange={(e) =>
                          setNewEducation({
                            ...newEducation,
                            degree: e.target.value,
                          })
                        }
                      />
                      <Input
                        placeholder="Établissement (ex: Université de Paris)"
                        value={newEducation.institution || ""}
                        onChange={(e) =>
                          setNewEducation({
                            ...newEducation,
                            institution: e.target.value,
                          })
                        }
                      />
                      <input
                        type="number"
                        placeholder="Année"
                        value={newEducation.year || ""}
                        onChange={(e) =>
                          setNewEducation({
                            ...newEducation,
                            year: e.target.value ? parseInt(e.target.value) : 0,
                          })
                        }
                        className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                      <textarea
                        placeholder="Description (optionnel)"
                        value={newEducation.description || ""}
                        onChange={(e) =>
                          setNewEducation({
                            ...newEducation,
                            description: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        rows={2}
                      />
                      <Button
                        onClick={handleAddEducation}
                        size="sm"
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Ajouter une formation
                      </Button>
                    </div>
                  </div>

                  {/* Expériences */}
                  <div className="mb-6">
                    <div className="text-sm font-medium text-gray-700 mb-3">
                      Expériences Professionnelles
                    </div>

                    {/* Liste des expériences existantes */}
                    {formData.experience && formData.experience.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {formData.experience.map((exp, idx) => (
                          <div
                            key={idx}
                            className="flex items-start justify-between bg-gray-50 p-3 rounded-md"
                          >
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                {exp.position} chez {exp.company}
                              </div>
                              <div className="text-xs text-gray-500">
                                {exp.startDate}
                                {exp.endDate && ` - ${exp.endDate}`}
                                {exp.description && ` • ${exp.description}`}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveExperience(idx)}
                              className="h-6 w-6 p-0 ml-2"
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Formulaire d'ajout */}
                    <div className="border border-gray-200 rounded-md p-3 bg-gray-50 space-y-2">
                      <Input
                        placeholder="Poste (ex: Développeur, Professeur)"
                        value={newExperience.position || ""}
                        onChange={(e) =>
                          setNewExperience({
                            ...newExperience,
                            position: e.target.value,
                          })
                        }
                      />
                      <Input
                        placeholder="Entreprise/Organisation"
                        value={newExperience.company || ""}
                        onChange={(e) =>
                          setNewExperience({
                            ...newExperience,
                            company: e.target.value,
                          })
                        }
                      />
                      <Input
                        placeholder="Date début (ex: 01/2020)"
                        value={newExperience.startDate || ""}
                        onChange={(e) =>
                          setNewExperience({
                            ...newExperience,
                            startDate: e.target.value,
                          })
                        }
                      />
                      <Input
                        placeholder="Date fin (ex: 12/2023, ou laisser vide)"
                        value={newExperience.endDate || ""}
                        onChange={(e) =>
                          setNewExperience({
                            ...newExperience,
                            endDate: e.target.value,
                          })
                        }
                      />
                      <textarea
                        placeholder="Description (optionnel)"
                        value={newExperience.description || ""}
                        onChange={(e) =>
                          setNewExperience({
                            ...newExperience,
                            description: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        rows={2}
                      />
                      <Button
                        onClick={handleAddExperience}
                        size="sm"
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Ajouter une expérience
                      </Button>
                    </div>
                  </div>

                  {/* Informations Complémentaires */}
                  <div className="mb-6">
                    <label className="text-xs text-gray-500 mb-1 block">
                      Informations Complémentaires
                    </label>
                    <textarea
                      value={formData.notes || ""}
                      onChange={(e) =>
                        handleInputChange("notes", e.target.value)
                      }
                      placeholder="Expériences particulières, distinctions, etc."
                      className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      rows={4}
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => handleSave("informations")}
                    disabled={isSaving}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSaving ? "Enregistrement..." : "Sauvegarder"}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                {/* Identité */}
                {renderField("Genre *", "gender")}
                {renderField("Prénom *", "firstName")}
                {renderField("Nom *", "lastName")}
                {renderField("Nom de naissance (si différent)", "birthName")}
                <div>
                  <div className="text-xs text-gray-500 mb-1">
                    Date de naissance *
                  </div>
                  <div className="text-base text-gray-900">
                    {formData.birthDate
                      ? new Date(formData.birthDate).toLocaleDateString("fr-FR")
                      : "-"}
                  </div>
                </div>
                {renderField("N° de sécurité sociale", "socialSecurityNumber")}
                {renderField("Pays de naissance", "birthCountry", true)}

                <div className="col-span-2 my-4">
                  <Separator />
                </div>

                {/* Coordonnées */}
                {renderField("Email *", "email")}
                {renderField("Tél principal *", "phone")}
                {renderField("Tél secondaire", "secondaryPhone")}
                {renderField("Code postal *", "primaryAddress.postalCode")}
                {renderField("Adresse", "primaryAddress.street", true)}
                {renderField(
                  "Complément d'adresse",
                  "primaryAddress.addressComplement",
                  true
                )}
                {renderField("Commune", "primaryAddress.city")}
                {renderField("Mode de déplacement", "transportMode")}
                {renderField("Cours", "courseLocation")}

                <div className="col-span-2 my-4">
                  <Separator />
                  <div className="text-sm font-medium text-gray-700 mt-4 mb-2">
                    Adresse secondaire
                  </div>
                  <Alert className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Remplir uniquement si vous souhaitez donner des cours dans un autre département
                    </AlertDescription>
                  </Alert>
                </div>

                {renderField(
                  "Code postal secondaire",
                  "secondaryAddress.postalCode"
                )}
                {renderField(
                  "Adresse secondaire",
                  "secondaryAddress.street",
                  true
                )}
                {renderField(
                  "Complément d'adresse",
                  "secondaryAddress.addressComplement",
                  true
                )}
                {renderField("Commune", "secondaryAddress.city")}

                {/* Profil Académique - Section CV */}
                <div className="col-span-2 my-6">
                  <Separator />
                  <div className="text-sm font-medium text-gray-700 mt-4 mb-4">
                    Mon Profil Académique
                  </div>

                  {/* Activité Actuelle */}
                  {formData.currentSituation && (
                    <div className="mb-4">
                      <div className="text-xs text-gray-500 mb-1">
                        Activité Actuelle
                      </div>
                      <div className="text-base text-gray-900">
                        {formData.currentSituation === "enseignant_education_nationale"
                          ? "Enseignant en Éducation Nationale"
                          : formData.currentSituation === "enseignant_vacataire_contractuel"
                          ? "Enseignant Vacataire/Contractuel"
                          : formData.currentSituation === "etudiant_master_professorat"
                          ? "Étudiant Master Professorat"
                          : formData.currentSituation === "enseignant_avec_activite_domicile"
                          ? "Enseignant avec Activité à Domicile"
                          : formData.currentSituation === "enseignant_activite_professionnelle"
                          ? "Enseignant avec Autre Activité"
                          : formData.currentSituation === "enseignant_formation_professionnelle"
                          ? "En Formation Professionnelle"
                          : formData.currentSituation === "etudiant"
                          ? "Étudiant"
                          : formData.currentSituation}
                      </div>
                    </div>
                  )}

                  {/* Formations */}
                  {formData.education && formData.education.length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs text-gray-500 mb-2">Formations</div>
                      <div className="space-y-2">
                        {formData.education.map((edu, idx) => (
                          <div
                            key={idx}
                            className="bg-gray-50 p-3 rounded-md border-l-4 border-blue-500"
                          >
                            <div className="text-sm font-medium text-gray-900">
                              {edu.degree} • {edu.institution}
                            </div>
                            <div className="text-xs text-gray-500">
                              {edu.year}
                              {edu.description && ` • ${edu.description}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Expériences */}
                  {formData.experience && formData.experience.length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs text-gray-500 mb-2">
                        Expériences Professionnelles
                      </div>
                      <div className="space-y-2">
                        {formData.experience.map((exp, idx) => (
                          <div
                            key={idx}
                            className="bg-gray-50 p-3 rounded-md border-l-4 border-blue-500"
                          >
                            <div className="text-sm font-medium text-gray-900">
                              {exp.position} chez {exp.company}
                            </div>
                            <div className="text-xs text-gray-500">
                              {exp.startDate}
                              {exp.endDate && ` - ${exp.endDate}`}
                              {exp.description && ` • ${exp.description}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Informations Complémentaires */}
                  {formData.notes && (
                    <div className="mb-4">
                      <div className="text-xs text-gray-500 mb-1">
                        Informations Complémentaires
                      </div>
                      <div className="text-base text-gray-900 whitespace-pre-wrap">
                        {formData.notes}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 2: Documents */}
        <TabsContent value="documents" className="mt-6">
          <div className="space-y-6">
            {/* Section Upload */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Ajouter un nouveau document
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Formats acceptés : PDF, PNG, JPG, GIF, WEBP (max 10MB)
                </p>
              </div>

              <DocumentUpload onFileSelect={handleFileUpload} />
            </div>

            {/* Message d'erreur global */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Liste des documents */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Mes documents ({documents.length})
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Gérez vos documents personnels
                </p>
              </div>

              {isLoadingDocuments ? (
                <div className="p-8 text-center text-gray-500">
                  Chargement de vos documents...
                </div>
              ) : documents.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Vous n'avez pas encore de document. Commencez par en uploader
                  un ci-dessus.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Document
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Catégorie
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Taille
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date d'ajout
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {documents.map((doc) => (
                        <tr key={doc._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              {getFileIcon(doc.contentType)}
                              <span className="text-sm font-medium text-gray-900">
                                {doc.filename}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                              {doc.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatFileSize(doc.size)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(doc.uploadDate).toLocaleDateString(
                              "fr-FR",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            <div className="flex justify-end gap-2">
                              <Button
                                onClick={() => handleView(doc._id)}
                                variant="outline"
                                size="sm"
                                title="Visualiser"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() =>
                                  handleDownload(doc._id, doc.filename)
                                }
                                variant="outline"
                                size="sm"
                                title="Télécharger"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() =>
                                  handleDelete(doc._id, doc.filename)
                                }
                                variant="outline"
                                size="sm"
                                title="Supprimer"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Note d'information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                💡 <strong>Astuce :</strong> Gardez vos documents à jour pour
                faciliter les démarches administratives. Vos documents sont
                sécurisés et accessibles uniquement par vous et les
                administrateurs.
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Tab 3: Choix (Matières enseignées) */}
        <TabsContent value="choix" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                Mes matières enseignées
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Sélectionnez les matières que vous enseignez et les niveaux
                correspondants
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Alert si aucune matière ou matières invalides */}
              {teachingSubjects.length === 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Sélectionnez au moins une matière avec ses niveaux
                  </AlertDescription>
                </Alert>
              )}

              {invalidCount > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {invalidCount} matière(s) sélectionnée(s) sans niveaux.
                    Veuillez sélectionner au moins un niveau par matière.
                  </AlertDescription>
                </Alert>
              )}

              {/* Résumé */}
              {selectedCount > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-sm">
                    {selectedCount} matière(s) configurée(s)
                  </Badge>
                </div>
              )}

              <Separator />

              {/* Message si aucune matière disponible */}
              {allSubjects.length === 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Aucune matière disponible pour le moment. Veuillez contacter
                    l'administrateur.
                  </AlertDescription>
                </Alert>
              )}

              {/* Liste des matières */}
              <div className="space-y-4">
                {allSubjects.map((subject) => {
                  const isSelected = isSubjectSelected(subject._id);
                  const selectedGrades = getGradesForSubject(subject._id);

                  return (
                    <div
                      key={subject._id}
                      className={`border rounded-lg p-4 transition-colors ${
                        isSelected
                          ? "border-primary bg-accent/50"
                          : "border-border"
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
                          <Badge variant="secondary">
                            {selectedGrades.length} niveau(x)
                          </Badge>
                        )}
                      </div>

                      {/* Sélecteur de niveaux (visible si matière cochée) */}
                      {isSelected && (
                        <SubjectLevelsSelector
                          selectedGrades={selectedGrades}
                          onChange={(grades) =>
                            handleGradesChange(subject._id, grades)
                          }
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Matières personnalisées */}
              {teachingSubjects.filter((ts) => ts.isCustom).length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Label className="text-base font-medium">
                      Matières personnalisées
                    </Label>
                    <Badge variant="outline" className="text-xs">
                      {teachingSubjects.filter((ts) => ts.isCustom).length}
                    </Badge>
                  </div>

                  {teachingSubjects
                    .filter((ts) => ts.isCustom)
                    .map((customSubject) => {
                      const selectedGrades = getGradesForSubject(
                        customSubject.subjectId
                      );

                      return (
                        <div
                          key={customSubject.subjectId}
                          className="border border-primary rounded-lg p-4 bg-surface-tertiary"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-base font-medium">
                                {customSubject.subjectName}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                Matière personnalisée
                              </Badge>
                              {selectedGrades.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {selectedGrades.length} niveau(x)
                                </Badge>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleRemoveCustomSubject(
                                  customSubject.subjectId
                                )
                              }
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>

                          <SubjectLevelsSelector
                            selectedGrades={selectedGrades}
                            onChange={(grades) =>
                              handleGradesChange(
                                customSubject.subjectId,
                                grades
                              )
                            }
                          />
                        </div>
                      );
                    })}
                </div>
              )}

              {/* Formulaire d'ajout de matière personnalisée */}
              {!isAddingCustomSubject ? (
                <Button
                  variant="outline"
                  onClick={() => setIsAddingCustomSubject(true)}
                  className="w-full"
                >
                  Autre
                </Button>
              ) : (
                <div className="border border-border rounded-lg p-4 bg-surface-tertiary">
                  <Label htmlFor="customSubjectName" className="text-base mb-2">
                    Nom de la matière
                  </Label>
                  <Input
                    id="customSubjectName"
                    type="text"
                    placeholder="Ex: Latin, Grec ancien, etc."
                    value={customSubjectName}
                    onChange={(e) => setCustomSubjectName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCustomSubject();
                      } else if (e.key === "Escape") {
                        setIsAddingCustomSubject(false);
                        setCustomSubjectName("");
                      }
                    }}
                    className="mb-3"
                    minLength={2}
                    required
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleAddCustomSubject}
                      disabled={!customSubjectName.trim()}
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Ajouter
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsAddingCustomSubject(false);
                        setCustomSubjectName("");
                      }}
                      size="sm"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Annuler
                    </Button>
                  </div>
                </div>
              )}

              <Separator />

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={loadChoixData}
                  disabled={isSaving}
                >
                  <X className="w-4 h-4 mr-2" />
                  Annuler
                </Button>
                <Button
                  onClick={handleSaveSubjects}
                  disabled={!hasValidSelection() || isSaving}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? "Enregistrement..." : "Enregistrer mes choix"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Déplacements */}
        <TabsContent value="deplacement" className="mt-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Déplacements
                </h3>
                <p className="text-sm text-gray-500">
                  Départements où vous pouvez vous déplacer pour donner des
                  cours
                </p>
              </div>
              {!isSimulationMode && editingTab !== "deplacements" && (
                <button
                  onClick={() => setEditingTab("deplacements")}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                >
                  Modifier ✏️
                </button>
              )}
            </div>

            {editingTab === "deplacements" ? (
              <>
                {/* Bouton pour afficher le combobox */}
                {!showDepartmentCombobox && (
                  <Button
                    variant="outline"
                    onClick={() => setShowDepartmentCombobox(true)}
                    className="mb-4"
                  >
                    Ajouter d'autres départements
                  </Button>
                )}

                {/* Combobox (affiché conditionnellement) */}
                {showDepartmentCombobox && (
                  <div className="mb-4">
                    <DepartmentCombobox
                      open={showDepartmentCombobox}
                      onOpenChange={setShowDepartmentCombobox}
                      onSelect={(code) => toggleDepartment(code)}
                      selectedCodes={formData.availableDepartments || []}
                    />
                  </div>
                )}

                {/* Pour chaque département sélectionné, afficher les communes */}
                {formData.availableDepartments?.map((deptCode) => {
                  const dept = FRENCH_DEPARTMENTS.find(
                    (d) => d.code === deptCode
                  );
                  const selectedCities = getCommunesForDepartment(deptCode);
                  const communes = communesByDept[deptCode] || [];
                  const isProtected = getProtectedDepartments().includes(
                    deptCode
                  );

                  return (
                    <div key={deptCode} className="border rounded-lg p-4 mb-4">
                      {/* Titre du département */}
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">
                          {deptCode} - {dept?.name || "Inconnu"}
                        </h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {selectedCities.length} commune(s)
                          </Badge>
                          {!isProtected && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemoveDepartment(deptCode)}
                              title="Supprimer ce département"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Communes sélectionnées */}
                      {selectedCities.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {selectedCities.map((cityCode) => {
                            const commune = communes.find(
                              (c) => c.code === cityCode
                            );
                            return (
                              <Badge
                                key={cityCode}
                                variant="secondary"
                                className="flex items-center gap-1 pr-1"
                              >
                                {commune
                                  ? getCommuneDisplayName(commune)
                                  : cityCode}
                                <button
                                  onClick={() => toggleCity(cityCode)}
                                  className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                                  title="Retirer cette commune"
                                >
                                  <XIcon className="h-3 w-3" />
                                </button>
                              </Badge>
                            );
                          })}
                        </div>
                      )}

                      {/* Bouton "Sélection des communes" */}
                      {!showCommuneCombobox[deptCode] && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            loadCommunesForDepartment(deptCode);
                            setShowCommuneCombobox((prev) => ({
                              ...prev,
                              [deptCode]: true,
                            }));
                          }}
                        >
                          Sélection des communes
                        </Button>
                      )}

                      {/* Combobox de communes */}
                      {showCommuneCombobox[deptCode] && (
                        <CommuneCombobox
                          departmentCode={deptCode}
                          open={showCommuneCombobox[deptCode]}
                          onOpenChange={(open) =>
                            setShowCommuneCombobox((prev) => ({
                              ...prev,
                              [deptCode]: open,
                            }))
                          }
                          onSelect={(cityCode) => toggleCity(cityCode)}
                          selectedCodes={selectedCities}
                        />
                      )}
                    </div>
                  );
                })}

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => handleSave("deplacements")}
                    disabled={isSaving}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSaving ? "Enregistrement..." : "Sauvegarder"}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                </div>
              </>
            ) : (
              <div>
                {formData.availableDepartments &&
                formData.availableDepartments.length > 0 ? (
                  <div className="space-y-4">
                    {formData.availableDepartments.map((deptCode) => {
                      const dept = FRENCH_DEPARTMENTS.find(
                        (d) => d.code === deptCode
                      );
                      const selectedCities = getCommunesForDepartment(deptCode);
                      const communes = communesByDept[deptCode] || [];

                      return (
                        <div key={deptCode} className="mb-4">
                          <div className="text-sm font-medium text-gray-700 mb-2">
                            {deptCode} - {dept?.name}
                          </div>
                          {selectedCities.length > 0 ? (
                            <div className="flex flex-wrap gap-2 ml-4">
                              {selectedCities.map((cityCode) => {
                                const commune = communes.find(
                                  (c) => c.code === cityCode
                                );
                                return (
                                  <Badge key={cityCode} variant="default">
                                    {commune
                                      ? getCommuneDisplayName(commune)
                                      : cityCode}
                                  </Badge>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 ml-4">
                              Aucune commune sélectionnée
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Aucun département sélectionné
                  </p>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 5: Status */}
        <TabsContent value="status" className="mt-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Statut d'emploi
                </h3>
                <p className="text-sm text-gray-500">
                  Votre statut professionnel
                </p>
              </div>
              {!isSimulationMode && editingTab !== "status" && (
                <button
                  onClick={() => setEditingTab("status")}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                >
                  Modifier ✏️
                </button>
              )}
            </div>

            {editingTab === "status" ? (
              <>
                <div className="space-y-6">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                      Statut professionnel *
                    </label>
                    <select
                      value={formData.employmentStatus || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "employmentStatus",
                          e.target.value as EmploymentStatus
                        )
                      }
                      className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="">Sélectionner...</option>
                      <option value="salarie">Salarié</option>
                      <option value="auto-entrepreneur">
                        Auto-entrepreneur
                      </option>
                    </select>
                  </div>

                  {formData.employmentStatus === "auto-entrepreneur" && (
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">
                        SIRET * (14 chiffres)
                      </label>
                      <input
                        type="text"
                        value={formData.siret || ""}
                        onChange={(e) =>
                          handleInputChange("siret", e.target.value)
                        }
                        pattern="[0-9]{14}"
                        title="14 chiffres requis"
                        maxLength={14}
                        className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="12345678901234"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => handleSave("status")}
                    disabled={isSaving}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSaving ? "Enregistrement..." : "Sauvegarder"}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="text-xs text-gray-500 mb-1">
                    Statut professionnel
                  </div>
                  <div className="text-base text-gray-900">
                    {formData.employmentStatus === "salarie"
                      ? "Salarié"
                      : formData.employmentStatus === "auto-entrepreneur"
                      ? "Auto-entrepreneur"
                      : "-"}
                  </div>
                </div>

                {formData.employmentStatus === "auto-entrepreneur" && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">SIRET</div>
                    <div className="text-base text-gray-900 font-mono">
                      {formData.siret || "-"}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
