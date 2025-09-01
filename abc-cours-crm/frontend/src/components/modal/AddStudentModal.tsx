import React, { useState } from 'react';
import { Button, Input } from '../../components';
import { familyService, type AddStudentData } from '../../services/familyService';
import { useCacheInvalidation } from '../../hooks/useCacheInvalidation';
import '../../pages/admin/dashboard/create/Step2StudentsSubjects.css';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  familyId: string;
  onSuccess?: () => void;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen,
  onClose,
  familyId,
  onSuccess
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { invalidateAllFamilyRelatedCaches } = useCacheInvalidation();
  
  // États du formulaire
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    level: "",
    dateOfBirth: "",
    street: "",
    postalCode: "",
    city: "",
    schoolName: "",
    schoolAddress: "",
    email: "",
    phone: "",
    courseLocation: "domicile",
    notes: "",
  });

  const handleFieldChange = (field: string, value: string) => {
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
    
    setIsLoading(true);
    setError(null);

    try {
      // Mapper les données du formulaire vers le format API backend
      const addStudentData: AddStudentData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        dateOfBirth: formData.dateOfBirth, // ISO string format
        school: {
          name: formData.schoolName.trim(),
          level: mapLevelToBackendFormat(formData.level.trim()),
          grade: formData.level.trim(), // Le niveau frontend correspond à la classe
        },
        contact: {
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim() || undefined,
        },
        courseLocation: {
          type: formData.courseLocation as "domicile" | "professeur" | "autre",
          address: formData.street.trim() && formData.city.trim() && formData.postalCode.trim() ? {
            street: formData.street.trim(),
            city: formData.city.trim(),
            postalCode: formData.postalCode.trim(),
          } : undefined,
        },
        notes: formData.notes.trim() || undefined,
        status: "active", // Statut par défaut
      };

      // Utiliser la nouvelle API dédiée
      await familyService.addStudent(familyId, addStudentData);

      // Invalider le cache des familles pour rafraîchir automatiquement
      invalidateAllFamilyRelatedCaches();
      console.log('✅ Cache invalidé après ajout d\'élève - rafraîchissement automatique activé');

      // Fermer la modal et appeler le callback de succès
      handleCancel();
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'élève:', error);
      setError('Erreur lors de l\'ajout de l\'élève. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  // Mapper le niveau frontend vers le format backend
  const mapLevelToBackendFormat = (level: string): "primaire" | "college" | "lycee" | "superieur" => {
    const levelLower = level.toLowerCase();
    
    if (['cp', 'ce1', 'ce2', 'cm1', 'cm2'].some(l => levelLower.includes(l))) {
      return "primaire";
    }
    if (['6ème', '6eme', '5ème', '5eme', '4ème', '4eme', '3ème', '3eme'].some(l => levelLower.includes(l))) {
      return "college";
    }
    if (['seconde', '2nde', 'première', '1ère', 'terminale', 'tle'].some(l => levelLower.includes(l))) {
      return "lycee";
    }
    
    // Par défaut, considérer comme collège si aucun mapping trouvé
    return "college";
  };

  const handleFillExample = () => {
    setFormData({
      firstName: "Marie",
      lastName: "Dupont",
      level: "5ème",
      dateOfBirth: "2009-03-15",
      street: "15 rue des Écoles",
      postalCode: "75005",
      city: "Paris",
      schoolName: "Collège Victor Hugo",
      schoolAddress: "12 rue de la République, 75011 Paris",
      email: "marie.dupont@example.com",
      phone: "06 12 34 56 78",
      courseLocation: "domicile",
      notes: "Élève motivée, difficultés en mathématiques"
    });
  };

  const handleCancel = () => {
    setError(null);
    setFormData({
      firstName: "",
      lastName: "",
      level: "",
      dateOfBirth: "",
      street: "",
      postalCode: "",
      city: "",
      schoolName: "",
      schoolAddress: "",
      email: "",
      phone: "",
      courseLocation: "domicile",
      notes: "",
    });
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="step2__modal-overlay" onClick={handleBackdropClick}>
      <div className="step2__modal step2__modal--add-student">
        {/* Header */}
        <div className="step2__modal-header">
          <h3 className="step2__modal-title">Ajouter un nouveau bénéficiaire</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleFillExample}
            className="step2__example-button"
            title="Préremplir avec des données d'exemple"
          >
            📝 Exemple
          </Button>
        </div>

        {/* Content */}
        <div className="step2__modal-content step2__modal-content--scrollable">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              <strong>Erreur :</strong> {error}
            </div>
          )}

          <div className="step2__add-student-form">
            {/* Section 1: Identité */}
            <div className="step2__form-section">
              <h4 className="step2__subsection-title">Identité de l'élève</h4>
              <div className="step2__form-grid">
                <div className="step2__form-field">
                  <label className="step2__form-label">Prénom *</label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) => handleFieldChange("firstName", e.target.value)}
                    placeholder="Prénom de l'élève"
                    required
                  />
                </div>

                <div className="step2__form-field">
                  <label className="step2__form-label">Nom *</label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => handleFieldChange("lastName", e.target.value)}
                    placeholder="Nom de l'élève"
                    required
                  />
                </div>

                <div className="step2__form-field">
                  <label className="step2__form-label">Date de naissance</label>
                  <Input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleFieldChange("dateOfBirth", e.target.value)}
                  />
                </div>

                <div className="step2__form-field">
                  <label className="step2__form-label">Rue</label>
                  <Input
                    value={formData.street}
                    onChange={(e) => handleFieldChange("street", e.target.value)}
                    placeholder="Rue de l'élève"
                  />
                </div>

                <div className="step2__form-field">
                  <label className="step2__form-label">Code postal</label>
                  <Input
                    value={formData.postalCode}
                    onChange={(e) => handleFieldChange("postalCode", e.target.value)}
                    placeholder="Code postal"
                  />
                </div>

                <div className="step2__form-field">
                  <label className="step2__form-label">Ville</label>
                  <Input
                    value={formData.city}
                    onChange={(e) => handleFieldChange("city", e.target.value)}
                    placeholder="Ville de l'élève"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: École */}
            <div className="step2__form-section">
              <h4 className="step2__subsection-title">École</h4>
              <div className="step2__form-grid">
                <div className="step2__form-field">
                  <label className="step2__form-label">Niveau</label>
                  <Input
                    value={formData.level}
                    onChange={(e) => handleFieldChange("level", e.target.value)}
                    placeholder="Ex: CP, 6ème, Terminale S..."
                  />
                </div>

                <div className="step2__form-field step2__form-field--full">
                  <label className="step2__form-label">Nom de l'école</label>
                  <Input
                    value={formData.schoolName}
                    onChange={(e) => handleFieldChange("schoolName", e.target.value)}
                    placeholder="Ex: École Primaire Jean Jaurès, Collège Victor Hugo..."
                  />
                </div>

                <div className="step2__form-field step2__form-field--full">
                  <label className="step2__form-label">Adresse de l'école</label>
                  <Input
                    value={formData.schoolAddress}
                    onChange={(e) => handleFieldChange("schoolAddress", e.target.value)}
                    placeholder="Adresse complète de l'établissement scolaire"
                  />
                </div>

                <div className="step2__form-field">
                  <label className="step2__form-label">Lieu des cours</label>
                  <select
                    value={formData.courseLocation}
                    onChange={(e) => handleFieldChange("courseLocation", e.target.value)}
                    className="step2__form-select"
                  >
                    <option value="domicile">Domicile</option>
                    <option value="professeur">Chez le professeur</option>
                    <option value="autre">Lieu neutre</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Contact personnel */}
            <div className="step2__form-section">
              <h4 className="step2__subsection-title">Contact personnel de l'élève</h4>
              <div className="step2__form-grid">
                <div className="step2__form-field">
                  <label className="step2__form-label">Email de l'élève</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleFieldChange("email", e.target.value)}
                    placeholder="email.eleve@example.com"
                  />
                </div>

                <div className="step2__form-field">
                  <label className="step2__form-label">Téléphone de l'élève</label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleFieldChange("phone", e.target.value)}
                    placeholder="06 12 34 56 78"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Notes */}
            <div className="step2__form-section">
              <h4 className="step2__subsection-title">Notes et observations</h4>
              <div className="step2__form-field step2__form-field--full">
                <label className="step2__form-label">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleFieldChange("notes", e.target.value)}
                  placeholder="Informations complémentaires, besoins particuliers, observations..."
                  className="step2__form-textarea"
                  rows={3}
                />
              </div>
            </div>

            <div className="step2__add-student-note">
              <strong>Note :</strong> L'élève sera automatiquement ajouté à cette famille et sera visible immédiatement dans les listes.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="step2__modal-footer">
          <div className="step2__modal-actions">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
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
    </div>
  );
};