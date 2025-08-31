import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  Navbar,
  Breadcrumb,
  Container,
  ButtonGroup,
  SummaryCard,
  DataCard,
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

  // États pour le mode édition
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<SettlementNote>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Calculs dynamiques basés sur les données en cours d'édition
  const currentHourlyRate =
    isEditing && editedData.subjects?.[0]?.hourlyRate
      ? editedData.subjects[0].hourlyRate
      : settlementNote
      ? getSubjectValue(settlementNote, "hourlyRate")
      : 0;
  const currentQuantity =
    isEditing && editedData.subjects?.[0]?.quantity
      ? editedData.subjects[0].quantity
      : settlementNote
      ? getSubjectValue(settlementNote, "quantity")
      : 0;
  const currentProfessorSalary =
    isEditing && editedData.subjects?.[0]?.professorSalary
      ? editedData.subjects[0].professorSalary
      : settlementNote
      ? getSubjectValue(settlementNote, "professorSalary")
      : 0;

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

  // Fonctions pour la gestion du mode édition
  const handleEditToggle = () => {
    if (isEditing) {
      // Annuler les modifications
      setEditedData({});
      setValidationErrors({});
      setIsEditing(false);
    } else {
      // Entrer en mode édition
      if (settlementNote) {
        setEditedData({
          clientName: settlementNote.clientName,
          department: settlementNote.department,
          status: settlementNote.status,
          paymentMethod: settlementNote.paymentMethod,
          notes: settlementNote.notes || "",
          subjects: settlementNote.subjects ? [...settlementNote.subjects] : [],
        });
        setIsEditing(true);
      }
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    // Validation des champs obligatoires
    if (!editedData.clientName?.trim()) {
      errors.clientName = "Le nom du client est requis";
    }
    if (!editedData.department?.trim()) {
      errors.department = "Le département est requis";
    }
    if (!editedData.paymentMethod?.trim()) {
      errors.paymentMethod = "Le mode de paiement est requis";
    }

    // Validation des sujets si ils existent
    if (editedData.subjects && editedData.subjects.length > 0) {
      editedData.subjects.forEach((subject, index) => {
        if (!subject.hourlyRate || subject.hourlyRate <= 0) {
          errors[`hourlyRate_${index}`] = "Le taux horaire doit être positif";
        }
        if (!subject.quantity || subject.quantity <= 0) {
          errors[`quantity_${index}`] = "La quantité doit être positive";
        }
        if (!subject.professorSalary || subject.professorSalary < 0) {
          errors[`professorSalary_${index}`] =
            "Le salaire professeur ne peut pas être négatif";
        }
      });
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !settlementNote) {
      return;
    }

    try {
      setIsSaving(true);
      const updatedNote = await settlementService.updateSettlementNote(
        settlementNote._id,
        editedData
      );
      setSettlementNote(updatedNote);
      setEditedData({});
      setIsEditing(false);
      setValidationErrors({});
    } catch (err) {
      console.error("Erreur lors de la sauvegarde:", err);
      setError("Impossible de sauvegarder les modifications");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    const fieldParts = field.split(".");

    if (fieldParts.length === 1) {
      setEditedData((prev) => ({ ...prev, [field]: value }));
    } else if (fieldParts.length === 3) {
      const [parent, index, childField] = fieldParts;
      if (parent === "subjects") {
        const subjectIndex = parseInt(index);
        const updatedSubjects = editedData.subjects
          ? [...editedData.subjects]
          : [];

        // S'assurer que le subject existe
        while (updatedSubjects.length <= subjectIndex) {
          updatedSubjects.push({
            subjectId:
              settlementNote?.subjects?.[subjectIndex]?.subjectId || "",
            hourlyRate: 0,
            quantity: 0,
            professorSalary: 0,
          });
        }

        // Convertir en nombre si c'est un champ numérique
        let processedValue = value;
        if (
          ["hourlyRate", "quantity", "professorSalary"].includes(childField)
        ) {
          processedValue = parseFloat(value) || 0;
        }

        updatedSubjects[subjectIndex] = {
          ...updatedSubjects[subjectIndex],
          [childField]: processedValue,
        };

        setEditedData((prev) => ({ ...prev, subjects: updatedSubjects }));
      }
    }
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
        placeholder: "Nom du client",
        required: true,
      },
      {
        key: "department",
        label: "Département",
        field: "department",
        type: "text",
        placeholder: "Département",
        required: true,
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
        required: true,
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
        required: true,
      },
    ],
    course: [
      {
        key: "subject",
        label: "Matière",
        field: "subject",
        type: "text",
        readOnly: true,
      },
      {
        key: "category",
        label: "Catégorie",
        field: "category",
        type: "text",
        readOnly: true,
      },
      {
        key: "quantity",
        label: "Quantité (QTé)",
        field: "subjects.0.quantity",
        type: "number",
        placeholder: "Quantité",
        required: true,
      },
      {
        key: "hourlyRate",
        label: "Prix unitaire (PU)",
        field: "subjects.0.hourlyRate",
        type: "number",
        placeholder: "Prix unitaire",
        required: true,
      },
    ],
    financial: [
      {
        key: "professorSalary",
        label: "Salaire professeur (unitaire)",
        field: "subjects.0.professorSalary",
        type: "number",
        placeholder: "Salaire professeur",
        required: true,
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
        required: false,
      },
    ],
  };

  // Fonctions utilitaires pour l'affichage et la récupération des valeurs
  const getFieldValue = (data: any, path: string) => {
    const keys = path.split(".");
    let value = data;
    for (const key of keys) {
      if (value && typeof value === "object") {
        if (!isNaN(Number(key))) {
          // Index de tableau
          value = value[Number(key)];
        } else {
          value = value[key];
        }
      } else {
        return path.includes("subjects.0.") ? "" : "";
      }
    }

    // Pour les champs numériques, on retourne une chaîne vide si pas de valeur
    if (value === null || value === undefined) {
      return "";
    }

    // Pour les champs numériques, on s'assure de retourner un nombre ou une chaîne
    if (
      path.includes("quantity") ||
      path.includes("hourlyRate") ||
      path.includes("professorSalary")
    ) {
      return typeof value === "number" ? value.toString() : value || "";
    }

    return value;
  };

  const getDisplayValue = (note: SettlementNote, path: string) => {
    if (path === "subject") {
      return getSubjectName(note);
    }
    if (path === "category") {
      return getSubjectCategory(note);
    }
    if (path === "subjects.0.quantity") {
      return getSubjectValue(note, "quantity").toString();
    }
    if (path === "subjects.0.hourlyRate") {
      return `${getSubjectValue(note, "hourlyRate").toFixed(2)} €`;
    }
    if (path === "subjects.0.professorSalary") {
      return `${getSubjectValue(note, "professorSalary").toFixed(2)} €`;
    }
    if (path === "totalSalary") {
      const quantity = getSubjectValue(note, "quantity");
      const salary = getSubjectValue(note, "professorSalary");
      return `${(quantity * salary).toFixed(2)} €`;
    }
    if (path === "status") {
      return note.status === "paid"
        ? "Payé"
        : note.status === "overdue"
        ? "En retard"
        : "En attente";
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
      return methods[note.paymentMethod] || note.paymentMethod;
    }

    const keys = path.split(".");
    let value: any = note;
    for (const key of keys) {
      if (value && typeof value === "object") {
        value = value[key as keyof typeof value];
      } else {
        return "Non renseigné";
      }
    }

    return value || "Non renseigné";
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

  // Calculs financiers (utilise les données courantes - éditées ou existantes)
  const ca = calculateCA(currentHourlyRate, currentQuantity);
  const marge = calculateMarge(
    currentHourlyRate,
    currentQuantity,
    currentProfessorSalary
  );

  return (
    <div>
      <Navbar activePath={location.pathname} />
      <Breadcrumb
        items={[
          { label: "Tableau de bord", href: "/admin/dashboard" },
          {
            label: settlementNote
              ? `NDR ${settlementNote._id
                  .substring(settlementNote._id.length - 8)
                  .toUpperCase()}`
              : "Détails de la note",
            href: "",
          },
        ]}
      />
      <Container layout="flex-col">
        {error || !settlementNote ? (
          <>
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error || "Note de règlement introuvable"}
            </div>
            <ButtonGroup
              variant="single"
              buttons={[
                {
                  text: "Retour au tableau de bord",
                  variant: "outline",
                  onClick: handleBack,
                },
              ]}
            />
          </>
        ) : (
          <>
            <Container layout="flex-col">
              <Container>
                <h1>
                  Note de règlement n°
                  {settlementNote._id
                    .substring(settlementNote._id.length - 8)
                    .toUpperCase()}
                </h1>
                <ButtonGroup
                  variant="single"
                  buttons={[
                    {
                      text: "Retour au tableau de bord",
                      variant: "outline",
                      onClick: handleBack,
                    },
                  ]}
                />
              </Container>
              <p>
                Créé par {settlementNote.createdBy.firstName}{" "}
                {settlementNote.createdBy.lastName}. Dernière modification le{" "}
                {new Date(settlementNote.updatedAt).toLocaleDateString("fr-FR")}{" "}
                à{" "}
                {new Date(settlementNote.updatedAt).toLocaleTimeString(
                  "fr-FR",
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )}
                .
              </p>
            </Container>

            {isEditing ? (
              <ButtonGroup
                variant="double"
                buttons={[
                  {
                    text: "Annuler",
                    variant: "outline",
                    onClick: handleEditToggle,
                    disabled: isSaving,
                  },
                  {
                    text: isSaving ? "Sauvegarde..." : "Enregistrer",
                    variant: "primary",
                    onClick: handleSave,
                    disabled: isSaving,
                  },
                ]}
              />
            ) : (
              <ButtonGroup
                variant="single"
                buttons={[
                  {
                    text: "Modifier",
                    variant: "primary",
                    onClick: handleEditToggle,
                  },
                ]}
              />
            )}

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
                    value: new Date(
                      settlementNote.createdAt
                    ).toLocaleDateString("fr-FR"),
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

              <DataCard
                title="Informations générales"
                fields={fieldConfig.general.map((field) => ({
                  key: field.key,
                  label: field.label,
                  value: isEditing
                    ? getFieldValue(editedData, field.field)
                    : getDisplayValue(settlementNote, field.field),
                  type: field.type as
                    | "text"
                    | "email"
                    | "tel"
                    | "number"
                    | "date"
                    | "textarea"
                    | "select",
                  required: (field as any).required || false,
                  placeholder: field.placeholder,
                  options: (field as any).options || undefined,
                }))}
                isEditing={isEditing}
                onChange={(key, value) => {
                  const field = fieldConfig.general.find((f) => f.key === key);
                  if (field) handleInputChange(field.field, value);
                }}
                errors={validationErrors}
              />

              <DataCard
                title="Détails du cours"
                fields={fieldConfig.course.map((field) => ({
                  key: field.key,
                  label: field.label,
                  value: isEditing
                    ? getFieldValue(editedData, field.field)
                    : getDisplayValue(settlementNote, field.field),
                  type: field.type as
                    | "text"
                    | "email"
                    | "tel"
                    | "number"
                    | "date"
                    | "textarea"
                    | "select",
                  required: (field as any).required || false,
                  placeholder: field.placeholder,
                  readOnly: (field as any).readOnly || false,
                }))}
                isEditing={isEditing}
                onChange={(key, value) => {
                  const field = fieldConfig.course.find((f) => f.key === key);
                  if (field && !(field as any).readOnly)
                    handleInputChange(field.field, value);
                }}
                errors={validationErrors}
              />

              <DataCard
                title="Détails financiers"
                fields={fieldConfig.financial.map((field) => ({
                  key: field.key,
                  label: field.label,
                  value: isEditing
                    ? getFieldValue(editedData, field.field)
                    : getDisplayValue(settlementNote, field.field),
                  type: field.type as
                    | "text"
                    | "email"
                    | "tel"
                    | "number"
                    | "date"
                    | "textarea"
                    | "select",
                  required: (field as any).required || false,
                  placeholder: field.placeholder,
                  readOnly: (field as any).readOnly || false,
                }))}
                isEditing={isEditing}
                onChange={(key, value) => {
                  const field = fieldConfig.financial.find(
                    (f) => f.key === key
                  );
                  if (field && !(field as any).readOnly)
                    handleInputChange(field.field, value);
                }}
                errors={validationErrors}
              />

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
                      <p>
                        {settlementNote.paymentSchedule.numberOfInstallments}
                      </p>
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
              <DataCard
                title="Notes"
                fields={fieldConfig.notes.map((field) => ({
                  key: field.key,
                  label: field.label,
                  value: isEditing
                    ? getFieldValue(editedData, field.field)
                    : getDisplayValue(settlementNote, field.field),
                  type: field.type as
                    | "text"
                    | "email"
                    | "tel"
                    | "number"
                    | "date"
                    | "textarea"
                    | "select",
                  required: (field as any).required || false,
                  placeholder: field.placeholder,
                }))}
                isEditing={isEditing}
                onChange={(key, value) => {
                  const field = fieldConfig.notes.find((f) => f.key === key);
                  if (field) handleInputChange(field.field, value);
                }}
                errors={validationErrors}
              />

              {/* Génération PDF */}
              <section className="settlement-details__section settlement-details__section--pdf">
                <h2>Génération PDF</h2>
                <PDFGenerator settlementNote={settlementNote} />
              </section>
            </div>
          </>
        )}
      </Container>
    </div>
  );
};
