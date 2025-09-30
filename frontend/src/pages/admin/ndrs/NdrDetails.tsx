import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  Navbar,
  PageHeader,
  Container,
  ButtonGroup,
  SummaryCard,
  DataCard,
} from "../../../components";
import { PDFGenerator } from "../../../components/pdf/PDFGenerator";
import { ndrService } from "../../../services/ndrService";
import type { Ndr } from "../../../services/ndrService";
import { familyService } from "../../../services/familyService";
import type { Family } from "../../../types/family";
import { subjectService } from "../../../services/subjectService";
import type { Subject } from "../../../types/subject";

export const NdrDetails: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Récupérer l'ID depuis localStorage
  const ndrId = localStorage.getItem("ndrId");

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
      setNdr(note);

      // Charger la famille associée
      const familyId = typeof note.familyId === "object"
        ? note.familyId._id
        : note.familyId;

      if (familyId) {
        const familyData = await familyService.getFamily(familyId);
        setFamily(familyData);
      }

      // Charger les détails des matières
      if (note.subjects && note.subjects.length > 0) {
        const subjectIds = note.subjects
          .map((s: any) => typeof s.id === "string" ? s.id : s.id?._id)
          .filter(Boolean);

        if (subjectIds.length > 0) {
          const subjectDetails = await Promise.all(
            subjectIds.map((id: string) => subjectService.getSubjectById(id))
          );
          setSubjects(subjectDetails);
        }
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
      navigate("/ndrs", { replace: true });
    }
  }, [ndrId, navigate]);

  const handleBack = () => {
    navigate("/ndrs");
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

  // Configuration des champs pour l'édition
  const fieldConfig = {
    general: [
      {
        key: "clientName",
        label: "Client (Famille)",
        field: "clientName",
        type: "text",
        readOnly: true,
      },
      {
        key: "department",
        label: "Département",
        field: "department",
        type: "text",
        readOnly: true,
      },
      {
        key: "status",
        label: "Statut",
        field: "status",
        type: "select",
        options: [
          { value: "pending", label: "En attente" },
          { value: "paid", label: "Payé" },
          { value: "overdue", label: "En retard" },
        ],
      },
      {
        key: "paymentMethod",
        label: "Mode de paiement",
        field: "paymentMethod",
        type: "select",
        options: [
          { value: "card", label: "Carte" },
          { value: "check", label: "Chèque" },
          { value: "transfer", label: "Virement" },
          { value: "cash", label: "Espèces" },
          { value: "PRLV", label: "Prélèvement" },
          { value: "CESU", label: "CESU" },
        ],
      },
    ],
    course: [
      {
        key: "subjects",
        label: "Matières",
        field: "subjects",
        type: "custom",
        readOnly: true,
      },
      {
        key: "quantity",
        label: "Quantité (QTé)",
        field: "quantity",
        type: "number",
        placeholder: "Quantité",
      },
      {
        key: "hourlyRate",
        label: "Prix unitaire (PU)",
        field: "hourlyRate",
        type: "number",
        placeholder: "Prix unitaire",
      },
    ],
    financial: [
      {
        key: "professorSalary",
        label: "Salaire professeur (unitaire)",
        field: "professor.salary",
        type: "number",
        placeholder: "Salaire professeur",
      },
      {
        key: "charges",
        label: "Charges",
        field: "charges",
        type: "number",
        placeholder: "Charges",
      },
      {
        key: "totalSalary",
        label: "Total salaire professeur",
        field: "totalSalary",
        type: "text",
        readOnly: true,
      },
    ],
    notes: [
      {
        key: "notes",
        label: "Notes",
        field: "notes",
        type: "textarea",
        placeholder: "Notes supplémentaires...",
      },
    ],
  };

  // Fonction simplifiée pour afficher les valeurs (comme ProspectDetails)
  const getDisplayValue = (ndr: NDR, path: string) => {
    // Cas spéciaux pour les données de la famille
    if (path === "clientName" && family) {
      return `${family.primaryContact.firstName} ${family.primaryContact.lastName}`;
    }
    if (path === "department" && family) {
      return family.address?.postalCode?.substring(0, 2) || "N/A";
    }

    // Cas spéciaux pour les traductions
    if (path === "status") {
      const statuses: Record<string, string> = {
        pending: "En attente",
        paid: "Payé",
        overdue: "En retard",
      };
      return statuses[ndr.status] || ndr.status;
    }

    if (path === "paymentMethod") {
      const methods: Record<string, string> = {
        card: "Carte",
        check: "Chèque",
        transfer: "Virement",
        cash: "Espèces",
        PRLV: "Prélèvement",
        CESU: "CESU",
      };
      return methods[ndr.paymentMethod] || ndr.paymentMethod;
    }

    // Cas spécial pour le total salaire (calculé)
    if (path === "totalSalary") {
      const quantity = ndr.quantity || 0;
      const salary = ndr.professor?.salary || 0;
      return `${(quantity * salary).toFixed(2)} €`;
    }

    // Extraction générique par chemin (comme ProspectDetails)
    const keys = path.split(".");
    let value: any = ndr;
    for (const key of keys) {
      if (value && typeof value === "object") {
        if (!isNaN(Number(key))) {
          value = value[Number(key)];
        } else {
          value = value[key];
        }
      } else {
        return "Non renseigné";
      }
    }

    // Formatage des nombres avec €
    if (typeof value === "number" && (path.includes("Rate") || path.includes("Salary") || path.includes("charges"))) {
      return `${value.toFixed(2)} €`;
    }

    return value || "Non renseigné";
  };

  if (isLoading) {
    return (
      <div>
        <Navbar activePath={location.pathname} />
        <PageHeader
          title="Chargement..."
          breadcrumb={[
            { label: "NDRs", href: "/ndrs" },
            { label: "Chargement..." },
          ]}
          backButton={{
            label: "Retour aux NDRs",
            href: "/ndrs",
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
      <Navbar activePath={location.pathname} />
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
                ndr.updatedAt
              ).toLocaleDateString("fr-FR")} à ${new Date(
                ndr.updatedAt
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
                    value: getAsCode(ndr.department),
                    label: "A/S",
                    variant: "primary",
                  },
                ]}
              />
            </Container>

            <div className="settlement-details__content">
              {/* Informations générales */}

              <DataCard
                title="Informations générales"
                fields={fieldConfig.general.map((field) => ({
                  key: field.key,
                  label: field.label,
                  value: getDisplayValue(ndr, field.field),
                  type: field.type as
                    | "text"
                    | "email"
                    | "tel"
                    | "number"
                    | "date"
                    | "textarea"
                    | "select",
                  placeholder: field.placeholder,
                  options: (field as any).options || undefined,
                  readOnly: (field as any).readOnly || false,
                }))}
                onSave={async (data) => {
                  await ndrService.updateNdr(ndr._id, {
                    status: data.status as string,
                    paymentMethod: data.paymentMethod as string,
                  });
                  await loadNdrDetails();
                }}
              />

              <DataCard
                title="Détails du cours"
                fields={fieldConfig.course.map((field) => {
                  // Traitement spécial pour les matières (comme ProspectDetails)
                  if (field.key === "subjects") {
                    return {
                      key: field.key,
                      label: field.label,
                      value: ndr.subjects || [],
                      type: "text",
                      readOnly: true,
                      customRender: () => (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                          }}
                        >
                          <div
                            style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}
                          >
                            {subjects && subjects.length > 0 ? (
                              subjects.map((subject: Subject) => (
                                <span
                                  key={subject._id}
                                  style={{
                                    padding: "4px 8px",
                                    backgroundColor: "#f3f4f6",
                                    borderRadius: "4px",
                                    fontSize: "14px",
                                  }}
                                >
                                  {subject.name}
                                </span>
                              ))
                            ) : (
                              <span style={{ color: "#9ca3af" }}>
                                Aucune matière sélectionnée
                              </span>
                            )}
                          </div>
                        </div>
                      ),
                    };
                  }

                  return {
                    key: field.key,
                    label: field.label,
                    value: getDisplayValue(ndr, field.field),
                    type: field.type as
                      | "text"
                      | "email"
                      | "tel"
                      | "number"
                      | "date"
                      | "textarea"
                      | "select",
                    placeholder: field.placeholder,
                    readOnly: (field as any).readOnly || false,
                  };
                })}
                onSave={async (data) => {
                  await ndrService.updateNdr(ndr._id, {
                    quantity: Number(data.quantity),
                    hourlyRate: Number(data.hourlyRate),
                  });
                  await loadNdrDetails();
                }}
              />

              <DataCard
                title="Détails financiers"
                fields={fieldConfig.financial.map((field) => ({
                  key: field.key,
                  label: field.label,
                  value: getDisplayValue(ndr, field.field),
                  type: field.type as
                    | "text"
                    | "email"
                    | "tel"
                    | "number"
                    | "date"
                    | "textarea"
                    | "select",
                  placeholder: field.placeholder,
                  readOnly: (field as any).readOnly || false,
                }))}
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
              />

              {/* Échéancier */}
              {ndr.paymentSchedule && (
                <section className="settlement-details__section settlement-details__section--payment-schedule">
                  <h2>Échéancier de paiement</h2>
                  <div
                    className="settlement-details__grid settlement-details__grid--3-cols"
                    style={{ marginBottom: "1.5rem" }}
                  >
                    <div className="settlement-details__field">
                      <label>Mode de règlement</label>
                      <p>
                        {ndr.paymentSchedule.paymentMethod === "PRLV"
                          ? "Prélèvement"
                          : "Chèque"}
                      </p>
                    </div>
                    <div className="settlement-details__field">
                      <label>Nombre d'échéances</label>
                      <p>{ndr.paymentSchedule.numberOfInstallments}</p>
                    </div>
                    <div className="settlement-details__field">
                      <label>
                        Jour de{" "}
                        {ndr.paymentSchedule.paymentMethod === "PRLV"
                          ? "prélèvement"
                          : "remise"}
                      </label>
                      <p>Le {ndr.paymentSchedule.dayOfMonth} de chaque mois</p>
                    </div>
                  </div>

                  {ndr.paymentSchedule.installments && (
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
                            {ndr.paymentSchedule.installments.map(
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
              <DataCard
                title="Notes"
                fields={fieldConfig.notes.map((field) => ({
                  key: field.key,
                  label: field.label,
                  value: getDisplayValue(ndr, field.field),
                  type: field.type as
                    | "text"
                    | "email"
                    | "tel"
                    | "number"
                    | "date"
                    | "textarea"
                    | "select",
                  placeholder: field.placeholder,
                }))}
                onSave={async (data) => {
                  await ndrService.updateNdr(ndr._id, {
                    notes: data.notes as string,
                  });
                  await loadNdrDetails();
                }}
              />

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
