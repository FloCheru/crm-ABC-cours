import { useState } from "react";
import { familyService } from "../services/familyService";

/**
 * Hook personnalisé pour gérer l'ajout d'élèves
 * Factorise la logique commune entre Prospects et ProspectDetails
 */
export const useStudentModal = () => {
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [selectedFamilyForStudent, setSelectedFamilyForStudent] = useState<string | null>(null);

  /**
   * Ouvre la modal d'ajout d'élève pour une famille donnée
   */
  const handleAddStudent = (familyId: string) => {
    setSelectedFamilyForStudent(familyId);
    setShowAddStudentModal(true);
  };

  /**
   * Ferme la modal d'ajout d'élève et remet à zéro la sélection
   */
  const closeStudentModal = () => {
    setShowAddStudentModal(false);
    setSelectedFamilyForStudent(null);
  };

  /**
   * Callback appelé après succès de création d'élève
   */
  const handleStudentSuccess = () => {
    closeStudentModal();
  };

  return {
    showAddStudentModal,
    selectedFamilyForStudent,
    handleAddStudent,
    closeStudentModal,
    handleStudentSuccess,
  };
};

/**
 * Créer un élève de test avec données fixes
 * Fonction utilitaire partagée entre Prospects et ProspectDetails
 */
export const createTestStudent = async (
  familyId: string,
  onSuccess: () => void,
  onError: (familyId: string) => void,
  refreshDataCallback?: () => Promise<void>
) => {
  try {
    const testStudentData = {
      firstName: "Emma",
      lastName: "Martin",
      dateOfBirth: "2010-05-15",
      school: {
        name: "Collège Victor Hugo",
        level: "collège" as const,
        grade: "5ème",
      },
      contact: {
        email: "emma.martin@email.com",
        phone: "0612345678",
      },
      courseLocation: {
        type: "domicile" as const,
        usesFamilyAddress: true,
      },
      availability: "Mercredi après-midi, samedi matin",
      comments: "⚡ Élève de test généré automatiquement",
      notes: "Élève motivé, bon niveau général",
      status: "active" as const,
    };

    // Créer l'élève via l'API
    await familyService.addStudent(familyId, testStudentData);

    // Rafraîchir les données si callback fourni
    if (refreshDataCallback) {
      await refreshDataCallback();
    }

    // Fermer la modal
    onSuccess();
  } catch (err) {
    console.error("Erreur lors de la création de l'élève de test:", err);
    // Réouvrir la modal en cas d'erreur
    onError(familyId);
  }
};