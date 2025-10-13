import React, { useState, useEffect } from "react";
import { Button } from "../../button/Button";
import { Input } from "../input/Input";
import { logger } from "../../../utils/logger";
import {
  getAllGrades,
  getGradesByCategory,
  type SchoolCategory,
} from "../../../constants/schoolLevels";
import type { CreateFamilyData } from "../../../types/family";
import "./EntityForm.css";

// Types de configuration pour différentes entités
export type EntityType = "family" | "student" | "subject";

// Mapping des types d'entité vers leurs types de données
type EntityDataMap = {
  family: CreateFamilyData;
  student: Record<string, unknown>; // À typer plus tard si nécessaire
  subject: Record<string, unknown>; // À typer plus tard si nécessaire
};

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
        key: "notes",
        label: "Notes générales",
        type: "textarea",
        group: "notes",
      },
      {
        key: "primaryContact.lastName",
        label: "Nom de famille",
        type: "text",
        group: "primaryContact",
      },
      {
        key: "primaryContact.firstName",
        label: "Prénom du contact principal",
        type: "text",
        group: "primaryContact",
      },
      {
        key: "primaryContact.primaryPhone",
        label: "Tél",
        type: "tel",
        group: "primaryContact",
      },
      {
        key: "primaryContact.email",
        label: "Email",
        type: "email",
        group: "primaryContact",
      },
      {
        key: "primaryContact.relation",
        label: "Civilité",
        type: "select",
        group: "primaryContact",
        options: [
          { value: "M.", label: "M." },
          { value: "Mme", label: "Mme" },
        ],
      },
      {
        key: "primaryContact.relation",
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
        group: "primaryContact",
      },
      {
        key: "address.postalCode",
        label: "Code postal",
        type: "text",
        group: "primaryContact",
      },
      {
        key: "address.city",
        label: "Ville",
        type: "text",
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
        key: "secondaryContact.relation",
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
        key: "primaryContact.birthDate",
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
      // Demande de cours
      {
        key: "demande.beneficiaryType",
        label: "Type de bénéficiaire",
        type: "select",
        group: "demande",
        options: [
          { value: "adulte", label: "Adulte" },
          { value: "eleves", label: "Élèves" },
        ],
      },
      {
        key: "demande.beneficiaryGrade",
        label: "Niveau du bénéficiaire",
        type: "select",
        group: "demande",
        options: [
          { value: "", label: "Sélectionner un niveau" },
          ...getAllGrades(),
        ],
      },
      {
        key: "demande.subjects",
        label: "Matières souhaitées",
        type: "text",
        group: "demande",
        placeholder: "Ex: Mathématiques, Français (séparées par des virgules)",
      },
      {
        key: "demande.notes",
        label: "Notes sur la demande",
        type: "textarea",
        group: "demande",
        placeholder: "Précisions sur la demande de cours...",
      },
      {
        key: "plannedTeacher",
        label: "Professeur prévu",
        type: "text",
        group: "demande",
        placeholder: "Nom du professeur prévu (optionnel)",
      },
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

        group: "personal",
      },
      {
        key: "lastName",
        label: "Nom",
        type: "text",

        group: "personal",
      },
      {
        key: "birthDate",
        label: "Date de naissance",
        type: "date",

        group: "personal",
      },

      // Scolarité
      {
        key: "school.name",
        label: "Établissement",
        type: "text",

        group: "school",
      },
      {
        key: "school.Grade",
        label: "Niveau scolaire",
        type: "select",

        group: "school",
        options: [
          { value: "primaire", label: "Primaire" },
          { value: "college", label: "Collège" },
          { value: "lycee", label: "Lycée" },
          { value: "superieur", label: "Supérieur" },
        ],
      },
      {
        key: "school.grade",
        label: "Classe",
        type: "select",

        group: "school",
        conditional: { field: "school.grade", value: "any" }, // S'affiche si un niveau est sélectionné
        options: [], // Options dynamiques basées sur school.grade
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

        group: "general",
      },
      {
        key: "description",
        label: "Description",
        type: "textarea",
        group: "general",
      },
      {
        key: "grade",
        label: "Niveau",
        type: "select",

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

interface EntityFormProps<T extends EntityType = EntityType> {
  /** Type d'entité à créer */
  entityType: T;
  /** Fonction appelée lors de la soumission */
  onSubmit: (data: EntityDataMap[T]) => Promise<void> | void;
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
  /** Mode spécifique pour les familles (prospect/client) */
  familyMode?: "prospect" | "client";
  /** Fonction pour créer un prospect de test (family uniquement) */
  onCreateTestProspect?: () => Promise<void>;
}

/**
 * Composant de formulaire générique pour créer/éditer des entités
 */
export const EntityForm = <T extends EntityType>(
  props: EntityFormProps<T>
): React.ReactElement => {
  const {
    entityType,
    onSubmit,
    onCancel,
    isLoading = false,
    initialData = {},
    additionalProps = {},
    className = "",
    onCreateTestProspect,
    familyMode = "prospect",
  } = props;
  const config = ENTITY_CONFIGS[entityType];

  // Adapter le titre et le texte du bouton selon le mode famille
  const getDisplayConfig = () => {
    if (entityType === "family") {
      if (familyMode === "client") {
        return {
          title: "Ajouter un nouveau client",
          submitButtonText: "Ajouter le client",
        };
      } else {
        return {
          title: "Ajouter un nouveau prospect",
          submitButtonText: "Ajouter le prospect",
        };
      }
    }
    return {
      title: config.title,
      submitButtonText: config.submitButtonText,
    };
  };

  const displayConfig = getDisplayConfig();
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>(""); // Erreur générale de soumission

  // Initialiser les données du formulaire
  useEffect(() => {
    const initData = { ...additionalProps, ...initialData };

    // Initialiser les valeurs par défaut des champs
    const config = ENTITY_CONFIGS[entityType];
    config.fields.forEach((field) => {
      if (field.defaultValue !== undefined) {
        const currentValue = getNestedValue(initData, field.key);
        // Initialiser si la valeur n'existe pas (undefined) ou si c'est une checkbox
        if (
          currentValue === undefined ||
          currentValue === null ||
          currentValue === ""
        ) {
          setNestedValue(initData, field.key, field.defaultValue);
          logger.debug(
            `INIT - Valeur par défaut définie pour "${field.key}":`,
            field.defaultValue
          );
        }
      }
    });

    setFormData(initData);
    console.log(`🚀 INIT DEBUG - FormData après initialisation:`, {
      initData,
      sameAddress: initData.sameAddress,
      keys: Object.keys(initData),
    });
  }, []); // Une seule fois au montage

  // Mettre à jour seulement si les props changent vraiment
  useEffect(() => {
    if (Object.keys(additionalProps).length > 0) {
      setFormData((prev) => ({ ...prev, ...additionalProps }));
    }
  }, [additionalProps?.familyId]); // Accès sécurisé à familyId

  // Obtenir la valeur d'un champ imbriqué (ex: "address.street")
  const getNestedValue = (obj: Record<string, unknown>, path: string): any => {
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
  const getClassOptions = (
    schoolGrade: string
  ): { value: string; label: string }[] => {
    // Utilise les constants centralisées
    return getGradesByCategory(schoolGrade as SchoolCategory);
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
        if (newData.address && typeof newData.address === "object") {
          const address = newData.address as {
            street?: string;
            city?: string;
            postalCode?: string;
          };
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
      if (fieldKey === "school.grade") {
        newData = setNestedValue(newData, "school.grade", "");
        logger.debug(
          "CHANGEMENT - Classe réinitialisée suite au changement de niveau"
        );
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

  // Valider tout le formulaire - VALIDATION DÉSACTIVÉE
  const validateForm = (): boolean => {
    logger.debug("VALIDATION - Validation désactivée");
    // Toujours retourner true (formulaire toujours valide)
    return true;
  };

  // Vérifier si on est en environnement de développement
  const isDevelopment = import.meta.env.VITE_ENVIRONMENT === "development";

  // Debug pour vérifier les conditions d'affichage du bouton
  console.log("🔍 DEBUG Bouton test:", {
    isDevelopment,
    VITE_ENVIRONMENT: import.meta.env.VITE_ENVIRONMENT,
    entityType,
    shouldShowButton: isDevelopment && entityType === "family",
  });

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

    // Traitement spécial pour les familles : transformer subjects en tableau
    let processedData = { ...formData };
    if (
      entityType === "family" &&
      processedData.demande &&
      typeof processedData.demande === "object"
    ) {
      const demande = processedData.demande as Record<string, unknown>;
      if (demande.subjects && typeof demande.subjects === "string") {
        demande.subjects = demande.subjects
          .split(",")
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0);
      }
    }

    try {
      // Réinitialiser l'erreur de soumission
      setSubmitError("");
      await onSubmit(processedData as EntityDataMap[T]);
      logger.info("SOUMISSION - Succès de la soumission");
    } catch (error) {
      logger.error("SOUMISSION - Erreur lors de la soumission:", error);

      // Extraire le message d'erreur
      let errorMessage = "Une erreur est survenue lors de la création";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (error && typeof error === "object" && "message" in error) {
        errorMessage = (error as any).message;
      }

      // Gérer les erreurs de validation spécifiques
      if (errorMessage.includes("Type de bénéficiaire requis")) {
        errorMessage = "Le type de bénéficiaire est obligatoire";
      } else if (errorMessage.includes("validation failed")) {
        errorMessage = "Certains champs requis sont manquants ou invalides";
      } else if (errorMessage.includes("email")) {
        errorMessage = "L'adresse email n'est pas valide";
      }

      setSubmitError(errorMessage);
    }
  };

  // Vérifier si un champ doit être affiché (logique conditionnelle)
  const shouldShowField = (field: FieldConfig): boolean => {
    if (!field.conditional) return true;

    const conditionValue = getNestedValue(formData, field.conditional.field);

    // Logique spéciale pour "any" - s'affiche si une valeur existe et n'est pas vide
    if (field.conditional.value === "any") {
      const shouldShow =
        conditionValue && conditionValue.toString().trim() !== "";

      // Debug pour school.grade
      if (field.key === "school.grade") {
        console.log(`🔍 CONDITIONAL DEBUG - Champ classe "${field.key}":`, {
          conditionField: field.conditional.field,
          conditionValueExpected: field.conditional.value,
          conditionValueActual: conditionValue,
          shouldShow,
          schoolGrade: getNestedValue(formData, "school.grade"),
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
        formDataKeys: Object.keys(formData),
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
          const schoolGrade =
            getNestedValue(formData, "school.grade")?.toString() || "";
          selectOptions = getClassOptions(schoolGrade);
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
              {selectOptions.map((option: { value: string; label: string }) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
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
          {groupName === "address" && "Adresse"}
          {groupName === "primaryContact" && "Contact principal"}
          {groupName === "secondaryContact" && "Contact secondaire"}
          {groupName === "billing" && "Adresse de facturation"}
          {groupName === "company" && "Informations entreprise"}
          {groupName === "demande" && "Demande de cours"}
          {groupName === "personal" && "Informations personnelles"}
          {groupName === "school" && "Scolarité"}
          {groupName === "notes" && "Notes"}
          {groupName === "professional" && "Statut professionnel"}
          {groupName === "general" && "Informations générales"}
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
        <h2>{displayConfig.title}</h2>

        {/* Bouton de création directe de prospect de test */}
        {entityType === "family" && onCreateTestProspect && (
          <Button
            type="button"
            variant="primary"
            onClick={onCreateTestProspect}
            disabled={isLoading}
            title="Crée directement un prospect de test avec des données prédéfinies"
          >
            🚀 Prospect test
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="entity-form__form">
        {/* Encart d'erreur général */}
        {submitError && (
          <div className="entity-form__error-banner">
            <div className="entity-form__error-content">
              <span className="entity-form__error-icon">⚠️</span>
              <span className="entity-form__error-message">{submitError}</span>
            </div>
          </div>
        )}

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
            {isLoading ? "Création..." : displayConfig.submitButtonText}
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
