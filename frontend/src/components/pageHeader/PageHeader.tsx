import React from "react";
import { useNavigate } from "react-router-dom";
import { Container, Button } from "../index";
import "./PageHeader.css";

interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface BackButtonConfig {
  label: string;
  href: string;
}

interface PageHeaderProps {
  /**
   * Titre principal de la page
   */
  title: string;

  /**
   * Elements du breadcrumb pour la navigation hiérarchique
   */
  breadcrumb?: BreadcrumbItem[];

  /**
   * Description optionnelle sous le titre
   */
  description?: string;

  /**
   * Configuration du bouton retour
   */
  backButton?: BackButtonConfig;

  /**
   * Actions à afficher à droite du header
   */
  actions?: React.ReactNode;

  /**
   * Métadonnées à afficher sous le titre (badges, tags, etc.)
   */
  metadata?: React.ReactNode;

  /**
   * Classes CSS supplémentaires
   */
  className?: string;
}

/**
 * Composant PageHeader unifié pour toutes les pages
 * 
 * Centralise l'affichage du titre, breadcrumb, description et bouton retour
 * selon les patterns existants du projet
 * 
 * @example
 * ```tsx
 * // Page simple sans breadcrumb
 * <PageHeader title="Gestion des Prospects" />
 * 
 * // Page avec breadcrumb et description
 * <PageHeader 
 *   title="Détails du Prospect"
 *   breadcrumb={[
 *     { label: "Prospects", href: "/prospects" },
 *     { label: "Détails" }
 *   ]}
 *   description="Créé le 15/01/2024 • Modifié le 20/01/2024"
 *   backButton={{ label: "Retour", href: "/prospects" }}
 * />
 * ```
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  breadcrumb,
  description,
  backButton,
  actions,
  metadata,
  className = "",
}) => {
  const navigate = useNavigate();
  
  const classes = [
    "page-header",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const handleBackClick = () => {
    if (backButton?.href) {
      navigate(backButton.href);
    }
  };

  const handleBreadcrumbClick = (item: BreadcrumbItem, event: React.MouseEvent) => {
    if (item.onClick) {
      event.preventDefault();
      item.onClick();
    }
  };

  const renderBreadcrumbWithBackButton = () => {
    // Si ni breadcrumb ni backButton, ne rien afficher
    if ((!breadcrumb || breadcrumb.length === 0) && !backButton) return null;

    return (
      <nav className="page-header__breadcrumb" aria-label="Fil d'Ariane">
        {/* Breadcrumb à gauche */}
        {breadcrumb && breadcrumb.length > 0 && (
          <ol className="page-header__breadcrumb-list">
            {breadcrumb.map((item, index) => {
              const isLast = index === breadcrumb.length - 1;

              return (
                <li key={index} className="page-header__breadcrumb-item">
                  {isLast ? (
                    <span className="page-header__breadcrumb-current" aria-current="page">
                      {item.label}
                    </span>
                  ) : (
                    <>
                      <a
                        href={item.href}
                        className="page-header__breadcrumb-link"
                        onClick={(event) => handleBreadcrumbClick(item, event)}
                      >
                        {item.label}
                      </a>
                      <span className="page-header__breadcrumb-separator" aria-hidden="true" />
                    </>
                  )}
                </li>
              );
            })}
          </ol>
        )}
        
        {/* Bouton retour à droite */}
        {backButton && (
          <div className="page-header__breadcrumb-back">
            <Button 
              variant="outline" 
              onClick={handleBackClick}
              size="sm"
            >
              ← {backButton.label}
            </Button>
          </div>
        )}
      </nav>
    );
  };

  return (
    <div className={classes}>
      {renderBreadcrumbWithBackButton()}
      
      <Container layout="flex-col" align="start">
        <div className="page-header__content">
          <div className="page-header__title-row">
            <h1 className="page-header__title">{title}</h1>
            {actions && (
              <div className="page-header__actions">
                {actions}
              </div>
            )}
          </div>
          {metadata && (
            <div className="page-header__metadata">
              {metadata}
            </div>
          )}
          {description && (
            <p className="page-header__description">{description}</p>
          )}
        </div>
      </Container>
    </div>
  );
};