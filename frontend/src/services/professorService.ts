import { apiClient } from '../utils';
import type { Professor, TeachingSubject } from '../types/professor';

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
      const data = await apiClient.get<any>('/api/professors');
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
      const data = await apiClient.get<any>(`/api/professors/${professorId}`);
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
      const data = await apiClient.post<any>('/api/professors', professorData);
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
      const data = await apiClient.put<any>(`/api/professors/${professorId}`, professorData);
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
      await apiClient.delete(`/api/professors/${professorId}`);
    } catch (error) {
      console.error('Erreur deleteProfessor:', error);
      throw error;
    }
  }

  /**
   * Met à jour le statut d'un professeur
   */
  async updateStatus(professorId: string, status: "active" | "inactive" | "pending" | "suspended"): Promise<Professor> {
    try {
      const data = await apiClient.put<any>(`/api/professors/${professorId}/status`, { status });
      return data.professor;
    } catch (error) {
      console.error('Erreur updateStatus:', error);
      throw error;
    }
  }

  // ==================== GESTION DES DOCUMENTS ====================

  /**
   * Récupère tous les documents d'un professeur
   */
  async getDocuments(professorId: string): Promise<ProfessorDocument[]> {
    try {
      const data = await apiClient.get<any>(`/api/professors/${professorId}/documents`);
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

      // Récupérer le token pour les uploads de fichiers
      const token = localStorage.getItem('token');
      const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};

      const response = await fetch(`http://localhost:3000/api/professors/${professorId}/documents`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
        headers,
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
      // Récupérer le token pour les téléchargements
      const token = localStorage.getItem('token');
      const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};

      const response = await fetch(`http://localhost:3000/api/documents/${documentId}/download`, {
        method: 'GET',
        credentials: 'include',
        headers,
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
      await apiClient.delete(`/api/documents/${documentId}`);
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
      const data = await apiClient.get<any>(`/api/documents/${documentId}`);
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
      const data = await apiClient.get<any>('/api/professors/me');
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
      const data = await apiClient.put<any>('/api/professors/me', profileData);
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
      const data = await apiClient.put<any>('/api/professors/me/rib', ribData);
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
      const data = await apiClient.put<any>('/api/professors/me/availability', { weeklyAvailability: availability });
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
      const data = await apiClient.get<any>('/api/professors/me/subjects');
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
      const data = await apiClient.put<any>('/api/professors/me/subjects', { subjects });
      return data.subjects || [];
    } catch (error) {
      console.error('Erreur updateMySubjects:', error);
      throw error;
    }
  }

  /**
   * Met à jour les matières enseignées d'un professeur (admin uniquement)
   * @param professorId - ID du professeur
   * @param subjects - Liste des matières avec niveaux
   * @returns Liste mise à jour
   */
  async updateProfessorSubjects(professorId: string, subjects: TeachingSubject[]): Promise<TeachingSubject[]> {
    try {
      const data = await apiClient.put<any>(`/api/professors/${professorId}/subjects`, { teachingSubjects: subjects });
      return data.teachingSubjects || [];
    } catch (error) {
      console.error('Erreur updateProfessorSubjects:', error);
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
