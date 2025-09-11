import React, { useState, useEffect, useRef } from "react";
import {
  Button,
  Input,
  Select,
  DataCard,
  Container,
  PageHeader,
} from "../../components";
import { familyService } from "../../services/familyService";
import rdvService from "../../services/rdvService";
import { adminService, type Admin } from "../../services/adminService";
import ActionCacheService from "../../services/actionCacheService";
import { usePrefillTest } from "../../hooks/usePrefillTest";
import "./Modal.css";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "student" | "rdv";
  data?: any;
  onSuccess?: () => void;
  mode?: "edit" | "view";
  // Props RDV
  onSubmit?: (data: any) => void;
  isEditing?: boolean;
  loading?: boolean;
}

// Configuration des handlers par type d'entité
const ENTITY_HANDLERS = {
  student: {
    prepareData: (formData: any, data: any) => {
      // Récupérer sameAsFamily directement des données existantes
      const sameAsFamily = data?.courseLocation?.usesFamilyAddress || false;
      const preparedData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        dateOfBirth: formData.dateOfBirth,
        school: {
          name: formData.schoolName.trim(),
          level: data?.school?.level || "collège",
          grade: formData.grade,
        },
        contact: {
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim() || undefined,
        },
        courseLocation: {
          type: formData.courseLocation as "domicile" | "professeur" | "autre",
          usesFamilyAddress: sameAsFamily,
          address: sameAsFamily
            ? undefined
            : {
                street: formData.studentStreet.trim(),
                city: formData.studentCity.trim(),
                postalCode: formData.studentPostalCode.trim(),
              },
        },
        availability: "",
        comments: formData.notes.trim() || "",
        notes: formData.notes.trim() || undefined,
        familyId: data.familyId,
      };

      return preparedData;
    },
    update: async (studentId: string, preparedData: any, familyId: string) => {
      return await familyService.updateStudent(familyId, studentId, preparedData);
    },
    create: async (familyId: string, preparedData: any) => {
      return await familyService.addStudent(familyId, preparedData);
    },
    logs: {
      entityName: "ÉLÈVE",
      updateStart: "🔄 DÉBUT MODIFICATION ÉLÈVE",
      createStart: "➕ AJOUT NOUVEL ÉLÈVE",
    },
  },
  rdv: {
    prepareData: (formData: any, data: any) => {
      return {
        date: formData.date,
        time: formData.time,
        type: formData.type as "physique" | "virtuel",
        notes: formData.notes,
        assignedAdminId: formData.assignedAdminId,
        familyId: data.familyId,
      };
    },
    update: async (rdvId: string, preparedData: any, familyId: string) => {
      return await rdvService.updateRdv(rdvId, {
        ...preparedData,
        familyId: familyId
      });
    },
    create: async (familyId: string, preparedData: any, adminsData?: any[]) => {
      // Générer un ID temporaire pour la mise à jour optimiste
      const tempRdvId = `temp_rdv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Trouver les données complètes de l'admin assigné
      const assignedAdmin = adminsData?.find(admin => admin.id === preparedData.assignedAdminId);
      
      return await ActionCacheService.executeAction(
        'CREATE_RDV',
        () => rdvService.createRdv({
          ...preparedData,
          familyId: familyId
        }),
        {
          familyId,
          rdvData: preparedData,
          tempRdvId,
          assignedAdminData: assignedAdmin
        }
      );
    },
    logs: {
      entityName: "RDV",
      updateStart: "🔄 DÉBUT MODIFICATION RDV",
      createStart: "➕ CRÉATION NOUVEAU RDV",
    },
  },
} as const;

// Mapping des titres selon type, data et mode
const TITLE_MAP = {
  student: {
    create: "Nouvel élève", // !data → edit mode
    view: "Détails élève", // data + view mode
    edit: "Modifier élève", // data + edit mode
  },
  rdv: {
    create: "Nouveau rendez-vous", // !data → edit mode
    view: "Détails RDV", // data + view mode
    edit: "Modifier RDV", // data + edit mode
  },
} as const;

// Fonction de génération du titre
const getModalTitle = (
  type: "student" | "rdv",
  data?: any,
  currentMode?: "view" | "edit"
): string => {
  // Cas 1 : Pas d'entityId = création (forcément edit)
  const entityId = data?.studentId || data?.rdvId;
  if (!entityId) {
    return TITLE_MAP[type].create;
  }

  // Cas 2 & 3 : EntityId présent = détails ou modification
  const mode = currentMode || "view"; // view par défaut
  return TITLE_MAP[type][mode];
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  type,
  data,
  onSuccess,
  mode = "edit",
}) => {
  // Hook pour les données de test de préremplissage
  const { studentTestData, rdvTestData } = usePrefillTest();
  
  // Nouvelle logique de détection création vs modification
  const entityId = data.studentId || data.rdvId;
  const familyId = data.familyId;
  // Configuration des champs par type
  const MODAL_CONFIG = {
    student: {
      sections: [
        {
          title: "Identité de l'élève",
          fields: [
            {
              key: "firstName",
              label: "Prénom",
              type: "text",
              required: true,
            },
            {
              key: "lastName",
              label: "Nom",
              type: "text",
              required: true,
            },
            { key: "dateOfBirth", label: "Date de naissance", type: "date" },
          ],
        },
        {
          title: "Adresse de l'élève",
          fields: [
            {
              key: "sameAsFamily",
              label: "Utiliser l'adresse de la famille",
              type: "checkbox",
            },
            {
              key: "studentStreet",
              label: "Rue",
              type: "text",
              placeholder: "Rue de l'élève",
              conditional: "sameAsFamily",
              conditionValue: true,
            },
            {
              key: "studentPostalCode",
              label: "Code postal",
              type: "text",
              placeholder: "Code postal",
              conditional: "sameAsFamily",
              conditionValue: true,
            },
            {
              key: "studentCity",
              label: "Ville",
              type: "text",
              placeholder: "Ville",
              conditional: "sameAsFamily",
              conditionValue: true,
            },
          ],
        },
        {
          title: "École",
          fields: [
            {
              key: "grade",
              label: "Classe",
              type: "text",
            },
            {
              key: "schoolName",
              label: "Nom de l'école",
              type: "text",
            },
            {
              key: "schoolAddress",
              label: "Adresse de l'école",
              type: "text",
            },
            {
              key: "courseLocation",
              label: "Lieu des cours",
              type: "select",
              options: [
                { value: "domicile", label: "Domicile" },
                { value: "professeur", label: "Chez le professeur" },
                { value: "autre", label: "Lieu neutre" },
              ],
            },
          ],
        },
        {
          title: "Contact personnel de l'élève",
          fields: [
            {
              key: "email",
              label: "Email de l'élève",
              type: "email",
              placeholder: "email.eleve@example.com",
            },
            {
              key: "phone",
              label: "Téléphone de l'élève",
              type: "tel",
              placeholder: "06 12 34 56 78",
            },
          ],
        },
        {
          title: "Notes et observations",
          fields: [
            {
              key: "notes",
              label: "Notes",
              type: "textarea",
              placeholder:
                "Informations complémentaires, besoins particuliers, observations...",
              rows: 3,
            },
          ],
        },
      ],
    },
    rdv: {
      sections: [
        {
          title: "Informations du rendez-vous",
          fields: [
            { key: "date", label: "Date", type: "date", required: true },
            { key: "time", label: "Heure", type: "time", required: true },
            {
              key: "type",
              label: "Type",
              type: "select",
              required: true,
              options: [
                { value: "physique", label: "Physique" },
                { value: "visio", label: "Visio" },
              ],
            },
          ],
        },
        {
          title: "Détails",
          fields: [
            {
              key: "assignedAdminId",
              label: "Administrateur assigné",
              type: "select",
              options: [],
            },
            {
              key: "notes",
              label: "Notes",
              type: "textarea",
              placeholder: "Notes sur le rendez-vous...",
              rows: 3,
            },
          ],
        },
      ],
    },
  };

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sameAsFamily, setSameAsFamily] = useState(true);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);

  // Ref pour le focus trap
  const modalRef = useRef<HTMLDivElement>(null);

  // État interne pour gérer le mode (peut changer dans la modal)
  const [internalMode, setInternalMode] = useState(mode);

  // Génération automatique du titre selon type, data et mode actuel
  const modalTitle = getModalTitle(type, data, internalMode);

  // Reset le mode quand la modal s'ouvre/ferme
  useEffect(() => {
    // Mode changé
    setInternalMode(mode);
  }, [isOpen, mode]);

  // Load admins when modal opens for RDV type
  useEffect(() => {
    if (isOpen && type === "rdv") {
      const loadAdmins = async () => {
        setIsLoadingAdmins(true);
        try {
          const adminsList = await adminService.getAdmins();
          if (adminsList && adminsList.length > 0) {
            setAdmins(adminsList);
          }
        } catch (error) {
          console.error("Failed to load admins:", error);
        } finally {
          setIsLoadingAdmins(false);
        }
      };
      loadAdmins();
    }
  }, [isOpen, type]);

  // États du formulaire (support élève + RDV)
  const [formData, setFormData] = useState({
    // Champs élève
    firstName: "",
    lastName: "",
    level: "",
    dateOfBirth: "",
    street: "",
    postalCode: "",
    city: "",
    studentStreet: "",
    studentPostalCode: "",
    studentCity: "",
    schoolName: "",
    schoolAddress: "",
    email: "",
    phone: "",
    courseLocation: "domicile",
    notes: "",
    // Champs RDV
    date: "",
    time: "",
    type: "physique",
    assignedAdminId: "",
  });

  // Effect pour pré-remplir les données quand data change
  useEffect(() => {
    // Data changée, réinitialisation des données
    if (type === "student" && data) {
      setFormData((prev) => ({
        ...prev,
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        grade: data.school?.grade || "",
        dateOfBirth: data.dateOfBirth
          ? new Date(data.dateOfBirth).toISOString().split("T")[0]
          : "",
        studentStreet: data.courseLocation?.address?.street || "",
        studentPostalCode: data.courseLocation?.address?.postalCode || "",
        studentCity: data.courseLocation?.address?.city || "",
        schoolName: data.school?.name || "",
        schoolAddress: "",
        email: data.contact?.email || "",
        phone: data.contact?.phone || "",
        courseLocation: data.courseLocation?.type || "domicile",
        notes: data.notes || data.comments || "",
      }));
      setSameAsFamily(data.courseLocation?.usesFamilyAddress || false);
    } else if (type === "rdv" && data) {
      const formattedDate = data.date
        ? new Date(data.date).toISOString().split("T")[0]
        : "";
      const adminId = data.assignedAdminId
        ? (typeof data.assignedAdminId === 'object' 
            ? data.assignedAdminId.id 
            : data.assignedAdminId)
        : "";

      setFormData((prev) => ({
        ...prev,
        date: formattedDate,
        time: data.time || "",
        type: data.type || "physique",
        assignedAdminId: adminId,
        notes: data.notes || "",
      }));
    }
  }, [type, data]);

  // Gestion de la touche ESC pour fermer la modal
  useEffect(() => {
    if (isOpen) {
      const handleEsc = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
        }
      };
      
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose]);

  // Focus trap - Empêche le focus de sortir de la modal
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const modal = modalRef.current;
      const focusableElements = modal.querySelectorAll(
        'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      // Focus initial sur le premier élément
      if (firstElement) {
        firstElement.focus();
      }

      const handleTabKey = (event: KeyboardEvent) => {
        if (event.key === 'Tab') {
          if (event.shiftKey) {
            // Shift + Tab - retour arrière
            if (document.activeElement === firstElement) {
              event.preventDefault();
              lastElement?.focus();
            }
          } else {
            // Tab - avancer
            if (document.activeElement === lastElement) {
              event.preventDefault();
              firstElement?.focus();
            }
          }
        }
      };

      document.addEventListener('keydown', handleTabKey);
      return () => document.removeEventListener('keydown', handleTabKey);
    }
  }, [isOpen]);

  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (type === "student") {
      return (
        formData.firstName.trim() !== "" && formData.lastName.trim() !== ""
      );
    } else if (type === "rdv") {
      return (
        formData.date.trim() !== "" &&
        formData.time.trim() !== "" &&
        formData.type.trim() !== ""
      );
    }
    return false;
  };

  const handleToggleMode = () => {
    setInternalMode(internalMode === "view" ? "edit" : "view");
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    // Vérifier si déjà en cours de chargement pour éviter double soumission
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const handler = ENTITY_HANDLERS[type];

      // 1. Préparation des données
      const preparedData = handler.prepareData(formData, data);

      // 2. Sauvegarde
      if (entityId) {
        // Mode UPDATE
        await handler.update(entityId, preparedData, familyId);
      } else {
        // Mode CREATE
        const additionalData = type === 'rdv' ? admins : undefined;
        await handler.create(familyId, preparedData, additionalData);
      }

      // 3. Gestion du mode selon le contexte (création vs édition)
      if (entityId) {
        // Mode UPDATE : basculer en mode view
        setInternalMode("view");
        // Callback après changement de mode
        if (onSuccess) {
          onSuccess();
        }
      } else {
        // Mode CREATE : fermer directement la modal
        if (onSuccess) {
          onSuccess();
        }
      }

    } catch (error) {
      console.error("❌ [HANDLESAVE] Erreur lors de la sauvegarde:", error);
      // Extraire et adapter le message d'erreur pour une meilleure UX
      let errorMessage = "Erreur lors de la sauvegarde. Veuillez réessayer.";
      
      if (error instanceof Error) {
        // Messages d'erreur plus conviviaux - ordre important (plus spécifique d'abord)
        if (error.message.includes("déjà un rendez-vous prévu à cette date et heure") || 
            error.message.includes("Cet administrateur a déjà un rendez-vous")) {
          errorMessage = "Ce créneau est déjà pris. Veuillez choisir une autre date ou heure.";
        } else if (error.message.includes("ValidationError") || 
                   error.message.includes("Données invalides")) {
          errorMessage = "Données invalides. Veuillez vérifier les informations saisies.";
        } else if (error.message.includes("HTTP error! status:")) {
          // Fallback pour les erreurs HTTP génériques qui n'ont pas été parsées
          errorMessage = "Erreur lors de la sauvegarde. Veuillez réessayer.";
        } else {
          // Utiliser le message détaillé directement s'il est compréhensible
          errorMessage = error.message;
        }
      }
      
      // Préserver l'état de la modal pour afficher l'erreur
      setError(errorMessage);
      // NE PAS fermer la modal ou changer de mode en cas d'erreur
      return;
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrefillFromProspect = () => {
    console.log("🎯 [MODAL] Clic 'Préremplir' déclenché");
    console.log("🔍 [MODAL] type de modal:", type);
    
    if (type === "student") {
      console.log("✅ [MODAL] Préremplissage élève avec données de test");
      console.log("🔍 [MODAL] Données de test:", studentTestData);
      
      setFormData((prev) => ({
        ...prev,
        ...studentTestData
      }));
      setSameAsFamily(studentTestData.sameAsFamily);
      console.log("✅ [MODAL] Préremplissage élève terminé avec succès");
    } else if (type === "rdv") {
      console.log("✅ [MODAL] Préremplissage RDV avec données de test");
      console.log("🔍 [MODAL] Données de test:", rdvTestData);
      
      // Utiliser l'ID du premier admin disponible si possible
      let adminId = rdvTestData.assignedAdminId;
      if (admins.length > 0) {
        adminId = admins[0].id;
      }
      
      setFormData((prev) => ({
        ...prev,
        ...rdvTestData,
        assignedAdminId: adminId
      }));
      console.log("✅ [MODAL] Préremplissage RDV terminé avec succès");
    }
  };

  // Fonction de rendu dynamique des champs
  const renderField = (field: any) => {
    const {
      key,
      label,
      type,
      required,
      placeholder,
      options,
      conditional,
      conditionValue,
      rows,
    } = field;
    const value = formData[key as keyof typeof formData] || "";
    const isDisabled = internalMode === "view";

    // Gestion des champs conditionnels
    if (conditional === "sameAsFamily" && sameAsFamily === conditionValue) {
      return null;
    }

    if (type === "checkbox") {
      return (
        <div key={key} className="data-card__field data-card__field--full">
          <label
            className="data-card__label"
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <input
              type="checkbox"
              checked={key === "sameAsFamily" ? sameAsFamily : Boolean(value)}
              onChange={(e) => {
                if (key === "sameAsFamily") {
                  setSameAsFamily(e.target.checked);
                  if (e.target.checked) {
                    handleFieldChange("studentStreet", "");
                    handleFieldChange("studentPostalCode", "");
                    handleFieldChange("studentCity", "");
                  }
                } else {
                  handleFieldChange(key, e.target.checked.toString());
                }
              }}
              disabled={isDisabled}
              data-testid={`checkbox-${key}`}
            />
            {label}
          </label>
        </div>
      );
    }

    if (type === "textarea") {
      return (
        <div key={key} className="data-card__field data-card__field--full">
          <label className="data-card__label">
            {label}
            {required && <span className="data-card__required">*</span>}
          </label>
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            placeholder={placeholder}
            className="data-card__textarea"
            rows={rows || 3}
            disabled={isDisabled}
            data-testid={`textarea-${key}`}
          />
        </div>
      );
    }

    if (type === "select") {
      // Handle dynamic admin options for assignedAdminId field
      let selectOptions = options || [];
      if (key === "assignedAdminId") {
        if (isLoadingAdmins) {
          selectOptions = [{ value: "", label: "Chargement des admins..." }];
        } else if (admins.length > 0) {
          selectOptions = admins.map((admin: Admin) => ({
            value: admin.id,
            label: `${admin.firstName} ${admin.lastName}`
          }));
        } else {
          selectOptions = [{ value: "", label: "Aucun admin disponible" }];
        }
      }

      // En mode view, afficher un Input disabled avec le texte
      if (internalMode === "view") {
        const selectedOption = selectOptions.find(
          (option: any) => option.value === value
        );
        const displayText = selectedOption
          ? selectedOption.label
          : value || "Non renseigné";

        return (
          <div key={key} className="data-card__field">
            <Input
              type="text"
              label={label}
              value={displayText}
              disabled={true}
              required={required}
            />
          </div>
        );
      }

      // En mode edit, utiliser le composant Select
      return (
        <div key={key} className="data-card__field">
          <Select
            label={label}
            value={value}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            options={selectOptions}
            required={required}
            disabled={isDisabled}
            data-testid={`select-${key}`}
          />
        </div>
      );
    }

    return (
      <div key={key} className="data-card__field">
        <label className="data-card__label">
          {label}
          {required && <span className="data-card__required">*</span>}
        </label>
        <Input
          type={type}
          value={value}
          onChange={(e) => handleFieldChange(key, e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={isDisabled}
          data-testid={`input-${key}`}
        />
      </div>
    );
  };

  const handleCancel = () => {
    setError(null);
    setFormData({
      firstName: "",
      lastName: "",
      level: "",
      dateOfBirth: "",
      street: "",
      postalCode: "",
      city: "",
      studentStreet: "",
      studentPostalCode: "",
      studentCity: "",
      schoolName: "",
      schoolAddress: "",
      email: "",
      phone: "",
      courseLocation: "domicile",
      notes: "",
      // Champs RDV
      date: "",
      time: "",
      type: "physique",
      assignedAdminId: "",
    });
    setSameAsFamily(true);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div 
        ref={modalRef}
        className="modal-container" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <PageHeader
          title={modalTitle}
          id="modal-title"
          actions={
            <>
              {internalMode === "view" ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    data-testid="close-button-header"
                  >
                    Fermer
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleToggleMode}
                    title="Modifier"
                    data-testid="edit-button-header"
                  >
                    ✏️ Modifier
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleToggleMode}
                    disabled={isLoading}
                  >
                    Annuler
                  </Button>
                  {(!data || !data.firstName) && (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handlePrefillFromProspect}
                      title="Préremplir avec des données d'exemple"
                    >
                      ✨ Préremplir
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleSave}
                    disabled={!validateForm() || isLoading}
                    data-testid="save-button-header"
                  >
                    💾{" "}
                    {isLoading
                      ? "En cours..."
                      : data
                      ? "Enregistrer"
                      : type === "student" ? "Créer l'élève" : "Créer RDV"}
                  </Button>
                </>
              )}
            </>
          }
        />
        {/* Content */}
        <div className="modal-content">
          {/* Afficher l'erreur en haut pour tous les types */}
          {error && (
            <div className="modal-error" style={{ marginBottom: "16px" }}>
              <strong>⚠️ Erreur :</strong> {error}
            </div>
          )}
          <Container size="full" padding="md" layout="flex-col">
            {MODAL_CONFIG[type].sections.map((section, sectionIndex) => (
              <DataCard
                key={sectionIndex}
                title={section.title}
                fields={[]} // Pas de fields car on utilise children
              >
                <div className="data-card__grid">
                  {section.fields.map((field) => renderField(field))}
                </div>
              </DataCard>
            ))}

            {type === "student" && (
              <div className="modal-note">
                <strong>Note :</strong> L'élève sera automatiquement ajouté à
                cette famille et sera visible immédiatement dans les listes.
              </div>
            )}
          </Container>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <Container layout="flex" justify="end" align="center" padding="md">
            {internalMode === "view" ? (
              <>
                <Button type="button" variant="outline" onClick={handleCancel} data-testid="close-button-footer">
                  Fermer
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleToggleMode}
                  data-testid="edit-button-footer"
                >
                  ✏️ Modifier
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleToggleMode}
                  disabled={isLoading}
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleSave}
                  disabled={!validateForm() || isLoading}
                  data-testid="save-button-footer"
                >
                  💾{" "}
                  {isLoading
                    ? "En cours..."
                    : data
                    ? "Enregistrer"
                    : type === "student" ? "Créer l'élève" : "Créer RDV"}
                </Button>
              </>
            )}
          </Container>
        </div>
      </div>
    </div>
  );
};