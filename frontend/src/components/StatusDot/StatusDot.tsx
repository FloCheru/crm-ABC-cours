import React, { useState, useRef, useEffect } from "react";
import "./StatusDot.css";

export type ProspectStatus = 
  | 'en_reflexion'
  | 'interesse_prof_a_trouver'
  | 'injoignable'
  | 'ndr_editee'
  | 'premier_cours_effectue'
  | 'rdv_prospect'
  | 'ne_va_pas_convertir';

interface StatusOption {
  value: ProspectStatus | null;
  label: string;
  cssClass: string;
}

interface StatusDotProps {
  /** Statut actuel du prospect */
  status?: ProspectStatus | null;
  /** ID du prospect pour la mise à jour */
  prospectId: string;
  /** Fonction appelée lors du changement de statut */
  onStatusChange?: (prospectId: string, newStatus: ProspectStatus | null) => Promise<void>;
  /** Indique si une mise à jour est en cours */
  isLoading?: boolean;
  /** Classes CSS supplémentaires */
  className?: string;
  /** Afficher le nom du statut à côté de la pastille */
  showLabel?: boolean;
}

const STATUS_OPTIONS: StatusOption[] = [
  { value: null, label: "Non défini", cssClass: "status-dot--default" },
  { value: "en_reflexion", label: "En réflexion", cssClass: "status-dot--en-reflexion" },
  { value: "interesse_prof_a_trouver", label: "Intéressé, prof à trouver", cssClass: "status-dot--interesse-prof-a-trouver" },
  { value: "injoignable", label: "Injoignable", cssClass: "status-dot--injoignable" },
  { value: "ndr_editee", label: "NDR éditée", cssClass: "status-dot--ndr-editee" },
  { value: "premier_cours_effectue", label: "Premier cours effectué", cssClass: "status-dot--premier-cours-effectue" },
  { value: "rdv_prospect", label: "RDV prospect", cssClass: "status-dot--rdv-prospect" },
  { value: "ne_va_pas_convertir", label: "Ne va pas convertir", cssClass: "status-dot--ne-va-pas-convertir" },
];

/**
 * Composant StatusDot - Point coloré interactif pour changer le statut d'un prospect
 *
 * @example
 * ```tsx
 * <StatusDot
 *   status="en_reflexion"
 *   prospectId="12345"
 *   onStatusChange={handleStatusChange}
 * />
 * ```
 */
export const StatusDot: React.FC<StatusDotProps> = ({
  status,
  prospectId,
  onStatusChange,
  isLoading = false,
  className = "",
  showLabel = false,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [shouldOpenUpward, setShouldOpenUpward] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fermer le dropdown quand on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Obtenir la classe CSS pour le statut actuel
  const getCurrentStatusClass = () => {
    const statusOption = STATUS_OPTIONS.find(option => option.value === status);
    return statusOption?.cssClass || "status-dot--default";
  };

  // Obtenir le label pour le statut actuel
  const getCurrentStatusLabel = () => {
    const statusOption = STATUS_OPTIONS.find(option => option.value === status);
    return statusOption?.label || "Non défini";
  };

  // Détecter si on doit ouvrir vers le haut
  const checkDropdownPosition = () => {
    if (dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const dropdownHeight = 300; // Estimation de la hauteur du dropdown
      const spaceBelow = windowHeight - rect.bottom;
      const shouldOpenUp = spaceBelow < dropdownHeight && rect.top > dropdownHeight;
      setShouldOpenUpward(shouldOpenUp);
    }
  };

  // Gérer le clic sur le point
  const handleDotClick = () => {
    if (isLoading || isUpdating) return;
    if (!isDropdownOpen) {
      checkDropdownPosition();
    }
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Gérer la sélection d'un nouveau statut
  const handleStatusSelect = async (newStatus: ProspectStatus | null) => {
    if (isUpdating || newStatus === status) {
      setIsDropdownOpen(false);
      return;
    }

    setIsUpdating(true);
    
    try {
      if (onStatusChange) {
        await onStatusChange(prospectId, newStatus);
      }
      setIsDropdownOpen(false);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      // Le dropdown reste ouvert en cas d'erreur pour permettre de réessayer
    } finally {
      setIsUpdating(false);
    }
  };

  // Gérer les touches clavier
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleDotClick();
    } else if (event.key === "Escape") {
      setIsDropdownOpen(false);
    }
  };

  const dotClasses = [
    "status-dot",
    getCurrentStatusClass(),
    isLoading || isUpdating ? "status-dot--loading" : "",
    className
  ].filter(Boolean).join(" ");

  return (
    <div className="status-dot-container" ref={dropdownRef}>
      <button
        className="status-dot-wrapper"
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          borderRadius: '4px'
        }}
        onClick={handleDotClick}
        onKeyDown={handleKeyDown}
        disabled={isLoading || isUpdating}
        title={`Statut: ${getCurrentStatusLabel()}${isUpdating ? " (Mise à jour...)" : ""}`}
        aria-label={`Changer le statut. Actuel: ${getCurrentStatusLabel()}`}
        aria-haspopup="menu"
        aria-expanded={isDropdownOpen}
      >
        <div className={dotClasses} />
        {showLabel && (
          <span className="status-dot-label" style={{ fontSize: '14px', color: '#374151' }}>
            {getCurrentStatusLabel()}
          </span>
        )}
      </button>

      {isDropdownOpen && (
        <div className={`status-dropdown ${shouldOpenUpward ? 'status-dropdown--upward' : ''}`} role="menu">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value || "null"}
              className="status-dropdown-item"
              onClick={() => handleStatusSelect(option.value)}
              disabled={isUpdating}
              role="menuitem"
              aria-label={`Changer vers: ${option.label}`}
            >
              <div className={`status-dropdown-dot ${option.cssClass}`} />
              <span className="status-dropdown-label">{option.label}</span>
              {option.value === status && <span className="status-dropdown-current"> ✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};