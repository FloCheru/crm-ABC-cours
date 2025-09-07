import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { AddStudentForm, type StudentFormData } from '../../components/forms/AddStudentForm';
import { familyService, type AddStudentData } from '../../services/familyService';
import './AddStudent.css';

const AddStudent: React.FC = () => {
  const { familyId } = useParams<{ familyId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (studentData: StudentFormData) => {
    if (!familyId) {
      setError('ID de famille manquant');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Mapper les données du formulaire vers le format API backend
      const addStudentData: AddStudentData = {
        firstName: studentData.firstName.trim(),
        lastName: studentData.lastName.trim(),
        dateOfBirth: studentData.dateOfBirth, // ISO string format
        school: {
          name: studentData.schoolName.trim(),
          level: mapLevelToBackendFormat(studentData.level.trim()),
          grade: studentData.level.trim(), // Le niveau frontend correspond à la classe
        },
        contact: {
          email: studentData.email.trim() || undefined,
          phone: studentData.phone.trim() || undefined,
        },
        courseLocation: {
          type: "domicile", // Valeur par défaut
        },
        notes: studentData.notes.trim() || undefined,
        status: "active", // Statut par défaut
      };

      // Utiliser la nouvelle API dédiée
      await familyService.addStudent(familyId, addStudentData);

      // Cache mis à jour automatiquement par ActionCache
      console.log('✅ Élève ajouté avec succès - cache mis à jour automatiquement par ActionCache');

      // Redirection selon le contexte de retour
      handleSuccessfulSave();
      
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

  const handleSuccessfulSave = () => {
    switch (returnTo) {
      case 'prospects':
        navigate('/prospects', { 
          state: { 
            message: 'Élève ajouté avec succès',
            type: 'success'
          }
        });
        break;
      case 'wizard':
        // Pour le wizard NDR, on redirige vers l'étape 2 avec l'ID famille
        navigate(`/admin/dashboard/create/step2?familyId=${familyId}`, {
          state: { 
            message: 'Élève ajouté avec succès',
            type: 'success'
          }
        });
        break;
      case 'clients':
        navigate('/clients', { 
          state: { 
            message: 'Élève ajouté avec succès',
            type: 'success'
          }
        });
        break;
      case 'prospectDetails':
        navigate(`/families/${familyId}`, { 
          state: { 
            message: 'Élève ajouté avec succès',
            type: 'success'
          }
        });
        break;
      default:
        // Redirection par défaut vers la page des familles/clients
        navigate('/clients', { 
          state: { 
            message: 'Élève ajouté avec succès',
            type: 'success'
          }
        });
        break;
    }
  };

  const handleCancel = () => {
    switch (returnTo) {
      case 'prospects':
        navigate('/prospects');
        break;
      case 'wizard':
        navigate(`/admin/dashboard/create/step2?familyId=${familyId}`);
        break;
      case 'clients':
        navigate('/clients');
        break;
      default:
        navigate('/clients');
        break;
    }
  };

  if (!familyId) {
    return (
      <div className="add-student-page">
        <div className="add-student-page__container">
          <div className="add-student-page__error">
            <h2>Erreur</h2>
            <p>ID de famille manquant. Impossible d'ajouter un élève.</p>
            <button 
              onClick={() => navigate('/clients')}
              className="add-student-page__button"
            >
              Retour aux clients
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="add-student-page">
      <div className="add-student-page__container">
        <div className="add-student-page__header">
          <div className="add-student-page__breadcrumb">
            <span className="add-student-page__breadcrumb-item">
              {returnTo === 'prospects' ? 'Prospects' : 
               returnTo === 'wizard' ? 'Création NDR' : 'Clients'}
            </span>
            <span className="add-student-page__breadcrumb-separator">›</span>
            <span className="add-student-page__breadcrumb-current">
              Ajouter un élève
            </span>
          </div>
        </div>

        {error && (
          <div className="add-student-page__error-banner">
            <strong>Erreur :</strong> {error}
          </div>
        )}

        <div className="add-student-page__form-container">
          <AddStudentForm
            onSave={handleSave}
            onCancel={handleCancel}
            familyId={familyId}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default AddStudent;