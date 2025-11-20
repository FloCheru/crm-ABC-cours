import { useNavigate, useParams } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { PageHeader } from "../../components";
import type { Professor } from "../../types/professor";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import type { RendezVous } from "../../types/rdv";
import rdvService from "../../services/rdvService";
import { professorService } from "../../services/professorService";
import { useAuthStore } from "../../stores";
import { enterProfessorView } from "../../utils/professorSimulation";
import { Eye } from "lucide-react";

export const ProfesseurDetails: React.FC = () => {
  const navigate = useNavigate();
  const { professorId } = useParams<{ professorId: string }>();
  const [professor, setProfessor] = useState<Professor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setError] = useState<string>("");
  const [isEditingBasic, setIsEditingBasic] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [formData, setFormData] = useState<Partial<Professor>>({});
  const [notesData, setNotesData] = useState<string>("");

  // États pour les rendez-vous
  const [rdvs, setRdvs] = useState<RendezVous[]>([]);
  const [isLoadingRdvs, setIsLoadingRdvs] = useState(false);

  // Récupérer le rôle de l'utilisateur connecté
  const user = useAuthStore((state) => state.user);
  const currentUserRole = user?.role || "admin";

  useEffect(() => {
    if (professorId) {
      loadProfessorData();
      loadRdvs();
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
      setNotesData(professor.notes || "");
    } catch (err) {
      console.error("Erreur lors du chargement du professeur:", err);
      setError("Impossible de charger les détails du professeur");
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (!professorId) {
      navigate("/admin/professeurs", { replace: true });
    }
  }, [professorId, navigate]);

  const handleSaveBasic = async () => {
    console.log("Données à sauvegarder (Infos):", formData);
    setProfessor(formData as Professor);
    setIsEditingBasic(false);
  };

  const handleCancelBasic = () => {
    setFormData(professor || {});
    setIsEditingBasic(false);
  };

  const handleSaveNotes = () => {
    if (professor) {
      const updatedProfessor = { ...professor, notes: notesData };
      setProfessor(updatedProfessor);
      console.log("Notes sauvegardées:", notesData);
    }
    setIsEditingNotes(false);
  };

  const handleCancelNotes = () => {
    setNotesData(professor?.notes || "");
    setIsEditingNotes(false);
  };

  const handleInputChange = (field: keyof Professor, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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

  const handleEnterProfessorView = () => {
    if (professor && professorId) {
      enterProfessorView({
        id: professorId,
        firstName: professor.firstName,
        lastName: professor.lastName,
      });
      navigate("/professor/profil");
    }
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
    field: keyof Professor,
    type: "text" | "email" | "tel" | "textarea" = "text",
    isFullWidth = false
  ) => (
    <div className={isFullWidth ? "col-span-2" : ""}>
      <label className="text-xs text-gray-500 mb-1 block">{label}</label>
      {type === "textarea" ? (
        <textarea
          value={(formData[field] as string) || ""}
          onChange={(e) => handleInputChange(field, e.target.value)}
          className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none min-h-[100px]"
        />
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
        title="Détails du Professeur"
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

      {/* Boutons d'action */}
      <div className="container mx-auto px-4 pt-12 max-w-6xl">
        <div className="flex gap-md">
          <button
            onClick={() =>
              navigate(`/admin/professeur-details/${professorId}/documents`)
            }
            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 flex items-center gap-2"
          >
            📄 Voir les documents
          </button>
          <button
            onClick={handleEnterProfessorView}
            className="px-4 py-2 bg-secondary text-white text-sm rounded-md hover:bg-secondary-hover flex items-center gap-2"
          >
            <Eye size={16} />
            Voir comme professeur
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="bg-transparent border-b border-gray-200 rounded-none p-0 h-auto w-full justify-start">
            <TabsTrigger
              value="info"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3"
            >
              Informations
            </TabsTrigger>
            <TabsTrigger
              value="rdv"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3"
            >
              Rendez-vous
            </TabsTrigger>
          </TabsList>

          {/* Section Informations */}
          <TabsContent value="info" className="mt-6">
            {/* Card Infos de base */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 relative">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Informations de base
                  </h3>
                  <p className="text-sm text-gray-500">
                    Identité et coordonnées du professeur
                  </p>
                </div>
                {!isEditingBasic && (
                  <button
                    onClick={() => setIsEditingBasic(true)}
                    className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                  >
                    Edit ✏️
                  </button>
                )}
              </div>

              {isEditingBasic ? (
                <>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                    {renderEditField("Prénom *", "firstName")}
                    {renderEditField("Nom *", "lastName")}
                    {renderEditField("Email *", "email", "email")}
                    {renderEditField("Téléphone", "phone", "tel")}
                    {renderEditField("Code postal", "postalCode")}
                    {renderEditField(
                      "Biographie",
                      "bio",
                      "textarea",
                      true
                    )}
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={handleSaveBasic}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                    >
                      Sauvegarder
                    </button>
                    <button
                      onClick={handleCancelBasic}
                      className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50"
                    >
                      Annuler
                    </button>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                  {renderField("Prénom *", professor.firstName)}
                  {renderField("Nom *", professor.lastName)}
                  {renderField("Email *", professor.email)}
                  {renderField("Téléphone", professor.phone)}
                  {renderField("Code postal", professor.postalCode)}
                  {renderField("Biographie", professor.bio, true)}
                </div>
              )}
            </div>

            {/* Card Notes */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 relative mt-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Notes administratives
                </h3>
                {!isEditingNotes && (
                  <button
                    onClick={() => setIsEditingNotes(true)}
                    className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                  >
                    Edit ✏️
                  </button>
                )}
              </div>

              {isEditingNotes ? (
                <div className="space-y-4">
                  <div>
                    <Label
                      htmlFor="admin-notes"
                      className="text-sm text-gray-700 mb-2 block"
                    >
                      Notes
                    </Label>
                    <Textarea
                      id="admin-notes"
                      value={notesData}
                      onChange={(e) => setNotesData(e.target.value)}
                      placeholder="Saisissez vos notes..."
                      className="min-h-[120px]"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveNotes}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                    >
                      Sauvegarder
                    </button>
                    <button
                      onClick={handleCancelNotes}
                      className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {professor.notes || "Aucune note"}
                </p>
              )}
            </div>

            {/* Card Statut */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 relative mt-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Statut
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  État actuel du professeur
                </p>
              </div>
              <div className="text-base text-gray-900">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  professor.status === "active"
                    ? "bg-green-100 text-green-800"
                    : professor.status === "inactive"
                    ? "bg-gray-100 text-gray-800"
                    : professor.status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}>
                  {professor.status === "active"
                    ? "Actif"
                    : professor.status === "inactive"
                    ? "Inactif"
                    : professor.status === "pending"
                    ? "En attente"
                    : "Suspendu"}
                </span>
              </div>
            </div>
          </TabsContent>

          {/* Section Rendez-vous */}
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
    </main>
  );
};