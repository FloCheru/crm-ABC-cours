import React from "react";
import { Button } from "./Button";
import type { ButtonVariant } from "./Button";
import "./ButtonGroup.css";

type ButtonGroupVariant = "single" | "double" | "triple";

interface ButtonConfig {
  /**
   * Texte du bouton
   */
  text: string;

  /**
   * Variante du bouton (primary, secondary, error, outline)
   */
  variant?: ButtonVariant;

  /**
   * Fonction appelée au clic
   */
  onClick?: () => void;

  /**
   * Bouton désactivé
   */
  disabled?: boolean;
}

interface ButtonGroupProps {
  /**
   * Variante du groupe (nombre de boutons)
   */
  variant: ButtonGroupVariant;

  /**
   * Configuration des boutons
   */
  buttons: ButtonConfig[];

  /**
   * Classes CSS supplémentaires
   */
  className?: string;
}

/**
 * Composant ButtonGroup avec 1, 2 ou 3 boutons
 *
 * @example
 * ```tsx
 * // Un bouton
 * <ButtonGroup
 *   variant="single"
 *   buttons={[
 *     { text: "Valider", variant: "primary", onClick: handleSubmit }
 *   ]}
 * />
 *
 * // Deux boutons
 * <ButtonGroup
 *   variant="double"
 *   buttons={[
 *     { text: "Annuler", variant: "secondary", onClick: handleCancel },
 *     { text: "Valider", variant: "primary", onClick: handleSubmit }
 *   ]}
 * />
 *
 * // Trois boutons
 * <ButtonGroup
 *   variant="triple"
 *   buttons={[
 *     { text: "Supprimer", variant: "error", onClick: handleDelete },
 *     { text: "Annuler", variant: "secondary", onClick: handleCancel },
 *     { text: "Valider", variant: "primary", onClick: handleSubmit }
 *   ]}
 * />
 * ```
 */
export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  variant,
  buttons,
  className = "",
}) => {
  // Validation du nombre de boutons selon la variante
  const expectedCount = variant === "single" ? 1 : variant === "double" ? 2 : 3;

  if (buttons.length !== expectedCount) {
    console.warn(
      `ButtonGroup variant "${variant}" expects ${expectedCount} button(s), but ${buttons.length} provided.`
    );
  }

  // Construction des classes CSS
  const classes = ["button-group", `button-group--${variant}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      {buttons.slice(0, expectedCount).map((button, index) => (
        <Button
          key={index}
          variant={button.variant || "primary"}
          onClick={button.onClick}
          disabled={button.disabled}
        >
          {button.text}
        </Button>
      ))}
    </div>
  );
};
