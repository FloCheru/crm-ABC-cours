import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {

  PageHeader,
  Container,
  SummaryCard,
} from "../../../components";
import {
  EditableCard,
  EditableField,
} from "../../../components/ui/EditableCard";
import { ndrService } from "../../../services/ndrService";
import type { NDR } from "../../../services/ndrService";
import { familyService } from "../../../services/familyService";
import type { Family } from "../../../types/family";
import type { Subject } from "../../../types/subject";
import { getDepartmentFromPostalCode } from "../../../utils";

// Constantes de traduction
const statusLabels: Record<string, string> = {
  pending: "En attente",
  paid: "Payé",
  overdue: "En retard",
};

const paymentMethodLabels: Record<string, string> = {
  card: "Carte",
  check: "Chèque",
  transfer: "Virement",
  cash: "Espèces",
  PRLV: "Prélèvement",
  CESU: "CESU",
};

const statusOptions = [
  { value: "pending", label: "En attente" },
  { value: "paid", label: "Payé" },
  { value: "overdue", label: "En retard" },
];

const paymentMethodOptions = [
  { value: "card", label: "Carte" },
  { value: "check", label: "Chèque" },
  { value: "transfer", label: "Virement" },
  { value: "cash", label: "Espèces" },
  { value: "PRLV", label: "Prélèvement" },
  { value: "CESU", label: "CESU" },
];

export const NdrDetails: React.FC = () => {
  const navigate = useNavigate();
  const { ndrId } = useParams<{ ndrId: string }>();

  const [ndr, setNdr] = useState<NDR | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // Fonction pour charger les détails de la NDR
  const loadNdrDetails = async () => {
    if (!ndrId) {
      setError("ID de note manquant");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      // Charger la NDR
      const note = await ndrService.getNdrById(ndrId);
      console.log("ndr reçu", note);
      setNdr(note);

      // Charger la famille associée
      const familyId =
        typeof note.familyId === "object" ? (note.familyId as any)._id : note.familyId;

      if (familyId) {
        const familyData = await familyService.getFamily(familyId);
        setFamily(familyData);
      }

      // Charger les détails des matières depuis la réponse peuplée
      if (note.subjects && note.subjects.length > 0) {
        const populatedSubjects = note.subjects
          .map((s: any) => {
            // Si l'objet subject est déjà peuplé avec name et category
            if (typeof s === "object" && s.name) {
              return {
                _id: s.id,
                name: s.name,
                category: s.category,
              };
            }
            return null;
          })
          .filter(Boolean);

        setSubjects(populatedSubjects as Subject[]);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors du chargement"
      );
      console.error("Erreur lors du chargement de la note:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNdrDetails();
  }, [ndrId]);

  // Redirection si pas d'ID de NDR dans localStorage
  useEffect(() => {
    if (!ndrId) {
      navigate("/admin/ndrs", { replace: true });
    }
  }, [ndrId, navigate]);

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
        <PageHeader
          title="Chargement..."
          breadcrumb={[
            { label: "NDRs", href: "/admin/ndrs" },
            { label: "Chargement..." },
          ]}
          backButton={{
            label: "Retour aux NDRs",
            href: "/admin/ndrs",
          }}
        />
        <Container layout="flex-col">
          <div className="text-center py-8">
            <div className="text-gray-500">Chargement de la note...</div>
          </div>
        </Container>
      </div>
    );
  }

  // Calculs financiers
  const ca = ndr ? calculateCA(ndr.hourlyRate, ndr.quantity) : 0;
  const marge = ndr
    ? calculateMarge(ndr.hourlyRate, ndr.quantity, ndr.professor?.salary || 0)
    : 0;

  return (
    <div>
      <PageHeader
        title={`Note de règlement n°${
          ndr
            ? ndr._id.substring(ndr._id.length - 8).toUpperCase()
            : "Chargement..."
        }`}
        breadcrumb={[
          { label: "NDRs", href: "/ndrs" },
          {
            label: `NDR n°${
              ndr
                ? ndr._id.substring(ndr._id.length - 8).toUpperCase()
                : "Chargement..."
            }`,
          },
        ]}
        description={
          ndr
            ? `Créé le ${new Date(ndr.createdAt).toLocaleDateString(
                "fr-FR"
              )} • Dernière modification le ${new Date(
                ndr.updatedAt || ndr.createdAt
              ).toLocaleDateString("fr-FR")} à ${new Date(
                ndr.updatedAt || ndr.createdAt
              ).toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}`
            : undefined
        }
        backButton={{ label: "Retour aux NDRs", href: "/ndrs" }}
      />
      <Container layout="flex-col">
        {error || !ndr ? (
          <>
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error || "Note de règlement introuvable"}
            </div>
          </>
        ) : (
          <>
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
                ]}
              />
              <SummaryCard
                title="DÉTAILS NDR"
                metrics={[
                  {
                    value: new Date(ndr.createdAt).toLocaleDateString("fr-FR"),
                    label: "Date de création",
                    variant: "secondary",
                  },
                  {
                    value: getAsCode((ndr as any).department),
                    label: "A/S",
                    variant: "primary",
                  },
                ]}
              />
            </Container>

            <div className="settlement-details__content space-y-6">
              {/* Informations générales */}
              <EditableCard
                title="Informations générales"
                onSave={async (data) => {
                  await ndrService.updateNdr(ndr._id, {
                    status: data.status as string,
                    paymentMethod: data.paymentMethod as "card" | "CESU" | "check" | "transfer" | "cash" | "PRLV",
                  });
                  await loadNdrDetails();
                }}
              >
                <EditableField
                  label="Client (Famille)"
                  value={
                    family
                      ? `${family.primaryContact.firstName} ${family.primaryContact.lastName}`
                      : "N/A"
                  }
                  readOnly
                />
                <EditableField
                  label="Département"
                  value={getDepartmentFromPostalCode(family?.primaryContact.address?.postalCode || "") || "N/A"}
                  readOnly
                />
                <EditableField
                  label="Statut"
                  name="status"
                  value={ndr.status}
                  displayValue={statusLabels[ndr.status] || ndr.status}
                  type="select"
                  options={statusOptions}
                />
                <EditableField
                  label="Mode de paiement"
                  name="paymentMethod"
                  value={ndr.paymentMethod}
                  displayValue={
                    paymentMethodLabels[ndr.paymentMethod] || ndr.paymentMethod
                  }
                  type="select"
                  options={paymentMethodOptions}
                />
              </EditableCard>

              <EditableCard
                title="Détails du cours"
                onSave={async (data) => {
                  await ndrService.updateNdr(ndr._id, {
                    quantity: Number(data.quantity),
                    hourlyRate: Number(data.hourlyRate),
                  });
                  await loadNdrDetails();
                }}
              >
                <EditableField
                  label="Matières"
                  value={subjects}
                  customRender={() => (
                    <div className="flex flex-wrap gap-2">
                      {subjects && subjects.length > 0 ? (
                        subjects.map((subject: Subject) => (
                          <span
                            key={subject._id}
                            className="px-2 py-1 bg-gray-100 rounded text-sm"
                          >
                            {subject.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400">
                          Aucune matière sélectionnée
                        </span>
                      )}
                    </div>
                  )}
                />
                <EditableField
                  label="Quantité (QTé)"
                  name="quantity"
                  value={ndr.quantity}
                  type="number"
                  placeholder="Quantité"
                />
                <EditableField
                  label="Prix unitaire (PU)"
                  name="hourlyRate"
                  value={ndr.hourlyRate}
                  displayValue={`${ndr.hourlyRate?.toFixed(2) || 0} €`}
                  type="number"
                  placeholder="Prix unitaire"
                />
              </EditableCard>

              <EditableCard
                title="Détails financiers"
                onSave={async (data) => {
                  await ndrService.updateNdr(ndr._id, {
                    professor: {
                      id: ndr.professor?.id || "",
                      salary: Number(data.professorSalary),
                    },
                    charges: Number(data.charges),
                  });
                  await loadNdrDetails();
                }}
              >
                <EditableField
                  label="Salaire horaire professeur"
                  name="professorSalary"
                  value={ndr.professor?.salary || 0}
                  displayValue={`${ndr.professor?.salary?.toFixed(2) || 0} €`}
                  type="number"
                  placeholder="Salaire professeur"
                />
                <EditableField
                  label="Charges"
                  name="charges"
                  value={ndr.charges || 0}
                  displayValue={`${ndr.charges?.toFixed(2) || 0} €`}
                  type="number"
                  placeholder="Charges"
                />
                <EditableField
                  label="Total salaire professeur"
                  value={(
                    (ndr.quantity || 0) * (ndr.professor?.salary || 0)
                  ).toFixed(2)}
                  displayValue={`${(
                    (ndr.quantity || 0) * (ndr.professor?.salary || 0)
                  ).toFixed(2)} €`}
                  readOnly
                />
              </EditableCard>

              {/* Échéancier */}
              {(ndr as any).paymentSchedule && (
                <section className="settlement-details__section settlement-details__section--payment-schedule">
                  <h2>Échéancier de paiement</h2>
                  <div
                    className="settlement-details__grid settlement-details__grid--3-cols"
                    style={{ marginBottom: "1.5rem" }}
                  >
                    <div className="settlement-details__field">
                      <label>Mode de règlement</label>
                      <p>
                        {(ndr as any).paymentSchedule.paymentMethod === "PRLV"
                          ? "Prélèvement"
                          : "Chèque"}
                      </p>
                    </div>
                    <div className="settlement-details__field">
                      <label>Nombre d'échéances</label>
                      <p>{(ndr as any).paymentSchedule.numberOfInstallments}</p>
                    </div>
                    <div className="settlement-details__field">
                      <label>
                        Jour de{" "}
                        {(ndr as any).paymentSchedule.paymentMethod === "PRLV"
                          ? "prélèvement"
                          : "remise"}
                      </label>
                      <p>Le {(ndr as any).paymentSchedule.dayOfMonth} de chaque mois</p>
                    </div>
                  </div>

                  {(ndr as any).paymentSchedule.installments && (
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
                            {(ndr as any).paymentSchedule.installments.map(
                              (installment: any, index: number) => (
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
              <EditableCard
                title="Notes"
                onSave={async (data) => {
                  await ndrService.updateNdr(ndr._id, {
                    notes: data.notes as string,
                  });
                  await loadNdrDetails();
                }}
              >
                <EditableField
                  label="Notes"
                  name="notes"
                  value={ndr.notes || ""}
                  type="textarea"
                  placeholder="Notes supplémentaires..."
                />
              </EditableCard>

              {/* Génération PDF */}
              <section className="settlement-details__section settlement-details__section--pdf">
                <h2>Génération PDF</h2>
                {/* <PDFGenerator ndr={ndr} /> */}
              </section>
            </div>
          </>
        )}
      </Container>
    </div>
  );
};
