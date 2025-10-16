import type { TeachingSubject } from '../types/teacher';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface Professor {
  _id: string;
  gender: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  postalCode: string;
  city: string;
  // ... autres champs du professeur
}

export interface ProfessorDocument {
  _id: string;
  filename: string;
  category: string;
  uploadDate: string;
  size: number;
  contentType: string;
  professorId: string;
}

/**
 * Service pour gérer les professeurs
 */
class ProfessorService {
  /**
   * Récupère tous les professeurs
   */
  async getAllProfessors(): Promise<Professor[]> {
    try {
      const response = await fetch(`${API_URL}/professors`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des professeurs');
      }

      const data = await response.json();
      return data.professors || [];
    } catch (error) {
      console.error('Erreur getAllProfessors:', error);
      throw error;
    }
  }

  /**
   * Récupère un professeur par son ID
   */
  async getProfessorById(professorId: string): Promise<Professor> {
    try {
      const response = await fetch(`${API_URL}/professors/${professorId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération du professeur');
      }

      const data = await response.json();
      return data.professor;
    } catch (error) {
      console.error('Erreur getProfessorById:', error);
      throw error;
    }
  }

  /**
   * Crée un nouveau professeur
   */
  async createProfessor(professorData: Partial<Professor>): Promise<Professor> {
    try {
      const response = await fetch(`${API_URL}/professors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(professorData),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création du professeur');
      }

      const data = await response.json();
      return data.professor;
    } catch (error) {
      console.error('Erreur createProfessor:', error);
      throw error;
    }
  }

  /**
   * Met à jour un professeur
   */
  async updateProfessor(professorId: string, professorData: Partial<Professor>): Promise<Professor> {
    try {
      const response = await fetch(`${API_URL}/professors/${professorId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(professorData),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du professeur');
      }

      const data = await response.json();
      return data.professor;
    } catch (error) {
      console.error('Erreur updateProfessor:', error);
      throw error;
    }
  }

  /**
   * Supprime un professeur
   */
  async deleteProfessor(professorId: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/professors/${professorId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression du professeur');
      }
    } catch (error) {
      console.error('Erreur deleteProfessor:', error);
      throw error;
    }
  }

  // ==================== GESTION DES DOCUMENTS ====================

  /**
   * Récupère tous les documents d'un professeur
   */
  async getDocuments(professorId: string): Promise<ProfessorDocument[]> {
    try {
      const response = await fetch(`${API_URL}/professors/${professorId}/documents`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des documents');
      }

      const data = await response.json();
      return data.documents || [];
    } catch (error) {
      console.error('Erreur getDocuments:', error);
      throw error;
    }
  }

  /**
   * Upload un document pour un professeur
   * @param professorId - ID du professeur
   * @param file - Fichier à uploader
   * @param category - Catégorie du document (CV, Diplôme, RIB, etc.)
   */
  async uploadDocument(
    professorId: string,
    file: File,
    category: string
  ): Promise<ProfessorDocument> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);
      formData.append('professorId', professorId);

      const response = await fetch(`${API_URL}/professors/${professorId}/documents`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
        // Ne pas définir Content-Type, le navigateur le fera automatiquement avec le boundary
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur lors de l\'upload du document');
      }

      const data = await response.json();
      return data.document;
    } catch (error) {
      console.error('Erreur uploadDocument:', error);
      throw error;
    }
  }

  /**
   * Télécharge un document
   * @param documentId - ID du document
   * @returns Blob du fichier
   */
  async downloadDocument(documentId: string): Promise<Blob> {
    try {
      const response = await fetch(`${API_URL}/documents/${documentId}/download`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement du document');
      }

      return await response.blob();
    } catch (error) {
      console.error('Erreur downloadDocument:', error);
      throw error;
    }
  }

  /**
   * Supprime un document
   * @param documentId - ID du document à supprimer
   */
  async deleteDocument(documentId: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/documents/${documentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression du document');
      }
    } catch (error) {
      console.error('Erreur deleteDocument:', error);
      throw error;
    }
  }

  /**
   * Récupère les métadonnées d'un document
   * @param documentId - ID du document
   */
  async getDocumentMetadata(documentId: string): Promise<ProfessorDocument> {
    try {
      const response = await fetch(`${API_URL}/documents/${documentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des métadonnées');
      }

      const data = await response.json();
      return data.document;
    } catch (error) {
      console.error('Erreur getDocumentMetadata:', error);
      throw error;
    }
  }

  // ==================== GESTION DU PROFIL PROFESSEUR ====================

  /**
   * Récupère le profil du professeur connecté
   * @returns Profil complet du professeur
   */
  async getMyProfile(): Promise<Professor> {
    try {
      const response = await fetch(`${API_URL}/professors/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération du profil');
      }

      const data = await response.json();
      return data.professor;
    } catch (error) {
      console.error('Erreur getMyProfile:', error);
      throw error;
    }
  }

  /**
   * Met à jour le profil du professeur connecté
   * @param profileData - Données du profil à mettre à jour
   * @returns Profil mis à jour
   */
  async updateMyProfile(profileData: Partial<Professor>): Promise<Professor> {
    try {
      const response = await fetch(`${API_URL}/professors/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur lors de la mise à jour du profil');
      }

      const data = await response.json();
      return data.professor;
    } catch (error) {
      console.error('Erreur updateMyProfile:', error);
      throw error;
    }
  }

  /**
   * Met à jour les informations RIB du professeur connecté
   * @param ribData - Données bancaires (employmentStatus, siret, bankName, iban, bic)
   * @returns Profil mis à jour
   */
  async updateMyRib(ribData: {
    employmentStatus?: string;
    siret?: string;
    bankName?: string;
    iban?: string;
    bic?: string;
  }): Promise<Professor> {
    try {
      const response = await fetch(`${API_URL}/professors/me/rib`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(ribData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur lors de la mise à jour du RIB');
      }

      const data = await response.json();
      return data.professor;
    } catch (error) {
      console.error('Erreur updateMyRib:', error);
      throw error;
    }
  }

  /**
   * Met à jour les disponibilités du professeur connecté
   * @param availability - Planning hebdomadaire de disponibilités
   * @returns Profil mis à jour
   */
  async updateMyAvailability(availability: any): Promise<Professor> {
    try {
      const response = await fetch(`${API_URL}/professors/me/availability`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ weeklyAvailability: availability }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur lors de la mise à jour des disponibilités');
      }

      const data = await response.json();
      return data.professor;
    } catch (error) {
      console.error('Erreur updateMyAvailability:', error);
      throw error;
    }
  }

  // ==================== GESTION DES MATIÈRES ENSEIGNÉES ====================

  /**
   * Récupère les matières enseignées par le professeur connecté
   * @returns Liste des matières avec niveaux associés
   */
  async getMySubjects(): Promise<TeachingSubject[]> {
    try {
      const response = await fetch(`${API_URL}/professors/me/subjects`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des matières');
      }

      const data = await response.json();
      return data.subjects || [];
    } catch (error) {
      console.error('Erreur getMySubjects:', error);
      throw error;
    }
  }

  /**
   * Met à jour les matières enseignées par le professeur connecté
   * @param subjects - Liste des matières avec niveaux
   * @returns Liste mise à jour
   */
  async updateMySubjects(subjects: TeachingSubject[]): Promise<TeachingSubject[]> {
    try {
      const response = await fetch(`${API_URL}/professors/me/subjects`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ subjects }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur lors de la mise à jour des matières');
      }

      const data = await response.json();
      return data.subjects || [];
    } catch (error) {
      console.error('Erreur updateMySubjects:', error);
      throw error;
    }
  }

  /**
   * Vérifie si le professeur a un RIB valide et complet
   * @returns true si le RIB est complet, false sinon
   */
  async hasValidRib(): Promise<boolean> {
    try {
      const profile = await this.getMyProfile();

      // Vérifier que tous les champs essentiels du RIB sont présents
      const hasEmploymentStatus = !!(profile as any).employmentStatus;
      const hasBankDetails = !!(profile as any).bankDetails;
      const hasIban = hasBankDetails && !!(profile as any).bankDetails.iban;
      const hasBic = hasBankDetails && !!(profile as any).bankDetails.bic;

      // Si auto-entrepreneur, le SIRET est obligatoire
      const isAutoEntrepreneur = (profile as any).employmentStatus === 'auto-entrepreneur';
      const hasSiret = hasBankDetails && !!(profile as any).bankDetails.siret;

      // RIB valide si :
      // - Statut professionnel renseigné
      // - IBAN et BIC renseignés
      // - Si auto-entrepreneur : SIRET renseigné
      return hasEmploymentStatus && hasIban && hasBic && (!isAutoEntrepreneur || hasSiret);
    } catch (error) {
      console.error('Erreur hasValidRib:', error);
      return false;
    }
  }
}

// Exporter une instance unique du service
export const professorService = new ProfessorService();
export default professorService;
