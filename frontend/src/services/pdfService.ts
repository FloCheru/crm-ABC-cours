/**
 * Service pour gérer la génération et récupération de PDFs
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export type PDFType = 'fiche_paie' | 'NDR' | 'convention' | 'facture';

export interface PDFMetadata {
  _id: string;
  gridFsFileId: string;
  type: PDFType;
  userId: string;
  userModel: 'Teacher' | 'Admin';
  version: number;
  status: 'generated' | 'sent' | 'downloaded' | 'archived';
  metadata?: {
    period?: string;
    salaryAmount?: number;
    settlementNoteId?: string;
    startDate?: string;
    endDate?: string;
    invoiceNumber?: string;
    invoiceDate?: string;
    totalAmount?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface GeneratePDFRequest {
  type: PDFType;
  data: any; // Données pour le template Handlebars
  userId?: string; // Optionnel, défaut = user connecté
  userModel?: 'Teacher' | 'Admin';
  version?: number;
}

export interface GeneratePDFResponse {
  success: boolean;
  data: {
    pdfId: string;
    gridFsFileId: string;
  };
  message: string;
}

export interface ListPDFsResponse {
  success: boolean;
  count: number;
  data: PDFMetadata[];
}

/**
 * Service pour gérer les PDFs
 */
class PDFService {
  /**
   * Génère un nouveau PDF
   * @param request - Paramètres de génération
   * @returns Promise avec pdfId et gridFsFileId
   */
  async generatePDF(request: GeneratePDFRequest): Promise<GeneratePDFResponse> {
    try {
      const response = await fetch(`${API_URL}/pdfs/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la génération du PDF');
      }

      const data: GeneratePDFResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Erreur generatePDF:', error);
      throw error;
    }
  }

  /**
   * Récupère un PDF par son ID (téléchargement)
   * @param pdfId - ID du PDF
   * @param filename - Nom du fichier (optionnel)
   * @returns Promise<void> - Déclenche le téléchargement
   */
  async downloadPDF(pdfId: string, filename?: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/pdfs/${pdfId}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la récupération du PDF');
      }

      // Récupérer le blob PDF
      const blob = await response.blob();

      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `document_${pdfId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur downloadPDF:', error);
      throw error;
    }
  }

  /**
   * Récupère un PDF en tant que Blob (pour affichage dans viewer)
   * @param pdfId - ID du PDF
   * @returns Promise<Blob> - Blob du PDF
   */
  async getPDFBlob(pdfId: string): Promise<Blob> {
    try {
      const response = await fetch(`${API_URL}/pdfs/${pdfId}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la récupération du PDF');
      }

      return await response.blob();
    } catch (error) {
      console.error('Erreur getPDFBlob:', error);
      throw error;
    }
  }

  /**
   * Liste les PDFs d'un utilisateur
   * @param userId - ID de l'utilisateur (optionnel, défaut = user connecté)
   * @param type - Type de PDF (optionnel)
   * @returns Promise<PDFMetadata[]> - Liste des PDFs
   */
  async listPDFs(userId?: string, type?: PDFType): Promise<PDFMetadata[]> {
    try {
      const endpoint = userId ? `/pdfs/list/${userId}` : '/pdfs/list';
      const queryParams = type ? `?type=${type}` : '';

      const response = await fetch(`${API_URL}${endpoint}${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la récupération de la liste');
      }

      const data: ListPDFsResponse = await response.json();
      return data.data;
    } catch (error) {
      console.error('Erreur listPDFs:', error);
      throw error;
    }
  }

  /**
   * Supprime un PDF (soft delete)
   * @param pdfId - ID du PDF
   * @returns Promise<void>
   */
  async deletePDF(pdfId: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/pdfs/${pdfId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression du PDF');
      }
    } catch (error) {
      console.error('Erreur deletePDF:', error);
      throw error;
    }
  }

  /**
   * Suppression définitive d'un PDF (hard delete) - ADMIN ONLY
   * @param pdfId - ID du PDF
   * @returns Promise<void>
   */
  async hardDeletePDF(pdfId: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/pdfs/${pdfId}/hard`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression définitive');
      }
    } catch (error) {
      console.error('Erreur hardDeletePDF:', error);
      throw error;
    }
  }

  /**
   * Invalide le cache d'un template (après modification) - ADMIN ONLY
   * @param templateName - Nom du template
   * @returns Promise<void>
   */
  async invalidateTemplateCache(templateName: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/pdfs/template/invalidate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ templateName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'invalidation du cache');
      }
    } catch (error) {
      console.error('Erreur invalidateTemplateCache:', error);
      throw error;
    }
  }

  /**
   * Génère une fiche de paie pour un professeur
   * @param professorId - ID du professeur
   * @param payrollData - Données de paie
   * @returns Promise avec pdfId
   */
  async generatePayslip(professorId: string, payrollData: any): Promise<string> {
    try {
      const response = await this.generatePDF({
        type: 'fiche_paie',
        data: payrollData,
        userId: professorId,
        userModel: 'Teacher',
      });

      return response.data.pdfId;
    } catch (error) {
      console.error('Erreur generatePayslip:', error);
      throw error;
    }
  }

  /**
   * Récupère toutes les fiches de paie d'un professeur
   * @param professorId - ID du professeur
   * @returns Promise<PDFMetadata[]> - Liste des fiches de paie
   */
  async getPayslips(professorId: string): Promise<PDFMetadata[]> {
    return this.listPDFs(professorId, 'fiche_paie');
  }
}

// Export singleton
export default new PDFService();
