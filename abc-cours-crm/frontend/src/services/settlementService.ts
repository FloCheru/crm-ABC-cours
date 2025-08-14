import { apiClient } from "../utils";
import type { CreateSettlementNoteData } from "../types/settlement";

interface SettlementNote {
  _id: string;
  clientName: string;
  department: string;
  paymentMethod: string;
  subject: {
    _id: string;
    name: string;
    category: string;
  };
  hourlyRate: number;
  quantity: number;
  professorSalary: number;
  charges: number;
  status: string;
  dueDate: string;
  notes?: string;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
  salaryToPay: number;
  chargesToPay: number;
  marginAmount: number;
  marginPercentage: number;
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
    try {
      // 🔍 LOGS DE DÉBOGAGE - Service
      console.log("🔍 === DÉBOGAGE SERVICE ===");
      console.log("🔍 URL appelée:", "/api/settlement-notes");
      console.log("🔍 Données envoyées:", data);
      console.log("🔍 Type des données:", typeof data);
      console.log("🔍 Clés des données:", Object.keys(data));
      console.log("🔍 === FIN DÉBOGAGE SERVICE ===");

      const response = await apiClient.post("/api/settlement-notes", data);
      return (response as SettlementNoteResponse).settlementNote;
    } catch (error) {
      console.error(
        "Erreur lors de la création de la note de règlement:",
        error
      );
      throw error;
    }
  }

  async getSettlementNotesByFamily(
    familyId: string
  ): Promise<SettlementNote[]> {
    try {
      const response = await apiClient.get(
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
      const response = await apiClient.get(
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
      const response = await apiClient.get(`/api/settlement-notes/${id}`);
      return response as SettlementNote;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération de la note de règlement:",
        error
      );
      throw error;
    }
  }
}

export const settlementService = new SettlementService();
export type { SettlementNote, SettlementNotesResponse };
