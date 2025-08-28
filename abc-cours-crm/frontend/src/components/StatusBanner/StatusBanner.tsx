import React from "react";
import "./StatusBanner.css";
import type { ProspectStatus } from "../StatusDot";

interface StatusBannerProps {
  /** Statut actuel du prospect */
  status?: ProspectStatus | null;
  /** Classes CSS supplémentaires */
  className?: string;
}

const STATUS_LABELS: Record<ProspectStatus | 'default', string> = {
  'en_reflexion': 'En réflexion',
  'interesse_prof_a_trouver': 'Intéressé, prof à trouver',
  'injoignable': 'Injoignable',
  'ndr_editee': 'NDR éditée',
  'premier_cours_effectue': 'Premier cours effectué',
  'rdv_prospect': 'RDV prospect',
  'ne_va_pas_convertir': 'Ne va pas convertir',
  'default': 'Non défini'
};

/**
 * Composant StatusBanner - Bandeau coloré avec le statut du prospect
 * Utilise les mêmes couleurs que le composant StatusDot pour la cohérence visuelle
 *
 * @example
 * ```tsx
 * <StatusBanner status="en_reflexion" />
 * ```
 */
export const StatusBanner: React.FC<StatusBannerProps> = ({
  status,
  className = "",
}) => {
  // Obtenir la classe CSS pour le statut actuel
  const getStatusClass = () => {
    if (!status) return "status-banner--default";
    return `status-banner--${status.replace(/_/g, '-')}`;
  };

  // Obtenir le label pour le statut actuel
  const getStatusLabel = () => {
    return STATUS_LABELS[status || 'default'];
  };

  const bannerClasses = [
    "status-banner",
    getStatusClass(),
    className
  ].filter(Boolean).join(" ");

  return (
    <div className={bannerClasses}>
      <div className="status-banner__content">
        <span className="status-banner__label">Statut :</span>
        <span className="status-banner__text">{getStatusLabel()}</span>
      </div>
    </div>
  );
};