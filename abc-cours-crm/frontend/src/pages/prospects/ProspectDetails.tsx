import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Navbar,
  Button,
  ButtonGroup,
  StatusBanner,
  DataCard,
  Table,
  RdvModal,
  AddStudentModal,
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

  // Fonction de rafraîchissement après mise à jour
  const refetchProspect = async () => {
    if (!familyId) return;
    try {
      const data = await familyService.getFamily(familyId);
      setProspect(data);
    } catch (err) {
      console.error("Erreur lors du rafraîchissement:", err);
    }
  };

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

  // État pour la modal d'ajout d'élève
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);

  // Fonction pour charger les détails du prospect
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

  useEffect(() => {
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
      setShowRdvModal(false);
      setRdvFormData({
        assignedAdminId: "",
        date: "",
        time: "",
        type: "physique",
        notes: ""
      });
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
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleBack}>
            Retour
          </Button>
          <Button variant="primary" onClick={handleCreateNDR}>
            Créer NDR
          </Button>
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
            value: getDisplayValue(prospect, field.field),
            type: field.type as "text" | "email" | "tel" | "number" | "date" | "textarea" | "select",
            required: (field as any).required || false,
            placeholder: field.placeholder
          }))}
          onSave={async (data) => {
            // Construire l'objet de données pour l'API
            const updateData: any = {
              primaryContact: {},
              address: {}
            };
            
            // Mapper les données du formulaire vers les champs de l'API
            Object.entries(data).forEach(([key, value]) => {
              const field = fieldConfig.personal.find(f => f.key === key);
              if (field) {
                const fieldParts = field.field.split('.');
                if (fieldParts.length === 2) {
                  const [parent, child] = fieldParts;
                  updateData[parent][child] = value;
                }
              }
            });
            
            // Mettre à jour via l'API
            await familyService.updateFamily(familyId!, updateData);
            await refetchProspect();
          }}
          className="mb-8"
        />


        {/* Demande de cours */}
        <DataCard
          title="Demande de cours"
          fields={fieldConfig.courseData.map(field => ({
            key: field.key,
            label: field.label,
            value: getDisplayValue(prospect, field.field),
            type: field.type as "text" | "email" | "tel" | "number" | "date" | "textarea" | "select",
            required: (field as any).required || false,
            placeholder: field.placeholder
          }))}
          onSave={async (data) => {
            // Construire l'objet de données pour l'API
            const updateData: any = {
              demande: {},
              address: {}
            };
            
            // Mapper les données du formulaire vers les champs de l'API
            Object.entries(data).forEach(([key, value]) => {
              const field = fieldConfig.courseData.find(f => f.key === key);
              if (field && !field.readOnly) {
                const fieldParts = field.field.split('.');
                if (fieldParts.length === 2) {
                  const [parent, child] = fieldParts;
                  updateData[parent][child] = value;
                }
              }
            });
            
            // Mettre à jour via l'API
            await familyService.updateFamily(familyId!, updateData);
            await refetchProspect();
          }}
          className="mb-8"
        />
        
        {/* Statut prospect */}
        <DataCard
          title="Statut"
          fields={[
            {
              key: "prospectStatus",
              label: "Statut prospect",
              value: prospect.prospectStatus || "",
              type: "select" as const,
              options: [
                { value: "", label: "Sélectionner un statut" },
                ...statusOptions.map(option => ({
                  value: option.value,
                  label: option.label
                }))
              ]
            }
          ]}
          onSave={async (data) => {
            await familyService.updateFamily(familyId!, {
              prospectStatus: data.prospectStatus || null
            });
            await refetchProspect();
          }}
          className="mb-8"
        />

        {/* Élèves */}
        <DataCard
          title={`Élèves (${students.length})`}
          fields={[]}
        >
          <div>
            {students.length > 0 ? (
              <Table
                columns={[
                  {
                    key: "firstName",
                    label: "Prénom",
                    render: (value) => value
                  },
                  {
                    key: "lastName",
                    label: "Nom",
                    render: (value) => value
                  },
                  {
                    key: "dateOfBirth",
                    label: "Né(e) le",
                    render: (value) => value ? new Date(value).toLocaleDateString("fr-FR") : "-"
                  },
                  {
                    key: "courseLocation",
                    label: "Lieu des cours",
                    render: (_, row: any) => {
                      if (!row.courseLocation?.type) return "-";
                      return row.courseLocation.type === "domicile" ? "À domicile" : 
                             row.courseLocation.type === "professeur" ? "Chez le professeur" : "Autre";
                    }
                  },
                  {
                    key: "postalCode",
                    label: "Code postal",
                    render: (_, row: any) => row.courseLocation?.address?.postalCode || "-"
                  },
                  {
                    key: "city",
                    label: "Ville",
                    render: (_, row: any) => row.courseLocation?.address?.city || "-"
                  },
                  {
                    key: "phone",
                    label: "Tél",
                    render: (_, row: any) => row.contact?.phone || "-"
                  },
                  {
                    key: "availability",
                    label: "Disponibilités",
                    render: (value) => value || "-"
                  },
                  {
                    key: "comments",
                    label: "Com.",
                    render: (value, row: any) => {
                      const comment = value || row.notes || "";
                      return comment.length > 30 ? `${comment.substring(0, 30)}...` : comment || "-";
                    }
                  },
                  {
                    key: "settlementNoteIds",
                    label: "NDR",
                    render: (_, row: any) => (
                      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full">
                        {row.settlementNoteIds?.length || 0}
                      </span>
                    )
                  },
                  {
                    key: "actions",
                    label: "Actions",
                    render: (_, row: any) => (
                      <div className="table__actions">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => {
                            // TODO: Implémenter modification élève
                            console.log("Modification élève:", row);
                          }}
                          title="Modifier l'élève"
                        >
                          ✏️
                        </Button>
                        <Button
                          size="sm"
                          variant="error"
                          onClick={() => {
                            if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'élève ${row.firstName} ${row.lastName} ?`)) {
                              // TODO: Implémenter suppression élève
                              console.log("Suppression élève:", row);
                            }
                          }}
                          title="Supprimer l'élève"
                        >
                          ✕
                        </Button>
                      </div>
                    )
                  }
                ]}
                data={students.map(student => ({ ...student, id: student._id || `student-${students.indexOf(student)}` }))}
                itemsPerPage={10}
              />
            ) : (
              <div>
                <p>Aucun élève enregistré</p>
              </div>
            )}
            
            <div>
              <Button
                variant="primary"
                onClick={() => setShowAddStudentModal(true)}
              >
                Ajouter un élève
              </Button>
            </div>
          </div>
        </DataCard>

        {/* Actions de suivi */}
        <DataCard
          title="Suivi"
          fields={fieldConfig.tracking.map(field => {
            let value;
            if (field.key === "createdAt") {
              value = new Date(prospect.createdAt).toLocaleDateString("fr-FR");
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
          onSave={async (data) => {
            const updateData: any = {};
            
            // Mapper les données du formulaire vers les champs de l'API  
            Object.entries(data).forEach(([key, value]) => {
              const field = fieldConfig.tracking.find(f => f.key === key);
              if (field && !field.readOnly) {
                const processedValue = field.type === "date" && value 
                  ? new Date(value as string) 
                  : value;
                updateData[field.field] = processedValue;
              }
            });
            
            // Mettre à jour via l'API
            await familyService.updateFamily(familyId!, updateData);
            await refetchProspect();
          }}
          className="mb-8"
        />

        {/* Section Suivi des RDV */}
        <DataCard
          title={`Suivi des RDV (${rdvs.length})`}
          fields={[]}
          className="mb-8"
        >
          <div>
            {isLoadingRdvs ? (
              <div>
                <div>Chargement des RDV...</div>
              </div>
            ) : rdvs.length > 0 ? (
              <Table
                columns={[
                  {
                    key: "date",
                    label: "Date",
                    render: (_, row: any) => new Date(row.date).toLocaleDateString('fr-FR')
                  },
                  {
                    key: "time",
                    label: "Heure",
                    render: (value) => value
                  },
                  {
                    key: "status",
                    label: "Statut",
                    render: (value) => 
                      value === 'planifie' ? 'Planifié' :
                      value === 'realise' ? 'Réalisé' :
                      value === 'annule' ? 'Annulé' : value
                  },
                  {
                    key: "type",
                    label: "Type",
                    render: (value) => value === 'physique' ? 'Physique' : 'Virtuel'
                  },
                  {
                    key: "assignedAdminId",
                    label: "Admin assigné",
                    render: (value) => {
                      if (!value) return "Non assigné";
                      return typeof value === 'object' 
                        ? `${value.firstName} ${value.lastName}` 
                        : value;
                    }
                  },
                  {
                    key: "notes",
                    label: "Notes",
                    render: (value) => value || "-"
                  },
                  {
                    key: "actions",
                    label: "Actions",
                    render: (_, row: any) => (
                      <div className="table__actions">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => {
                            setEditingRdv(row);
                            setRdvFormData({
                              assignedAdminId: row.assignedAdminId || "",
                              date: new Date(row.date).toISOString().split('T')[0],
                              time: row.time,
                              type: row.type,
                              notes: row.notes || ""
                            });
                            setShowRdvModal(true);
                          }}
                          title="Modifier le RDV"
                        >
                          ✏️
                        </Button>
                        <Button
                          size="sm"
                          variant="error"
                          onClick={() => handleDeleteRdv(row._id!)}
                          title="Supprimer le RDV"
                        >
                          ✕
                        </Button>
                      </div>
                    )
                  }
                ]}
                data={rdvs.map(rdv => ({ ...rdv, id: rdv._id }))}
                itemsPerPage={5}
              />
            ) : (
              <div>
                <p>Aucun RDV planifié</p>
              </div>
            )}
            
            <div>
              <Button
                variant="primary"
                onClick={() => {
                  setEditingRdv(null);
                  setRdvFormData({
                    assignedAdminId: "",
                    date: "",
                    time: "",
                    type: "physique",
                    notes: ""
                  });
                  setShowRdvModal(true);
                }}
              >
                Nouveau RDV
              </Button>
            </div>
          </div>
        </DataCard>
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

      {/* Modal ajout d'élève */}
      <AddStudentModal
        isOpen={showAddStudentModal}
        onClose={() => setShowAddStudentModal(false)}
        familyId={prospect?._id || ""}
        onSuccess={() => {
          // Recharger les données du prospect pour afficher le nouvel élève
          if (familyId) {
            loadProspectDetails();
          }
        }}
      />
    </div>
  );
};
