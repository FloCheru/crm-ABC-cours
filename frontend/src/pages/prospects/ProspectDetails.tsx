import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import {
  
  Button,
  ButtonGroup,
  StatusBanner,
  DataCard,
  Table,
  Modal,
  PageHeader,
  StatusDot,
  ReminderSubjectDropdown,
  DatePicker,
  Container,
} from "../../components";
import { familyService } from "../../services/familyService";
import { subjectService } from "../../services/subjectService";
import { getAllGrades } from "../../constants/schoolLevels";
import type { Family, Student } from "../../types/family";
import type { ProspectStatus } from "../../components/StatusDot";
import type { RendezVous } from "../../types/rdv";
import type { Subject } from "../../types/subject";
import {
  updateProspectStatus,
  updateNextAction,
  updateNextActionDate,
} from "../../utils/prospectUpdates";
import { useStudentModal, createTestStudent } from "../../utils/studentUtils";

type FieldType =
  | "text"
  | "email"
  | "tel"
  | "number"
  | "date"
  | "textarea"
  | "select";

export const ProspectDetails: React.FC = () => {
  const navigate = useNavigate();

  // Récupérer l'ID depuis localStorage
  const prospectId = localStorage.getItem("prospectId");
  const [prospect, setProspect] = useState<Family | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setError] = useState<string>("");

  // RDV depuis le store global
  const prospectRdvs = prospect?.rdvs || [];
  const [showRdvModal, setShowRdvModal] = useState(false);
  const [editingRdv, setEditingRdv] = useState<RendezVous | null>(null);
  // rdvFormData supprimé car non utilisé

  // Utilisation du hook factorisé pour la gestion des élèves
  const {
    showAddStudentModal,
    selectedFamilyForStudent,
    handleAddStudent,
    handleStudentSuccess,
  } = useStudentModal();

  // Créer un élève de test avec données fixes
  const handleAddStudentTest = async () => {
    if (!prospectId) return;

    const refreshData = async () => {
      const updatedFamily = await familyService.getFamily(prospectId);
      setProspect(updatedFamily);
    };

    await createTestStudent(
      prospectId,
      handleStudentSuccess,
      handleAddStudent,
      refreshData
    );
  };
  const [selectedDataForView, setSelectedDataForView] = useState<{
    data: Student | RendezVous;
    type: "student" | "rdv";
  } | null>(null);

  // États pour la sélection des matières
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);

  // Charger le prospect et les matières au montage du composant
  useEffect(() => {
    if (prospectId) {
      loadProspectData();
      loadSubjects();
    } else {
      setError("ID de prospect manquant");
      setIsLoading(false);
    }
  }, [prospectId]);

  // Charger les données du prospect
  const loadProspectData = async () => {
    try {
      setIsLoading(true);
      const prospectData = await familyService.getFamily(prospectId!);
      console.log("Prospect chargé:", prospectData);
      setProspect(prospectData);
    } catch (err) {
      console.error("Erreur lors du chargement du prospect:", err);
      setError("Impossible de charger les détails du prospect");
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les matières disponibles
  const loadSubjects = async () => {
    try {
      setIsLoadingSubjects(true);
      const subjects = await subjectService.getSubjects();
      setAvailableSubjects(subjects);
    } catch (err) {
      console.error("Erreur lors du chargement des matières:", err);
    } finally {
      setIsLoadingSubjects(false);
    }
  };

  // Fonctions RDV supprimées - gérées via Modal component

  const handleDeleteRdv = async (_rdvId: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce RDV ?")) return;

    try {
    } catch (err) {
      console.error(`❌ [RDV DELETE] Erreur:`, err);
    }
  };

  const handleBack = () => {
    navigate("/admin/prospects");
  };

  const handleCreateNDR = () => {
    if (prospect?._id) {
      navigate(`/admin/dashboard/create/wizard?familyId=${prospect._id}`);
    }
  };

  // Handlers avec mise à jour optimiste locale
  const handleStatusChange = async (
    _familyId: string,
    newStatus: ProspectStatus | null
  ) => {
    if (!prospect) return;

    // Mise à jour optimiste locale
    setProspect((prev) =>
      prev ? { ...prev, prospectStatus: newStatus } : prev
    );

    try {
      await updateProspectStatus(prospectId!, newStatus);
      console.log(`✅ Statut du prospect ${prospectId} mis à jour`);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      // En cas d'erreur, restaurer l'état précédent
      setProspect((prev) =>
        prev ? { ...prev, prospectStatus: prospect.prospectStatus } : prev
      );
    }
  };

  const handleNextActionUpdate = async (
    _familyId: string,
    newAction: string
  ) => {
    if (!prospect) return;

    // Mise à jour optimiste locale
    setProspect((prev) => (prev ? { ...prev, nextAction: newAction } : prev));

    try {
      await updateNextAction(prospectId!, newAction);
      console.log(`✅ Prochaine action du prospect ${prospectId} mise à jour`);
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'action:", error);
      // En cas d'erreur, restaurer l'état précédent
      setProspect((prev) =>
        prev ? { ...prev, nextAction: prospect.nextAction } : prev
      );
    }
  };

  const handleNextActionDateUpdate = async (
    _familyId: string,
    newDate: Date | null
  ) => {
    if (!prospect) return;

    // Mise à jour optimiste locale
    setProspect((prev) => (prev ? { ...prev, nextActionDate: newDate } : prev));

    try {
      await updateNextActionDate(prospectId!, newDate);
      console.log(
        `✅ Date de la prochaine action du prospect ${prospectId} mise à jour`
      );
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la date:", error);
      // En cas d'erreur, restaurer l'état précédent
      setProspect((prev) =>
        prev ? { ...prev, nextActionDate: prospect.nextActionDate } : prev
      );
    }
  };

  // Fonction pour afficher les détails d'un élève ou RDV
  const handleViewData = (
    data: Student | RendezVous,
    type: "student" | "rdv"
  ) => {
    setSelectedDataForView({ data, type });
  };

  // Fonction pour supprimer un étudiant
  const handleDeleteStudent = async (
    studentId: string,
    studentName: string
  ) => {
    // Capturer les IDs avant optimistic update pour éviter les race conditions
    const capturedStudentId = studentId;
    const capturedProspectId = prospectId!;
    const capturedStudentName = studentName;

    try {
      // ✨ NOUVEAU: Utiliser familyService avec ActionCache intégré
      await familyService.removeStudent(capturedProspectId, capturedStudentId);
    } catch (error: unknown) {
      console.error("Erreur lors de la suppression de l'étudiant:", error);

      // Gestion d'erreur simplifiée
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("non trouvé") || errorMessage.includes("404")) {
        alert(
          `L'étudiant ${capturedStudentName} n'existe plus dans la base de données.`
        );
      } else {
        alert(
          `Erreur lors de la suppression : ${errorMessage || "Erreur inconnue"}`
        );
      }
    }
  };

  // Redirection si pas d'ID de prospect dans localStorage
  React.useEffect(() => {
    if (!prospectId) {
      navigate("/admin/prospects", { replace: true });
    }
  }, [prospectId, navigate]);

  // Affichage de chargement
  if (isLoading) {
    return (
      <div>
        <PageHeader
          title="Chargement..."
          breadcrumb={[
            { label: "Prospects", href: "/admin/prospects" },
            { label: "Chargement..." },
          ]}
        />
        <Container layout="flex-col">
          <div className="text-center py-8">
            <div className="text-gray-500">
              Chargement des détails du prospect...
            </div>
          </div>
        </Container>
      </div>
    );
  }

  // Redirection si pas de prospect après chargement
  if (!prospectId || !prospect) {
    return null; // Le useEffect va gérer la redirection
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
        field: "primaryContact.address.street",
        type: "text",
        placeholder: "Adresse",
        required: true,
      },
      {
        key: "city",
        label: "Ville",
        field: "primaryContact.address.city",
        type: "text",
        placeholder: "Ville",
        required: true,
      },
      {
        key: "postalCode",
        label: "Code postal",
        field: "primaryContact.address.postalCode",
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
        type: "custom",
        readOnly: false,
      },
      {
        key: "beneficiaryGrade",
        label: "Niveau",
        field: "demande.beneficiaryGrade",
        type: "select",
        options: [
          { value: "", label: "Sélectionner un niveau" },
          ...getAllGrades(),
        ],
      },
      {
        key: "notes",
        label: "Notes sur la demande",
        field: "*notes",
        type: "textarea",
        placeholder: "Précisions sur la demande de cours",
      },
    ],
    tracking: [
      {
        key: "prospectStatus",
        label: "Statut prospect",
        field: "prospectStatus",
        type: "custom",
        readOnly: false,
      },
      {
        key: "nextAction",
        label: "Objet de rappel",
        field: "nextAction",
        type: "custom",
        customRender: () => (
          <ReminderSubjectDropdown
            value={prospect.nextAction || "Actions à définir"}
            familyId={prospectId!}
            onUpdate={handleNextActionUpdate}
          />
        ),
      },
      {
        key: "nextActionDate",
        label: "RRR",
        field: "nextActionDate",
        type: "custom",
        customRender: () => (
          <DatePicker
            value={prospect.nextActionDate || null}
            familyId={prospectId!}
            onUpdate={handleNextActionDateUpdate}
          />
        ),
      },
    ],
    secondaryContact: [
      {
        key: "firstName",
        label: "Prénom",
        field: "secondaryContact.firstName",
        type: "text",
        placeholder: "Prénom",
        required: false,
      },
      {
        key: "lastName",
        label: "Nom",
        field: "secondaryContact.lastName",
        type: "text",
        placeholder: "Nom",
        required: false,
      },
      {
        key: "email",
        label: "Email",
        field: "secondaryContact.email",
        type: "email",
        placeholder: "email@exemple.com",
        required: false,
      },
      {
        key: "phone",
        label: "Téléphone",
        field: "secondaryContact.phone",
        type: "tel",
        placeholder: "06 12 34 56 78",
        required: false,
      },
      {
        key: "relation",
        label: "Lien de parenté",
        field: "secondaryContact.relation",
        type: "select",
        required: false,
        options: [
          { value: "père", label: "Père" },
          { value: "mère", label: "Mère" },
          { value: "tuteur", label: "Tuteur légal" },
        ],
      },
      {
        key: "birthDate",
        label: "Date de naissance",
        field: "secondaryContact.birthDate",
        type: "date",
        required: false,
      },
    ],
  };

  const getDisplayValue = (prospect: Family, path: string) => {
    const keys = path.split(".");
    let value: any = prospect;

    // Naviguer dans l'objet selon le chemin (supporte n niveaux)
    for (const key of keys) {
      value = value?.[key];
      if (value === undefined || value === null) {
        value = "";
        break;
      }
    }

    if (path === "nextActionDate" && value) {
      return new Date(value).toLocaleDateString("fr-FR");
    }

    // Gestion spéciale pour les tableaux (comme subjects)
    if (path === "demande.subjects" && Array.isArray(value)) {
      return value.length > 0 ? value.join(", ") : "";
    }

    // Gestion spéciale pour plannedTeacher - peut être string ou objet
    if (path === "plannedTeacher") {
      if (!value) return "";
      if (typeof value === "string") return value;
      if (
        typeof value === "object" &&
        "firstName" in value &&
        "lastName" in value
      ) {
        return `${(value as any).firstName} ${(value as any).lastName}`;
      }
      return "";
    }

    // Gestion spéciale pour nextAction - doit être string
    if (path === "nextAction") {
      if (!value) return "Actions à définir";
      if (typeof value === "string") return value;
      return "Actions à définir";
    }

    return value || "";
  };

  return (
    <main>
      <PageHeader
        title="Détails du Prospect"
        breadcrumb={[
          { label: "Prospects", href: "/admin/prospects" },
          { label: "Détails" },
        ]}
        description={
          prospect
            ? `Créé le ${new Date(prospect.createdAt).toLocaleDateString(
                "fr-FR"
              )} • Modifié le ${new Date(prospect.updatedAt).toLocaleDateString(
                "fr-FR"
              )}`
            : undefined
        }
        backButton={{
          label: "Retour au tableau des prospects",
          href: "/admin/prospects",
        }}
      />

      {/* Bandeau de statut avec couleurs cohérentes */}
      <StatusBanner status={prospect.prospectStatus as ProspectStatus} />

      <main className="space-y-8">
        {/* Notes */}
        <DataCard
          title="Notes"
          fields={[
            {
              key: "notes",
              label: "Notes sur la demande",
              value: prospect.notes || "",
              type: "textarea",
              placeholder: "Ajouter des notes sur la demande",
            },
          ]}
          onSave={async (data) => {
            await familyService.updateFamily(prospectId!, {
              notes: data.notes as string,
            });

            // Recharger les données depuis la base
            const updated = await familyService.getFamily(prospectId!);
            setProspect(updated);
          }}
          className="mb-8"
        />

        {/* Informations personnelles */}
        <DataCard
          title="Contact principal"
          fields={fieldConfig.personal.map((field) => ({
            key: field.key,
            label: field.label,
            value: getDisplayValue(prospect, field.field),
            type: field.type as
              | "text"
              | "email"
              | "tel"
              | "number"
              | "date"
              | "textarea"
              | "select",
            required: (field as any).required || false,
            placeholder: field.placeholder,
          }))}
          onSave={async (data) => {
            // Séparer les données de contact et d'adresse
            const contactData = {
              firstName: data.firstName as string,
              lastName: data.lastName as string,
              primaryPhone: data.primaryPhone as string,
              email: data.email as string,
              relation: prospect.primaryContact?.relation,
              secondaryPhone: (data.secondaryPhone as string) || null,
              address: {
                street: data.street as string,
                city: data.city as string,
                postalCode: data.postalCode as string,
              },
            };

            // Un seul appel maintenant que l'adresse est dans primaryContact
            await familyService.updatePrimaryContact(prospectId!, contactData);

            // Recharger les données depuis la base
            const updated = await familyService.getFamily(prospectId!);
            setProspect(updated);
          }}
          className="mb-8"
        />

        {/* Contact secondaire */}
        <DataCard
          title="Contact secondaire"
          fields={fieldConfig.secondaryContact.map((field) => ({
            key: field.key,
            label: field.label,
            value: getDisplayValue(prospect, field.field),
            type: field.type as
              | "text"
              | "email"
              | "tel"
              | "number"
              | "date"
              | "textarea"
              | "select",
            required: field.required || false,
            placeholder: field.placeholder,
          }))}
          onSave={async (data) => {
            // Structure explicite pour secondaryContact
            const contactData = {
              firstName: data.firstName as string,
              lastName: data.lastName as string,
              phone: data.phone as string,
              email: data.email as string,
              relation: data.relation as string,
              birthDate: data.birthDate
                ? new Date(data.birthDate as string)
                : null,
            };

            // Appel à updateSecondaryContact
            await familyService.updateSecondaryContact(
              prospectId!,
              contactData
            );

            // Recharger les données depuis la base
            const updated = await familyService.getFamily(prospectId!);
            setProspect(updated);
          }}
          className="mb-8"
        />

        {/* Demande de cours */}
        <DataCard
          title="Demande de cours"
          fields={fieldConfig.courseData.map((field) => {
            // Traitement spécial pour les matières
            if (field.key === "subjects") {
              return {
                key: field.key,
                label: field.label,
                value: prospect.demande?.subjects || [],
                type: "text",
                readOnly: true,
                customRender: () => (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}
                    >
                      {prospect.demande?.subjects &&
                      prospect.demande.subjects.length > 0 ? (
                        prospect.demande.subjects.map((subject: any) => (
                          <span
                            key={subject.id || subject.name || subject}
                            style={{
                              padding: "4px 8px",
                              backgroundColor: "#f3f4f6",
                              borderRadius: "4px",
                              fontSize: "14px",
                            }}
                          >
                            {typeof subject === "object"
                              ? subject.name
                              : subject}
                          </span>
                        ))
                      ) : (
                        <span style={{ color: "#9ca3af" }}>
                          Aucune matière sélectionnée
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // Filtrer pour ne garder que les matières qui existent vraiment dans la DB
                        const validSubjects = (prospect.demande?.subjects || [])
                          .filter((subject) => {
                            const subjectName =
                              typeof subject === "object"
                                ? subject.name
                                : subject;
                            return availableSubjects.some(
                              (availableSubject) =>
                                availableSubject.name === subjectName
                            );
                          })
                          .map((subject) =>
                            typeof subject === "object" ? subject.name : subject
                          );
                        setSelectedSubjects(validSubjects);
                        setShowSubjectModal(true);
                      }}
                    >
                      Modifier les matières
                    </Button>
                  </div>
                ),
              };
            }

            return {
              key: field.key,
              label: field.label,
              value: getDisplayValue(prospect, field.field),
              type: field.type as
                | "text"
                | "email"
                | "tel"
                | "number"
                | "date"
                | "textarea"
                | "select",
              required: (field as any).required || false,
              placeholder: field.placeholder,
              options: (field as any).options,
            };
          })}
          onSave={async (data) => {
            // Utiliser la fonction spécialisée pour demande
            const demandeData = {
              grade: data.beneficiaryGrade as string,
              subjects: (prospect.demande?.subjects || []).map((s: any) =>
                typeof s === "string" ? s : s.id
              ),
            };

            await familyService.updateDemande(prospectId!, demandeData);

            // Recharger les données depuis la base
            const updated = await familyService.getFamily(prospectId!);
            setProspect(updated);
          }}
          className="mb-8"
        />

        {/* Élèves */}
        <DataCard title={`Élèves (${students.length})`} fields={[]}>
          <div>
            {students.length > 0 ? (
              <Table
                columns={[
                  {
                    key: "firstName",
                    label: "Prénom",
                    render: (value) => value,
                  },
                  {
                    key: "lastName",
                    label: "Nom",
                    render: (value) => value,
                  },
                  {
                    key: "birthDate",
                    label: "Né(e) le",
                    render: (value) =>
                      value ? new Date(value).toLocaleDateString("fr-FR") : "-",
                  },
                  {
                    key: "school",
                    label: "École/Niveau",
                    render: (_, row: Student) => {
                      if (!row.school) return "-";
                      // Correction: utiliser grade directement, pas level
                      const schoolName = row.school.name || "";
                      const schoolGrade = row.school.grade || "";
                      return schoolGrade ? `${schoolGrade}` : schoolName || "-";
                    },
                  },
                  {
                    key: "courseLocation",
                    label: "Lieu des cours",
                    render: (_, row: Student) => {
                      if (!row.courseLocation?.type) return "-";
                      return row.courseLocation.type === "domicile"
                        ? "À domicile"
                        : row.courseLocation.type === "professeur"
                        ? "Chez le professeur"
                        : "Autre";
                    },
                  },
                  {
                    key: "phone",
                    label: "Tél",
                    render: (_, row: Student) => {
                      return row.contact?.phone || "-";
                    },
                  },
                  {
                    key: "availability",
                    label: "Disponibilités",
                    render: (value: unknown, row: Student): string => {
                      return String(row.availability || value || "-");
                    },
                  },
                  {
                    key: "comments",
                    label: "Com.",
                    render: (value: unknown, row: Student): string => {
                      const comment = String(
                        row.comments || row.notes || value || ""
                      );
                      return comment.length > 30
                        ? `${comment.substring(0, 30)}...`
                        : comment || "-";
                    },
                  },
                  {
                    key: "settlementNoteIds",
                    label: "NDR",
                    render: (_, row: any) => (
                      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full">
                        {row.settlementNoteIds?.length || 0}
                      </span>
                    ),
                  },
                  {
                    key: "actions",
                    label: "Actions",
                    render: (_, row: any) => (
                      <div className="table__actions">
                        <Button
                          size="sm"
                          variant="error"
                          onClick={(e) => {
                            e.stopPropagation(); // Empêcher le clic sur la ligne
                            if (
                              window.confirm(
                                `Êtes-vous sûr de vouloir supprimer l'élève ${row.firstName} ${row.lastName} ?`
                              )
                            ) {
                              handleDeleteStudent(
                                row._id,
                                `${row.firstName} ${row.lastName}`
                              );
                            }
                          }}
                          title="Supprimer l'élève"
                        >
                          ✕
                        </Button>
                      </div>
                    ),
                  },
                ]}
                data={students.map((student) => ({
                  ...student,
                  id: student.id || `student-${students.indexOf(student)}`,
                }))}
                onRowClick={(student) => handleViewData(student, "student")}
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
                onClick={() => {
                  handleAddStudent(prospect._id);
                }}
              >
                Ajouter un élève
              </Button>
            </div>
          </div>
        </DataCard>

        {/* Actions de suivi */}
        <DataCard
          title="Suivi"
          fields={fieldConfig.tracking.map((field) => {
            // Traitement spécial pour le statut prospect
            if (field.key === "prospectStatus") {
              return {
                key: field.key,
                label: field.label,
                value: prospect.prospectStatus,
                type: "text",
                readOnly: true,
                customRender: () => (
                  <StatusDot
                    status={prospect.prospectStatus as ProspectStatus}
                    prospectId={prospect._id}
                    onStatusChange={handleStatusChange}
                    showLabel={true}
                  />
                ),
              };
            }

            // Traitement spécial pour l'objet du rappel
            if (field.key === "nextAction") {
              return {
                key: field.key,
                label: field.label,
                value: prospect.nextAction || "Actions à définir",
                type: "text",
                readOnly: true,
                customRender: () => (
                  <ReminderSubjectDropdown
                    value={prospect.nextAction || "Actions à définir"}
                    familyId={prospectId!}
                    onUpdate={handleNextActionUpdate}
                  />
                ),
              };
            }

            // Traitement spécial pour la date de rappel (RRR)
            if (field.key === "nextActionDate") {
              return {
                key: field.key,
                label: field.label,
                value: prospect.nextActionDate || null,
                type: "text",
                readOnly: true,
                customRender: () => (
                  <DatePicker
                    value={prospect.nextActionDate || null}
                    familyId={prospectId!}
                    onUpdate={handleNextActionDateUpdate}
                  />
                ),
              };
            }

            let value = getDisplayValue(prospect, field.field);

            return {
              key: field.key,
              label: field.label,
              value,
              type: field.type as FieldType,
              required: (field as any).required,
              placeholder: (field as any).placeholder,
            };
          })}
          onSave={async (data) => {
            // Séparer les champs par type d'action
            const {
              prospectStatus,
              nextAction,
              nextActionDate,
              ...otherFields
            } = data;

            // Traiter le statut prospect avec UPDATE_PROSPECT_STATUS
            if (prospectStatus !== undefined) {
              await familyService.updateFamily(prospectId!, {
                prospectStatus: prospectStatus || null,
              });
            }

            // Traiter les champs de rappel avec UPDATE_REMINDER
            if (nextAction !== undefined) {
              await familyService.updateFamily(prospectId!, {
                nextAction: nextAction as string,
              });
            }

            if (nextActionDate !== undefined) {
              const dateValue = nextActionDate
                ? new Date(nextActionDate as string)
                : null;
              await familyService.updateFamily(prospectId!, {
                nextActionDate: dateValue,
              });
            }

            // Traiter les autres champs avec UPDATE_FAMILY si nécessaire
            if (Object.keys(otherFields).length > 0) {
              const updateData: Partial<Family> = {};
              Object.entries(otherFields).forEach(([key, value]) => {
                const field = fieldConfig.tracking.find((f) => f.key === key);
                if (
                  field &&
                  !field.readOnly &&
                  key !== "prospectStatus" &&
                  key !== "nextAction" &&
                  key !== "nextActionDate"
                ) {
                  const processedValue =
                    field.type === "date" && value
                      ? new Date(value as string)
                      : value;
                  (updateData as any)[field.field] = processedValue;
                }
              });

              if (Object.keys(updateData).length > 0) {
                await familyService.updateFamily(prospectId!, updateData);
              }
            }

            // Recharger les données depuis la base
            const updated = await familyService.getFamily(prospectId!);
            setProspect(updated);
          }}
          className="mb-8"
        />

        {/* Section Suivi des RDV */}
        <DataCard
          title={`Suivi des RDV (${prospectRdvs.length})`}
          fields={[]}
          className="mb-8"
        >
          <div>
            {prospectRdvs.length > 0 ? (
              <Table
                columns={[
                  {
                    key: "date",
                    label: "Date",
                    render: (_, row: any) =>
                      new Date(row.date).toLocaleDateString("fr-FR"),
                  },
                  {
                    key: "time",
                    label: "Heure",
                    render: (value) => value,
                  },
                  {
                    key: "status",
                    label: "Statut",
                    render: (value) =>
                      value === "planifie"
                        ? "Planifié"
                        : value === "realise"
                        ? "Réalisé"
                        : value === "annule"
                        ? "Annulé"
                        : value,
                  },
                  {
                    key: "type",
                    label: "Type",
                    render: (value) =>
                      value === "physique" ? "Physique" : "Virtuel",
                  },
                  {
                    key: "assignedAdminId",
                    label: "Admin assigné",
                    render: (value) => {
                      if (!value) return "Non assigné";
                      return typeof value === "object"
                        ? `${value.firstName} ${value.lastName}`
                        : value;
                    },
                  },
                  {
                    key: "notes",
                    label: "Notes",
                    render: (value) => value || "-",
                  },
                  {
                    key: "actions",
                    label: "Actions",
                    render: (_, row: any) => (
                      <div className="table__actions">
                        <Button
                          size="sm"
                          variant="error"
                          onClick={() => handleDeleteRdv(row._id!)}
                          title="Supprimer le RDV"
                        >
                          ✕
                        </Button>
                      </div>
                    ),
                  },
                ]}
                data={prospectRdvs.map((rdv) => ({ ...rdv, id: rdv._id }))}
                onRowClick={(rdv) => handleViewData(rdv, "rdv")}
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
      <Modal
        type="rdv"
        isOpen={showRdvModal}
        onClose={() => {
          setShowRdvModal(false);
          setEditingRdv(null);
        }}
        data={editingRdv || { familyId: prospectId || "" }}
        onSuccess={() => {
          setShowRdvModal(false);
          setEditingRdv(null);
        }}
      />

      {/* Modal ajout d'élève */}
      <Modal
        type="student"
        isOpen={showAddStudentModal}
        onClose={() => {
          handleStudentSuccess();
        }}
        data={{ familyId: selectedFamilyForStudent || prospectId || "" }}
        onSuccess={() => {
          // Les données du prospect sont automatiquement mises à jour par l'ActionCache
          handleStudentSuccess();
        }}
        onAddStudentTest={handleAddStudentTest}
      />

      {/* Modal unifiée pour élèves ET RDV */}
      {selectedDataForView && (
        <Modal
          isOpen={!!selectedDataForView}
          onClose={() => setSelectedDataForView(null)}
          mode="view"
          type={selectedDataForView.type}
          data={selectedDataForView.data}
          onSuccess={() => setSelectedDataForView(null)}
        />
      )}

      {/* Modal de sélection des matières */}
      {showSubjectModal && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="modal-content"
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              maxWidth: "600px",
              width: "90%",
              maxHeight: "80vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              className="modal-header"
              style={{ padding: "20px", borderBottom: "1px solid #e5e7eb" }}
            >
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>
                Sélectionner les matières
              </h3>
            </div>

            <div
              className="modal-body"
              style={{ padding: "20px", overflowY: "auto", flex: 1 }}
            >
              {isLoadingSubjects ? (
                <div>Chargement des matières...</div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {availableSubjects.map((subject) => (
                    <label
                      key={subject._id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        cursor: "pointer",
                        padding: "8px",
                        borderRadius: "4px",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedSubjects.includes(subject.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSubjects([
                              ...selectedSubjects,
                              subject.name,
                            ]);
                          } else {
                            setSelectedSubjects(
                              selectedSubjects.filter((s) => s !== subject.name)
                            );
                          }
                        }}
                        style={{ marginRight: "12px" }}
                      />
                      <span>{subject.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div
              className="modal-footer"
              style={{
                padding: "20px",
                borderTop: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ color: "#6b7280" }}>
                {selectedSubjects.length} matière(s) sélectionnée(s)
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <Button
                  variant="outline"
                  onClick={() => setShowSubjectModal(false)}
                >
                  Annuler
                </Button>
                <Button
                  variant="primary"
                  onClick={async () => {
                    // Sauvegarder les matières sélectionnées
                    const updateData = {
                      ...prospect,
                      demande: {
                        ...prospect.demande,
                        subjects: selectedSubjects,
                      },
                    };
                    await familyService.updateFamily(prospectId!, updateData);

                    // Recharger les données depuis la base
                    const updated = await familyService.getFamily(prospectId!);
                    setProspect(updated);

                    setShowSubjectModal(false);
                  }}
                >
                  Confirmer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
