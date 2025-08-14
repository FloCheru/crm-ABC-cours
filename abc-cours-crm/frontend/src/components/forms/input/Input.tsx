import React from "react";
import "./Input.css";

interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  /**
   * Label personnalisé (optionnel, sinon généré automatiquement)
   */
  label?: string;

  /**
   * Type de l'input (pour générer le label automatiquement)
   */
  type?: string;

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
   * Composant Button à afficher (active la variante avec bouton)
   */
  button?: React.ReactNode;

  /**
   * Classes CSS supplémentaires
   */
  className?: string;
}

/**
 * Composant Input avec label optionnel
 *
 * @example
 * ```tsx
 * // Input sans label
 * <Input
 *   type="email"
 *   placeholder="votre@email.com"
 * />
 *
 * // Input avec label personnalisé
 * <Input
 *   label="Email professionnel"
 *   type="email"
 *   placeholder="votre@email.com"
 * />
 *
 * // Input avec bouton
 * <Input
 *   type="text"
 *   placeholder="Code promo"
 *   button={<Button variant="primary" onClick={handleApply}>Appliquer</Button>}
 * />
 *
 * // Input avec erreur
 * <Input
 *   type="password"
 *   required
 *   error="Le mot de passe est requis"
 * />
 *
 * // Input avec texte d'aide
 * <Input
 *   type="tel"
 *   placeholder="06 12 34 56 78"
 *   helpText="Format recommandé : 06 12 34 56 78"
 * />
 *
 * // Input avec validation
 * <Input
 *   type="number"
 *   placeholder="25"
 *   required
 *   error="Le nombre de coupons est requis"
 * />
 * ```
 */
export const Input: React.FC<InputProps> = ({
  label,
  type = "text",
  required = false,
  error,
  helpText,
  button,
  className = "",
  id,
  ...props
}) => {
  // Génère un ID unique si non fourni
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const inputClasses = ["input", error && "input--error", className]
    .filter(Boolean)
    .join(" ");

  const fieldClasses = ["input-field", button && "input-field--with-button"]
    .filter(Boolean)
    .join(" ");

  const inputContainer = (
    <>
      <input
        id={inputId}
        type={type}
        className={inputClasses}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={
          error ? `${inputId}-error` : helpText ? `${inputId}-help` : undefined
        }
        {...props}
      />

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
          {required && <span className="input-label__required">*</span>}
        </label>
      )}

      {button ? (
        // Si bouton, pas de wrapper supplémentaire
        inputContainer
      ) : (
        // Si pas de bouton, wrapper simple
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
