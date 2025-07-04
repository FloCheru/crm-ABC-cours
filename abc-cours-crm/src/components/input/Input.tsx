import React from "react";
import "./Input.css";

type InputSize = "sm" | "md" | "lg";

interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  /**
   * Libellé de l'input
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
   * Texte d'aide sous l'input
   */
  helpText?: string;

  /**
   * Taille de l'input
   */
  size?: InputSize;

  /**
   * Icône à afficher dans l'input
   */
  icon?: React.ReactNode;

  /**
   * Composant Button à afficher (active la variante avec bouton)
   */
  button?: React.ReactNode;

  /**
   * Classes CSS supplémentaires
   */
  className?: string;
}

/**
 * Composant Input avec label, validation et différents états
 *
 * @example
 * ```tsx
 * // Input basique
 * <Input
 *   label="Email"
 *   type="email"
 *   placeholder="votre@email.com"
 * />
 *
 * // Input avec votre composant Button
 * <Input
 *   placeholder="Code promo"
 *   button={<Button variant="primary" onClick={handleApply}>Appliquer</Button>}
 * />
 *
 * // Input avec erreur
 * <Input
 *   label="Mot de passe"
 *   type="password"
 *   required
 *   error="Le mot de passe est requis"
 * />
 * ```
 */
export const Input: React.FC<InputProps> = ({
  label,
  required = false,
  error,
  helpText,
  size = "md",
  icon,
  button,
  className = "",
  id,
  ...props
}) => {
  // Génère un ID unique si non fourni
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const inputClasses = [
    "input",
    size !== "md" && `input--${size}`,
    error && "input--error",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const fieldClasses = [
    "input-field",
    icon && "input-field--with-icon",
    button && "input-field--with-button",
  ]
    .filter(Boolean)
    .join(" ");

  const inputContainer = (
    <>
      <input
        id={inputId}
        className={inputClasses}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={
          error ? `${inputId}-error` : helpText ? `${inputId}-help` : undefined
        }
        {...props}
      />

      {icon && (
        <span className="input-icon" aria-hidden="true">
          {icon}
        </span>
      )}

      {button}
    </>
  );

  return (
    <div className={fieldClasses}>
      {label && (
        <label
          htmlFor={inputId}
          className={`input-label ${required ? "input-label--required" : ""}`}
        >
          {label}
        </label>
      )}

      {button ? (
        // Si bouton, pas de wrapper supplémentaire
        inputContainer
      ) : (
        // Si pas de bouton, wrapper pour l'icône
        <div style={{ position: "relative" }}>{inputContainer}</div>
      )}

      {error && (
        <div id={`${inputId}-error`} className="input-error" role="alert">
          {error}
        </div>
      )}

      {helpText && !error && (
        <div id={`${inputId}-help`} className="input-help">
          {helpText}
        </div>
      )}
    </div>
  );
};

export default Input;
