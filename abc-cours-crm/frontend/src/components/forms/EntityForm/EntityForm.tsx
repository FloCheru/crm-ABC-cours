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
  conditional?: { field: string; value: any }; // Pour affichage conditionnel
  defaultValue?: any; // Valeur par défaut
}

interface EntityConfig {
  title: string;
  fields: FieldConfig[];
  submitButtonText: string;
}

// Configurations pour chaque type d'entité
const ENTITY_CONFIGS: Record<EntityType, EntityConfig> = {
  family: {
    title: "Ajouter un nouveau prospect",
    submitButtonText: "Ajouter le prospect",
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
        key: "primaryContact.gender",
        label: "Civilité",
        type: "select",
        required: true,
        group: "primaryContact",
        options: [
          { value: "M.", label: "M." },
          { value: "Mme", label: "Mme" },
        ],
      },
      {
        key: "primaryContact.relationship",
        label: "Lien de parenté",
        type: "select",
        required: false,
        group: "primaryContact",
        options: [
          { value: "père", label: "Père" },
          { value: "mère", label: "Mère" },
          { value: "tuteur_legal", label: "Tuteur légal" },
          { value: "grand_parent", label: "Grand-parent" },
          { value: "oncle_tante", label: "Oncle/Tante" },
          { value: "autre", label: "Autre" },
        ],
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
        label: "Lien de parenté",
        type: "select",
        required: false,
        group: "secondaryContact",
        options: [
          { value: "père", label: "Père" },
          { value: "mère", label: "Mère" },
          { value: "tuteur_legal", label: "Tuteur légal" },
          { value: "grand_parent", label: "Grand-parent" },
          { value: "oncle_tante", label: "Oncle/Tante" },
          { value: "autre", label: "Autre" },
        ],
      },
      // Nouveaux champs famille
      {
        key: "primaryContact.dateOfBirth",
        label: "Date de naissance",
        type: "date",
        group: "primaryContact",
      },
      // Adresse de facturation
      {
        key: "sameAddress",
        label: "L'adresse de facturation est la même que l'adresse principale",
        type: "checkbox",
        group: "billing",
        defaultValue: false,
      },
      {
        key: "billingAddress.street",
        label: "Adresse de facturation (si différente)",
        type: "text",
        group: "billing",
        conditional: { field: "sameAddress", value: false },
      },
      {
        key: "billingAddress.city", 
        label: "Ville de facturation",
        type: "text",
        group: "billing",
        conditional: { field: "sameAddress", value: false },
      },
      {
        key: "billingAddress.postalCode",
        label: "Code postal de facturation", 
        type: "text",
        group: "billing",
        conditional: { field: "sameAddress", value: false },
      },
      // Informations entreprise
      {
        key: "companyInfo.urssafNumber",
        label: "N° URSSAF",
        type: "text",
        group: "company",
      },
      {
        key: "companyInfo.siretNumber",
        label: "N° SIRET",
        type: "text",
        group: "company",
      },
      {
        key: "companyInfo.ceNumber",
        label: "N° CE",
        type: "text",
        group: "company",
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
        type: "select",
        required: true,
        group: "school",
        conditional: { field: "school.level", value: "any" }, // S'affiche si un niveau est sélectionné
        options: [], // Options dynamiques basées sur school.level
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
    
    // Initialiser les valeurs par défaut des champs
    const config = ENTITY_CONFIGS[entityType];
    config.fields.forEach((field) => {
      if (field.defaultValue !== undefined) {
        const currentValue = getNestedValue(initData, field.key);
        // Initialiser si la valeur n'existe pas (undefined) ou si c'est une checkbox
        if (currentValue === undefined || currentValue === null || currentValue === "") {
          setNestedValue(initData, field.key, field.defaultValue);
          logger.debug(`INIT - Valeur par défaut définie pour "${field.key}":`, field.defaultValue);
        }
      }
    });
    
    setFormData(initData);
    console.log(`🚀 INIT DEBUG - FormData après initialisation:`, {
      initData,
      sameAddress: initData.sameAddress,
      keys: Object.keys(initData)
    });
  }, []); // Une seule fois au montage

  // Mettre à jour seulement si les props changent vraiment
  useEffect(() => {
    if (Object.keys(additionalProps).length > 0) {
      setFormData((prev) => ({ ...prev, ...additionalProps }));
    }
  }, [additionalProps?.familyId]); // Accès sécurisé à familyId

  // Obtenir la valeur d'un champ imbriqué (ex: "address.street")
  const getNestedValue = (
    obj: Record<string, unknown>,
    path: string
  ): any => {
    const value = path.split(".").reduce((current, key) => {
      if (current && typeof current === "object" && key in current) {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj as unknown);

    // Retourner la valeur telle quelle (peut être boolean, string, etc.)
    return value;
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

  // Obtenir les options dynamiques pour le champ classe
  const getClassOptions = (schoolLevel: string): { value: string; label: string }[] => {
    const classMapping: Record<string, { value: string; label: string }[]> = {
      primaire: [
        { value: "CP", label: "CP" },
        { value: "CE1", label: "CE1" },
        { value: "CE2", label: "CE2" },
        { value: "CM1", label: "CM1" },
        { value: "CM2", label: "CM2" },
      ],
      collège: [
        { value: "6ème", label: "6ème" },
        { value: "5ème", label: "5ème" },
        { value: "4ème", label: "4ème" },
        { value: "3ème", label: "3ème" },
      ],
      lycée: [
        { value: "Seconde", label: "Seconde" },
        { value: "Première", label: "Première" },
        { value: "Terminale", label: "Terminale" },
      ],
      supérieur: [
        { value: "L1", label: "L1" },
        { value: "L2", label: "L2" },
        { value: "L3", label: "L3" },
        { value: "M1", label: "M1" },
        { value: "M2", label: "M2" },
        { value: "Doctorat", label: "Doctorat" },
      ],
    };

    return classMapping[schoolLevel] || [];
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

      let newData = setNestedValue(prev, fieldKey, value);

      // Logique spéciale pour la case "même adresse"
      if (fieldKey === "sameAddress" && value === true) {
        // Copier l'adresse principale vers l'adresse de facturation
        if (newData.address && typeof newData.address === 'object') {
          const address = newData.address as { street?: string; city?: string; postalCode?: string };
          newData = {
            ...newData,
            billingAddress: {
              street: address.street || "",
              city: address.city || "",
              postalCode: address.postalCode || "",
            },
          };
        }
      } else if (fieldKey === "sameAddress" && value === false) {
        // Vider l'adresse de facturation pour permettre la saisie manuelle
        newData = {
          ...newData,
          billingAddress: {
            street: "",
            city: "",
            postalCode: "",
          },
        };
      }

      // Logique spéciale pour le niveau scolaire - réinitialiser la classe
      if (fieldKey === "school.level") {
        newData = setNestedValue(newData, "school.grade", "");
        logger.debug("CHANGEMENT - Classe réinitialisée suite au changement de niveau");
      }

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

  // Vérifier si un champ doit être affiché (logique conditionnelle)
  const shouldShowField = (field: FieldConfig): boolean => {
    if (!field.conditional) return true;
    
    const conditionValue = getNestedValue(formData, field.conditional.field);
    
    // Logique spéciale pour "any" - s'affiche si une valeur existe et n'est pas vide
    if (field.conditional.value === "any") {
      const shouldShow = conditionValue && conditionValue.toString().trim() !== "";
      
      // Debug pour school.grade
      if (field.key === "school.grade") {
        console.log(`🔍 CONDITIONAL DEBUG - Champ classe "${field.key}":`, {
          conditionField: field.conditional.field,
          conditionValueExpected: field.conditional.value,
          conditionValueActual: conditionValue,
          shouldShow,
          schoolLevel: getNestedValue(formData, "school.level")
        });
      }
      
      return shouldShow;
    }
    
    // Convertir les valeurs booléennes pour comparaison stricte
    let actualValue = conditionValue;
    let expectedValue = field.conditional.value;
    
    // Si on attend une valeur booléenne, s'assurer que la comparaison est correcte
    if (typeof expectedValue === "boolean") {
      actualValue = Boolean(conditionValue);
    }
    
    const shouldShow = actualValue === expectedValue;
    
    // Debug pour billingAddress
    if (field.key.includes("billingAddress")) {
      console.log(`🔍 CONDITIONAL DEBUG - Champ "${field.key}":`, {
        conditionField: field.conditional.field,
        conditionValueExpected: field.conditional.value,
        conditionValueActual: conditionValue,
        conditionValueType: typeof conditionValue,
        shouldShow,
        formDataSameAddress: formData.sameAddress,
        formDataKeys: Object.keys(formData)
      });
    }
    
    return shouldShow;
  };

  // Rendu d'un champ
  const renderField = (field: FieldConfig) => {
    // Vérifier si le champ doit être affiché
    if (!shouldShowField(field)) {
      return null;
    }

    const value = getNestedValue(formData, field.key);
    const error = errors[field.key];

    switch (field.type) {
      case "select":
        // Options dynamiques pour le champ classe basées sur le niveau scolaire
        let selectOptions = field.options || [];
        if (field.key === "school.grade") {
          const schoolLevel = getNestedValue(formData, "school.level")?.toString() || "";
          selectOptions = getClassOptions(schoolLevel);
        }

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
              value={value?.toString() || ""}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              required={field.required}
              className={`input ${error ? "input--error" : ""}`}
            >
              <option value="">Sélectionner...</option>
              {selectOptions.map(
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
              value={value?.toString() || ""}
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
            value={value?.toString() || ""}
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
          {groupName === "billing" && "Adresse de facturation"}
          {groupName === "company" && "Informations entreprise"}
          {groupName === "personal" && "Informations personnelles"}
          {groupName === "school" && "Scolarité"}
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
