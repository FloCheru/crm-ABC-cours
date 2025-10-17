import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input, FormCard } from "../../../../components";
import { ndrService } from "../../../../services/ndrService";
import "./Step3RatesValidation.css";

interface Props {
  ndrData: any;
  updateNdrData: (updates: any) => void;
  previousStep: () => void;
}

export const Step3RatesValidation: React.FC<Props> = ({
  ndrData,
  updateNdrData,
  previousStep,
}) => {
  const navigate = useNavigate();

  // États locaux simplifiés
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  // Validation simple
  const validateForm = (): boolean => {
    const rate = parseFloat(ndrData.hourlyRate?.toString() || "0");
    const qty = parseFloat(ndrData.quantity?.toString() || "0");
    const charge = parseFloat(ndrData.charges?.toString() || "0");

    if (isNaN(rate) || rate <= 0) {
      setError("Le tarif horaire doit être une valeur positive");
      return false;
    }
    if (isNaN(qty) || qty <= 0) {
      setError("La quantité doit être une valeur positive");
      return false;
    }
    if (isNaN(charge) || charge < 0) {
      setError("Les charges doivent être une valeur positive ou nulle");
      return false;
    }
    if (!ndrData.paymentMethod) {
      setError("Un mode de paiement doit être sélectionné");
      return false;
    }
    if (!ndrData.paymentType) {
      setError("Un type de paiement doit être sélectionné");
      return false;
    }
    return true;
  };

  // Soumission simplifiée
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      // Préparer les données pour ndrService
      const ndrPayload = {
        familyId: ndrData.familyId,
        beneficiaries: {
          students: (ndrData.studentIds || []).map((id: string) => ({ id })),
          adult: ndrData.adult || false,
        },
        paymentMethod: ndrData.paymentMethod as
          | "card"
          | "CESU"
          | "check"
          | "transfer"
          | "cash"
          | "PRLV",
        paymentType: ndrData.paymentType as "avance" | "credit",
        subjects: ndrData.subjects || [],
        hourlyRate: parseFloat(ndrData.hourlyRate?.toString() || "0"),
        quantity: parseFloat(ndrData.quantity?.toString() || "0"),
        charges: parseFloat(ndrData.charges?.toString() || "0"),
        status: ndrData.status || "pending",
        notes: ndrData.notes || "",
      };

      // Log pour vérifier le format des données
      console.log("🔍 ndrPayload envoyé:", JSON.stringify(ndrPayload, null, 2));

      // Créer la NDR directement avec ndrService
      await ndrService.createNDR(ndrPayload);

      // Redirection
      navigate("/admin/dashboard");
    } catch (err: any) {
      console.error("Erreur lors de la création de la NDR:", err);
      setError(
        err.message || "Erreur lors de la création de la note de règlement"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="step3-rates-validation">
      <div className="step3__header">
        <h2>Étape 3 : Tarification et Validation</h2>
        <p className="step3__subtitle">
          Configurez les tarifs et le mode de paiement
        </p>
      </div>

      {error && (
        <div className="step3__error">
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="step3__form">
        {/* Tarification */}
        <FormCard title="Tarification">
          <div className="step3__rates-grid">
            <div className="rate-field">
              <label htmlFor="hourlyRate">Tarif horaire (€) *</label>
              <Input
                id="hourlyRate"
                type="number"
                step="0.01"
                min="0"
                value={ndrData.hourlyRate?.toString() || ""}
                onChange={(e) => updateNdrData({ hourlyRate: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                required
              />
            </div>

            <div className="rate-field">
              <label htmlFor="quantity">Quantité (h) *</label>
              <Input
                id="quantity"
                type="number"
                step="0.5"
                min="0"
                value={ndrData.quantity?.toString() || ""}
                onChange={(e) => updateNdrData({ quantity: parseFloat(e.target.value) || 0 })}
                placeholder="0"
                required
              />
            </div>

            <div className="rate-field">
              <label htmlFor="charges">Charges (€) *</label>
              <Input
                id="charges"
                type="number"
                step="0.01"
                min="0"
                value={ndrData.charges?.toString() || ""}
                onChange={(e) => updateNdrData({ charges: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="step3__total">
            <h4>
              Total:{" "}
              {(
                (ndrData.hourlyRate || 0) * (ndrData.quantity || 0)
              ).toFixed(2)}{" "}
              €
            </h4>
          </div>
        </FormCard>

        {/* Mode de paiement */}
        <FormCard title="Mode de paiement">
          <div className="step3__payment">
            <div className="payment-methods">
              <h4>Mode de paiement *</h4>
              <div className="payment-options">
                {[
                  { value: "card", label: "Carte bancaire" },
                  { value: "CESU", label: "CESU" },
                  { value: "check", label: "Chèque" },
                  { value: "transfer", label: "Virement" },
                  { value: "cash", label: "Espèces" },
                  { value: "PRLV", label: "Prélèvement" },
                ].map((option) => (
                  <label key={option.value} className="payment-option">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={option.value}
                      checked={ndrData.paymentMethod === option.value}
                      onChange={(e) => updateNdrData({ paymentMethod: e.target.value })}
                      required
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="payment-type">
              <h4>Type de paiement *</h4>
              <div className="payment-type-options">
                {[
                  { value: "avance", label: "Avance" },
                  { value: "credit", label: "Crédit" },
                ].map((option) => (
                  <label key={option.value} className="payment-option">
                    <input
                      type="radio"
                      name="paymentType"
                      value={option.value}
                      checked={ndrData.paymentType === option.value}
                      onChange={(e) => updateNdrData({ paymentType: e.target.value })}
                      required
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </FormCard>

        {/* Notes */}
        <FormCard title="Notes">
          <div className="step3__notes">
            <label htmlFor="notes">Notes complémentaires</label>
            <textarea
              id="notes"
              value={ndrData.notes || ""}
              onChange={(e) => updateNdrData({ notes: e.target.value })}
              rows={4}
              placeholder="Ajoutez des notes ou remarques particulières..."
            />
          </div>
        </FormCard>

        {/* Navigation */}
        <div className="step3__navigation">
          <Button
            type="button"
            variant="secondary"
            onClick={previousStep}
            disabled={isSubmitting}
          >
            ← Retour
          </Button>

          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? "Génération en cours..." : "Créer la NDR"}
          </Button>
        </div>
      </form>
    </div>
  );
};
