import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input, FormCard } from "../../../../components";
import { useNDRWizard } from "../../../../contexts/NDRWizardContext";
import { settlementService } from "../../../../services/settlementService";
import { subjectService } from "../../../../services/subjectService";
import {
  ndrPrefillService,
  type PrefillRates,
} from "../../../../services/ndrPrefillService";
import { useRefresh } from "../../../../hooks/useRefresh";
import type { Subject } from "../../../../types/subject";
import "./Step3RatesValidation.css";

interface RateRow {
  subjectId: string;
  subjectName: string;
  hourlyRate: string;
  quantity: string;
  professorSalary: string;
  total: number;
}

export const Step3RatesValidation: React.FC = () => {
  const navigate = useNavigate();
  const { state, updateStep3, previousStep, validateStep3 } = useNDRWizard();
  const { triggerRefresh } = useRefresh();

  // États locaux
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  // const [rateRows, setRateRows] = useState<RateRow[]>([]); // Conservé pour compatibilité future
  // Tarification globale (une seule ligne)
  const [globalHourlyRate, setGlobalHourlyRate] = useState<string>("");
  const [globalQuantity, setGlobalQuantity] = useState<string>("");
  const [globalProfessorSalary, setGlobalProfessorSalary] =
    useState<string>("");
  const [charges, setCharges] = useState<string>("0");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [paymentType, setPaymentType] = useState<string>("");
  const [hasPaymentSchedule, setHasPaymentSchedule] = useState<boolean>(false);
  const [schedulePaymentMethod, setSchedulePaymentMethod] = useState<
    "PRLV" | "check"
  >("PRLV");
  const [numberOfInstallments, setNumberOfInstallments] = useState<number>(1);
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [notes, setNotes] = useState<string>("");
  // États pour le préremplissage
  const [isPrefilling, setIsPrefilling] = useState<boolean>(false);
  const [showPrefillPreview, setShowPrefillPreview] = useState<boolean>(false);
  const [prefillData, setPrefillData] = useState<PrefillRates | null>(null);

  // Charger les matières au montage
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        setIsLoading(true);
        console.log("🔍 STEP 3 DEBUG - Début chargement matières");
        console.log("🔍 selectedSubjectIds:", state.step2.selectedSubjectIds);
        console.log(
          "🔍 selectedSubjectIds length:",
          state.step2.selectedSubjectIds.length
        );

        const allSubjects = await subjectService.getActiveSubjects();
        console.log("🔍 allSubjects reçus:", allSubjects.length, allSubjects);

        // Filtrer seulement les matières sélectionnées dans Step 2
        const selectedSubjects = allSubjects.filter((subject) =>
          state.step2.selectedSubjectIds.includes(subject._id)
        );
        console.log(
          "🔍 selectedSubjects après filtre:",
          selectedSubjects.length,
          selectedSubjects
        );

        setSubjects(selectedSubjects);

        // Initialiser les lignes de tarifs
        const initialRates: RateRow[] = selectedSubjects.map((subject) => ({
          subjectId: subject._id,
          subjectName: subject.name,
          hourlyRate: "",
          quantity: "",
          professorSalary: "",
          total: 0,
        }));

        console.log(
          "🔍 initialRates créées:",
          initialRates.length,
          initialRates
        );
        // setRateRows(initialRates); // Temporairement désactivé pour le préremplissage global
      } catch (err) {
        console.error("🔍 Erreur lors du chargement des matières:", err);
        setError("Erreur lors du chargement des matières");
      } finally {
        setIsLoading(false);
      }
    };

    console.log("🔍 STEP 3 DEBUG - useEffect déclenché");
    console.log("🔍 state.step2:", state.step2);

    if (
      state.step2.selectedSubjectIds &&
      state.step2.selectedSubjectIds.length > 0
    ) {
      console.log("🔍 Condition remplie, appel loadSubjects()");
      loadSubjects();
    } else {
      console.log("🔍 PROBLÈME: selectedSubjectIds vide ou inexistant!");
      console.log(
        "🔍 state.step2.selectedSubjectIds:",
        state.step2.selectedSubjectIds
      );
      // setRateRows([]); // Assurer que rateRows est vide si pas de matières
    }
  }, [state.step2.selectedSubjectIds]);

  // Calculs automatiques avec tarification globale - protection NaN
  const calculations = useMemo(() => {
    // Protection contre les valeurs vides/invalides
    const chargesValue = parseFloat(charges) || 0;
    const hourlyRate = parseFloat(globalHourlyRate) || 0;
    const quantity = parseFloat(globalQuantity) || 0;
    const professorSalary = parseFloat(globalProfessorSalary) || 0;

    // Calculs avec vérification NaN
    const totalRevenue = isNaN(hourlyRate * quantity)
      ? 0
      : hourlyRate * quantity;
    const totalSalary = isNaN(professorSalary * quantity)
      ? 0
      : professorSalary * quantity;
    const totalQuantity = isNaN(quantity) ? 0 : quantity;
    const totalCharges = isNaN(chargesValue * quantity)
      ? 0
      : chargesValue * quantity;
    const margin = isNaN(totalRevenue - totalSalary - totalCharges)
      ? 0
      : totalRevenue - totalSalary - totalCharges;
    const marginPercentage =
      totalRevenue > 0 && !isNaN(margin / totalRevenue)
        ? (margin / totalRevenue) * 100
        : 0;

    return {
      totalRevenue: isNaN(totalRevenue) ? 0 : totalRevenue,
      totalSalary: isNaN(totalSalary) ? 0 : totalSalary,
      totalQuantity: isNaN(totalQuantity) ? 0 : totalQuantity,
      totalCharges: isNaN(totalCharges) ? 0 : totalCharges,
      margin: isNaN(margin) ? 0 : margin,
      marginPercentage: isNaN(marginPercentage) ? 0 : marginPercentage,
    };
  }, [globalHourlyRate, globalQuantity, globalProfessorSalary, charges]);

  // Mise à jour d'une ligne de tarif (fonction préservée pour compatibilité future)
  // const handleRateChange = (index: number, field: keyof RateRow, value: string) => {
  //   const newRows = [...rateRows];
  //   newRows[index] = { ...newRows[index], [field]: value };
  //
  //   // Calcul du total pour cette ligne
  //   if (field === 'hourlyRate' || field === 'quantity') {
  //     const hourlyRate = parseFloat(field === 'hourlyRate' ? value : newRows[index].hourlyRate) || 0;
  //     const quantity = parseFloat(field === 'quantity' ? value : newRows[index].quantity) || 0;
  //     newRows[index].total = hourlyRate * quantity;
  //   }
  //
  //   setRateRows(newRows);
  //   setError(''); // Effacer les erreurs lors de la modification
  // };

  // Fonction de préremplissage intelligent
  const handlePrefill = async () => {
    try {
      setIsPrefilling(true);
      setError("");

      console.log("📋 Début préremplissage intelligent");
      console.log("📋 Subjects disponibles:", subjects.length, subjects);
      console.log("📋 Département client:", state.step1.department);

      // Générer les données de préremplissage
      const prefillRates = ndrPrefillService.generatePrefillData(
        subjects,
        state.step1.department,
        "prospect" // TODO: Déterminer selon l'historique client
      );

      setPrefillData(prefillRates);
      setShowPrefillPreview(true);

      console.log("📋 Préremplissage généré:", prefillRates);
    } catch (err) {
      console.error("❌ Erreur lors du préremplissage:", err);
      setError("Erreur lors de la génération du préremplissage intelligent");
    } finally {
      setIsPrefilling(false);
    }
  };

  // Appliquer les données de préremplissage
  const applyPrefillData = () => {
    if (!prefillData) return;

    console.log("📋 Application du préremplissage:", prefillData);

    // Appliquer les valeurs
    setGlobalHourlyRate(prefillData.hourlyRate.toString());
    setGlobalQuantity(prefillData.quantity.toString());
    setGlobalProfessorSalary(prefillData.professorSalary.toString());
    setCharges(prefillData.charges.toString());
    setPaymentMethod(prefillData.paymentMethod);
    setPaymentType(prefillData.paymentType);

    // Fermer la prévisualisation
    setShowPrefillPreview(false);
    setPrefillData(null);

    console.log("✅ Préremplissage appliqué avec succès");
  };

  // Annuler le préremplissage
  const cancelPrefill = () => {
    setShowPrefillPreview(false);
    setPrefillData(null);
  };

  // Calcul des échéances
  const calculateInstallments = useMemo(() => {
    if (!hasPaymentSchedule || numberOfInstallments <= 1) {
      return [];
    }

    const totalAmount = calculations.totalRevenue;
    const amountPerInstallment = totalAmount / numberOfInstallments;
    const installments: Array<{ amount: number; dueDate: Date }> = [];

    const today = new Date();
    for (let i = 0; i < numberOfInstallments; i++) {
      const dueDate = new Date(
        today.getFullYear(),
        today.getMonth() + i,
        dayOfMonth
      );
      installments.push({
        amount: amountPerInstallment,
        dueDate,
      });
    }

    return installments;
  }, [
    hasPaymentSchedule,
    numberOfInstallments,
    dayOfMonth,
    calculations.totalRevenue,
  ]);

  // Validation du formulaire avec tarification globale
  const validateForm = (): boolean => {
    // Vérifier la tarification globale
    const hourlyRate = parseFloat(globalHourlyRate);
    const quantity = parseFloat(globalQuantity);
    const professorSalary = parseFloat(globalProfessorSalary);

    if (isNaN(hourlyRate) || hourlyRate <= 0) {
      setError("Le tarif horaire doit être une valeur positive");
      return false;
    }

    if (isNaN(quantity) || quantity <= 0) {
      setError("La quantité doit être une valeur positive");
      return false;
    }

    if (isNaN(professorSalary) || professorSalary <= 0) {
      setError("Le salaire professeur doit être une valeur positive");
      return false;
    }

    // Vérifier les charges
    const chargesValue = parseFloat(charges);
    if (isNaN(chargesValue) || chargesValue < 0) {
      setError("Les charges doivent être une valeur positive ou nulle");
      return false;
    }

    // Vérifier le mode de paiement
    if (!paymentMethod) {
      setError("Un mode de paiement doit être sélectionné");
      return false;
    }

    // Vérifier le type de paiement (maintenant obligatoire)
    if (!paymentType) {
      setError("Un type de paiement doit être sélectionné");
      return false;
    }

    return true;
  };

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      // Mettre à jour Step 3 dans le contexte avec tarification globale
      const step3Data = {
        subjects: subjects.map((subject) => ({
          subjectId: subject._id,
          hourlyRate: parseFloat(globalHourlyRate),
          quantity: parseFloat(globalQuantity),
          professorSalary: parseFloat(globalProfessorSalary),
        })),
        charges: parseFloat(charges),
        paymentMethod: paymentMethod as any,
        paymentType: paymentType as "immediate_advance" | "tax_credit_n1" | "", // Type casting explicite
        hasPaymentSchedule,
        paymentSchedule: hasPaymentSchedule
          ? {
              paymentMethod: schedulePaymentMethod,
              numberOfInstallments,
              dayOfMonth,
            }
          : undefined,
        notes,
        marginAmount: calculations.margin,
        marginPercentage: calculations.marginPercentage,
        chargesToPay: calculations.totalCharges,
        salaryToPay: calculations.totalSalary,
      };

      updateStep3(step3Data);

      // Valider avec le contexte
      const isValid = validateStep3();
      if (!isValid) {
        setError(
          "Erreur de validation. Veuillez vérifier les données saisies."
        );
        return;
      }

      // Préparer les données finales pour l'API
      const settlementData = {
        // Step 1
        familyId: state.step1.familyId,
        clientName: state.step1.clientName,
        department: state.step1.department,

        // Step 2
        studentIds: state.step2.studentIds,

        // Step 3
        subjects: step3Data.subjects,
        charges: step3Data.charges,
        paymentMethod: step3Data.paymentMethod,
        paymentType: step3Data.paymentType as
          | "immediate_advance"
          | "tax_credit_n1"
          | "", // Type casting pour l'API
        paymentSchedule: step3Data.paymentSchedule,
        notes: step3Data.notes,

        // Calculs
        marginAmount: step3Data.marginAmount,
        marginPercentage: step3Data.marginPercentage,
        chargesToPay: step3Data.chargesToPay,
        salaryToPay: step3Data.salaryToPay,
      };

      // 🔍 LOGS DEBUG DÉTAILLÉS AVANT ENVOI API
      console.log("🔍 === DEBUG CRÉATION NDR ===");
      console.log(
        "🔍 settlementData complet:",
        JSON.stringify(settlementData, null, 2)
      );
      console.log("🔍 Vérifications individuelles:");
      console.log(
        "🔍 familyId:",
        settlementData.familyId,
        "(type:",
        typeof settlementData.familyId,
        ")"
      );
      console.log(
        "🔍 clientName:",
        settlementData.clientName,
        "(type:",
        typeof settlementData.clientName,
        ")"
      );
      console.log(
        "🔍 department:",
        settlementData.department,
        "(type:",
        typeof settlementData.department,
        ")"
      );
      console.log(
        "🔍 studentIds:",
        settlementData.studentIds,
        "(type:",
        typeof settlementData.studentIds,
        ", length:",
        settlementData.studentIds?.length,
        ")"
      );
      console.log(
        "🔍 subjects:",
        settlementData.subjects,
        "(length:",
        settlementData.subjects?.length,
        ")"
      );
      console.log("🔍 subjects[0]:", settlementData.subjects?.[0]);
      console.log(
        "🔍 charges:",
        settlementData.charges,
        "(type:",
        typeof settlementData.charges,
        ")"
      );
      console.log(
        "🔍 paymentMethod:",
        settlementData.paymentMethod,
        "(type:",
        typeof settlementData.paymentMethod,
        ")"
      );
      console.log(
        "🔍 paymentType:",
        settlementData.paymentType,
        "(type:",
        typeof settlementData.paymentType,
        ")"
      );
      console.log("🔍 paymentSchedule:", settlementData.paymentSchedule);
      console.log("🔍 === FIN DEBUG CRÉATION NDR ===");

      // Créer la note de règlement
      await settlementService.createSettlementNote(
        settlementData
      );

      // Déclencher le refresh
      triggerRefresh();

      // Rediriger vers les détails de la NDR
      navigate(`/admin/dashboard`);
    } catch (err: any) {
      console.error("Erreur lors de la création de la NDR:", err);
      setError(
        err.message || "Erreur lors de la création de la note de règlement"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="step3-rates-validation">
        <div className="step3__loading">
          <p>Chargement des matières...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="step3-rates-validation">
      <div className="step3__header">
        <h2>Étape 3 : Tarification et Validation</h2>
        <p className="step3__subtitle">
          Configurez les tarifs, modes de paiement et finalisez votre note de
          règlement
        </p>
      </div>

      {error && (
        <div className="step3__error">
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="step3__form">
        {/* Section 1: Tarification globale */}
        <FormCard title="Tarification">
          {/* Bouton de préremplissage intelligent */}
          <div className="step3__prefill-section">
            <div className="prefill-header">
              <div className="prefill-info">
                <h4>💡 Préremplissage intelligent</h4>
                <p>
                  Générez automatiquement des tarifs optimisés selon vos
                  matières et votre département
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={handlePrefill}
                disabled={isPrefilling || subjects.length === 0}
                className="prefill-button"
              >
                {isPrefilling ? "Génération..." : "🪄 Préremplir"}
              </Button>
            </div>
          </div>

          <div className="step3__global-rates">
            <div className="global-rates-grid">
              <div className="rate-field">
                <label htmlFor="globalHourlyRate">Tarif horaire (€) *</label>
                <Input
                  id="globalHourlyRate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={globalHourlyRate}
                  onChange={(e) => setGlobalHourlyRate(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="rate-field">
                <label htmlFor="globalQuantity">Quantité totale (h) *</label>
                <Input
                  id="globalQuantity"
                  type="number"
                  step="0.5"
                  min="0"
                  value={globalQuantity}
                  onChange={(e) => setGlobalQuantity(e.target.value)}
                  placeholder="0"
                  required
                />
              </div>

              <div className="rate-field">
                <label htmlFor="globalProfessorSalary">
                  Salaire professeur (€) *
                </label>
                <Input
                  id="globalProfessorSalary"
                  type="number"
                  step="0.01"
                  min="0"
                  value={globalProfessorSalary}
                  onChange={(e) => setGlobalProfessorSalary(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="global-total">
              <h4>
                Total:{" "}
                <span className="total-amount">
                  {(calculations.totalRevenue || 0).toFixed(2)} €
                </span>
              </h4>
            </div>
          </div>
        </FormCard>

        {/* Section 2: Charges et calculs */}
        <FormCard title="Charges et calculs automatiques">
          <div className="step3__charges">
            <div className="charges-input">
              <label htmlFor="charges">Charges globales (€) *</label>
              <Input
                id="charges"
                type="number"
                step="0.01"
                min="0"
                value={charges}
                onChange={(e) => setCharges(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="calculations-summary">
              <h4>Récapitulatif financier</h4>
              <div className="calculations-grid">
                <div className="calc-item">
                  <span>Total revenus:</span>
                  <strong className="text-blue">
                    {(calculations.totalRevenue || 0).toFixed(2)} €
                  </strong>
                </div>
                <div className="calc-item">
                  <span>Salaire à verser:</span>
                  <strong>
                    {(calculations.totalSalary || 0).toFixed(2)} €
                  </strong>
                </div>
                <div className="calc-item">
                  <span>Charges à payer:</span>
                  <strong>
                    {(calculations.totalCharges || 0).toFixed(2)} €
                  </strong>
                </div>
                <div className="calc-item">
                  <span>Marge:</span>
                  <strong
                    className={
                      (calculations.margin || 0) >= 0
                        ? "text-green"
                        : "text-red"
                    }
                  >
                    {(calculations.margin || 0).toFixed(2)} € (
                    {(calculations.marginPercentage || 0).toFixed(1)}%)
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </FormCard>

        {/* Section 3: Mode de paiement */}
        <FormCard title="Mode de paiement">
          <div className="step3__payment">
            <div className="payment-methods">
              <h4>Sélectionnez un mode de paiement *</h4>
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
                      checked={paymentMethod === option.value}
                      onChange={(e) => setPaymentMethod(e.target.value)}
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
                  { value: "immediate_advance", label: "Avance immédiate" },
                  { value: "tax_credit_n1", label: "Crédit d'impôt N+1" },
                ].map((option) => (
                  <label key={option.value} className="payment-option">
                    <input
                      type="radio"
                      name="paymentType"
                      value={option.value}
                      checked={paymentType === option.value}
                      onChange={(e) => setPaymentType(e.target.value)}
                      required
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="payment-schedule-toggle">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={hasPaymentSchedule}
                  onChange={(e) => setHasPaymentSchedule(e.target.checked)}
                />
                <span>Paiement échelonné</span>
              </label>
            </div>
          </div>
        </FormCard>

        {/* Section 4: Échéancier (conditionnel) */}
        {hasPaymentSchedule && (
          <FormCard title="Configuration de l'échéancier">
            <div className="step3__schedule">
              <div className="schedule-config">
                <div className="schedule-field">
                  <label htmlFor="schedulePaymentMethod">
                    Mode de paiement pour l'échéancier *
                  </label>
                  <select
                    id="schedulePaymentMethod"
                    value={schedulePaymentMethod}
                    onChange={(e) =>
                      setSchedulePaymentMethod(
                        e.target.value as "PRLV" | "check"
                      )
                    }
                    required
                  >
                    <option value="PRLV">Prélèvement</option>
                    <option value="check">Chèque</option>
                  </select>
                </div>

                <div className="schedule-field">
                  <label htmlFor="numberOfInstallments">
                    Nombre d'échéances *
                  </label>
                  <Input
                    id="numberOfInstallments"
                    type="number"
                    min="1"
                    max="12"
                    value={numberOfInstallments}
                    onChange={(e) =>
                      setNumberOfInstallments(parseInt(e.target.value))
                    }
                    required
                  />
                </div>

                <div className="schedule-field">
                  <label htmlFor="dayOfMonth">
                    Jour du{" "}
                    {schedulePaymentMethod === "PRLV" ? "prélèvement" : "mois"}{" "}
                    *
                  </label>
                  <select
                    id="dayOfMonth"
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(parseInt(e.target.value))}
                    required
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <option key={day} value={day}>
                        {day}
                        {day === 1 ? "er" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {calculateInstallments.length > 0 && (
                <div className="installments-preview">
                  <h4>Aperçu des échéances</h4>
                  <div className="installments-list">
                    {calculateInstallments.map((installment, index) => (
                      <div key={index} className="installment-item">
                        <span>Échéance {index + 1}:</span>
                        <span>{installment.amount.toFixed(2)} €</span>
                        <span className="date">
                          {installment.dueDate.toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </FormCard>
        )}

        {/* Section 5: Notes et récapitulatif */}
        <FormCard title="Notes et récapitulatif final">
          <div className="step3__final">
            <div className="notes-section">
              <label htmlFor="notes">Notes complémentaires</label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Ajoutez des notes ou remarques particulières..."
              />
            </div>

            <div className="final-summary">
              <h4>Récapitulatif de la note de règlement</h4>

              <div className="summary-section">
                <h5>Client</h5>
                <p>
                  <strong>{state.step1.clientName}</strong> -{" "}
                  {state.step1.department}
                </p>
              </div>

              <div className="summary-section">
                <h5>Bénéficiaires</h5>
                <p>
                  {state.step2.familySelected && "Famille sélectionnée"}
                  {state.step2.familySelected &&
                    state.step2.studentIds.length > 0 &&
                    " + "}
                  {state.step2.studentIds.length > 0 &&
                    `${state.step2.studentIds.length} élève(s)`}
                </p>
              </div>

              <div className="summary-section">
                <h5>Matières et financier</h5>
                <p>
                  {subjects.length} matière(s) -{" "}
                  {calculations.totalQuantity || 0}h total
                </p>
                <p className="total-amount">
                  <strong>
                    Montant total: {(calculations.totalRevenue || 0).toFixed(2)}{" "}
                    €
                  </strong>
                </p>
                {(calculations.margin || 0) >= 0 ? (
                  <p className="text-green">
                    Marge: +{(calculations.margin || 0).toFixed(2)} € (
                    {(calculations.marginPercentage || 0).toFixed(1)}%)
                  </p>
                ) : (
                  <p className="text-red">
                    Déficit: {(calculations.margin || 0).toFixed(2)} € (
                    {(calculations.marginPercentage || 0).toFixed(1)}%)
                  </p>
                )}
              </div>
            </div>
          </div>
        </FormCard>

        {/* Modal de prévisualisation du préremplissage */}
        {showPrefillPreview && prefillData && (
          <div className="prefill-modal-overlay">
            <div className="prefill-modal">
              <div className="prefill-modal__header">
                <h3>📋 Prévisualisation du préremplissage</h3>
                <button
                  type="button"
                  onClick={cancelPrefill}
                  className="prefill-modal__close"
                >
                  ×
                </button>
              </div>

              <div className="prefill-modal__content">
                <div className="prefill-preview">
                  <h4>Tarification proposée</h4>
                  <div className="prefill-values">
                    <div className="prefill-value">
                      <span>Tarif horaire:</span>
                      <strong>{prefillData.hourlyRate} €</strong>
                    </div>
                    <div className="prefill-value">
                      <span>Quantité totale:</span>
                      <strong>{prefillData.quantity} h</strong>
                    </div>
                    <div className="prefill-value">
                      <span>Salaire professeur:</span>
                      <strong>{prefillData.professorSalary} €</strong>
                    </div>
                    <div className="prefill-value">
                      <span>Charges:</span>
                      <strong>{prefillData.charges} €</strong>
                    </div>
                  </div>

                  <div className="prefill-calculation">
                    {(() => {
                      const preview =
                        ndrPrefillService.calculateQuickPreview(prefillData);
                      return (
                        <div className="prefill-calc-grid">
                          <div className="calc-row">
                            <span>Chiffre d'affaires:</span>
                            <strong className="text-blue">
                              {preview.totalRevenue} €
                            </strong>
                          </div>
                          <div className="calc-row">
                            <span>Coûts totaux:</span>
                            <strong>
                              {(
                                preview.totalSalary + preview.totalCharges
                              ).toFixed(2)}{" "}
                              €
                            </strong>
                          </div>
                          <div className="calc-row">
                            <span>Marge prévisionnelle:</span>
                            <strong
                              className={
                                preview.margin >= 0 ? "text-green" : "text-red"
                              }
                            >
                              {preview.margin} € (
                              {preview.marginPercentage.toFixed(1)}%)
                            </strong>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="prefill-payment">
                    <h4>Paiement suggéré</h4>
                    <div className="prefill-payment-info">
                      <span>
                        Mode:{" "}
                        <strong>
                          {prefillData.paymentMethod === "transfer"
                            ? "Virement"
                            : prefillData.paymentMethod === "check"
                            ? "Chèque"
                            : prefillData.paymentMethod === "card"
                            ? "Carte bancaire"
                            : prefillData.paymentMethod === "PRLV"
                            ? "Prélèvement"
                            : prefillData.paymentMethod === "cash"
                            ? "Espèces"
                            : "Non défini"}
                        </strong>
                      </span>
                      <span>
                        Type:{" "}
                        <strong>
                          {prefillData.paymentType === "tax_credit_n1"
                            ? "Crédit d'impôt N+1"
                            : "Avance immédiate"}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="prefill-modal__actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={cancelPrefill}
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={applyPrefillData}
                >
                  ✅ Appliquer ces valeurs
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="step3__navigation">
          <Button
            type="button"
            variant="secondary"
            onClick={previousStep}
            disabled={isSubmitting}
          >
            ← Retour : Élèves et Matières
          </Button>

          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="generate-button"
          >
            {isSubmitting
              ? "Génération en cours..."
              : "Générer la Note de Règlement"}
          </Button>
        </div>
      </form>
    </div>
  );
};
