import React from "react";
import "./Select.css";

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  /**
   * Label personnalisé
   */
  label?: string;

  /**
   * Indique si le champ est requis
   */
  required?: boolean;

  /**
   * Message d'erreur à afficher
   */
  error?: string;

  /**
   * Texte d'aide sous le select
   */
  helpText?: string;

  /**
   * Options du select
   */
  options: SelectOption[];

  /**
   * Classes CSS supplémentaires
   */
  className?: string;
}

/**
 * Composant Select pour les listes déroulantes
 *
 * @example
 * ```tsx
 * <Select
 *   label="Famille"
 *   placeholder="Sélectionner une famille"
 *   options={[
 *     { value: "", label: "Sélectionner une famille" },
 *     { value: "1", label: "Famille Martin" },
 *     { value: "2", label: "Famille Dupont" }
 *   ]}
 *   value={selectedFamily}
 *   onChange={(e) => setSelectedFamily(e.target.value)}
 * />
 * ```
 */
export const Select: React.FC<SelectProps> = ({
  label,
  required = false,
  error,
  helpText,
  options,
  className = "",
  id,
  ...props
}) => {
  // Génère un ID unique si non fourni
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

  const selectClasses = ["select", error && "select--error", className]
    .filter(Boolean)
    .join(" ");

  const fieldClasses = ["select-field"].filter(Boolean).join(" ");

  return (
    <div className={fieldClasses}>
      {label && (
        <label
          htmlFor={selectId}
          className={`select-label ${required ? "select-label--required" : ""}`}
        >
          {label}
          {required && <span className="select-label__required">*</span>}
        </label>
      )}

      <select
        id={selectId}
        className={selectClasses}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={
          error
            ? `${selectId}-error`
            : helpText
            ? `${selectId}-help`
            : undefined
        }
        {...props}
      >
        {options.map((option, index) => (
          <option key={index} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>

      {error && (
        <div id={`${selectId}-error`} className="select-error" role="alert">
          {error}
        </div>
      )}

      {helpText && !error && (
        <div id={`${selectId}-help`} className="select-help">
          {helpText}
        </div>
      )}
    </div>
  );
};
