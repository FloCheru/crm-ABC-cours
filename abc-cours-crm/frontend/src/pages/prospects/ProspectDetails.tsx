import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Navbar,
  Button,
  ButtonGroup,
  Input,
  StatusBanner,
} from "../../components";
import { familyService } from "../../services/familyService";
import type { Family } from "../../types/family";
import type { ProspectStatus } from "../../components/StatusDot";
import "./ProspectDetails.css";


const statusOptions = [
  { value: "en_reflexion", label: "En réflexion" },
  { value: "interesse_prof_a_trouver", label: "Intéressé - Prof à trouver" },
  { value: "injoignable", label: "Injoignable" },
  { value: "ndr_editee", label: "NDR éditée" },
  { value: "premier_cours_effectue", label: "Premier cours effectué" },
  { value: "rdv_prospect", label: "RDV prospect" },
  { value: "ne_va_pas_convertir", label: "Ne va pas convertir" },
];

export const ProspectDetails: React.FC = () => {
  const { familyId } = useParams<{ familyId: string }>();
  const navigate = useNavigate();
  const [prospect, setProspect] = useState<Family | null>(null);
  const [error, setError] = useState<string>("");

  // States pour le mode édition
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<Family>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    const loadProspectDetails = async () => {
      if (!familyId) {
        setError("ID du prospect manquant");
        return;
      }

      try {
        const data = await familyService.getFamily(familyId);
        setProspect(data);
      } catch (err) {
        console.error("Erreur lors du chargement du prospect:", err);
        setError("Impossible de charger les détails du prospect");
      }
    };

    loadProspectDetails();
  }, [familyId]);

  const handleBack = () => {
    navigate("/prospects");
  };

  const handleCreateNDR = () => {
    if (prospect?._id) {
      navigate(`/admin/dashboard/create/wizard?familyId=${prospect._id}`);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Annuler les modifications
      setEditedData({});
      setValidationErrors({});
      setIsEditing(false);
    } else {
      // Entrer en mode édition
      setEditedData({
        primaryContact: { ...prospect!.primaryContact },
        address: { ...prospect!.address },
        demande: { ...prospect!.demande },
        plannedTeacher: prospect?.plannedTeacher || "",
        prospectStatus: prospect?.prospectStatus || null,
        nextActionReminderSubject: prospect?.nextActionReminderSubject || "",
        nextActionDate: prospect?.nextActionDate || null,
      });
      setIsEditing(true);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    // Validation des champs obligatoires
    if (!editedData.primaryContact?.firstName?.trim()) {
      errors.firstName = "Le prénom est requis";
    }
    if (!editedData.primaryContact?.lastName?.trim()) {
      errors.lastName = "Le nom est requis";
    }
    if (!editedData.primaryContact?.email?.trim()) {
      errors.email = "L'email est requis";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editedData.primaryContact.email)
    ) {
      errors.email = "Format d'email invalide";
    }
    if (!editedData.primaryContact?.primaryPhone?.trim()) {
      errors.primaryPhone = "Le téléphone principal est requis";
    }
    if (!editedData.address?.street?.trim()) {
      errors.street = "La rue est requise";
    }
    if (!editedData.address?.city?.trim()) {
      errors.city = "La ville est requise";
    }
    if (!editedData.address?.postalCode?.trim()) {
      errors.postalCode = "Le code postal est requis";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);
      const updatedProspect = await familyService.updateFamily(
        familyId!,
        editedData
      );
      setProspect(updatedProspect);
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
    // Gestion spéciale pour les matières - conversion chaîne vers tableau
    if (field === "demande.subjects") {
      value = value ? value.split(",").map((s: string) => s.trim()).filter((s: string) => s.length > 0) : [];
    }
    
    const fieldParts = field.split(".");
    if (fieldParts.length === 1) {
      setEditedData((prev) => ({ ...prev, [field]: value }));
    } else if (fieldParts.length === 2) {
      const [parent, child] = fieldParts;
      setEditedData((prev) => ({
        ...prev,
        [parent]: {
          ...((prev[parent as keyof Family] as Record<string, any>) || {}),
          [child]: value,
        },
      }));
    }
  };

  if (error || !prospect) {
    return (
      <div className="prospect-details">
        <Navbar activePath="/prospects" />
        <div className="prospect-details__error">
          <h2>Erreur</h2>
          <p>{error || "Prospect non trouvé"}</p>
          <Button variant="primary" onClick={handleBack}>
            Retour aux prospects
          </Button>
        </div>
      </div>
    );
  }

  const students = prospect.students || [];

  // Configuration des champs pour le mapping
  const fieldConfig = {
    personal: [
      { key: "firstName", label: "Prénom", field: "primaryContact.firstName", type: "text", placeholder: "Prénom", required: true },
      { key: "lastName", label: "Nom", field: "primaryContact.lastName", type: "text", placeholder: "Nom", required: true },
      { key: "primaryPhone", label: "Téléphone principal", field: "primaryContact.primaryPhone", type: "tel", placeholder: "06 12 34 56 78", required: true },
      { key: "secondaryPhone", label: "Téléphone secondaire", field: "primaryContact.secondaryPhone", type: "tel", placeholder: "06 12 34 56 78", required: false },
      { key: "email", label: "Email", field: "primaryContact.email", type: "email", placeholder: "email@exemple.com", required: true }
    ],
    address: [
      { key: "street", label: "Rue", field: "address.street", type: "text", placeholder: "Adresse", required: true },
      { key: "city", label: "Ville", field: "address.city", type: "text", placeholder: "Ville", required: true },
      { key: "postalCode", label: "Code postal", field: "address.postalCode", type: "text", placeholder: "Code postal", required: true }
    ],
    course: [
      { key: "plannedTeacher", label: "Professeur prévu", field: "plannedTeacher", type: "text", placeholder: "Nom du professeur", required: false },
      { key: "beneficiaryType", label: "Type de bénéficiaire", field: "demande.beneficiaryType", type: "text", placeholder: "Type de bénéficiaire", required: false },
      { key: "subjects", label: "Matières demandées", field: "demande.subjects", type: "textarea", placeholder: "Matières séparées par des virgules", required: false }
    ],
    tracking: [
      { key: "nextActionReminderSubject", label: "Objet de rappel", field: "nextActionReminderSubject", type: "text", placeholder: "Objet de rappel", required: false },
      { key: "nextActionDate", label: "Date de rappel", field: "nextActionDate", type: "date", placeholder: "", required: false }
    ]
  };

  const getFieldValue = (field: any, path: string) => {
    const keys = path.split('.');
    let value = keys.length === 1 ? field : field?.[keys[0]]?.[keys[1]];
    
    // Gestion spéciale pour les tableaux (comme subjects)
    if (path === "demande.subjects" && Array.isArray(value)) {
      return value.join(", ");
    }
    
    return value || "";
  };

  const getDisplayValue = (prospect: Family, path: string) => {
    const keys = path.split('.');
    let value: any = keys.length === 1 ? prospect[path as keyof Family] : (prospect as any)[keys[0]]?.[keys[1]];
    
    if (path === "nextActionDate" && value) {
      return new Date(value).toLocaleDateString("fr-FR");
    }
    
    // Gestion spéciale pour les tableaux (comme subjects)
    if (path === "demande.subjects" && Array.isArray(value)) {
      return value.length > 0 ? value.join(", ") : "Non renseignées";
    }
    
    // Gestion spéciale pour plannedTeacher - peut être string ou objet
    if (path === "plannedTeacher") {
      if (!value) return "Non assigné";
      if (typeof value === 'string') return value;
      if (typeof value === 'object' && 'firstName' in value && 'lastName' in value) {
        return `${(value as any).firstName} ${(value as any).lastName}`;
      }
      return "Non assigné";
    }
    
    // Gestion spéciale pour nextActionReminderSubject - doit être string
    if (path === "nextActionReminderSubject") {
      if (!value) return "Actions à définir";
      if (typeof value === 'string') return value;
      return "Actions à définir";
    }
    
    return value || "Non renseigné";
  };


  return (
    <div className="prospect-details">
      <Navbar activePath="/prospects" />

      <div className="prospect-details__header">
        <h1>Détails du Prospect</h1>
        <div className="prospect-details__header-actions">
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
              variant="triple"
              buttons={[
                {
                  text: "Retour",
                  variant: "outline",
                  onClick: handleBack,
                },
                {
                  text: "Modifier",
                  variant: "secondary",
                  onClick: handleEditToggle,
                },
                {
                  text: "Créer NDR",
                  variant: "primary",
                  onClick: handleCreateNDR,
                },
              ]}
            />
          )}
        </div>
      </div>

      {/* Bandeau de statut avec couleurs cohérentes */}
      <StatusBanner status={prospect.prospectStatus as ProspectStatus} />

      <div className="prospect-details__content">

        {/* Informations personnelles */}
        <div className="prospect-details__section prospect-details__section--primary-contact">
          <h2>Informations personnelles</h2>
          <div className="prospect-details__grid">
            {fieldConfig.personal.map((field) => (
              <div key={field.key} className="prospect-details__field">
                <label>{field.label}</label>
                {isEditing ? (
                  <Input
                    type={field.type}
                    value={getFieldValue(editedData, field.field)}
                    onChange={(e) => handleInputChange(field.field, e.target.value)}
                    error={validationErrors[field.key]}
                    placeholder={field.placeholder}
                  />
                ) : (
                  <p>{getDisplayValue(prospect, field.field)}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Adresse */}
        <div className="prospect-details__section prospect-details__section--address">
          <h2>Adresse</h2>
          <div className="prospect-details__grid">
            {fieldConfig.address.map((field) => (
              <div key={field.key} className="prospect-details__field">
                <label>{field.label}</label>
                {isEditing ? (
                  <Input
                    type={field.type}
                    value={getFieldValue(editedData, field.field)}
                    onChange={(e) => handleInputChange(field.field, e.target.value)}
                    error={validationErrors[field.key]}
                    placeholder={field.placeholder}
                  />
                ) : (
                  <p>{getDisplayValue(prospect, field.field)}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Demande */}
        <div className="prospect-details__section prospect-details__section--course-request">
          <h2>Demande de cours</h2>
          <div className="prospect-details__grid">
            {fieldConfig.course.map((field) => (
              <div key={field.key} className="prospect-details__field">
                <label>{field.label}</label>
                {isEditing ? (
                  field.type === "textarea" ? (
                    <textarea
                      value={Array.isArray(getFieldValue(editedData, field.field)) 
                        ? getFieldValue(editedData, field.field).join(", ")
                        : getFieldValue(editedData, field.field)}
                      onChange={(e) => {
                        const value = e.target.value;
                        const arrayValue = value.split(",").map(s => s.trim()).filter(Boolean);
                        handleInputChange(field.field, arrayValue);
                      }}
                      placeholder={field.placeholder}
                      rows={3}
                      style={{ resize: "vertical", minHeight: "80px" }}
                    />
                  ) : (
                    <Input
                      type={field.type}
                      value={getFieldValue(editedData, field.field)}
                      onChange={(e) => handleInputChange(field.field, e.target.value)}
                      placeholder={field.placeholder}
                    />
                  )
                ) : (
                  <p>{getDisplayValue(prospect, field.field)}</p>
                )}
              </div>
            ))}
            <div className="prospect-details__field">
              <label>Statut prospect</label>
              {isEditing ? (
                <select
                  value={editedData.prospectStatus || ""}
                  onChange={(e) =>
                    handleInputChange("prospectStatus", e.target.value || null)
                  }
                >
                  <option value="">Sélectionner un statut</option>
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <p>{prospect.prospectStatus || "Non défini"}</p>
              )}
            </div>
          </div>
        </div>

        {/* Élèves */}
        <div className="prospect-details__section prospect-details__section--students">
          <h2>Élèves ({students.length})</h2>
          <div className="prospect-details__students">
            {students.length > 0 ? (
              students.map((student, index) => (
                <div key={index} className="prospect-details__student">
                  <h3>
                    {student.firstName} {student.lastName}
                  </h3>
                  <div className="prospect-details__student-info">
                    {student.school?.grade && (
                      <p>Niveau: {student.school.grade}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p>Aucun élève enregistré</p>
            )}
            {isEditing && (
              <Button
                variant="secondary"
                onClick={() => navigate(`/families/${prospect._id}/add-student?returnTo=prospectDetails&familyId=${prospect._id}`)}
              >
                Ajouter un élève
              </Button>
            )}
          </div>
        </div>

        {/* Actions de suivi */}
        <div className="prospect-details__section prospect-details__section--lead-source">
          <h2>Suivi</h2>
          <div className="prospect-details__grid">
            {fieldConfig.tracking.map((field) => (
              <div key={field.key} className="prospect-details__field">
                <label>{field.label}</label>
                {isEditing ? (
                  <Input
                    type={field.type}
                    value={field.type === "date" && editedData[field.field as keyof typeof editedData] 
                      ? new Date(editedData[field.field as keyof typeof editedData] as string).toISOString().split("T")[0]
                      : getFieldValue(editedData, field.field)}
                    onChange={(e) => handleInputChange(field.field, field.type === "date" && e.target.value ? new Date(e.target.value) : e.target.value)}
                    placeholder={field.placeholder}
                  />
                ) : (
                  <p>{getDisplayValue(prospect, field.field)}</p>
                )}
              </div>
            ))}
            <div className="prospect-details__field">
              <label>Date de création</label>
              <p>{new Date(prospect.createdAt).toLocaleDateString("fr-FR")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="prospect-details__actions">
        <ButtonGroup
          variant="double"
          buttons={[
            {
              text: "Créer NDR",
              variant: "primary",
              onClick: handleCreateNDR,
            },
            {
              text: "Retour à la liste",
              variant: "outline",
              onClick: handleBack,
            },
          ]}
        />
      </div>
    </div>
  );
};
