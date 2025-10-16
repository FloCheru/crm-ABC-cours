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
}

// Exporter une instance unique du service
export const professorService = new ProfessorService();
export default professorService;
