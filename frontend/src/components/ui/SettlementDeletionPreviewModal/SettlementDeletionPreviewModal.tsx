import React from "react";
import { Button } from "../../button/Button";
import { ModalWrapper } from "../ModalWrapper/ModalWrapper";
import "./SettlementDeletionPreviewModal.css";

interface SettlementDeletionPreviewData {
  settlementNote: {
    clientName: string;
    department: string;
    totalAmount: number;
    status: string;
    createdAt: string;
  };
  itemsToDelete: {
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
  };
  totalItems: number;
}

interface SettlementDeletionPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  previewData: SettlementDeletionPreviewData | null;
  isLoading: boolean;
}

export const SettlementDeletionPreviewModal: React.FC<SettlementDeletionPreviewModalProps> = ({
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
        <div className="settlement-deletion-preview-modal">
          <div className="settlement-deletion-preview-modal__header">
            <h2>🔍 Analyse de la suppression...</h2>
          </div>
          <div className="settlement-deletion-preview-modal__content">
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
        <div className="settlement-deletion-preview-modal">
          <div className="settlement-deletion-preview-modal__header error">
            <h2>❌ Erreur</h2>
          </div>
          <div className="settlement-deletion-preview-modal__content">
            <p>Impossible de récupérer les informations de suppression.</p>
          </div>
          <div className="settlement-deletion-preview-modal__footer">
            <Button variant="secondary" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>
      </ModalWrapper>
    );
  }

  const { settlementNote, itemsToDelete, totalItems } = previewData;

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose}>
      <div className="settlement-deletion-preview-modal">
        <div className="settlement-deletion-preview-modal__header warning">
          <h2>⚠️ Confirmation de suppression</h2>
          <p className="settlement-info">
            <strong>NDR : {settlementNote.clientName || "Nom non disponible"}</strong> ({settlementNote.department || "Département inconnu"})
            <br />
            <span className="amount">Montant: {(settlementNote.totalAmount ?? 0).toFixed(2)}€</span>
            <span className={`status ${settlementNote.status || "pending"}`}>
              [{settlementNote.status || "pending"}]
            </span>
          </p>
        </div>

        <div className="settlement-deletion-preview-modal__content">
          <div className="warning-message">
            <p>
              <strong>
                🚨 Cette action va supprimer définitivement la note de règlement et {totalItems ?? 0} éléments associés
              </strong>
            </p>
            <p>Cette action est <strong>irréversible</strong>.</p>
          </div>

          <div className="deletion-summary">
            <h3>📋 Résumé des suppressions :</h3>
            
            {/* Séries de coupons */}
            {itemsToDelete?.couponSeries?.count > 0 && (
              <div className="deletion-section">
                <h4>
                  📦 Séries de coupons ({itemsToDelete.couponSeries.count})
                </h4>
                <ul>
                  {itemsToDelete.couponSeries.details?.map((series, index) => (
                    <li key={index}>
                      <strong>{series.subject || "Matière inconnue"}</strong> - {series.totalCoupons || 0} coupons
                      ({series.remainingCoupons || 0} restants) à {(series.hourlyRate || 0).toFixed(2)}€/h
                      <span className={`status ${series.status || "pending"}`}>
                        [{series.status || "pending"}]
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Coupons individuels */}
            {itemsToDelete?.coupons?.count > 0 && (
              <div className="deletion-section">
                <h4>
                  🎫 Coupons individuels ({itemsToDelete.coupons.count})
                </h4>
                <div className="coupons-breakdown">
                  <span className="available">
                    ✅ {itemsToDelete.coupons.availableCount || 0} disponibles
                  </span>
                  <span className="used">
                    ❌ {itemsToDelete.coupons.usedCount || 0} utilisés
                  </span>
                </div>
              </div>
            )}

            {(totalItems ?? 0) === 0 && (
              <div className="no-related-items">
                <p>✅ Aucun élément associé ne sera supprimé.</p>
                <p>Seule la note de règlement sera supprimée.</p>
              </div>
            )}
          </div>

          <div className="final-warning">
            <p>
              ⚠️ <strong>Attention :</strong> Une fois confirmée, cette suppression ne peut pas être annulée.
              <br />
              Tous les coupons associés (utilisés ou non) seront également supprimés.
            </p>
          </div>
        </div>

        <div className="settlement-deletion-preview-modal__footer">
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