import React from "react";
import { Input, Select } from "../";
import "./DataCard.css";

export interface FieldConfig {
  key: string;
  label: string;
  value: any;
  type: "text" | "email" | "tel" | "number" | "date" | "textarea" | "select";
  required?: boolean;
  placeholder?: string;
  options?: Array<{value: string; label: string}>;
}

export interface DataCardProps {
  title: string;
  fields: FieldConfig[];
  isEditing?: boolean;
  onChange?: (key: string, value: any) => void;
  errors?: Record<string, string>;
  className?: string;
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
  isEditing = false,
  onChange,
  errors = {},
  className = ""
}) => {
  const cardClasses = ["data-card", className].filter(Boolean).join(" ");

  const handleFieldChange = (key: string, value: any) => {
    if (onChange) {
      onChange(key, value);
    }
  };

  const renderField = (field: FieldConfig) => {
    const { key, label, value, type, required, placeholder, options } = field;
    const error = errors[key];

    if (!isEditing) {
      // Mode lecture
      let displayValue = value;
      
      // Formatage spécial pour certains types
      if (type === "date" && value) {
        displayValue = new Date(value).toLocaleDateString("fr-FR");
      } else if (type === "select" && value && options) {
        const option = options.find(opt => opt.value === value);
        displayValue = option ? option.label : value;
      } else if (!value) {
        displayValue = "Non renseigné";
      }

      return (
        <div key={key} className="data-card__field">
          <label className="data-card__label">{label}</label>
          <p className="data-card__value">{displayValue}</p>
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
            value={value || ""}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            placeholder={placeholder}
            className={`data-card__textarea ${error ? "data-card__textarea--error" : ""}`}
            rows={4}
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
            value={value || ""}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            options={options}
            required={required}
            error={error}
            className="data-card__select"
          />
        </div>
      );
    }

    return (
      <div key={key} className="data-card__field">
        <Input
          type={type}
          label={label}
          value={value || ""}
          onChange={(e) => handleFieldChange(key, e.target.value)}
          placeholder={placeholder}
          required={required}
          error={error}
          className="data-card__input"
        />
      </div>
    );
  };

  return (
    <div className={cardClasses}>
      <div className="data-card__header">
        <h2 className="data-card__title">{title}</h2>
      </div>
      <div className="data-card__content">
        <div className="data-card__grid">
          {fields.map(renderField)}
        </div>
      </div>
    </div>
  );
};