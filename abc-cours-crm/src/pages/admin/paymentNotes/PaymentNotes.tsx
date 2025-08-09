import React, { useState, useEffect } from "react";
import { Container } from "../../../components/container/Container";
import { FormCard } from "../../../components/form/formcard/FormCard";
import { Input } from "../../../components/form/input/Input";
import { Select } from "../../../components/form/select/Select";
import { Button } from "../../../components/button/Button";
import { Table } from "../../../components/table/Table";
import { paymentNoteService } from "../../../services/paymentNoteService";
import { familyService } from "../../../services/familyService";
import { subjectService } from "../../../services/subjectService";
import type {
  PaymentNote,
  PaymentNoteFormData,
} from "../../../types/paymentNote";
import type { Family } from "../../../types/family";
import type { Subject } from "../../../types/subject";
import "./PaymentNotes.css";

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  family: string;
  school: {
    level: string;
    grade: string;
  };
}

interface Professor {
  _id: string;
  user: {
    firstName: string;
    lastName: string;
  };
  subjects: Array<{
    name: string;
  }>;
}

interface CouponSeries {
  _id: string;
  name: string;
  totalAmount: number;
  family: string;
  student: string;
  subject: string;
  professor: string;
}

const PaymentNotes: React.FC = () => {
  const [paymentNotes, setPaymentNotes] = useState<PaymentNote[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [couponSeries, setCouponSeries] = useState<CouponSeries[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<PaymentNoteFormData>({
    family: "",
    student: "",
    subject: "",
    studentLevel: "collège",
    couponSeries: "",
    professor: "",
    amount: 0,
    paymentMethod: "transfer",
    notes: "",
    paymentReference: "",
  });

  // Charger les données initiales
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [paymentNotesData, familiesData, subjectsData] = await Promise.all([
        paymentNoteService.getAllPaymentNotes(),
        familyService.getFamilies(),
        subjectService.getSubjects(),
      ]);

      setPaymentNotes(paymentNotesData);
      setFamilies(familiesData);
      setSubjects(subjectsData);
    } catch (err) {
      setError("Erreur lors du chargement des données");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Charger les étudiants quand une famille est sélectionnée
  useEffect(() => {
    if (formData.family) {
      loadStudentsByFamily(formData.family);
    } else {
      setStudents([]);
      setFormData((prev) => ({ ...prev, student: "" }));
    }
  }, [formData.family]);

  // Charger les séries de coupons quand un élève et une matière sont sélectionnés
  useEffect(() => {
    if (formData.student && formData.subject) {
      loadCouponSeries(formData.student, formData.subject);
    } else {
      setCouponSeries([]);
      setFormData((prev) => ({ ...prev, couponSeries: "" }));
    }
  }, [formData.student, formData.subject]);

  // Charger les professeurs quand une matière est sélectionnée
  useEffect(() => {
    if (formData.subject) {
      loadProfessorsBySubject(formData.subject);
    } else {
      setProfessors([]);
      setFormData((prev) => ({ ...prev, professor: "" }));
    }
  }, [formData.subject]);

  const loadStudentsByFamily = async (familyId: string) => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3000/api"
        }/students/families/${familyId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.ok) {
        const studentsData = await response.json();
        setStudents(studentsData);
      }
    } catch (err) {
      console.error("Erreur lors du chargement des étudiants:", err);
    }
  };

  const loadCouponSeries = async (studentId: string, subjectId: string) => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3000/api"
        }/coupon-series/student/${studentId}/subject/${subjectId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.ok) {
        const seriesData = await response.json();
        setCouponSeries(seriesData);
      }
    } catch (err) {
      console.error("Erreur lors du chargement des séries de coupons:", err);
    }
  };

  const loadProfessorsBySubject = async (subjectId: string) => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3000/api"
        }/professors/subject/${subjectId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.ok) {
        const professorsData = await response.json();
        setProfessors(professorsData);
      }
    } catch (err) {
      console.error("Erreur lors du chargement des professeurs:", err);
    }
  };

  const handleInputChange = (
    field: keyof PaymentNoteFormData,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const newPaymentNote = await paymentNoteService.createPaymentNote({
        ...formData,
        amount: Number(formData.amount),
      });

      setPaymentNotes((prev) => [newPaymentNote, ...prev]);

      // Réinitialiser le formulaire
      setFormData({
        family: "",
        student: "",
        subject: "",
        studentLevel: "collège",
        couponSeries: "",
        professor: "",
        amount: 0,
        paymentMethod: "transfer",
        notes: "",
        paymentReference: "",
      });

      alert("Note de règlement créée avec succès !");
    } catch (err) {
      setError("Erreur lors de la création de la note de règlement");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    try {
      const updatedNote = await paymentNoteService.markAsPaid(id);
      setPaymentNotes((prev) =>
        prev.map((note) => (note._id === id ? updatedNote : note))
      );
      alert("Note marquée comme payée !");
    } catch (err) {
      setError("Erreur lors du marquage comme payé");
      console.error(err);
    }
  };

  const handleCancel = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir annuler cette note de règlement ?")) {
      try {
        const updatedNote = await paymentNoteService.cancelPaymentNote(id);
        setPaymentNotes((prev) =>
          prev.map((note) => (note._id === id ? updatedNote : note))
        );
        alert("Note annulée !");
      } catch (err) {
        setError("Erreur lors de l'annulation");
        console.error(err);
      }
    }
  };

  const handleDownloadPDF = async (id: string) => {
    try {
      await paymentNoteService.downloadPDF(id);
    } catch (err) {
      setError("Erreur lors du téléchargement du PDF");
      console.error(err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR");
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      pending: "status-pending",
      paid: "status-paid",
      cancelled: "status-cancelled",
    };
    return (
      <span
        className={`status-badge ${
          statusClasses[status as keyof typeof statusClasses]
        }`}
      >
        {status === "pending"
          ? "En attente"
          : status === "paid"
          ? "Payé"
          : "Annulé"}
      </span>
    );
  };

  const tableColumns = [
    { key: "entryDate", label: "Date de saisie" },
    { key: "family", label: "Famille" },
    { key: "student", label: "Élève" },
    { key: "subject", label: "Matière" },
    { key: "studentLevel", label: "Niveau" },
    { key: "couponSeries", label: "Série de coupons" },
    { key: "professor", label: "Professeur" },
    { key: "amount", label: "Montant" },
    { key: "paymentMethod", label: "Méthode" },
    { key: "status", label: "Statut" },
    { key: "actions", label: "Actions" },
  ];

  const tableData = paymentNotes.map((note) => ({
    id: note._id,
    entryDate: formatDate(note.entryDate),
    family: note.family.name,
    student: `${note.student.firstName} ${note.student.lastName}`,
    subject: note.subject.name,
    studentLevel: note.studentLevel,
    couponSeries: note.couponSeries.name,
    professor: `${note.professor.user.firstName} ${note.professor.user.lastName}`,
    amount: formatAmount(note.amount),
    paymentMethod:
      note.paymentMethod === "check"
        ? "Chèque"
        : note.paymentMethod === "transfer"
        ? "Virement"
        : note.paymentMethod === "card"
        ? "Carte"
        : "Espèces",
    status: getStatusBadge(note.status),
    actions: (
      <div className="action-buttons">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleDownloadPDF(note._id)}
        >
          Télécharger PDF
        </Button>
        {note.status === "pending" && (
          <>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleMarkAsPaid(note._id)}
            >
              Marquer payé
            </Button>
            <Button
              variant="error"
              size="sm"
              onClick={() => handleCancel(note._id)}
            >
              Annuler
            </Button>
          </>
        )}
      </div>
    ),
  }));

  if (loading && paymentNotes.length === 0) {
    return (
      <Container>
        <div className="loading">Chargement...</div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="payment-notes-page">
        <h1>Notes de Règlement</h1>

        {error && <div className="error-message">{error}</div>}

        <FormCard title="Nouvelle Note de Règlement">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-section">
                <h3>Informations Famille et Élève</h3>

                <Select
                  label="Famille "
                  value={formData.family}
                  onChange={(e) => handleInputChange("family", e.target.value)}
                  required
                  options={[
                    { value: "", label: "Sélectionner une famille" },
                    ...families.map((family) => ({
                      value: family._id,
                      label: family.name,
                    })),
                  ]}
                />

                <Select
                  label="Élève "
                  value={formData.student}
                  onChange={(e) => handleInputChange("student", e.target.value)}
                  required
                  disabled={!formData.family}
                  options={[
                    { value: "", label: "Sélectionner un élève" },
                    ...students.map((student) => ({
                      value: student._id,
                      label: `${student.firstName} ${student.lastName} - ${student.school.level} ${student.school.grade}`,
                    })),
                  ]}
                />

                <Select
                  label="Niveau de l'élève "
                  value={formData.studentLevel}
                  onChange={(e) =>
                    handleInputChange("studentLevel", e.target.value)
                  }
                  required
                  options={[
                    { value: "primaire", label: "Primaire" },
                    { value: "collège", label: "Collège" },
                    { value: "lycée", label: "Lycée" },
                    { value: "supérieur", label: "Supérieur" },
                  ]}
                />
              </div>

              <div className="form-section">
                <h3>Informations Cours</h3>

                <Select
                  label="Matière "
                  value={formData.subject}
                  onChange={(e) => handleInputChange("subject", e.target.value)}
                  required
                  options={[
                    { value: "", label: "Sélectionner une matière" },
                    ...subjects.map((subject) => ({
                      value: subject._id,
                      label: subject.name,
                    })),
                  ]}
                />

                <Select
                  label="Série de Coupons "
                  value={formData.couponSeries}
                  onChange={(e) =>
                    handleInputChange("couponSeries", e.target.value)
                  }
                  required
                  disabled={!formData.student || !formData.subject}
                  options={[
                    { value: "", label: "Sélectionner une série" },
                    ...couponSeries.map((series) => ({
                      value: series._id,
                      label: `${series.name} - ${formatAmount(
                        series.totalAmount
                      )}`,
                    })),
                  ]}
                />

                <Select
                  label="Professeur "
                  value={formData.professor}
                  onChange={(e) =>
                    handleInputChange("professor", e.target.value)
                  }
                  required
                  disabled={!formData.subject}
                  options={[
                    { value: "", label: "Sélectionner un professeur" },
                    ...professors.map((professor) => ({
                      value: professor._id,
                      label: `${professor.user.firstName} ${professor.user.lastName}`,
                    })),
                  ]}
                />
              </div>

              <div className="form-section">
                <h3>Informations Paiement</h3>

                <Input
                  type="number"
                  label="Montant (€) "
                  value={formData.amount.toString()}
                  onChange={(e) =>
                    handleInputChange("amount", Number(e.target.value))
                  }
                  required
                  min="0"
                  step="0.01"
                />

                <Select
                  label="Méthode de Paiement "
                  value={formData.paymentMethod}
                  onChange={(e) =>
                    handleInputChange("paymentMethod", e.target.value)
                  }
                  required
                  options={[
                    { value: "check", label: "Chèque" },
                    { value: "transfer", label: "Virement" },
                    { value: "card", label: "Carte bancaire" },
                    { value: "cash", label: "Espèces" },
                  ]}
                />

                <Input
                  type="text"
                  label="Référence de Paiement"
                  value={formData.paymentReference}
                  onChange={(e) =>
                    handleInputChange("paymentReference", e.target.value)
                  }
                  placeholder="Numéro de chèque, référence virement..."
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Notes et Commentaires</h3>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Notes additionnelles..."
                rows={3}
                className="notes-textarea"
              />
            </div>

            <div className="form-actions">
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? "Création..." : "Créer la Note de Règlement"}
              </Button>
            </div>
          </form>
        </FormCard>

        <div className="payment-notes-list">
          <h2>Notes de Règlement Existantes</h2>
          {paymentNotes.length > 0 ? (
            <Table columns={tableColumns} data={tableData} />
          ) : (
            <p>Aucune note de règlement trouvée.</p>
          )}
        </div>
      </div>
    </Container>
  );
};

export default PaymentNotes;
