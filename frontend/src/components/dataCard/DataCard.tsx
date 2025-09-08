import React, { useState } from "react";
import { Input, Select, Button } from "../";
import "./DataCard.css";

export interface FieldConfig {
  key: string;
  label: string;
  value: any;
  type: "text" | "email" | "tel" | "number" | "date" | "textarea" | "select";
  required?: boolean;
  placeholder?: string;
  options?: Array<{value: string; label: string}>;
  readOnly?: boolean;
  customRender?: () => React.ReactNode;
}

export interface DataCardProps {
  title: string;
  fields: FieldConfig[];
  onSave?: (data: Record<string, any>) => Promise<void>;
  className?: string;
  children?: React.ReactNode;
  // Props optionnels pour compatibilité avec les composants existants
  isEditing?: boolean;
  onChange?: (key: string, value: any) => void;
  errors?: Record<string, string>;
}

/**
 * Composant DataCard réutilisable avec mode lecture/édition
 *
 * @example
 * ```tsx
 * const fields: FieldConfig[] = [
 *   {
 *     key: "firstName",
 *     label: "Prénom",
 *     value: client.firstName,
 *     type: "text",
 *     required: true,
 *     placeholder: "Entrez le prénom"
 *   },
 *   {
 *     key: "email",
 *     label: "Email",
 *     value: client.email,
 *     type: "email",
 *     placeholder: "email@exemple.com"
 *   },
 *   {
 *     key: "description",
 *     label: "Description",
 *     value: client.description,
 *     type: "textarea",
 *     placeholder: "Description détaillée"
 *   },
 *   {
 *     key: "category",
 *     label: "Catégorie",
 *     value: client.category,
 *     type: "select",
 *     options: [
 *       { value: "", label: "Sélectionner une catégorie" },
 *       { value: "premium", label: "Premium" },
 *       { value: "standard", label: "Standard" }
 *     ]
 *   }
 * ];
 *
 * <DataCard
 *   title="Informations client"
 *   fields={fields}
 *   isEditing={isEditing}
 *   onChange={(key, value) => setClient({...client, [key]: value})}
 *   errors={validationErrors}
 * />
 * ```
 */
export const DataCard: React.FC<DataCardProps> = ({
  title,
  fields,
  onSave,
  className = "",
  children
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localData, setLocalData] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const cardClasses = ["data-card", className].filter(Boolean).join(" ");

  const handleEditToggle = () => {
    if (isEditing) {
      // Annuler : réinitialiser les données locales
      setLocalData({});
      setValidationErrors({});
      setIsEditing(false);
    } else {
      // Démarrer l'édition : initialiser avec les valeurs actuelles
      const initialData: Record<string, any> = {};
      fields.forEach(field => {
        initialData[field.key] = field.value;
      });
      setLocalData(initialData);
      setValidationErrors({});
      setIsEditing(true);
    }
  };

  const handleFieldChange = (key: string, value: any) => {
    setLocalData(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Effacer l'erreur de validation pour ce champ
    if (validationErrors[key]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    fields.forEach(field => {
      if (field.required) {
        const value = localData[field.key];
        if (!value || (typeof value === 'string' && !value.trim())) {
          errors[field.key] = `${field.label} est requis`;
        }
      }
    });
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !onSave) return;
    
    setIsSaving(true);
    try {
      await onSave(localData);
      setIsEditing(false);
      setValidationErrors({});
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      // On pourrait ajouter une notification d'erreur ici
    } finally {
      setIsSaving(false);
    }
  };

  const renderField = (field: FieldConfig) => {
    const { key, label, value, type, required, placeholder, options, customRender, readOnly } = field;
    const displayValue = isEditing ? (localData[key] ?? value) : value;
    const error = validationErrors[key];
    
    // Si un rendu custom est défini et qu'on n'est pas en mode édition ou que c'est readOnly
    if (customRender && (!isEditing || readOnly)) {
      return (
        <div key={key} className="data-card__field">
          <label className="data-card__label">{label}</label>
          {customRender()}
        </div>
      );
    }

    if (!isEditing) {
      // Mode lecture
      let readDisplayValue = displayValue;
      
      // Formatage spécial pour certains types
      if (type === "date" && displayValue) {
        readDisplayValue = new Date(displayValue).toLocaleDateString("fr-FR");
      } else if (type === "select" && displayValue && options) {
        const option = options.find(opt => opt.value === displayValue);
        readDisplayValue = option ? option.label : displayValue;
      } else if (!displayValue) {
        readDisplayValue = "Non renseigné";
      }

      return (
        <div key={key} className="data-card__field">
          <label className="data-card__label">{label}</label>
          <p className="data-card__value">{readDisplayValue}</p>
        </div>
      );
    }

    // Mode édition

    if (type === "textarea") {
      return (
        <div key={key} className="data-card__field data-card__field--textarea">
          <label className="data-card__label">
            {label}
            {required && <span className="data-card__required">*</span>}
          </label>
          <textarea
            value={displayValue || ""}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            placeholder={placeholder}
            className={`data-card__textarea ${error ? "data-card__textarea--error" : ""}`}
            rows={4}
            disabled={isSaving}
          />
          {error && <div className="data-card__error" role="alert">{error}</div>}
        </div>
      );
    }

    if (type === "select" && options) {
      return (
        <div key={key} className="data-card__field">
          <Select
            label={label}
            value={displayValue || ""}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            options={options}
            required={required}
            error={error}
            className="data-card__select"
            disabled={isSaving}
          />
        </div>
      );
    }

    return (
      <div key={key} className="data-card__field">
        <Input
          type={type}
          label={label}
          value={displayValue || ""}
          onChange={(e) => handleFieldChange(key, e.target.value)}
          placeholder={placeholder}
          required={required}
          error={error}
          className="data-card__input"
          disabled={isSaving}
        />
      </div>
    );
  };

  return (
    <section className={cardClasses}>
      <div className="data-card__header">
        <h2 className="data-card__title">{title}</h2>
        {onSave && (
          <div className="data-card__actions">
            {isEditing ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleEditToggle}
                  disabled={isSaving}
                >
                  Annuler
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? "Sauvegarde..." : "Sauvegarder"}
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="primary"
                onClick={handleEditToggle}
                title="Modifier"
              >
                ✏️
              </Button>
            )}
          </div>
        )}
      </div>
      <div className="data-card__content">
        {fields.length > 0 && (
          <div className="data-card__grid">
            {fields.map(renderField)}
          </div>
        )}
        {children && (
          <div className="data-card__children">
            {children}
          </div>
        )}
      </div>
    </section>
  );
};