import React from "react";
import "./Breadcrumb.css";

interface BreadcrumbItem {
  /**
   * Libellé affiché
   */
  label: string;

  /**
   * URL ou chemin de navigation
   */
  href?: string;

  /**
   * Fonction appelée au clic
   */
  onClick?: () => void;
}

interface BreadcrumbProps {
  /**
   * Liste des éléments du breadcrumb
   */
  items: BreadcrumbItem[];

  /**
   * Affiche une icône home pour le premier élément
   */
  showHome?: boolean;

  /**
   * Variante compacte
   */
  compact?: boolean;

  /**
   * Classes CSS supplémentaires
   */
  className?: string;
}

/**
 * Composant Breadcrumb pour la navigation hiérarchique
 *
 * @example
 * ```tsx
 * <Breadcrumb
 *   items={[
 *     { label: "Admin", href: "/admin" },
 *     { label: "Coupons", href: "/admin/coupons" },
 *     { label: "Créer" }  // Dernièr élément sans href = page actuelle
 *   ]}
 *   showHome
 * />
 * ```
 */
export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  showHome = false,
  compact = false,
  className = "",
}) => {
  const handleClick = (item: BreadcrumbItem, event: React.MouseEvent) => {
    if (item.onClick) {
      event.preventDefault();
      item.onClick();
    }
  };

  const classes = [
    "breadcrumb",
    showHome && "breadcrumb--with-home",
    compact && "breadcrumb--compact",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <nav className={classes} aria-label="Fil d'Ariane">
      <ol className="breadcrumb__list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="breadcrumb__item">
              {isLast ? (
                // Dernier élément = page actuelle (pas de lien)
                <span className="breadcrumb__current" aria-current="page">
                  {item.label}
                </span>
              ) : (
                // Éléments intermédiaires = liens
                <>
                  <a
                    href={item.href}
                    className="breadcrumb__link"
                    onClick={(event) => handleClick(item, event)}
                  >
                    {item.label}
                  </a>
                  <span className="breadcrumb__separator" aria-hidden="true" />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
