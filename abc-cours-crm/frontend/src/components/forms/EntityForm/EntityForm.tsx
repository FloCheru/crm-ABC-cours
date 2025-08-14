import React, { useState, useEffect } from "react";
import { Button } from "../../button/Button";
import { Input } from "../input/Input";
import { logger } from "../../../utils/logger";
import "./EntityForm.css";

// Types de configuration pour différentes entités
export type EntityType = "family" | "student" | "professor" | "subject";

// Configuration des champs pour chaque type d'entité
interface FieldConfig {
  key: string;
  label: string;
  type: "text" | "email" | "tel" | "date" | "select" | "textarea" | "checkbox";
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: (value: string | number | boolean) => string | undefined;
  group?: string; // Pour grouper les champs
}

interface EntityConfig {
  title: string;
  fields: FieldConfig[];
  submitButtonText: string;
}

// Configurations pour chaque type d'entité
const ENTITY_CONFIGS: Record<EntityType, EntityConfig> = {
  family: {
    title: "Créer une nouvelle famille",
    submitButtonText: "Créer la famille",
    fields: [
      {
        key: "primaryContact.lastName",
        label: "Nom de famille",
        type: "text",
        required: true,
        group: "primaryContact",
      },
      {
        key: "primaryContact.firstName",
        label: "Prénom du contact principal",
        type: "text",
        required: true,
        group: "primaryContact",
      },
      {
        key: "primaryContact.primaryPhone",
        label: "Tél",
        type: "tel",
        required: true,
        group: "primaryContact",
      },
      {
        key: "primaryContact.email",
        label: "Email",
        type: "email",
        required: true,
        group: "primaryContact",
      },
      {
        key: "primaryContact.secondaryPhone",
        label: "Téléphone secondaire",
        type: "tel",
        group: "primaryContact",
      },
      {
        key: "address.street",
        label: "Adresse",
        type: "text",
        required: true,
        group: "primaryContact",
      },
      {
        key: "address.city",
        label: "Ville",
        type: "text",
        required: true,
        group: "primaryContact",
      },
      {
        key: "address.postalCode",
        label: "Code postal",
        type: "text",
        required: true,
        group: "primaryContact",
      },
      {
        key: "secondaryContact.firstName",
        label: "Prénom",
        type: "text",
        group: "secondaryContact",
      },
      {
        key: "secondaryContact.lastName",
        label: "Nom",
        type: "text",
        group: "secondaryContact",
      },
      {
        key: "secondaryContact.phone",
        label: "Tél",
        type: "tel",
        group: "secondaryContact",
      },
      {
        key: "secondaryContact.email",
        label: "Email",
        type: "email",
        group: "secondaryContact",
      },
      {
        key: "secondaryContact.relationship",
        label: "Lien avec la famille",
        type: "text",
        group: "secondaryContact",
      },
      { key: "notes", label: "Notes", type: "textarea", group: "notes" },
    ],
  },

  student: {
    title: "Créer un nouvel élève",
    submitButtonText: "Créer l'élève",
    fields: [
      // Informations personnelles
      {
        key: "firstName",
        label: "Prénom",
        type: "text",
        required: true,
        group: "personal",
      },
      {
        key: "lastName",
        label: "Nom",
        type: "text",
        required: true,
        group: "personal",
      },
      {
        key: "dateOfBirth",
        label: "Date de naissance",
        type: "date",
        required: true,
        group: "personal",
      },

      // Scolarité
      {
        key: "school.name",
        label: "Établissement",
        type: "text",
        required: true,
        group: "school",
      },
      {
        key: "school.level",
        label: "Niveau scolaire",
        type: "select",
        required: true,
        group: "school",
        options: [
          { value: "primaire", label: "Primaire" },
          { value: "collège", label: "Collège" },
          { value: "lycée", label: "Lycée" },
          { value: "supérieur", label: "Supérieur" },
        ],
      },
      {
        key: "school.grade",
        label: "Classe",
        type: "text",
        required: true,
        group: "school",
      },

      // Contact
      {
        key: "contact.email",
        label: "Email de l'élève",
        type: "email",
        group: "contact",
      },
      {
        key: "contact.phone",
        label: "Téléphone de l'élève",
        type: "tel",
        group: "contact",
      },

      // Notes
      { key: "notes", label: "Notes", type: "textarea", group: "notes" },
    ],
  },

  professor: {
    title: "Créer un nouveau professeur",
    submitButtonText: "Créer le professeur",
    fields: [
      // Informations personnelles
      {
        key: "firstName",
        label: "Prénom",
        type: "text",
        required: true,
        group: "personal",
      },
      {
        key: "lastName",
        label: "Nom",
        type: "text",
        required: true,
        group: "personal",
      },
      {
        key: "email",
        label: "Email",
        type: "email",
        required: true,
        group: "personal",
      },
      {
        key: "phone",
        label: "Téléphone",
        type: "tel",
        required: true,
        group: "personal",
      },

      // Statut professionnel
      {
        key: "status",
        label: "Statut",
        type: "select",
        required: true,
        group: "professional",
        options: [
          { value: "employee", label: "Salarié" },
          { value: "freelance", label: "Auto-entrepreneur" },
        ],
      },

      // Informations financières
      {
        key: "hourlyRate",
        label: "Tarif horaire (€)",
        type: "text",
        required: true,
        group: "financial",
      },

      // Notes
      { key: "notes", label: "Notes", type: "textarea", group: "notes" },
    ],
  },

  subject: {
    title: "Créer une nouvelle matière",
    submitButtonText: "Créer la matière",
    fields: [
      {
        key: "name",
        label: "Nom de la matière",
        type: "text",
        required: true,
        group: "general",
      },
      {
        key: "description",
        label: "Description",
        type: "textarea",
        group: "general",
      },
      {
        key: "level",
        label: "Niveau",
        type: "select",
        required: true,
        group: "general",
        options: [
          { value: "débutant", label: "Débutant" },
          { value: "intermédiaire", label: "Intermédiaire" },
          { value: "avancé", label: "Avancé" },
        ],
      },
    ],
  },
};

interface EntityFormProps {
  /** Type d'entité à créer */
  entityType: EntityType;
  /** Fonction appelée lors de la soumission */
  onSubmit: (data: Record<string, unknown>) => Promise<void> | void;
  /** Fonction appelée lors de l'annulation */
  onCancel: () => void;
  /** Indique si le formulaire est en cours de soumission */
  isLoading?: boolean;
  /** Données initiales (pour l'édition) */
  initialData?: Record<string, unknown>;
  /** Props additionnelles (ex: familyId pour student) */
  additionalProps?: Record<string, unknown>;
  /** Classes CSS supplémentaires */
  className?: string;
}

/**
 * Composant de formulaire générique pour créer/éditer des entités
 */
export const EntityForm: React.FC<EntityFormProps> = ({
  entityType,
  onSubmit,
  onCancel,
  isLoading = false,
  initialData = {},
  additionalProps = {},
  className = "",
}) => {
  const config = ENTITY_CONFIGS[entityType];
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialiser les données du formulaire
  useEffect(() => {
    const initData = { ...additionalProps, ...initialData };
    setFormData(initData);
  }, []); // Une seule fois au montage

  // Mettre à jour seulement si les props changent vraiment
  useEffect(() => {
    if (Object.keys(additionalProps).length > 0) {
      setFormData((prev) => ({ ...prev, ...additionalProps }));
    }
  }, [additionalProps.familyId]); // Surveiller seulement familyId qui peut changer

  // Obtenir la valeur d'un champ imbriqué (ex: "address.street")
  const getNestedValue = (
    obj: Record<string, unknown>,
    path: string
  ): string => {
    const value = path.split(".").reduce((current, key) => {
      if (current && typeof current === "object" && key in current) {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj as unknown);

    // Retourner une chaîne vide si la valeur est undefined/null
    return value?.toString() || "";
  };

  // Définir la valeur d'un champ imbriqué
  const setNestedValue = (
    obj: Record<string, unknown>,
    path: string,
    value: unknown
  ): Record<string, unknown> => {
    logger.debug("setNestedValue - Début:", { obj, path, value });

    const keys = path.split(".");
    const result = { ...obj };
    let current = result;

    // Créer la structure imbriquée étape par étape
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];

      // S'assurer que l'objet parent existe et est bien un objet
      if (
        !current[key] ||
        typeof current[key] !== "object" ||
        current[key] === null
      ) {
        current[key] = {};
      }

      // Passer à l'objet enfant
      current = current[key] as Record<string, unknown>;
    }

    // Définir la valeur finale
    const finalKey = keys[keys.length - 1];
    current[finalKey] = value;

    logger.debug("setNestedValue - Résultat:", {
      keys,
      result,
      finalValue: getNestedValue(result, path),
      structure: JSON.stringify(result, null, 2),
    });

    return result;
  };

  // Gérer les changements de champs
  const handleFieldChange = (fieldKey: string, value: unknown) => {
    logger.debug(`CHANGEMENT - Champ "${fieldKey}" modifié:`, {
      ancienneValeur: getNestedValue(formData, fieldKey),
      nouvelleValeur: value,
      type: typeof value,
    });

    setFormData((prev) => {
      logger.debug(
        "CHANGEMENT - formData avant modification:",
        JSON.stringify(prev, null, 2)
      );

      const newData = setNestedValue(prev, fieldKey, value);

      logger.debug(
        "CHANGEMENT - formData après modification:",
        JSON.stringify(newData, null, 2)
      );
      logger.debug(
        "CHANGEMENT - Vérification de la valeur définie:",
        getNestedValue(newData, fieldKey)
      );

      // Log spécifique pour les champs imbriqués
      if (fieldKey.includes(".")) {
        const keys = fieldKey.split(".");
        const parentKey = keys[0];
        const childKey = keys[1];

        logger.debug("CHANGEMENT - Champ imbriqué détecté:", {
          fieldKey,
          parentKey,
          childKey,
          parentObject: newData[parentKey],
          childValue: (newData[parentKey] as Record<string, unknown>)?.[
            childKey
          ],
        });
      }

      return newData;
    });

    // Supprimer l'erreur si le champ devient valide
    if (errors[fieldKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldKey];
        logger.debug(`CHANGEMENT - Erreur supprimée pour "${fieldKey}"`);
        return newErrors;
      });
    }
  };

  // Valider un champ
  const validateField = (
    field: FieldConfig,
    value: unknown
  ): string | undefined => {
    if (field.required && (!value || value.toString().trim() === "")) {
      return `${field.label} est requis`;
    }

    if (
      field.type === "email" &&
      value &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.toString())
    ) {
      return "Format d'email invalide";
    }

    if (field.validation) {
      return field.validation(value as string | number | boolean);
    }

    return undefined;
  };

  // Valider tout le formulaire
  const validateForm = (): boolean => {
    logger.debug("VALIDATION - Début de la validation du formulaire");
    logger.debug(
      "VALIDATION - Données du formulaire:",
      JSON.stringify(formData, null, 2)
    );
    logger.debug("VALIDATION - Configuration des champs:", config.fields);

    const newErrors: Record<string, string> = {};

    config.fields.forEach((field: FieldConfig) => {
      const value = getNestedValue(formData, field.key);
      logger.debug(`VALIDATION - Champ "${field.key}":`, {
        label: field.label,
        type: field.type,
        required: field.required,
        value: value,
        valueType: typeof value,
        isEmpty: !value || value.toString().trim() === "",
      });

      const error = validateField(field, value);
      if (error) {
        logger.warn(`VALIDATION - Erreur pour "${field.key}": ${error}`);
        newErrors[field.key] = error;
      } else {
        logger.debug(`VALIDATION - Champ "${field.key}" valide`);
      }
    });

    logger.debug("VALIDATION - Résumé des erreurs:", newErrors);
    logger.debug(
      "VALIDATION - Formulaire valide:",
      Object.keys(newErrors).length === 0
    );

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Gérer la soumission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    logger.debug("SOUMISSION - Début de la soumission");
    logger.debug(
      "SOUMISSION - Données avant validation:",
      JSON.stringify(formData, null, 2)
    );

    if (!validateForm()) {
      logger.warn("SOUMISSION - Validation échouée, arrêt de la soumission");
      logger.debug("SOUMISSION - Erreurs actuelles:", errors);
      return;
    }

    logger.debug("SOUMISSION - Validation réussie, envoi des données");

    try {
      await onSubmit(formData);
      logger.info("SOUMISSION - Succès de la soumission");
    } catch (error) {
      logger.error("SOUMISSION - Erreur lors de la soumission:", error);
    }
  };

  // Rendu d'un champ
  const renderField = (field: FieldConfig) => {
    const value = getNestedValue(formData, field.key);
    const error = errors[field.key];

    switch (field.type) {
      case "select":
        return (
          <div>
            <label htmlFor={field.key} className="input-label">
              {field.label}
              {field.required && (
                <span className="input-label__required">*</span>
              )}
            </label>
            <select
              id={field.key}
              value={value}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              required={field.required}
              className={`input ${error ? "input--error" : ""}`}
            >
              <option value="">Sélectionner...</option>
              {field.options?.map(
                (option: { value: string; label: string }) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                )
              )}
            </select>
          </div>
        );

      case "textarea":
        return (
          <div>
            <label htmlFor={field.key} className="input-label">
              {field.label}
              {field.required && (
                <span className="input-label__required">*</span>
              )}
            </label>
            <textarea
              id={field.key}
              value={value}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              required={field.required}
              placeholder={field.placeholder}
              rows={3}
              className={`input ${error ? "input--error" : ""}`}
            />
          </div>
        );

      case "checkbox":
        return (
          <div>
            <label htmlFor={field.key} className="input-label">
              <input
                type="checkbox"
                id={field.key}
                checked={!!value}
                onChange={(e) => handleFieldChange(field.key, e.target.checked)}
                className={error ? "input--error" : ""}
              />
              {field.label}
              {field.required && (
                <span className="input-label__required">*</span>
              )}
            </label>
          </div>
        );

      default:
        // Utiliser votre composant Input pour text, email, tel, date
        return (
          <Input
            id={field.key}
            type={field.type}
            value={value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            required={field.required}
            placeholder={field.placeholder}
            error={error}
            label={field.label}
          />
        );
    }
  };

  // Rendu des groupes de champs
  const renderFieldGroup = (groupName: string) => {
    const groupFields = config.fields.filter(
      (field) => field.group === groupName
    );

    if (groupFields.length === 0) return null;

    return (
      <div key={groupName} className="entity-form__group">
        <h3 className="entity-form__group-title">
          {groupName === "primaryContact" && "Contact principal"}
          {groupName === "secondaryContact" && "Contact secondaire"}
          {groupName === "personal" && "Informations personnelles"}
          {groupName === "school" && "Scolarité"}
          {groupName === "contact" && "Contact"}
          {groupName === "professional" && "Statut professionnel"}
          {groupName === "general" && "Informations générales"}
          {groupName === "notes" && "Notes"}
        </h3>
        <div className="entity-form__fields">
          {groupFields.map((field) => (
            <div key={field.key} className="entity-form__field">
              {renderField(field)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`entity-form ${className}`}>
      <div className="entity-form__header">
        <h2>{config.title}</h2>
      </div>

      <form onSubmit={handleSubmit} className="entity-form__form">
        {/* Rendu dynamique de tous les groupes de champs */}
        {(() => {
          // Récupérer tous les groupes uniques présents dans la configuration
          const allGroups = [
            ...new Set(
              config.fields.map((field) => field.group).filter(Boolean)
            ),
          ] as string[];

          // Rendre chaque groupe
          return allGroups.map((groupName) => renderFieldGroup(groupName));
        })()}

        <div className="entity-form__actions">
          <button
            type="submit"
            className="entity-form__submit"
            disabled={isLoading}
          >
            {isLoading ? "Création..." : config.submitButtonText}
          </button>

          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
};
