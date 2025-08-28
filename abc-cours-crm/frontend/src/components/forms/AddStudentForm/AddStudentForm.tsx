import React, { useState } from 'react';
import { Input, Button } from '../..';
import './AddStudentForm.css';

export interface StudentFormData {
  firstName: string;
  lastName: string;
  level: string;
  dateOfBirth: string;
  schoolName: string;
  schoolAddress: string;
  email: string;
  phone: string;
  notes: string;
}

interface AddStudentFormProps {
  onSave: (studentData: StudentFormData) => Promise<void>;
  onCancel: () => void;
  familyId: string;
  isLoading?: boolean;
}

export const AddStudentForm: React.FC<AddStudentFormProps> = ({
  onSave,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<StudentFormData>({
    firstName: "",
    lastName: "",
    level: "",
    dateOfBirth: "",
    schoolName: "",
    schoolAddress: "",
    email: "",
    phone: "",
    notes: "",
  });

  const handleFieldChange = (field: keyof StudentFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    return (
      formData.firstName.trim() !== "" &&
      formData.lastName.trim() !== ""
    );
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    await onSave(formData);
  };

  const handleFillExample = () => {
    setFormData({
      firstName: "Marie",
      lastName: "Dupont",
      level: "5ème",
      dateOfBirth: "2009-03-15",
      schoolName: "Collège Victor Hugo",
      schoolAddress: "12 rue de la République, 75011 Paris",
      email: "marie.dupont@example.com",
      phone: "06 12 34 56 78",
      notes: "Élève motivée, difficultés en mathématiques"
    });

    // Animation visuelle pour indiquer le préremplissage
    const formElement = document.querySelector(".add-student-form");
    if (formElement) {
      formElement.classList.add("add-student-form--filling-example");
      setTimeout(() => {
        formElement.classList.remove("add-student-form--filling-example");
      }, 1000);
    }
  };

  return (
    <div className="add-student-form-container">
      <div className="add-student-form-header">
        <h3 className="add-student-form-title">
          Ajouter un nouveau bénéficiaire
        </h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleFillExample}
          className="add-student-form-example-button"
          title="Préremplir avec des données d'exemple"
        >
          📝 Exemple
        </Button>
      </div>

      <div className="add-student-form-content">
        <div className="add-student-form">
          {/* Section 1: Identité */}
          <div className="add-student-form-section">
            <h4 className="add-student-form-section-title">
              Identité de l'élève
            </h4>
            <div className="add-student-form-grid">
              <div className="add-student-form-field">
                <label
                  htmlFor="student-firstName"
                  className="add-student-form-label"
                >
                  Prénom *
                </label>
                <Input
                  id="student-firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    handleFieldChange("firstName", e.target.value)
                  }
                  placeholder="Prénom de l'élève"
                  required
                />
              </div>

              <div className="add-student-form-field">
                <label
                  htmlFor="student-lastName"
                  className="add-student-form-label"
                >
                  Nom *
                </label>
                <Input
                  id="student-lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    handleFieldChange("lastName", e.target.value)
                  }
                  placeholder="Nom de l'élève"
                  required
                />
              </div>

              <div className="add-student-form-field">
                <label
                  htmlFor="student-dateOfBirth"
                  className="add-student-form-label"
                >
                  Date de naissance
                </label>
                <Input
                  id="student-dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) =>
                    handleFieldChange("dateOfBirth", e.target.value)
                  }
                />
              </div>

              <div className="add-student-form-field">
                <label
                  htmlFor="student-level"
                  className="add-student-form-label"
                >
                  Niveau/Classe
                </label>
                <Input
                  id="student-level"
                  value={formData.level}
                  onChange={(e) =>
                    handleFieldChange("level", e.target.value)
                  }
                  placeholder="Ex: CP, 6ème, Terminale S..."
                />
              </div>
            </div>
          </div>

          {/* Section 2: École */}
          <div className="add-student-form-section">
            <h4 className="add-student-form-section-title">École</h4>
            <div className="add-student-form-grid">
              <div className="add-student-form-field add-student-form-field--full">
                <label
                  htmlFor="student-schoolName"
                  className="add-student-form-label"
                >
                  Nom de l'école
                </label>
                <Input
                  id="student-schoolName"
                  value={formData.schoolName}
                  onChange={(e) =>
                    handleFieldChange("schoolName", e.target.value)
                  }
                  placeholder="Ex: École Primaire Jean Jaurès, Collège Victor Hugo..."
                />
              </div>

              <div className="add-student-form-field add-student-form-field--full">
                <label
                  htmlFor="student-schoolAddress"
                  className="add-student-form-label"
                >
                  Adresse de l'école
                </label>
                <Input
                  id="student-schoolAddress"
                  value={formData.schoolAddress}
                  onChange={(e) =>
                    handleFieldChange("schoolAddress", e.target.value)
                  }
                  placeholder="Adresse complète de l'établissement scolaire"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Contact personnel */}
          <div className="add-student-form-section">
            <h4 className="add-student-form-section-title">
              Contact personnel de l'élève
            </h4>
            <div className="add-student-form-grid">
              <div className="add-student-form-field">
                <label
                  htmlFor="student-email"
                  className="add-student-form-label"
                >
                  Email de l'élève
                </label>
                <Input
                  id="student-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    handleFieldChange("email", e.target.value)
                  }
                  placeholder="email.eleve@example.com"
                />
              </div>

              <div className="add-student-form-field">
                <label
                  htmlFor="student-phone"
                  className="add-student-form-label"
                >
                  Téléphone de l'élève
                </label>
                <Input
                  id="student-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    handleFieldChange("phone", e.target.value)
                  }
                  placeholder="06 12 34 56 78"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Notes */}
          <div className="add-student-form-section">
            <h4 className="add-student-form-section-title">
              Notes et observations
            </h4>
            <div className="add-student-form-field add-student-form-field--full">
              <label
                htmlFor="student-notes"
                className="add-student-form-label"
              >
                Notes
              </label>
              <textarea
                id="student-notes"
                value={formData.notes}
                onChange={(e) =>
                  handleFieldChange("notes", e.target.value)
                }
                placeholder="Informations complémentaires, besoins particuliers, observations..."
                className="add-student-form-textarea"
                rows={3}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="add-student-form-footer">
        <div className="add-student-form-actions">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
            disabled={!validateForm() || isLoading}
          >
            {isLoading ? 'Ajout en cours...' : 'Ajouter l\'élève'}
          </Button>
        </div>
      </div>
    </div>
  );
};