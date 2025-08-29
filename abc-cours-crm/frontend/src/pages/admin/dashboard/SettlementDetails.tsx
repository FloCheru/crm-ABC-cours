import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  Navbar,
  Breadcrumb,
  Container,
  Button,
  ButtonGroup,
  SummaryCard,
} from "../../../components";
import { PDFGenerator } from "../../../components/pdf/PDFGenerator";
import { settlementService } from "../../../services/settlementService";
import type { SettlementNote } from "../../../services/settlementService";

// Fonctions utilitaires pour extraire les valeurs des subjects
const getSubjectValue = (
  note: SettlementNote,
  field: "hourlyRate" | "quantity" | "professorSalary"
): number => {
  if (!note.subjects || note.subjects.length === 0) return 0;
  // Pour l'instant, on prend la première matière. Plus tard on pourra gérer plusieurs matières
  return note.subjects[0][field] || 0;
};

const getSubjectName = (note: SettlementNote): string => {
  if (!note.subjects || note.subjects.length === 0) return "N/A";
  const firstSubject = note.subjects[0];
  if (typeof firstSubject.subjectId === "object") {
    return firstSubject.subjectId.name;
  }
  return "Matière";
};

const getSubjectCategory = (note: SettlementNote): string => {
  if (!note.subjects || note.subjects.length === 0) return "N/A";
  const firstSubject = note.subjects[0];
  if (typeof firstSubject.subjectId === "object") {
    return firstSubject.subjectId.category;
  }
  return "N/A";
};

export const SettlementDetails: React.FC = () => {
  const { noteId } = useParams<{ noteId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [settlementNote, setSettlementNote] = useState<SettlementNote | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!noteId) {
      setError("ID de note manquant");
      setIsLoading(false);
      return;
    }

    const loadSettlementNote = async () => {
      try {
        setIsLoading(true);
        setError("");
        const note = await settlementService.getSettlementNoteById(noteId);
        setSettlementNote(note);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erreur lors du chargement"
        );
        console.error("Erreur lors du chargement de la note:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettlementNote();
  }, [noteId]);

  const handleBack = () => {
    navigate("/admin/dashboard");
  };

  const handleEdit = () => {
    navigate(`/admin/dashboard/edit/${noteId}`);
  };

  const getAsCode = (department: string): string => {
    if (!department) return "S";
    const cleanDept = department.trim().toUpperCase();
    if (
      cleanDept === "06" ||
      cleanDept === "83" ||
      cleanDept.startsWith("97")
    ) {
      return "A";
    }
    return "S";
  };

  const calculateCA = (hourlyRate: number, quantity: number): number => {
    return hourlyRate * quantity;
  };

  const calculateMarge = (
    hourlyRate: number,
    quantity: number,
    professorSalary: number
  ): number => {
    const ca = calculateCA(hourlyRate, quantity);
    const totalSalary = professorSalary * quantity;
    return ca - totalSalary;
  };

  if (isLoading) {
    return (
      <div>
        <Navbar activePath={location.pathname} />
        <Breadcrumb
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Tableau de bord", href: "/admin/dashboard" },
            { label: "Détails de la note", href: "" },
          ]}
        />
        <Container layout="flex-col">
          <div className="text-center py-8">
            <div className="text-gray-500">Chargement de la note...</div>
          </div>
        </Container>
      </div>
    );
  }

  if (error || !settlementNote) {
    return (
      <div>
        <Navbar activePath={location.pathname} />
        <Breadcrumb
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Tableau de bord", href: "/admin/dashboard" },
            { label: "Détails de la note", href: "" },
          ]}
        />
        <Container layout="flex-col">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error || "Note de règlement introuvable"}
          </div>
          <Button variant="secondary" onClick={handleBack}>
            Retour au tableau de bord
          </Button>
        </Container>
      </div>
    );
  }

  const ca = calculateCA(
    getSubjectValue(settlementNote, "hourlyRate"),
    getSubjectValue(settlementNote, "quantity")
  );
  const totalSalary =
    getSubjectValue(settlementNote, "professorSalary") *
    getSubjectValue(settlementNote, "quantity");
  const marge = calculateMarge(
    getSubjectValue(settlementNote, "hourlyRate"),
    getSubjectValue(settlementNote, "quantity"),
    getSubjectValue(settlementNote, "professorSalary")
  );

  return (
    <div>
      <Navbar activePath={location.pathname} />
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Tableau de bord", href: "/admin/dashboard" },
          {
            label: `NDR ${settlementNote._id
              .substring(settlementNote._id.length - 8)
              .toUpperCase()}`,
            href: "",
          },
        ]}
      />
      <Container layout="flex-col">
        <div className="settlement-details__header">
          <h1>
            Note de règlement NDR{" "}
            {settlementNote._id
              .substring(settlementNote._id.length - 8)
              .toUpperCase()}
          </h1>
          <div className="settlement-details__header-actions">
            <ButtonGroup
              variant="double"
              buttons={[
                { text: "Retour", variant: "secondary", onClick: handleBack },
                { text: "Modifier", variant: "primary", onClick: handleEdit },
              ]}
            />
          </div>
        </div>

        {/* Métriques principales */}
        <Container layout="grid">
          <SummaryCard
            title="INFORMATIONS FINANCIÈRES"
            metrics={[
              {
                value: `${ca.toFixed(2)} €`,
                label: "Chiffre d'affaires",
                variant: "primary",
              },
              {
                value: `${marge.toFixed(2)} €`,
                label: "Marge",
                variant: marge >= 0 ? "success" : "error",
              },
              {
                value: `${totalSalary.toFixed(2)} €`,
                label: "Total salaire prof",
                variant: "secondary",
              },
            ]}
          />
          <SummaryCard
            title="DÉTAILS NDR"
            metrics={[
              {
                value: new Date(settlementNote.createdAt).toLocaleDateString(
                  "fr-FR"
                ),
                label: "Date de création",
                variant: "secondary",
              },
              {
                value: getAsCode(settlementNote.department),
                label: "A/S",
                variant: "primary",
              },
            ]}
          />
        </Container>

        <div className="settlement-details__content">
          {/* Informations générales */}
          <section className="settlement-details__section settlement-details__section--general-info">
            <h2>Informations générales</h2>
            <div className="settlement-details__grid settlement-details__grid--3-cols">
              <div className="settlement-details__field">
                <label>Client (Famille)</label>
                <p>{settlementNote.clientName}</p>
              </div>
              <div className="settlement-details__field">
                <label>Département</label>
                <p>{settlementNote.department || "N/A"}</p>
              </div>
              <div className="settlement-details__field">
                <label>Statut</label>
                <p>
                  <span
                    className={`settlement-details__status-badge settlement-details__status-badge--${
                      settlementNote.status === "paid"
                        ? "paid"
                        : settlementNote.status === "overdue"
                        ? "overdue"
                        : "pending"
                    }`}
                  >
                    {settlementNote.status === "paid"
                      ? "Payé"
                      : settlementNote.status === "overdue"
                      ? "En retard"
                      : "En attente"}
                  </span>
                </p>
              </div>
            </div>
          </section>

          {/* Détails du cours */}
          <section className="settlement-details__section settlement-details__section--course-details">
            <h2>Détails du cours</h2>
            <div className="settlement-details__grid settlement-details__grid--3-cols">
              <div className="settlement-details__field">
                <label>Matière</label>
                <p>{getSubjectName(settlementNote)}</p>
              </div>
              <div className="settlement-details__field">
                <label>Catégorie</label>
                <p>{getSubjectCategory(settlementNote)}</p>
              </div>
              <div className="settlement-details__field">
                <label>Quantité (QTé)</label>
                <p>{getSubjectValue(settlementNote, "quantity")}</p>
              </div>
              <div className="settlement-details__field">
                <label>Prix unitaire (PU)</label>
                <p>
                  {getSubjectValue(settlementNote, "hourlyRate").toFixed(2)} €
                </p>
              </div>
              <div className="settlement-details__field">
                <label>Mode de paiement</label>
                <p>{settlementNote.paymentMethod}</p>
              </div>
            </div>
          </section>

          {/* Détails financiers */}
          <section className="settlement-details__section settlement-details__section--financial-details">
            <h2>Détails financiers</h2>
            <div className="settlement-details__grid settlement-details__grid--2-cols">
              <div className="settlement-details__field">
                <label>Salaire professeur (unitaire)</label>
                <p>
                  {getSubjectValue(settlementNote, "professorSalary").toFixed(
                    2
                  )}{" "}
                  € / unité
                </p>
              </div>
              <div className="settlement-details__field">
                <label>Total salaire professeur</label>
                <p className="text-orange-600">{totalSalary.toFixed(2)} €</p>
              </div>
            </div>
          </section>

          {/* Échéancier */}
          {settlementNote.paymentSchedule && (
            <section className="settlement-details__section settlement-details__section--payment-schedule">
              <h2>Échéancier de paiement</h2>
              <div
                className="settlement-details__grid settlement-details__grid--3-cols"
                style={{ marginBottom: "1.5rem" }}
              >
                <div className="settlement-details__field">
                  <label>Mode de règlement</label>
                  <p>
                    {settlementNote.paymentSchedule.paymentMethod === "PRLV"
                      ? "Prélèvement"
                      : "Chèque"}
                  </p>
                </div>
                <div className="settlement-details__field">
                  <label>Nombre d'échéances</label>
                  <p>{settlementNote.paymentSchedule.numberOfInstallments}</p>
                </div>
                <div className="settlement-details__field">
                  <label>
                    Jour de{" "}
                    {settlementNote.paymentSchedule.paymentMethod === "PRLV"
                      ? "prélèvement"
                      : "remise"}
                  </label>
                  <p>
                    Le {settlementNote.paymentSchedule.dayOfMonth} de chaque
                    mois
                  </p>
                </div>
              </div>

              {settlementNote.paymentSchedule.installments && (
                <div>
                  <h3
                    style={{
                      margin: "0 0 1rem 0",
                      color: "#374151",
                      fontSize: "1rem",
                      fontWeight: "600",
                    }}
                  >
                    Détail des échéances
                  </h3>
                  <div style={{ overflowX: "auto" }}>
                    <table className="settlement-details__payment-table">
                      <thead>
                        <tr>
                          <th>Échéance</th>
                          <th>Montant</th>
                          <th>Date d'échéance</th>
                          <th>Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {settlementNote.paymentSchedule.installments.map(
                          (installment, index) => (
                            <tr key={index}>
                              <td>{index + 1}</td>
                              <td>{installment.amount.toFixed(2)} €</td>
                              <td>
                                {new Date(
                                  installment.dueDate
                                ).toLocaleDateString("fr-FR")}
                              </td>
                              <td>
                                <span
                                  className={`settlement-details__status-badge settlement-details__status-badge--${
                                    installment.status === "paid"
                                      ? "paid"
                                      : installment.status === "failed"
                                      ? "failed"
                                      : "pending"
                                  }`}
                                >
                                  {installment.status === "paid"
                                    ? "Payé"
                                    : installment.status === "failed"
                                    ? "Échec"
                                    : "En attente"}
                                </span>
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Notes supplémentaires */}
          {settlementNote.notes && (
            <section className="settlement-details__section settlement-details__section--notes">
              <h2>Notes</h2>
              <div className="settlement-details__notes-content">
                {settlementNote.notes}
              </div>
            </section>
          )}

          {/* Génération PDF */}
          <section className="settlement-details__section settlement-details__section--pdf">
            <h2>Génération PDF</h2>
            <PDFGenerator settlementNote={settlementNote} />
          </section>

          {/* Informations de création */}
          <section className="settlement-details__section settlement-details__section--creation-info">
            <h2>Informations de création</h2>
            <div className="settlement-details__grid settlement-details__grid--2-cols">
              <div className="settlement-details__field">
                <label>Créé par</label>
                <p>
                  {settlementNote.createdBy?.firstName}{" "}
                  {settlementNote.createdBy?.lastName}
                </p>
              </div>
              <div className="settlement-details__field">
                <label>Dernière modification</label>
                <p>
                  {new Date(settlementNote.updatedAt).toLocaleDateString(
                    "fr-FR"
                  )}{" "}
                  à{" "}
                  {new Date(settlementNote.updatedAt).toLocaleTimeString(
                    "fr-FR",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </p>
              </div>
            </div>
          </section>
        </div>
      </Container>
    </div>
  );
};
