import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import "./ModalWrapper.css";

interface ModalWrapperProps {
  /** Indique si la modal est ouverte */
  isOpen: boolean;
  /** Fonction appelée lors de la fermeture */
  onClose: () => void;
  /** Contenu de la modal */
  children: React.ReactNode;
  /** Permet de fermer en cliquant sur l'overlay */
  closeOnOverlayClick?: boolean;
  /** Permet de fermer avec la touche Escape */
  closeOnEscape?: boolean;
  /** Classes CSS supplémentaires */
  className?: string;
  /** Taille de la modal */
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

/**
 * Composant wrapper pour les modals avec overlay flouté
 *
 * @example
 * ```tsx
 * <ModalWrapper
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   size="lg"
 * >
 *   <EntityForm
 *     entityType="family"
 *     onSubmit={handleSubmit}
 *     onCancel={() => setShowModal(false)}
 *   />
 * </ModalWrapper>
 * ```
 */
export const ModalWrapper: React.FC<ModalWrapperProps> = ({
  isOpen,
  onClose,
  children,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className = "",
  size = "md",
}) => {
  // Gérer la fermeture avec Escape
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Bloquer le scroll du body quand la modal est ouverte
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    // Nettoyer au démontage
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Gérer le clic sur l'overlay
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const modalClasses = ["modal-wrapper", `modal-wrapper--${size}`, className]
    .filter(Boolean)
    .join(" ");

  return createPortal(
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
    >
      <div className={modalClasses}>{children}</div>
    </div>,
    document.body
  );
};
