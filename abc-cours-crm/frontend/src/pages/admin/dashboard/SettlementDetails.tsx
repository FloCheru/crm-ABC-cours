import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  Navbar,
  Breadcrumb,
  Container,
  Button,
  ButtonGroup,
  SummaryCard,
  FormCard,
} from "../../../components";
import { PDFGenerator } from "../../../components/pdf/PDFGenerator";
import { settlementService } from "../../../services/settlementService";
import type { SettlementNote } from "../../../services/settlementService";

// Fonctions utilitaires pour extraire les valeurs des subjects
const getSubjectValue = (note: SettlementNote, field: 'hourlyRate' | 'quantity' | 'professorSalary'): number => {
  if (!note.subjects || note.subjects.length === 0) return 0;
  // Pour l'instant, on prend la première matière. Plus tard on pourra gérer plusieurs matières
  return note.subjects[0][field] || 0;
};

const getSubjectName = (note: SettlementNote): string => {
  if (!note.subjects || note.subjects.length === 0) return "N/A";
  const firstSubject = note.subjects[0];
  if (typeof firstSubject.subjectId === 'object') {
    return firstSubject.subjectId.name;
  }
  return "Matière";
};

const getSubjectCategory = (note: SettlementNote): string => {
  if (!note.subjects || note.subjects.length === 0) return "N/A";
  const firstSubject = note.subjects[0];
  if (typeof firstSubject.subjectId === 'object') {
    return firstSubject.subjectId.category;
  }
  return "N/A";
};

export const SettlementDetails: React.FC = () => {
  const { noteId } = useParams<{ noteId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [settlementNote, setSettlementNote] = useState<SettlementNote | null>(null);
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

  const ca = calculateCA(getSubjectValue(settlementNote, 'hourlyRate'), getSubjectValue(settlementNote, 'quantity'));
  const totalSalary = getSubjectValue(settlementNote, 'professorSalary') * getSubjectValue(settlementNote, 'quantity');
  const marge = calculateMarge(
    getSubjectValue(settlementNote, 'hourlyRate'),
    getSubjectValue(settlementNote, 'quantity'),
    getSubjectValue(settlementNote, 'professorSalary')
  );

  return (
    <div>
      <Navbar activePath={location.pathname} />
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Tableau de bord", href: "/admin/dashboard" },
          { label: `NDR ${settlementNote._id.substring(settlementNote._id.length - 8).toUpperCase()}`, href: "" },
        ]}
      />
      <Container layout="flex-col">
        <div className="flex justify-between items-center mb-6">
          <h1>Note de règlement NDR {settlementNote._id.substring(settlementNote._id.length - 8).toUpperCase()}</h1>
          <ButtonGroup
            variant="double"
            buttons={[
              { text: "Retour", variant: "secondary", onClick: handleBack },
              { text: "Modifier", variant: "primary", onClick: handleEdit }
            ]}
          />
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
                value: settlementNote._id.substring(settlementNote._id.length - 8).toUpperCase(),
                label: "N° NDR",
                variant: "primary",
              },
              {
                value: new Date(settlementNote.createdAt).toLocaleDateString("fr-FR"),
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

        {/* Informations générales */}
        <FormCard title="Informations générales">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client (Famille)
              </label>
              <p className="text-sm bg-gray-50 px-3 py-2 rounded">
                {settlementNote.clientName}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Département
              </label>
              <p className="text-sm bg-gray-50 px-3 py-2 rounded">
                {settlementNote.department || "N/A"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <div
                className={`px-2 py-1 rounded border text-xs ${
                  settlementNote.status === "paid"
                    ? "bg-green-100 text-green-800 border-green-200"
                    : settlementNote.status === "overdue"
                    ? "bg-red-100 text-red-800 border-red-200"
                    : "bg-yellow-100 text-yellow-800 border-yellow-200"
                }`}
              >
                {settlementNote.status === "paid"
                  ? "Payé"
                  : settlementNote.status === "overdue"
                  ? "En retard"
                  : "En attente"}
              </div>
            </div>
          </div>
        </FormCard>

        {/* Détails du cours */}
        <FormCard title="Détails du cours">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Matière
              </label>
              <p className="text-sm bg-gray-50 px-3 py-2 rounded">
                {getSubjectName(settlementNote)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catégorie
              </label>
              <p className="text-sm bg-gray-50 px-3 py-2 rounded">
                {getSubjectCategory(settlementNote)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantité (QTé)
              </label>
              <p className="text-sm bg-gray-50 px-3 py-2 rounded">
                {getSubjectValue(settlementNote, 'quantity')}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prix unitaire (PU)
              </label>
              <p className="text-sm bg-gray-50 px-3 py-2 rounded">
                {getSubjectValue(settlementNote, 'hourlyRate').toFixed(2)} €
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mode de paiement
              </label>
              <p className="text-sm bg-gray-50 px-3 py-2 rounded">
                {settlementNote.paymentMethod}
              </p>
            </div>
          </div>
        </FormCard>

        {/* Détails financiers */}
        <FormCard title="Détails financiers">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Salaire professeur (unitaire)
              </label>
              <p className="text-sm bg-gray-50 px-3 py-2 rounded">
                {getSubjectValue(settlementNote, 'professorSalary').toFixed(2)} € / unité
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total salaire professeur
              </label>
              <p className="text-sm bg-gray-50 px-3 py-2 rounded">
                {totalSalary.toFixed(2)} €
              </p>
            </div>
          </div>
        </FormCard>

        {/* Échéancier */}
        {settlementNote.paymentSchedule && (
          <FormCard title="Échéancier de paiement">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mode de règlement
                </label>
                <p className="text-sm bg-gray-50 px-3 py-2 rounded">
                  {settlementNote.paymentSchedule.paymentMethod === "PRLV" ? "Prélèvement" : "Chèque"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre d'échéances
                </label>
                <p className="text-sm bg-gray-50 px-3 py-2 rounded">
                  {settlementNote.paymentSchedule.numberOfInstallments}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jour de {settlementNote.paymentSchedule.paymentMethod === "PRLV" ? "prélèvement" : "remise"}
                </label>
                <p className="text-sm bg-gray-50 px-3 py-2 rounded">
                  Le {settlementNote.paymentSchedule.dayOfMonth} de chaque mois
                </p>
              </div>
            </div>
            
            {settlementNote.paymentSchedule.installments && (
              <div>
                <h3 className="text-md font-medium mb-2">Détail des échéances</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-gray-50 rounded">
                    <thead>
                      <tr className="border-b">
                        <th className="px-4 py-2 text-left text-sm font-medium">Échéance</th>
                        <th className="px-4 py-2 text-left text-sm font-medium">Montant</th>
                        <th className="px-4 py-2 text-left text-sm font-medium">Date d'échéance</th>
                        <th className="px-4 py-2 text-left text-sm font-medium">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {settlementNote.paymentSchedule.installments.map((installment, index) => (
                        <tr key={index} className="border-b last:border-b-0">
                          <td className="px-4 py-2 text-sm">{index + 1}</td>
                          <td className="px-4 py-2 text-sm">{installment.amount.toFixed(2)} €</td>
                          <td className="px-4 py-2 text-sm">
                            {new Date(installment.dueDate).toLocaleDateString("fr-FR")}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            <span className={`px-2 py-1 rounded text-xs ${
                              installment.status === "paid" 
                                ? "bg-green-100 text-green-800"
                                : installment.status === "failed"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}>
                              {installment.status === "paid" ? "Payé" : 
                               installment.status === "failed" ? "Échec" : "En attente"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </FormCard>
        )}

        {/* Notes supplémentaires */}
        {settlementNote.notes && (
          <FormCard title="Notes">
            <p className="text-sm bg-gray-50 px-3 py-2 rounded whitespace-pre-wrap">
              {settlementNote.notes}
            </p>
          </FormCard>
        )}

        {/* Génération PDF */}
        <PDFGenerator settlementNote={settlementNote} />

        {/* Informations de création */}
        <FormCard title="Informations de création">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Créé par
              </label>
              <p className="text-sm bg-gray-50 px-3 py-2 rounded">
                {settlementNote.createdBy?.firstName} {settlementNote.createdBy?.lastName}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dernière modification
              </label>
              <p className="text-sm bg-gray-50 px-3 py-2 rounded">
                {new Date(settlementNote.updatedAt).toLocaleDateString("fr-FR")} à{" "}
                {new Date(settlementNote.updatedAt).toLocaleTimeString("fr-FR", {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </FormCard>
      </Container>
    </div>
  );
};