import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Navbar,
  Button,
  ButtonGroup,
  StatusBanner,
  DataCard,
  RdvModal,
} from "../../components";
import { familyService } from "../../services/familyService";
import rdvService from "../../services/rdvService";
import type { Family } from "../../types/family";
import type { ProspectStatus } from "../../components/StatusDot";
import type { RendezVous } from "../../types/rdv";

const statusOptions = [
  { value: "en_reflexion", label: "En réflexion" },
  { value: "interesse_prof_a_trouver", label: "Intéressé - Prof à trouver" },
  { value: "injoignable", label: "Injoignable" },
  { value: "ndr_editee", label: "NDR éditée" },
  { value: "premier_cours_effectue", label: "Premier cours effectué" },
  { value: "rdv_prospect", label: "RDV prospect" },
  { value: "ne_va_pas_convertir", label: "Ne va pas convertir" },
];

export const ProspectDetails: React.FC = () => {
  const { familyId } = useParams<{ familyId: string }>();
  const navigate = useNavigate();
  const [prospect, setProspect] = useState<Family | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // States pour le mode édition
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<Family>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // States pour la gestion des RDV
  const [rdvs, setRdvs] = useState<RendezVous[]>([]);
  const [isLoadingRdvs, setIsLoadingRdvs] = useState(false);
  const [showRdvModal, setShowRdvModal] = useState(false);
  const [editingRdv, setEditingRdv] = useState<RendezVous | null>(null);
  const [rdvFormData, setRdvFormData] = useState({
    assignedAdminId: "",
    date: "",
    time: "",
    type: "physique" as "physique" | "virtuel",
    notes: ""
  });

  useEffect(() => {
    const loadProspectDetails = async () => {
      if (!familyId) {
        setError("ID du prospect manquant");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await familyService.getFamily(familyId);
        setProspect(data);
        await loadRdvs();
      } catch (err) {
        console.error("Erreur lors du chargement du prospect:", err);
        setError("Impossible de charger les détails du prospect");
      } finally {
        setLoading(false);
      }
    };

    loadProspectDetails();
  }, [familyId]);

  // Debug: tracer les changements de showRdvModal
  useEffect(() => {
    console.log("🔴 [DEBUG] ProspectDetails - showRdvModal a changé:", showRdvModal);
  }, [showRdvModal]);

  // Fonctions pour la gestion des RDV
  const loadRdvs = async () => {
    if (!familyId) return;
    
    try {
      setIsLoadingRdvs(true);
      const rdvData = await rdvService.getRdvsByFamily(familyId);
      setRdvs(rdvData);
    } catch (err) {
      console.error("Erreur lors du chargement des RDV:", err);
    } finally {
      setIsLoadingRdvs(false);
    }
  };

  const handleCreateRdv = async () => {
    if (!familyId || !rdvFormData.date || !rdvFormData.time) return;
    
    try {
      const newRdv = await rdvService.createRdv({
        familyId,
        assignedAdminId: rdvFormData.assignedAdminId,
        date: rdvFormData.date,
        time: rdvFormData.time,
        type: rdvFormData.type,
        notes: rdvFormData.notes
      });
      
      setRdvs(prev => [...prev, newRdv]);
      setShowRdvModal(false);
      setRdvFormData({
        assignedAdminId: "",
        date: "",
        time: "",
        type: "physique",
        notes: ""
      });
    } catch (err) {
      console.error("Erreur lors de la création du RDV:", err);
    }
  };

  const handleUpdateRdv = async (rdvId: string, updates: {
    assignedAdminId?: string;
    date?: string;
    time?: string;
    type?: "physique" | "virtuel";
    notes?: string;
  }) => {
    try {
      const updatedRdv = await rdvService.updateRdv(rdvId, updates);
      setRdvs(prev => prev.map(rdv => rdv._id === rdvId ? updatedRdv : rdv));
      setEditingRdv(null);
    } catch (err) {
      console.error("Erreur lors de la mise à jour du RDV:", err);
    }
  };

  const handleDeleteRdv = async (rdvId: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce RDV ?")) return;
    
    try {
      await rdvService.deleteRdv(rdvId);
      setRdvs(prev => prev.filter(rdv => rdv._id !== rdvId));
    } catch (err) {
      console.error("Erreur lors de la suppression du RDV:", err);
    }
  };

  const handleRdvFormChange = (key: string, value: any) => {
    setRdvFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleBack = () => {
    navigate("/prospects");
  };

  const handleCreateNDR = () => {
    if (prospect?._id) {
      navigate(`/admin/dashboard/create/wizard?familyId=${prospect._id}`);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Annuler les modifications
      setEditedData({});
      setValidationErrors({});
      setIsEditing(false);
    } else {
      // Entrer en mode édition
      setEditedData({
        primaryContact: { ...prospect!.primaryContact },
        address: { ...prospect!.address },
        demande: { ...prospect!.demande },
        plannedTeacher: prospect?.plannedTeacher || "",
        prospectStatus: prospect?.prospectStatus || null,
        nextActionReminderSubject: prospect?.nextActionReminderSubject || "",
        nextActionDate: prospect?.nextActionDate || null,
      });
      setIsEditing(true);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    // Validation des champs obligatoires
    if (!editedData.primaryContact?.firstName?.trim()) {
      errors.firstName = "Le prénom est requis";
    }
    if (!editedData.primaryContact?.lastName?.trim()) {
      errors.lastName = "Le nom est requis";
    }
    if (!editedData.primaryContact?.email?.trim()) {
      errors.email = "L'email est requis";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editedData.primaryContact.email)
    ) {
      errors.email = "Format d'email invalide";
    }
    if (!editedData.primaryContact?.primaryPhone?.trim()) {
      errors.primaryPhone = "Le téléphone principal est requis";
    }
    if (!editedData.address?.street?.trim()) {
      errors.street = "La rue est requise";
    }
    if (!editedData.address?.city?.trim()) {
      errors.city = "La ville est requise";
    }
    if (!editedData.address?.postalCode?.trim()) {
      errors.postalCode = "Le code postal est requis";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);
      const updatedProspect = await familyService.updateFamily(
        familyId!,
        editedData
      );
      setProspect(updatedProspect);
      setEditedData({});
      setIsEditing(false);
      setValidationErrors({});
    } catch (err) {
      console.error("Erreur lors de la sauvegarde:", err);
      setError("Impossible de sauvegarder les modifications");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    // Gestion spéciale pour les matières - conversion chaîne vers tableau
    if (field === "demande.subjects") {
      value = value
        ? value
            .split(",")
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 0)
        : [];
    }

    const fieldParts = field.split(".");
    if (fieldParts.length === 1) {
      setEditedData((prev) => ({ ...prev, [field]: value }));
    } else if (fieldParts.length === 2) {
      const [parent, child] = fieldParts;
      setEditedData((prev) => ({
        ...prev,
        [parent]: {
          ...((prev[parent as keyof Family] as Record<string, any>) || {}),
          [child]: value,
        },
      }));
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar activePath="/prospects" />
        <div className="text-center py-8">
          <div className="text-gray-500">Chargement des détails...</div>
        </div>
      </div>
    );
  }

  if (error || !prospect) {
    return (
      <div>
        <Navbar activePath="/prospects" />
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Erreur</h2>
          <p className="text-gray-600 mb-6">{error || "Prospect non trouvé"}</p>
          <Button variant="primary" onClick={handleBack}>
            Retour aux prospects
          </Button>
        </div>
      </div>
    );
  }

  const students = prospect.students || [];

  // Configuration des champs pour le mapping
  const fieldConfig = {
    personal: [
      {
        key: "firstName",
        label: "Prénom",
        field: "primaryContact.firstName",
        type: "text",
        placeholder: "Prénom",
        required: true,
      },
      {
        key: "lastName",
        label: "Nom",
        field: "primaryContact.lastName",
        type: "text",
        placeholder: "Nom",
        required: true,
      },
      {
        key: "primaryPhone",
        label: "Téléphone principal",
        field: "primaryContact.primaryPhone",
        type: "tel",
        placeholder: "06 12 34 56 78",
        required: true,
      },
      {
        key: "secondaryPhone",
        label: "Téléphone secondaire",
        field: "primaryContact.secondaryPhone",
        type: "tel",
        placeholder: "06 12 34 56 78",
        required: false,
      },
      {
        key: "email",
        label: "Email",
        field: "primaryContact.email",
        type: "email",
        placeholder: "email@exemple.com",
        required: true,
      },
      {
        key: "street",
        label: "Rue",
        field: "address.street",
        type: "text",
        placeholder: "Adresse",
        required: true,
      },
      {
        key: "city",
        label: "Ville",
        field: "address.city",
        type: "text",
        placeholder: "Ville",
        required: true,
      },
      {
        key: "postalCode",
        label: "Code postal",
        field: "address.postalCode",
        type: "text",
        placeholder: "Code postal",
        required: true,
      },
    ],
    courseData: [
      {
        key: "subjects",
        label: "Matières demandées",
        field: "demande.subjects",
        type: "text",
        readOnly: true,
      },
      {
        key: "level",
        label: "Niveau",
        field: "demande.level",
        type: "text",
        placeholder: "Niveau d'étude",
      },
      {
        key: "frequency",
        label: "Fréquence",
        field: "demande.frequency",
        type: "text",
        placeholder: "Fréquence des cours",
      },
      {
        key: "department",
        label: "Département",
        field: "address.department",
        type: "text",
        placeholder: "Département",
      },
      {
        key: "phone",
        label: "Téléphone",
        field: "primaryContact.primaryPhone",
        type: "tel",
        placeholder: "06 12 34 56 78",
      },
      {
        key: "email",
        label: "Email",
        field: "primaryContact.email",
        type: "email",
        placeholder: "email@exemple.com",
      },
      {
        key: "availability",
        label: "Disponibilités",
        field: "demande.availability",
        type: "text",
        placeholder: "Horaires et jours disponibles",
      },
    ],
    tracking: [
      {
        key: "nextActionReminderSubject",
        label: "Objet de rappel",
        field: "nextActionReminderSubject",
        type: "text",
        placeholder: "Objet de rappel",
        required: false,
      },
      {
        key: "nextActionDate",
        label: "Date de rappel",
        field: "nextActionDate",
        type: "date",
        placeholder: "",
        required: false,
      },
      {
        key: "createdAt",
        label: "Date de création",
        field: "createdAt",
        type: "text",
        readOnly: true,
      },
    ],
  };

  const getFieldValue = (field: any, path: string) => {
    const keys = path.split(".");
    let value = keys.length === 1 ? field : field?.[keys[0]]?.[keys[1]];

    // Gestion spéciale pour les tableaux (comme subjects)
    if (path === "demande.subjects" && Array.isArray(value)) {
      return value.join(", ");
    }

    return value || "";
  };

  const getDisplayValue = (prospect: Family, path: string) => {
    const keys = path.split(".");
    let value: any =
      keys.length === 1
        ? prospect[path as keyof Family]
        : (prospect as any)[keys[0]]?.[keys[1]];

    if (path === "nextActionDate" && value) {
      return new Date(value).toLocaleDateString("fr-FR");
    }

    // Gestion spéciale pour les tableaux (comme subjects)
    if (path === "demande.subjects" && Array.isArray(value)) {
      return value.length > 0 ? value.join(", ") : "Non renseignées";
    }

    // Gestion spéciale pour plannedTeacher - peut être string ou objet
    if (path === "plannedTeacher") {
      if (!value) return "Non assigné";
      if (typeof value === "string") return value;
      if (
        typeof value === "object" &&
        "firstName" in value &&
        "lastName" in value
      ) {
        return `${(value as any).firstName} ${(value as any).lastName}`;
      }
      return "Non assigné";
    }

    // Gestion spéciale pour nextActionReminderSubject - doit être string
    if (path === "nextActionReminderSubject") {
      if (!value) return "Actions à définir";
      if (typeof value === "string") return value;
      return "Actions à définir";
    }

    return value || "Non renseigné";
  };

  return (
    <div>
      <Navbar activePath="/prospects" />

      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Détails du Prospect</h1>
        <div>
          {isEditing ? (
            <ButtonGroup
              variant="double"
              buttons={[
                {
                  text: "Annuler",
                  variant: "outline",
                  onClick: handleEditToggle,
                  disabled: isSaving,
                },
                {
                  text: isSaving ? "Sauvegarde..." : "Enregistrer",
                  variant: "primary",
                  onClick: handleSave,
                  disabled: isSaving,
                },
              ]}
            />
          ) : (
            <ButtonGroup
              variant="triple"
              buttons={[
                {
                  text: "Retour",
                  variant: "outline",
                  onClick: handleBack,
                },
                {
                  text: "Modifier",
                  variant: "secondary",
                  onClick: handleEditToggle,
                },
                {
                  text: "Créer NDR",
                  variant: "primary",
                  onClick: handleCreateNDR,
                },
              ]}
            />
          )}
        </div>
      </header>

      {/* Bandeau de statut avec couleurs cohérentes */}
      <StatusBanner status={prospect.prospectStatus as ProspectStatus} />

      <main className="space-y-8">
        {/* Informations personnelles */}
        <DataCard
          title="Informations personnelles"
          fields={fieldConfig.personal.map(field => ({
            key: field.key,
            label: field.label,
            value: isEditing 
              ? getFieldValue(editedData, field.field)
              : getDisplayValue(prospect, field.field),
            type: field.type as "text" | "email" | "tel" | "number" | "date" | "textarea" | "select",
            required: (field as any).required || false,
            placeholder: field.placeholder
          }))}
          isEditing={isEditing}
          onChange={(key, value) => {
            const field = fieldConfig.personal.find(f => f.key === key);
            if (field) handleInputChange(field.field, value);
          }}
          errors={validationErrors}
          className="mb-8"
        />


        {/* Demande de cours */}
        <DataCard
          title="Demande de cours"
          fields={fieldConfig.courseData.map(field => ({
            key: field.key,
            label: field.label,
            value: isEditing 
              ? getFieldValue(editedData, field.field)
              : getDisplayValue(prospect, field.field),
            type: field.type as "text" | "email" | "tel" | "number" | "date" | "textarea" | "select",
            required: (field as any).required || false,
            placeholder: field.placeholder
          }))}
          isEditing={isEditing}
          onChange={(key, value) => {
            const field = fieldConfig.courseData.find(f => f.key === key);
            if (field) handleInputChange(field.field, value);
          }}
          errors={validationErrors}
          className="mb-8"
        />
        
        {/* Statut prospect - section séparée */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Statut</h2>
          <div className="grid grid-cols-1 gap-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Statut prospect</label>
              {isEditing ? (
                <select
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={editedData.prospectStatus || ""}
                  onChange={(e) =>
                    handleInputChange("prospectStatus", e.target.value || null)
                  }
                >
                  <option value="">Sélectionner un statut</option>
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-gray-900">{prospect.prospectStatus || "Non défini"}</p>
              )}
            </div>
          </div>
        </section>

        {/* Élèves */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Élèves ({students.length})</h2>
          <div className="space-y-4">
            {students.length > 0 ? (
              students.map((student, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">
                    {student.firstName} {student.lastName}
                  </h3>
                  <div>
                    {student.school?.grade && (
                      <p className="text-gray-600">Niveau: {student.school.grade}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">Aucun élève enregistré</p>
            )}
            {isEditing && (
              <Button
                variant="secondary"
                onClick={() =>
                  navigate(
                    `/families/${prospect._id}/add-student?returnTo=prospectDetails&familyId=${prospect._id}`
                  )
                }
              >
                Ajouter un élève
              </Button>
            )}
          </div>
        </section>

        {/* Actions de suivi */}
        <DataCard
          title="Suivi"
          fields={fieldConfig.tracking.map(field => {
            let value;
            if (field.key === "createdAt") {
              value = new Date(prospect.createdAt).toLocaleDateString("fr-FR");
            } else if (isEditing) {
              if (field.type === "date" && editedData[field.field as keyof typeof editedData]) {
                value = new Date(
                  editedData[field.field as keyof typeof editedData] as string
                ).toISOString().split("T")[0];
              } else {
                value = getFieldValue(editedData, field.field);
              }
            } else {
              value = getDisplayValue(prospect, field.field);
            }
            
            return {
              key: field.key,
              label: field.label,
              value,
              type: field.type as "text" | "email" | "tel" | "number" | "date" | "textarea" | "select",
              required: field.required,
              placeholder: field.placeholder
            };
          })}
          isEditing={isEditing && fieldConfig.tracking.some(f => !f.readOnly)} 
          onChange={(key, value) => {
            const field = fieldConfig.tracking.find(f => f.key === key);
            if (field && !field.readOnly) {
              const processedValue = field.type === "date" && value 
                ? new Date(value) 
                : value;
              handleInputChange(field.field, processedValue);
            }
          }}
          errors={validationErrors}
          className="mb-8"
        />

        {/* Section Suivi des RDV */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Suivi des RDV ({rdvs.length})</h2>
          

          <div className="space-y-4">
            {isLoadingRdvs ? (
              <div className="text-center py-4">
                <div className="text-gray-500">Chargement des RDV...</div>
              </div>
            ) : rdvs.length > 0 ? (
              <div className="space-y-4">
                {rdvs.map((rdv) => (
                  <div key={rdv._id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex gap-2 mb-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            rdv.status === 'planifie' ? 'bg-blue-100 text-blue-800' :
                            rdv.status === 'realise' ? 'bg-green-100 text-green-800' :
                            rdv.status === 'annule' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {rdv.status === 'planifie' ? 'Planifié' :
                             rdv.status === 'realise' ? 'Réalisé' :
                             rdv.status === 'annule' ? 'Annulé' : rdv.status}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            rdv.type === 'physique' ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'
                          }`}>
                            {rdv.type === 'physique' ? 'Physique' : 'Virtuel'}
                          </span>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(rdv.date).toLocaleDateString('fr-FR')} à {rdv.time}
                          </p>
                          {rdv.notes && (
                            <p className="text-sm text-gray-600 mt-1">{rdv.notes}</p>
                          )}
                          {rdv.assignedAdminId && (
                            <p className="text-sm text-gray-500 mt-1">Admin: {rdv.assignedAdminId}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingRdv(rdv);
                            setRdvFormData({
                              assignedAdminId: rdv.assignedAdminId || "",
                              date: new Date(rdv.date).toISOString().split('T')[0],
                              time: rdv.time,
                              type: rdv.type,
                              notes: rdv.notes || ""
                            });
                            setShowRdvModal(true);
                          }}
                        >
                          Modifier
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleDeleteRdv(rdv._id!)}
                        >
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Aucun RDV planifié</p>
              </div>
            )}
            
            <div className="mt-6 flex gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  console.log("🔵 [DEBUG] Bouton 'Ajouter un RDV' cliqué");
                  console.log("🔵 [DEBUG] showRdvModal avant:", showRdvModal);
                  setShowRdvModal(true);
                  console.log("🔵 [DEBUG] setShowRdvModal(true) appelé");
                }}
              >
                Ajouter un RDV
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Actions */}
      <div className="mt-8">
        <ButtonGroup
          variant="double"
          buttons={[
            {
              text: "Créer NDR",
              variant: "primary",
              onClick: handleCreateNDR,
            },
            {
              text: "Retour à la liste",
              variant: "outline",
              onClick: handleBack,
            },
          ]}
        />
      </div>

      {/* Modal RDV */}
      <RdvModal
        isOpen={showRdvModal}
        onClose={() => {
          console.log("🔴 [DEBUG] RdvModal onClose appelé");
          setShowRdvModal(false);
          setEditingRdv(null);
          setRdvFormData({
            assignedAdminId: "",
            date: "",
            time: "",
            type: "physique",
            notes: ""
          });
        }}
        formData={rdvFormData}
        onFormChange={handleRdvFormChange}
        onSubmit={() => {
          if (editingRdv) {
            handleUpdateRdv(editingRdv._id!, rdvFormData);
          } else {
            handleCreateRdv();
          }
        }}
        isEditing={editingRdv !== null}
      />
    </div>
  );
};
