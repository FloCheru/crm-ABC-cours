import React from "react";
import "./Button.css";

export type ButtonVariant = "primary" | "secondary" | "error" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Variante visuelle du bouton
   */
  variant?: ButtonVariant;

  /**
   * Taille du bouton
   */
  size?: ButtonSize;

  /**
   * Bouton pleine largeur
   */
  fullWidth?: boolean;

  /**
   * Contenu du bouton
   */
  children: React.ReactNode;

  /**
   * Classes CSS supplémentaires
   */
  className?: string;
}

/**
 * Composant Button avec différentes variantes et tailles
 *
 * @example
 * ```tsx
 * <Button variant="primary" onClick={handleClick}>
 *   Valider
 * </Button>
 *
 * <Button variant="error" size="sm">
 *   Supprimer
 * </Button>
 * ```
 */
export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  fullWidth = false,
  children,
  className = "",
  disabled,
  ...props
}) => {
  // Construction des classes CSS
  const classes = [
    "btn",
    `btn--${variant}`,
    size !== "md" && `btn--${size}`,
    fullWidth && "btn--full-width",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} disabled={disabled} {...props}>
      {children}
    </button>
  );
};

export default Button;
