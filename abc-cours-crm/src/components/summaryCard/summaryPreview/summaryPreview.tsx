import React from "react";
import "./SummaryPreview.css";

interface SummaryItem {
  /**
   * Libellé de la ligne
   */
  label: string;

  /**
   * Valeur affichée
   */
  value: string;
}

interface SummaryPreviewProps {
  /**
   * Titre de l'aperçu
   */
  title?: string;

  /**
   * Liste des éléments à afficher
   */
  items: SummaryItem[];

  /**
   * Montant total (optionnel)
   */
  total?: {
    label: string;
    value: string;
  };

  /**
   * Classes CSS supplémentaires
   */
  className?: string;
}

/**
 * Composant SummaryPreview pour afficher un aperçu de données
 *
 * @example
 * ```tsx
 * <SummaryPreview
 *   title="Aperçu de la série"
 *   items={[
 *     { label: "Nom de la série :", value: "Martin_Juin_2024" },
 *     { label: "Famille :", value: "Famille MARTIN" },
 *     { label: "Élève :", value: "Lucas MARTIN (5ème)" },
 *     { label: "Matière :", value: "Mathématiques" },
 *     { label: "Nombre de coupons :", value: "20 coupons" },
 *     { label: "Tarif unitaire :", value: "25,00 € / heure" }
 *   ]}
 *   total={{
 *     label: "Montant total :",
 *     value: "500,00 €"
 *   }}
 * />
 * ```
 */
export const SummaryPreview: React.FC<SummaryPreviewProps> = ({
  title = "Aperçu de la série",
  items,
  total,
  className = "",
}) => {
  const classes = ["summary-preview", className].filter(Boolean).join(" ");

  return (
    <div className={classes}>
      {title && <h3 className="summary-preview__title">{title}</h3>}

      <div className="summary-preview__content">
        {items.map((item, index) => (
          <div key={index} className="summary-preview__row">
            <span className="summary-preview__label">{item.label}</span>
            <span className="summary-preview__value">{item.value}</span>
          </div>
        ))}
      </div>

      {total && (
        <>
          <hr className="summary-preview__separator" />
          <div className="summary-preview__total">
            <span className="summary-preview__total-label">{total.label}</span>
            <span className="summary-preview__total-value">{total.value}</span>
          </div>
        </>
      )}
    </div>
  );
};
