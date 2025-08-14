import React from "react";
import "./FormCard.css";

interface FormCardProps {
  /**
   * Titre du formulaire affiché en haut
   */
  title?: string;

  /**
   * Icône à afficher à côté du titre
   */
  icon?: React.ReactNode;

  /**
   * Variante du formulaire
   */
  variant?: "default" | "compact";

  /**
   * Contenu du formulaire
   */
  children: React.ReactNode;

  /**
   * Classes CSS supplémentaires
   */
  className?: string;
}

/**
 * Composant FormCard pour encadrer les formulaires
 *
 * @example
 * ```tsx
 * <FormCard title="Encart Form" icon={<FileText />}>
 *   <Input label="Title" placeholder="Placeholder" required />
 *   <Input label="Comment" placeholder="Placeholder" />
 *   <Input
 *     label="Title"
 *     placeholder="Placeholder"
 *     as="textarea"
 *     rows={4}
 *   />
 * </FormCard>
 * ```
 */
export const FormCard: React.FC<FormCardProps> = ({
  title,
  icon,
  variant = "default",
  children,
  className = "",
}) => {
  const classes = [
    "form-card",
    variant === "compact" && "form-card--compact",
    !title && "form-card--no-title",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      {title && (
        <div className="form-card__title">
          {icon && (
            <span className="form-card__icon" aria-hidden="true">
              {icon}
            </span>
          )}
          {title}
        </div>
      )}

      <div className="form-card__content">{children}</div>
    </div>
  );
};
