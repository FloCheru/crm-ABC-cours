import React, { useState, useEffect } from "react";
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
      };

      return preparedData;
    },
    update: async (entityId: string, preparedData: any, originalData: any) => {
      const result = await familyService.updateStudent(
        originalData.family,
        entityId,
        preparedData
      );
      return result;
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
        familyId: formData.familyId || data.familyId,
      };
    },
    update: async (entityId: string, preparedData: any, _originalData: any) => {
      return await rdvService.updateRdv(entityId, {
        ...preparedData,
        familyId: preparedData.familyId
      });
    },
    create: async (_familyId: string, _preparedData: any) => {
      throw new Error("Création RDV pas encore implémentée");
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
  // Cas 1 : Pas de data = création (forcément edit)
  if (!data || !data._id) {
    return TITLE_MAP[type].create;
  }

  // Cas 2 & 3 : Data présente = détails ou modification
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
              type: "text",
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

  // Pour la compatibilité avec le code existant
  const familyId = data?.familyId || data?._id;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sameAsFamily, setSameAsFamily] = useState(true);

  // État interne pour gérer le mode (peut changer dans la modal)
  const [internalMode, setInternalMode] = useState(mode);

  // Génération automatique du titre selon type, data et mode actuel
  const modalTitle = getModalTitle(type, data, internalMode);

  // Reset le mode quand la modal s'ouvre/ferme
  useEffect(() => {
    // Mode changé
    setInternalMode(mode);
  }, [isOpen, mode]);

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
      const adminName = data.assignedAdminId
        ? `${data.assignedAdminId.firstName} ${data.assignedAdminId.lastName}`
        : "";

      setFormData((prev) => ({
        ...prev,
        date: formattedDate,
        time: data.time || "",
        type: data.type || "physique",
        assignedAdminId: adminName,
        notes: data.notes || "",
      }));
    }
  }, [type, data]);

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

    setIsLoading(true);
    setError(null);

    try {
      const handler = ENTITY_HANDLERS[type];
      const logs = handler.logs;

      // 1. Préparation des données
      const preparedData = handler.prepareData(formData, data);

      // 2. Sauvegarde
      if (data && data._id) {
        const result = await handler.update(data._id, preparedData, data);
      } else {
        await handler.create(familyId, preparedData);
      }

      // 3. Basculement en mode view
      setInternalMode("view");

      // 4. Callback
      if (onSuccess) {
        onSuccess();
      }

    } catch (error) {
      console.error("❌ [HANDLESAVE] Erreur lors de la sauvegarde:", error);
      setError("Erreur lors de la sauvegarde. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillExample = () => {
    if (type === "student") {
      setFormData((prev) => ({
        ...prev,
        firstName: "Marie",
        lastName: "Dupont",
        level: "5ème",
        dateOfBirth: "2009-03-15",
        studentStreet: "25 avenue de la République",
        studentPostalCode: "75011",
        studentCity: "Paris",
        schoolName: "Collège Victor Hugo",
        schoolAddress: "12 rue de la République, 75011 Paris",
        email: "marie.dupont@example.com",
        phone: "06 12 34 56 78",
        courseLocation: "domicile",
        notes: "Élève motivée, difficultés en mathématiques",
      }));
      setSameAsFamily(false);
    } else if (type === "rdv") {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];

      setFormData((prev) => ({
        ...prev,
        date: tomorrowStr,
        time: "14:00",
        type: "physique",
        assignedAdminId: "admin1",
        notes: "Rendez-vous de suivi pédagogique",
      }));
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
          />
        </div>
      );
    }

    if (type === "select" && options) {
      // En mode view, afficher un Input disabled avec le texte
      if (internalMode === "view") {
        const selectedOption = options.find(
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
            options={options}
            required={required}
            disabled={isDisabled}
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
      <div className="modal-container">
        {/* Header */}
        <PageHeader
          title={modalTitle}
          actions={
            <>
              {internalMode === "view" ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                  >
                    Fermer
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleToggleMode}
                    title="Modifier"
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
                  {!data && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleFillExample}
                      title="Préremplir avec des données d'exemple"
                    >
                      📝 Exemple
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleSave}
                    disabled={!validateForm() || isLoading}
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
          {error && (
            <div className="modal-error">
              <strong>Erreur :</strong> {error}
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
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Fermer
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleToggleMode}
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