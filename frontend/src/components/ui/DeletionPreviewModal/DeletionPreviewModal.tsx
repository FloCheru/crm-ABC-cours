import React from "react";
import { Button } from "../../button/Button";
import { ModalWrapper } from "../ModalWrapper/ModalWrapper";
import "./DeletionPreviewModal.css";

interface DeletionPreviewData {
  family: {
    name: string;
    status: string;
    prospectStatus?: string;
  };
  itemsToDelete: {
    students: {
      count: number;
      details: Array<{
        name: string;
        grade: string;
      }>;
    };
    couponSeries: {
      count: number;
      details: Array<{
        subject: string;
        totalCoupons: number;
        usedCoupons: number;
        remainingCoupons: number;
        hourlyRate: number;
        status: string;
      }>;
    };
    coupons: {
      count: number;
      availableCount: number;
      usedCount: number;
    };
    settlementNotes: {
      count: number;
      details: Array<{
        clientName: string;
        totalHours: number;
        totalAmount: number;
        status: string;
        date: string;
      }>;
    };
  };
  totalItems: number;
}

interface DeletionPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  previewData: DeletionPreviewData | null;
  isLoading: boolean;
}

export const DeletionPreviewModal: React.FC<DeletionPreviewModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  previewData,
  isLoading,
}) => {
  if (!isOpen) return null;

  if (isLoading) {
    return (
      <ModalWrapper isOpen={isOpen} onClose={onClose}>
        <div className="deletion-preview-modal">
          <div className="deletion-preview-modal__header">
            <h2>🔍 Analyse de la suppression...</h2>
          </div>
          <div className="deletion-preview-modal__content">
            <div className="loading-spinner">
              Calcul des éléments à supprimer...
            </div>
          </div>
        </div>
      </ModalWrapper>
    );
  }

  if (!previewData) {
    return (
      <ModalWrapper isOpen={isOpen} onClose={onClose}>
        <div className="deletion-preview-modal">
          <div className="deletion-preview-modal__header error">
            <h2>❌ Erreur</h2>
          </div>
          <div className="deletion-preview-modal__content">
            <p>Impossible de récupérer les informations de suppression.</p>
          </div>
          <div className="deletion-preview-modal__footer">
            <Button variant="secondary" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>
      </ModalWrapper>
    );
  }

  const { family, itemsToDelete, totalItems } = previewData;

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose}>
      <div className="deletion-preview-modal">
        <div className="deletion-preview-modal__header warning">
          <h2>⚠️ Confirmation de suppression</h2>
          <p className="family-info">
            <strong>{family.name}</strong> ({family.status}
            {family.prospectStatus && ` - ${family.prospectStatus}`})
          </p>
        </div>

        <div className="deletion-preview-modal__content">
          <div className="warning-message">
            <p>
              <strong>
                🚨 Cette action va supprimer définitivement {totalItems} éléments
              </strong>
            </p>
            <p>Cette action est <strong>irréversible</strong>.</p>
          </div>

          <div className="deletion-summary">
            <h3>📋 Résumé des suppressions :</h3>
            
            {/* Étudiants */}
            {itemsToDelete.students.count > 0 && (
              <div className="deletion-section">
                <h4>
                  👨‍🎓 Élèves ({itemsToDelete.students.count})
                </h4>
                <ul>
                  {itemsToDelete.students.details.map((student, index) => (
                    <li key={index}>
                      {student.name} ({student.grade})
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Notes de règlement */}
            {itemsToDelete.settlementNotes.count > 0 && (
              <div className="deletion-section">
                <h4>
                  📄 Notes de règlement ({itemsToDelete.settlementNotes.count})
                </h4>
                <ul>
                  {itemsToDelete.settlementNotes.details.map((ndr, index) => (
                    <li key={index}>
                      {ndr.clientName} - {ndr.totalHours}h pour {ndr.totalAmount.toFixed(2)}€
                      <span className="date">({ndr.date})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Séries de coupons */}
            {itemsToDelete.couponSeries.count > 0 && (
              <div className="deletion-section">
                <h4>
                  📦 Séries de coupons ({itemsToDelete.couponSeries.count})
                </h4>
                <ul>
                  {itemsToDelete.couponSeries.details.map((series, index) => (
                    <li key={index}>
                      <strong>{series.subject}</strong> - {series.totalCoupons} coupons
                      ({series.remainingCoupons} restants) à {series.hourlyRate}€/h
                      <span className={`status ${series.status}`}>
                        [{series.status}]
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Coupons individuels */}
            {itemsToDelete.coupons.count > 0 && (
              <div className="deletion-section">
                <h4>
                  🎫 Coupons individuels ({itemsToDelete.coupons.count})
                </h4>
                <div className="coupons-breakdown">
                  <span className="available">
                    ✅ {itemsToDelete.coupons.availableCount} disponibles
                  </span>
                  <span className="used">
                    ❌ {itemsToDelete.coupons.usedCount} utilisés
                  </span>
                </div>
              </div>
            )}

            {totalItems === 0 && (
              <div className="no-related-items">
                <p>✅ Aucun élément associé ne sera supprimé.</p>
                <p>Seule la famille sera supprimée.</p>
              </div>
            )}
          </div>

          <div className="final-warning">
            <p>
              ⚠️ <strong>Attention :</strong> Une fois confirmée, cette suppression ne peut pas être annulée.
            </p>
          </div>
        </div>

        <div className="deletion-preview-modal__footer">
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button 
            variant="error" 
            onClick={onConfirm}
            className="confirm-deletion"
          >
            🗑️ Confirmer la suppression
          </Button>
        </div>
      </div>
    </ModalWrapper>
  );
};