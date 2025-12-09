// import { ArrowLeft } from "lucide-react"; // Non utilisé après migration vers PageHeader
import { useState } from "react";
import {
  Container,
  Button,
  PageHeader,
  ButtonGroup,
} from "../../../components";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Label } from "../../../components/ui/label";
import { useNavigate } from "react-router-dom";
import { useCouponSeriesForm } from "../../../hooks/useCouponSeriesForm";
import { couponSeriesService } from "../../../services/couponSeriesService";
import { logger } from "../../../utils/logger";

export function CouponSeriesCreate() {
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
        ? `${selectedStudent.firstName} ${selectedStudent.lastName} (${selectedStudent.school.grade})`
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
                  <div className="space-y-2">
                    <Label>Famille / Parent <span className="text-red-500">*</span></Label>
                    <Select
                      value={formData.familyId || "none"}
                      onValueChange={(value) => updateFormData("familyId", value === "none" ? "" : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une famille" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sélectionner une famille</SelectItem>
                        {(families || []).map((family) => (
                          <SelectItem key={family._id} value={family._id}>
                            {family.primaryContact.firstName} {family.primaryContact.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">Famille bénéficiaire des coupons</p>
                    {errors.familyId && <p className="text-sm text-red-500">{errors.familyId}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Élève concerné <span className="text-red-500">*</span></Label>
                    <Select
                      value={formData.studentId || "none"}
                      onValueChange={(value) => updateFormData("studentId", value === "none" ? "" : value)}
                      disabled={!formData.familyId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un élève" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sélectionner un élève</SelectItem>
                        {(students || []).map((student) => (
                          <SelectItem key={student._id} value={student._id}>
                            {student.firstName} {student.lastName} ({student.school.grade})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.studentId && <p className="text-sm text-red-500">{errors.studentId}</p>}
                  </div>
                </Container>
                <h2>Options avancées</h2>
                <Container padding="none">
                  <div className="space-y-2">
                    <Label>Notes et commentaires</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => updateFormData("notes", e.target.value)}
                      placeholder="Commentaires internes (optionnel)"
                    />
                    <p className="text-sm text-muted-foreground">Commentaires internes (optionnel)</p>
                  </div>
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
                  <div className="space-y-2">
                    <Label>Matière <span className="text-red-500">*</span></Label>
                    <Select
                      value={formData.subject || "none"}
                      onValueChange={(value) => updateFormData("subject", value === "none" ? "" : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une matière" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sélectionner une matière</SelectItem>
                        {(subjects || []).map((subject) => (
                          <SelectItem key={subject._id} value={subject._id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.subject && <p className="text-sm text-red-500">{errors.subject}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Tarif horaire <span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      value={formData.hourlyRate}
                      onChange={(e) =>
                        updateFormData(
                          "hourlyRate",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      min={0}
                      step={0.01}
                    />
                    {errors.hourlyRate && <p className="text-sm text-red-500">{errors.hourlyRate}</p>}
                  </div>
                </Container>
                <div className="space-y-2">
                  <Label>Nombre de coupons <span className="text-red-500">*</span></Label>
                  <Input
                    type="number"
                    value={formData.totalCoupons}
                    onChange={(e) =>
                      updateFormData(
                        "totalCoupons",
                        parseInt(e.target.value) || 0
                      )
                    }
                    min={1}
                  />
                  {errors.totalCoupons && <p className="text-sm text-red-500">{errors.totalCoupons}</p>}
                </div>
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
