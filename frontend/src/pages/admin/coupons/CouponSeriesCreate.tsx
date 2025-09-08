// import { ArrowLeft } from "lucide-react"; // Non utilisé après migration vers PageHeader
import { useState } from "react";
import {
  Container,
  Button,
  Navbar,
  PageHeader,
  Input,
  Select,
  ButtonGroup,
} from "../../../components";
import { useLocation, useNavigate } from "react-router-dom";
import { useCouponSeriesForm } from "../../../hooks/useCouponSeriesForm";
import { couponSeriesService } from "../../../services/couponSeriesService";
import { logger } from "../../../utils/logger";

export function CouponSeriesCreate() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>("");

  const {
    formData,
    families,
    students,
    subjects,
    selectedFamily,
    selectedStudent,
    selectedSubject,
    isLoading,
    errors,
    totalAmount,
    updateFormData,
    validateForm,
    resetForm,
  } = useCouponSeriesForm();

  // const handleBackToCoupons = () => {
  //   navigate("/admin/coupons");
  // }; // Non utilisé après migration vers PageHeader

  const handleCreateSeries = async () => {
    logger.debug("Validation du formulaire:", validateForm());
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      await couponSeriesService.createCouponSeries({
        familyId: formData.familyId,
        studentId: formData.studentId,
        subject: formData.subject,
        hourlyRate: formData.hourlyRate,
        totalCoupons: formData.totalCoupons,
        notes: formData.notes,
        autoAssignTeacher: formData.autoAssignTeacher,
        sendNotification: formData.sendNotification,
      });

      // Rediriger vers la liste des coupons avec un message de succès
      navigate("/admin/coupons", {
        state: { message: "Série de coupons créée avec succès" },
      });
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Erreur lors de la création"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    setSubmitError("");

    try {
      await couponSeriesService.createCouponSeries({
        familyId: formData.familyId,
        studentId: formData.studentId,
        subject: formData.subject,
        hourlyRate: formData.hourlyRate,
        totalCoupons: formData.totalCoupons,
        notes: formData.notes,
        autoAssignTeacher: formData.autoAssignTeacher,
        sendNotification: formData.sendNotification,
      });

      navigate("/admin/coupons", {
        state: { message: "Brouillon enregistré avec succès" },
      });
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Erreur lors de l'enregistrement"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (
      window.confirm(
        "Êtes-vous sûr de vouloir annuler ? Toutes les données seront perdues."
      )
    ) {
      resetForm();
      navigate("/admin/coupons");
    }
  };

  const summaryItems = [
    {
      label: "Nom de la série :",
      value:
        selectedFamily && selectedStudent
          ? `${selectedFamily.primaryContact.firstName}_${selectedFamily.primaryContact.lastName}_${
              selectedStudent.firstName
            }_${new Date().getFullYear()}`
          : "À définir",
    },
    {
      label: "Famille :",
      value: selectedFamily ? `${selectedFamily.primaryContact.firstName} ${selectedFamily.primaryContact.lastName}` : "À sélectionner",
    },
    {
      label: "Élève :",
      value: selectedStudent
        ? `${selectedStudent.firstName} ${selectedStudent.lastName} (${selectedStudent.school.level})`
        : "À sélectionner",
    },
    {
      label: "Matière :",
      value: selectedSubject ? selectedSubject.name : "À sélectionner",
    },
    {
      label: "Nombre de coupons :",
      value:
        formData.totalCoupons > 0
          ? `${formData.totalCoupons} coupons`
          : "À définir",
    },
    {
      label: "Tarif unitaire :",
      value:
        formData.hourlyRate > 0
          ? `${formData.hourlyRate.toFixed(2)} € / heure`
          : "À définir",
    },
  ];

  return (
    <div>
      <Navbar activePath={location.pathname} />
      <PageHeader 
        title="Créer une nouvelle série de coupons"
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Liste des séries de coupons", href: "/admin/coupons" },
          { label: "Création d'une nouvelle liste" }
        ]}
        backButton={{ label: "Retour aux séries", href: "/admin/coupons" }}
      />

      <Container layout="flex-col" padding="lg">

        {isLoading ? (
          <div>Chargement...</div>
        ) : (
          <>
            {submitError && (
              <div style={{ color: "red", marginBottom: "16px" }}>
                {submitError}
              </div>
            )}

            {/* Layout deux colonnes */}
            <Container layout="two-columns" padding="none">
              {/* Colonne gauche */}
              <Container
                layout="flex-col"
                padding="lg"
              >
                <h2>Informations générales</h2>
                <Container padding="none">
                  <Select
                    label="Famille / Parent"
                    helpText="Famille bénéficiaire des coupons"
                    required
                    value={formData.familyId}
                    onChange={(e) => updateFormData("familyId", e.target.value)}
                    error={errors.familyId}
                    options={[
                      { value: "", label: "Sélectionner une famille" },
                      ...(families || []).map((family) => ({
                        value: family._id,
                        label: `${family.primaryContact.firstName} ${family.primaryContact.lastName}`,
                      })),
                    ]}
                  />
                  <Select
                    label="Élève concerné"
                    required
                    value={formData.studentId}
                    onChange={(e) =>
                      updateFormData("studentId", e.target.value)
                    }
                    error={errors.studentId}
                    disabled={!formData.familyId}
                    options={[
                      { value: "", label: "Sélectionner un élève" },
                      ...(students || []).map((student) => ({
                        value: student._id,
                        label: `${student.firstName} ${student.lastName} (${student.school.level})`,
                      })),
                    ]}
                  />
                </Container>
                <h2>Options avancées</h2>
                <Container padding="none">
                  <Input
                    label="Notes et commentaires"
                    type="textarea"
                    helpText="Commentaires internes (optionnel)"
                    value={formData.notes}
                    onChange={(e) => updateFormData("notes", e.target.value)}
                  />
                </Container>
                <Container>
                  <input
                    type="checkbox"
                    checked={formData.autoAssignTeacher}
                    onChange={(e) =>
                      updateFormData("autoAssignTeacher", e.target.checked)
                    }
                  />
                  <label>
                    Assigner automatiquement un professeur disponible
                  </label>
                </Container>
                <Container>
                  <input
                    type="checkbox"
                    checked={formData.sendNotification}
                    onChange={(e) =>
                      updateFormData("sendNotification", e.target.checked)
                    }
                  />
                  <label>Envoyer une notification à la famille</label>
                </Container>
              </Container>

              {/* Colonne droite */}
              <Container
                layout="flex-col"
                padding="lg"
              >
                <h2>Matière et tarification</h2>
                <Container padding="none">
                  <Select
                    label="Matière"
                    required
                    value={formData.subject}
                    onChange={(e) => updateFormData("subject", e.target.value)}
                    error={errors.subject}
                    options={[
                      { value: "", label: "Sélectionner une matière" },
                      ...(subjects || []).map((subject) => ({
                        value: subject._id,
                        label: subject.name,
                      })),
                    ]}
                  />
                  <Input
                    label="Tarif horaire"
                    required
                    type="number"
                    value={formData.hourlyRate}
                    onChange={(e) =>
                      updateFormData(
                        "hourlyRate",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    error={errors.hourlyRate}
                    min="0"
                    step="0.01"
                  />
                </Container>
                <Input
                  label="Nombre de coupons"
                  required
                  type="number"
                  value={formData.totalCoupons}
                  onChange={(e) =>
                    updateFormData(
                      "totalCoupons",
                      parseInt(e.target.value) || 0
                    )
                  }
                  error={errors.totalCoupons}
                  min="1"
                />
                <div className="summary-preview">
                  <h3>Aperçu de la série</h3>
                  <div>
                    {summaryItems.map((item, index) => (
                      <div
                        key={index}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "8px",
                        }}
                      >
                        <span>{item.label}</span>
                        <span>{item.value}</span>
                      </div>
                    ))}
                    <hr style={{ margin: "16px 0" }} />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontWeight: "bold",
                      }}
                    >
                      <span>Total :</span>
                      <span>{totalAmount.toFixed(2)} €</span>
                    </div>
                  </div>
                </div>
                {/* Actions du formulaire */}
                <Container layout="flex" padding="none">
                  <Button
                    variant="outline"
                    onClick={handleSaveDraft}
                    disabled={isSubmitting}
                  >
                    Enregistrer le brouillon
                  </Button>
                  <ButtonGroup
                    variant="double"
                    buttons={[
                      {
                        text: "Annuler",
                        variant: "secondary",
                        onClick: handleCancel,
                      },
                      {
                        text: "Créer la série",
                        variant: "primary",
                        onClick: handleCreateSeries,
                        disabled: isSubmitting,
                      },
                    ]}
                  />
                </Container>
              </Container>
            </Container>
          </>
        )}
      </Container>
    </div>
  );
}
