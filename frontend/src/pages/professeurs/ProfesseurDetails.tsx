import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { PageHeader, Modal } from "../../components";
import type {
  Teacher,
  DisabilityKnowledge,
  CurrentSituation,
} from "../../types/teacher";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { Checkbox } from "../../components/ui/checkbox";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import type { RendezVous } from "../../types/rdv";
import rdvService from "../../services/rdvService";
import { useAuthStore } from "../../stores";

export const ProfesseurDetails: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const teacherId = localStorage.getItem("teacherId");
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setError] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Teacher>>({});
  const [isEditingComments, setIsEditingComments] = useState(false);
  const [commentsData, setCommentsData] = useState<string>("");

  // États pour les rendez-vous
  const [rdvs, setRdvs] = useState<RendezVous[]>([]);
  const [isRdvModalOpen, setIsRdvModalOpen] = useState(false);
  const [selectedRdv, setSelectedRdv] = useState<RendezVous | null>(null);
  const [isLoadingRdvs, setIsLoadingRdvs] = useState(false);

  // Récupérer le rôle de l'utilisateur connecté
  const user = useAuthStore((state) => state.user);
  const currentUserRole = user?.role || "admin";

  useEffect(() => {
    if (teacherId) {
      loadTeacherData();
      loadRdvs();
    } else {
      setError("ID de professeur manquant");
      setIsLoading(false);
    }
  }, [teacherId]);

  const loadTeacherData = async () => {
    try {
      setIsLoading(true);
      const mockTeacher: Teacher = {
        _id: teacherId!,
        gender: "Mme",
        firstName: "Marie",
        lastName: "Dupont",
        birthName: "",
        birthDate: "1990-05-15",
        socialSecurityNumber: "",
        birthCountry: "France",
        email: "marie.dupont@email.com",
        phone: "0123456789",
        secondaryPhone: "",
        address: "",
        addressComplement: "",
        postalCode: "75001",
        city: "Paris",
        inseeCity: "",
        distributionOffice: "",
        transportMode: "voiture",
        courseLocation: "domicile",
        secondaryAddress: "",
        experience: "",
        certifications: "",
        miscellaneous: "",
        disabilityKnowledge: [],
        additionalNotes: "",
        currentSituation: [],
        identifier: "MarieDupont",
        notifyEmail: "marie.dupont.notif@email.com",
        createdAt: new Date("2024-01-15").toISOString(),
        updatedAt: new Date("2024-03-10").toISOString(),
      };
      setTeacher(mockTeacher);
      setFormData(mockTeacher);
      setCommentsData(mockTeacher.additionalNotes || "");
    } catch (err) {
      console.error("Erreur lors du chargement du professeur:", err);
      setError("Impossible de charger les détails du professeur");
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (!teacherId) {
      navigate("/admin/professeurs", { replace: true });
    }
  }, [teacherId, navigate]);

  const handleSave = async () => {
    console.log("Données à sauvegarder:", formData);
    setTeacher(formData as Teacher);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData(teacher || {});
    setIsEditing(false);
  };

  const handleSaveComments = () => {
    if (teacher) {
      const updatedTeacher = { ...teacher, additionalNotes: commentsData };
      setTeacher(updatedTeacher);
      console.log("Commentaires sauvegardés:", commentsData);
    }
    setIsEditingComments(false);
  };

  const handleCancelComments = () => {
    setCommentsData(teacher?.additionalNotes || "");
    setIsEditingComments(false);
  };

  const handleInputChange = (field: keyof Teacher, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArrayValue = <T extends string>(
    field: keyof Teacher,
    value: T
  ) => {
    setFormData((prev) => {
      const currentArray = (prev[field] as T[]) || [];
      const newArray = currentArray.includes(value)
        ? currentArray.filter((item) => item !== value)
        : [...currentArray, value];
      return { ...prev, [field]: newArray };
    });
  };

  const loadRdvs = async () => {
    if (!teacherId) return;

    try {
      setIsLoadingRdvs(true);
      const rdvsList = await rdvService.getRdvsByProfessor(teacherId);
      setRdvs(rdvsList);
    } catch (err) {
      console.error("Erreur lors du chargement des RDV:", err);
    } finally {
      setIsLoadingRdvs(false);
    }
  };

  const handleOpenRdvModal = (rdv?: RendezVous) => {
    setSelectedRdv(rdv || null);
    setIsRdvModalOpen(true);
  };

  const handleCloseRdvModal = () => {
    setSelectedRdv(null);
    setIsRdvModalOpen(false);
  };

  const handleRdvSuccess = () => {
    loadRdvs();
    handleCloseRdvModal();
  };

  const handleDeleteRdv = async (rdvId: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce rendez-vous ?")) {
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
    if (currentUserRole === "professor" && rdv.entityType === "professor-student") return true;
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
    // TODO: Récupérer les noms réels depuis les IDs
    if (rdv.entityType === "admin-professor") {
      return "Admin ABC"; // Placeholder
    } else if (rdv.entityType === "professor-student") {
      return "Élève"; // Placeholder - devrait récupérer le nom de l'élève
    }
    return "-";
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

  if (!teacherId || !teacher) {
    return null;
  }

  const disabilityOptions: { value: DisabilityKnowledge; label: string }[] = [
    { value: "aucune", label: "Aucune" },
    { value: "dys", label: "Dys (dyslexie, dyspraxie, etc.)" },
    { value: "autisme", label: "Autisme" },
    { value: "déficience_visuelle", label: "Déficience visuelle" },
    { value: "déficience_auditive", label: "Déficience auditive" },
    { value: "handicap_moteur", label: "Handicap moteur" },
    { value: "handicap_cognitif", label: "Handicap cognitif" },
    { value: "autre", label: "Autre" },
  ];

  const situationOptions: { value: CurrentSituation; label: string }[] = [
    {
      value: "enseignant_education_nationale",
      label:
        "Enseignant de l'Éducation Nationale en poste, en disponibilité ou à la retraite",
    },
    {
      value: "enseignant_vacataire_contractuel",
      label:
        "Enseignant vacataire ou contractuel actif qui opère dans le public ou dans le privé",
    },
    {
      value: "etudiant_master_professorat",
      label: "Étudiant en master Enseignement ou Professorat",
    },
    {
      value: "enseignant_avec_activite_domicile",
      label: "Enseignant avec pour seule activité le cours à domicile",
    },
    {
      value: "enseignant_activite_professionnelle",
      label:
        "Enseignant ayant une autre activité professionnelle autre que l'enseignement et dispensant des cours à domicile",
    },
    {
      value: "enseignant_formation_professionnelle",
      label: "Enseignant en formation professionnelle",
    },
    { value: "etudiant", label: "Étudiant" },
    { value: "autre", label: "Autre" },
  ];

  const renderField = (
    label: string,
    value: string | undefined,
    isFullWidth = false
  ) => (
    <div className={isFullWidth ? "col-span-2" : ""}>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-base text-gray-900">{value || "-"}</div>
    </div>
  );

  const renderEditField = (
    label: string,
    field: keyof Teacher,
    type: "text" | "email" | "tel" | "date" | "select" = "text",
    options?: { value: string; label: string }[],
    isFullWidth = false
  ) => (
    <div className={isFullWidth ? "col-span-2" : ""}>
      <label className="text-xs text-gray-500 mb-1 block">{label}</label>
      {type === "select" ? (
        <select
          value={(formData[field] as string) || ""}
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
          value={(formData[field] as string) || ""}
          onChange={(e) => handleInputChange(field, e.target.value)}
          className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      )}
    </div>
  );

  return (
    <main className="bg-gray-50 min-h-screen">
      <PageHeader
        title="Détails du Professeur"
        breadcrumb={[
          { label: "Professeurs", href: "/admin/professeurs" },
          { label: "Détails" },
        ]}
        description={
          teacher
            ? `Créé le ${new Date(teacher.createdAt).toLocaleDateString(
                "fr-FR"
              )}${
                teacher.updatedAt
                  ? ` • Modifié le ${new Date(
                      teacher.updatedAt
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

      {/* Encart Commentaires */}
      <div className="container mx-auto px-4 pt-8 max-w-6xl">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Commentaires admin
            </h3>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/admin/professeur-documents')}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 flex items-center gap-2"
              >
                📄 Voir les documents
              </button>
              {!isEditingComments && (
                <button
                  onClick={() => setIsEditingComments(true)}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                >
                  Edit ✏️
                </button>
              )}
            </div>
          </div>

          {isEditingComments ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="admin-comments" className="text-sm text-gray-700 mb-2 block">
                  Commentaires admin
                </Label>
                <Textarea
                  id="admin-comments"
                  value={commentsData}
                  onChange={(e) => setCommentsData(e.target.value)}
                  placeholder="Saisissez vos commentaires..."
                  className="min-h-[120px]"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSaveComments}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                >
                  Sauvegarder
                </button>
                <button
                  onClick={handleCancelComments}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {teacher.additionalNotes || "Aucun commentaire"}
            </p>
          )}
        </div>
      </div>

      {/* Section Rendez-vous */}
      <div className="container mx-auto px-4 pt-6 max-w-6xl">
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
                onClick={() => handleOpenRdvModal()}
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
                                onClick={() => handleOpenRdvModal(rdv)}
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
                              onClick={() => handleOpenRdvModal(rdv)}
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
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
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
              value="cv"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3"
            >
              CV
            </TabsTrigger>
            <TabsTrigger
              value="situation"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3"
            >
              Situation actuelle
            </TabsTrigger>
          </TabsList>

          {/* Section Identité */}
          <TabsContent value="identite" className="mt-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 relative">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Identité
                  </h3>
                  <p className="text-sm text-gray-500">
                    Informations personnelles du professeur
                  </p>
                </div>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                  >
                    Edit ✏️
                  </button>
                )}
              </div>

              {isEditing ? (
                <>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-6">
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
                    {renderEditField(
                      "Date de naissance *",
                      "birthDate",
                      "date"
                    )}
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
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                    >
                      Sauvegarder
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
                  {renderField("Genre *", teacher.gender)}
                  {renderField("Prénom *", teacher.firstName)}
                  {renderField("Nom *", teacher.lastName)}
                  {renderField(
                    "Nom de naissance (si différent)",
                    teacher.birthName
                  )}
                  {renderField(
                    "Date de naissance *",
                    new Date(teacher.birthDate).toLocaleDateString("fr-FR")
                  )}
                  {renderField(
                    "N° de sécurité sociale",
                    teacher.socialSecurityNumber
                  )}
                  {renderField("Pays de naissance", teacher.birthCountry, true)}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Section Coordonnées */}
          <TabsContent value="coordonnees" className="mt-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 relative">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Coordonnées
                  </h3>
                  <p className="text-sm text-gray-500">
                    Informations de contact et adresse
                  </p>
                </div>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                  >
                    Edit ✏️
                  </button>
                )}
              </div>

              {isEditing ? (
                <>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                    {renderEditField("Email *", "email", "email")}
                    {renderEditField("Tél principal *", "phone", "tel")}
                    {renderEditField("Tél secondaire", "secondaryPhone", "tel")}
                    {renderEditField("Code postal *", "postalCode")}
                    {renderEditField(
                      "Adresse",
                      "address",
                      "text",
                      undefined,
                      true
                    )}
                    {renderEditField(
                      "Complément d'adresse",
                      "addressComplement",
                      "text",
                      undefined,
                      true
                    )}
                    {renderEditField("Commune", "city")}
                    {renderEditField("Commune INSEE", "inseeCity")}
                    {renderEditField(
                      "Bureau distributeur",
                      "distributionOffice",
                      "text",
                      undefined,
                      true
                    )}
                    {renderEditField("Déplacement", "transportMode", "select", [
                      { value: "", label: "Sélectionner..." },
                      { value: "voiture", label: "Voiture" },
                      { value: "vélo", label: "Vélo" },
                      { value: "transports", label: "Transports en commun" },
                      { value: "moto", label: "Moto" },
                    ])}
                    {renderEditField("Cours", "courseLocation", "select", [
                      { value: "", label: "Sélectionner..." },
                      { value: "domicile", label: "À domicile" },
                      { value: "visio", label: "En visio" },
                    ])}
                    {renderEditField(
                      "Adresse secondaire",
                      "secondaryAddress",
                      "text",
                      undefined,
                      true
                    )}
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                    >
                      Sauvegarder
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
                  {renderField("Email *", teacher.email)}
                  {renderField("Tél principal *", teacher.phone)}
                  {renderField("Tél secondaire", teacher.secondaryPhone)}
                  {renderField("Code postal *", teacher.postalCode)}
                  {renderField("Adresse", teacher.address, true)}
                  {renderField(
                    "Complément d'adresse",
                    teacher.addressComplement,
                    true
                  )}
                  {renderField("Commune", teacher.city)}
                  {renderField("Commune INSEE", teacher.inseeCity)}
                  {renderField(
                    "Bureau distributeur",
                    teacher.distributionOffice,
                    true
                  )}
                  {renderField("Déplacement", teacher.transportMode)}
                  {renderField("Cours", teacher.courseLocation)}
                  {renderField(
                    "Adresse secondaire",
                    teacher.secondaryAddress,
                    true
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Section CV */}
          <TabsContent value="cv" className="mt-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 relative">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">CV</h3>
                  <p className="text-sm text-gray-500">
                    Expérience professionnelle et compétences
                  </p>
                </div>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                  >
                    Edit ✏️
                  </button>
                )}
              </div>

              {isEditing ? (
                <>
                  <div className="space-y-6">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">
                        Expérience
                      </label>
                      <textarea
                        value={formData.experience || ""}
                        onChange={(e) =>
                          handleInputChange("experience", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none min-h-[100px]"
                        placeholder="Décrivez votre expérience professionnelle..."
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">
                        Formation / Certifications
                      </label>
                      <textarea
                        value={formData.certifications || ""}
                        onChange={(e) =>
                          handleInputChange("certifications", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none min-h-[100px]"
                        placeholder="Diplômes, certifications, formations..."
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">
                        Divers
                      </label>
                      <textarea
                        value={formData.miscellaneous || ""}
                        onChange={(e) =>
                          handleInputChange("miscellaneous", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none min-h-[100px]"
                        placeholder="Informations complémentaires..."
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 mb-2 block">
                        Connaissance du public en situation de handicap
                      </label>
                      <div className="space-y-2">
                        {disabilityOptions.map((option) => (
                          <div
                            key={option.value}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`disability-${option.value}`}
                              checked={
                                formData.disabilityKnowledge?.includes(
                                  option.value
                                ) || false
                              }
                              onCheckedChange={() =>
                                toggleArrayValue<DisabilityKnowledge>(
                                  "disabilityKnowledge",
                                  option.value
                                )
                              }
                            />
                            <label
                              htmlFor={`disability-${option.value}`}
                              className="text-sm cursor-pointer"
                            >
                              {option.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">
                        Ce que je juge bon de signaler
                      </label>
                      <textarea
                        value={formData.additionalNotes || ""}
                        onChange={(e) =>
                          handleInputChange("additionalNotes", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none min-h-[100px]"
                        placeholder="Informations que vous souhaitez signaler..."
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                    >
                      Sauvegarder
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
                    <div className="text-xs text-gray-500 mb-1">Expérience</div>
                    <div className="text-base text-gray-900 whitespace-pre-wrap">
                      {teacher.experience || "-"}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 mb-1">
                      Formation / Certifications
                    </div>
                    <div className="text-base text-gray-900 whitespace-pre-wrap">
                      {teacher.certifications || "-"}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 mb-1">Divers</div>
                    <div className="text-base text-gray-900 whitespace-pre-wrap">
                      {teacher.miscellaneous || "-"}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 mb-1">
                      Connaissance du public en situation de handicap
                    </div>
                    <div className="text-base text-gray-900">
                      {teacher.disabilityKnowledge &&
                      teacher.disabilityKnowledge.length > 0
                        ? teacher.disabilityKnowledge
                            .map(
                              (val) =>
                                disabilityOptions.find(
                                  (opt) => opt.value === val
                                )?.label
                            )
                            .join(", ")
                        : "-"}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 mb-1">
                      Ce que je juge bon de signaler
                    </div>
                    <div className="text-base text-gray-900 whitespace-pre-wrap">
                      {teacher.additionalNotes || "-"}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Section Situation actuelle */}
          <TabsContent value="situation" className="mt-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 relative">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Situation actuelle
                  </h3>
                  <p className="text-sm text-gray-500">
                    Merci de cocher les cases correspondant à votre situation
                    actuelle
                  </p>
                </div>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                  >
                    Edit ✏️
                  </button>
                )}
              </div>

              {isEditing ? (
                <>
                  <div className="space-y-3">
                    {situationOptions.map((option) => (
                      <div
                        key={option.value}
                        className="flex items-start space-x-3"
                      >
                        <Checkbox
                          id={`situation-${option.value}`}
                          checked={
                            formData.currentSituation?.includes(option.value) ||
                            false
                          }
                          onCheckedChange={() =>
                            toggleArrayValue<CurrentSituation>(
                              "currentSituation",
                              option.value
                            )
                          }
                          className="mt-0.5"
                        />
                        <label
                          htmlFor={`situation-${option.value}`}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                    >
                      Sauvegarder
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
                <div className="space-y-2">
                  {teacher.currentSituation &&
                  teacher.currentSituation.length > 0 ? (
                    teacher.currentSituation.map((val) => {
                      const option = situationOptions.find(
                        (opt) => opt.value === val
                      );
                      return option ? (
                        <div key={val} className="flex items-start space-x-2">
                          <span className="text-blue-600 mt-0.5">✓</span>
                          <span className="text-sm text-gray-900">
                            {option.label}
                          </span>
                        </div>
                      ) : null;
                    })
                  ) : (
                    <p className="text-sm text-gray-500">
                      Aucune situation sélectionnée
                    </p>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal RDV */}
      {isRdvModalOpen && (
        <Modal
          isOpen={isRdvModalOpen}
          onClose={handleCloseRdvModal}
          type="rdv"
          data={{
            ...(selectedRdv || {}),
            rdvId: selectedRdv?._id,
            professorId: teacherId,
          }}
          onSuccess={handleRdvSuccess}
          mode={selectedRdv && !canEditRdv(selectedRdv) ? "view" : "edit"}
        />
      )}
    </main>
  );
};
