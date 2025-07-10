import React from "react";
import "./SummaryCard.css";

type MetricVariant =
  | "primary"
  | "secondary"
  | "success"
  | "error"
  | "warning"
  | "info";

interface Metric {
  /**
   * Valeur de la métrique
   */
  value: string | number;

  /**
   * Libellé de la métrique
   */
  label: string;

  /**
   * Variante de couleur
   */
  variant?: MetricVariant;
}

interface SummaryCardProps {
  /**
   * Titre de la card
   */
  title: string;

  /**
   * Liste des métriques à afficher
   */
  metrics: Metric[];

  /**
   * Classes CSS supplémentaires
   */
  className?: string;
}

/**
 * Composant SummaryCard pour afficher des métriques de synthèse
 *
 * @example
 * ```tsx
 * <SummaryCard
 *   title="Synthèse Globale"
 *   metrics={[
 *     {
 *       value: "€18,650",
 *       label: "Montant total",
 *       variant: "primary"
 *     },
 *     {
 *       value: "2,450",
 *       label: "Total Coupons",
 *       variant: "secondary"
 *     }
 *   ]}
 * />
 * ```
 */
export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  metrics,
  className = "",
}) => {
  const getValueClasses = (variant?: MetricVariant): string => {
    const classes = ["summary-card__value"];

    if (variant && variant !== "primary") {
      classes.push(`summary-card__value--${variant}`);
    }

    return classes.join(" ");
  };

  const cardClasses = ["summary-card", className].filter(Boolean).join(" ");

  return (
    <div className={cardClasses}>
      <header className="summary-card__header">
        <h2 className="summary-card__title">{title}</h2>
      </header>

      <div className="summary-card__metrics">
        {metrics.map((metric, index) => (
          <div key={index} className="summary-card__metric">
            <p className={getValueClasses(metric.variant)}>{metric.value}</p>
            <p className="summary-card__label">{metric.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
