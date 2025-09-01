import { rateLimitedApiClient } from "../utils";
import { apiClient } from "../utils/apiClient";
import type { CreateSettlementNoteData } from "../types/settlement";
import ActionCacheService from "./actionCacheService";

interface SettlementNote {
  _id: string;
  familyId: string | { _id: string; address: { postalCode: string } };
  studentIds: string[] | Array<{ _id: string; firstName: string; lastName: string }>;
  clientName: string;
  department: string;
  extractedDepartment?: string; // Département extrait automatiquement du code postal
  paymentMethod: "card" | "CESU" | "check" | "transfer" | "cash" | "PRLV";
  subjects: Array<{
    subjectId: string | { _id: string; name: string; category: string };
    hourlyRate: number;
    quantity: number;
    professorSalary: number;
  }>;
  // Champs calculés globaux
  totalHourlyRate: number;
  totalQuantity: number;
  totalProfessorSalary: number;
  salaryToPay: number;
  charges: number;
  chargesToPay: number;
  marginAmount: number;
  marginPercentage: number;
  status: "pending" | "paid" | "overdue";
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  notes?: string;
  // Échéancier
  paymentSchedule?: {
    paymentMethod: "PRLV" | "check";
    numberOfInstallments: number;
    dayOfMonth: number;
    installments: {
      amount: number;
      dueDate: string;
      status: "pending" | "paid" | "failed";
      paidAt?: string;
    }[];
  };
  // Champs pour la gestion des coupons
  couponSeriesId?: {
    _id: string;
    totalCoupons: number;
    usedCoupons: number;
    status: "active" | "completed" | "expired";
  };
  totalCoupons?: number;
  // Champs pour la gestion des PDFs générés
  generatedPDFs?: Array<{
    _id: string;
    fileName: string;
    filePath: string;
    type: "ndr" | "coupons" | "both";
    fileSize: number;
    totalPages: number;
    generatedAt: string;
  }>;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
}

interface SettlementNotesResponse {
  notes: SettlementNote[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface SettlementNoteResponse {
  message: string;
  settlementNote: SettlementNote;
}

class SettlementService {
  async createSettlementNote(
    data: CreateSettlementNoteData
  ): Promise<SettlementNote> {
    // 🔍 LOGS DE DÉBOGAGE - Service
    console.log("🔍 === DÉBOGAGE SERVICE ===");
    console.log("🔍 URL appelée:", "/api/settlement-notes");
    console.log("🔍 Données envoyées:", data);
    console.log("🔍 Type des données:", typeof data);
    console.log("🔍 Clés des données:", Object.keys(data));
    console.log("🔍 === FIN DÉBOGAGE SERVICE ===");

    // ✨ NOUVEAU: Utilisation du ActionCacheService pour gestion intelligente du cache
    return ActionCacheService.executeAction(
      'CREATE_NDR',
      async () => {
        const response = await rateLimitedApiClient.post("/api/settlement-notes", data);
        return (response as SettlementNoteResponse).settlementNote;
      },
      {
        familyId: data.familyId,
        newStatus: 'client',
        ndrData: data
      }
    );
  }

  async getSettlementNotesByFamily(
    familyId: string
  ): Promise<SettlementNote[]> {
    try {
      const response = await rateLimitedApiClient.get(
        `/api/settlement-notes?familyId=${familyId}`
      );
      return (response as SettlementNotesResponse).notes || [];
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des notes de règlement:",
        error
      );
      return [];
    }
  }

  async getSettlementNotesCountByFamily(familyId: string): Promise<number> {
    try {
      console.log("🔍 Service: Comptage des notes pour famille:", familyId);
      const notes = await this.getSettlementNotesByFamily(familyId);
      console.log("🔍 Service: Notes trouvées:", notes.length, notes);
      return notes.length;
    } catch (error) {
      console.error("Erreur lors du comptage des notes de règlement:", error);
      return 0;
    }
  }

  async getAllSettlementNotes(
    page: number = 1,
    limit: number = 10
  ): Promise<SettlementNotesResponse> {
    try {
      const response = await rateLimitedApiClient.get(
        `/api/settlement-notes?page=${page}&limit=${limit}`
      );
      return response as SettlementNotesResponse;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des notes de règlement:",
        error
      );
      throw error;
    }
  }

  async getSettlementNoteById(id: string): Promise<SettlementNote> {
    try {
      const response = await rateLimitedApiClient.get(`/api/settlement-notes/${id}`);
      return response as SettlementNote;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération de la note de règlement:",
        error
      );
      throw error;
    }
  }

  async updateSettlementNote(
    id: string,
    updates: Partial<SettlementNote>
  ): Promise<SettlementNote> {
    try {
      console.log("🔄 Mise à jour de la note de règlement:", id, updates);
      // Utilisation d'une requête manuelle car patch n'est pas disponible dans rateLimitedApiClient
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/settlement-notes/${id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiClient.getToken()}`,
          },
          body: JSON.stringify(updates),
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Note de règlement mise à jour:", result);
      return result as SettlementNote;
    } catch (error) {
      console.error(
        "Erreur lors de la mise à jour de la note de règlement:",
        error
      );
      throw error;
    }
  }

  async getDeletionPreview(id: string): Promise<any> {
    try {
      const response = await apiClient.get(`/api/settlement-notes/${id}/deletion-preview`);
      return response;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération de l'aperçu de suppression:",
        error
      );
      throw error;
    }
  }

  async deleteSettlementNote(id: string): Promise<{ message: string }> {
    // ✨ NOUVEAU: Utilisation du ActionCacheService pour DELETE_NDR
    return ActionCacheService.executeAction(
      'DELETE_NDR',
      async () => {
        const response = await rateLimitedApiClient.delete(`/api/settlement-notes/${id}`);
        return response as { message: string };
      },
      {
        ndrId: id,
        familyId: '', // Sera récupéré par le backend si besoin
      }
    );
  }

  // Méthodes pour la gestion des PDFs
  async generatePDF(
    settlementNoteId: string, 
    type: "ndr" | "coupons" | "both" = "ndr"
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      pdfId: string;
      fileName: string;
      type: string;
      fileSize: number;
      generatedAt: string;
    };
  }> {
    try {
      console.log(`🔄 Génération PDF - Note: ${settlementNoteId}, Type: ${type}`);
      const response = await rateLimitedApiClient.post(
        `/api/settlement-notes/${settlementNoteId}/generate-pdf`,
        { type }
      );
      console.log(`✅ PDF généré avec succès:`, response);
      return response as any;
    } catch (error) {
      console.error("Erreur lors de la génération du PDF:", error);
      throw error;
    }
  }

  async listPDFs(settlementNoteId: string): Promise<{
    success: boolean;
    data: Array<{
      id: string;
      fileName: string;
      type: "ndr" | "coupons" | "both";
      fileSize: number;
      totalPages: number;
      generatedAt: string;
    }>;
  }> {
    try {
      const response = await rateLimitedApiClient.get(
        `/api/settlement-notes/${settlementNoteId}/pdfs`
      );
      return response as any;
    } catch (error) {
      console.error("Erreur lors de la récupération des PDFs:", error);
      throw error;
    }
  }

  async downloadPDF(settlementNoteId: string, pdfId: string): Promise<Blob> {
    try {
      console.log(`⬇️ Téléchargement PDF - Note: ${settlementNoteId}, PDF: ${pdfId}`);
      
      // Utiliser apiClient pour bénéficier de l'authentification automatique
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/pdfs/${settlementNoteId}/${pdfId}/download`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiClient.getToken()}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const blob = await response.blob();
      console.log(`✅ PDF téléchargé:`, blob);
      return blob;
    } catch (error) {
      console.error("Erreur lors du téléchargement du PDF:", error);
      throw error;
    }
  }

  async previewPDF(settlementNoteId: string, pdfId: string): Promise<void> {
    try {
      console.log(`👁️ Prévisualisation PDF - Note: ${settlementNoteId}, PDF: ${pdfId}`);
      
      // Faire une requête authentifiée pour récupérer le PDF
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/pdfs/${settlementNoteId}/${pdfId}/preview`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiClient.getToken()}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      // Convertir en Blob
      const blob = await response.blob();
      
      // Créer une URL locale pour le PDF
      const pdfUrl = URL.createObjectURL(blob);
      
      // Ouvrir dans un nouvel onglet
      const newWindow = window.open(pdfUrl, '_blank');
      
      // Nettoyer l'URL après un délai pour éviter les fuites mémoire
      if (newWindow) {
        setTimeout(() => {
          URL.revokeObjectURL(pdfUrl);
        }, 1000);
      }
      
      console.log(`✅ PDF ouvert dans un nouvel onglet`);
    } catch (error) {
      console.error("Erreur lors de la prévisualisation du PDF:", error);
      throw error;
    }
  }

  async deletePDF(settlementNoteId: string, pdfId: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`🗑️ Suppression PDF - Note: ${settlementNoteId}, PDF: ${pdfId}`);
      const response = await rateLimitedApiClient.delete(
        `/api/pdfs/${settlementNoteId}/${pdfId}`
      );
      console.log(`✅ PDF supprimé:`, response);
      return response as any;
    } catch (error) {
      console.error("Erreur lors de la suppression du PDF:", error);
      throw error;
    }
  }
}

export const settlementService = new SettlementService();
export type { SettlementNote, SettlementNotesResponse };
