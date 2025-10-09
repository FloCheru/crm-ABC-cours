import { apiClient } from "../utils";
// Interface temporaire pour CreateNDRData (à créer dans ../types/ndr.ts plus tard)
interface CreateNDRData {
  familyId: string;
  studentIds?: string[];
  adult?: boolean;
  paymentMethod: "card" | "CESU" | "check" | "transfer" | "cash" | "PRLV";
  paymentType?: "avance" | "credit";
  deadlines?: {
    deadlinesNumber: number;
    deadlinesDay: number;
  };
  subjects?: Array<string | { id: string }>;
  hourlyRate: number;
  quantity: number;
  charges: number;
  status?: string;
  notes?: string;
  professor?: {
    id: string;
    salary?: number;
  };
}

interface NDR {
  _id: string;
  familyId: string;
  beneficiaries: {
    students: Array<{
      id: string;
    }>;
    adult: boolean;
  };
  paymentMethod: "card" | "CESU" | "check" | "transfer" | "cash" | "PRLV";
  paymentType: "avance" | "credit";
  deadlines?: {
    deadlinesNumber: number;
    deadlinesDay: number;
  };
  subjects: Array<{
    id: string | { _id: string; name: string; category: string };
    name?: string;
    category?: string;
  }>;
  hourlyRate: number;
  quantity: number;
  charges: number;
  status: string;
  notes?: string;
  createdBy: {
    userId: string | { _id: string; firstName: string; lastName: string };
  };
  professor?: {
    id: string;
    salary?: number;
  };
  coupons: Array<{
    id: string;
    code: string;
    status: "available" | "used" | "deleted";
    updatedAt: string;
  }>;
  generatedPDFs: any[];
  createdAt: string;
  updatedAt: string;
}

interface NDRsResponse {
  ndrs: NDR[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface NDRResponse {
  message: string;
  ndr: NDR;
}

class NdrService {
  async createNDR(data: CreateNDRData): Promise<NDR> {
    try {
      // Construire les données selon le modèle NDR
      const ndrData = {
        familyId: data.familyId,
        beneficiaries: {
          students: data.studentIds?.map((id: string) => ({ id })) || [],
          adult: data.adult || false,
        },
        paymentMethod: data.paymentMethod,
        paymentType: data.paymentType || "avance",
        deadlines: data.deadlines
          ? {
              deadlinesNumber: data.deadlines.deadlinesNumber,
              deadlinesDay: data.deadlines.deadlinesDay,
            }
          : undefined,
        subjects:
          data.subjects?.map((subject: string | { id: string }) => ({
            id: typeof subject === "string" ? subject : subject.id,
          })) || [],
        hourlyRate: data.hourlyRate,
        quantity: data.quantity,
        charges: data.charges,
        status: data.status || "pending",
        notes: data.notes,
        professor: data.professor
          ? {
              id: data.professor.id,
              salary: data.professor.salary,
            }
          : undefined,
      };

      const response = await apiClient.post("/api/ndrs", ndrData);
      const result = (response as NDRResponse).ndr;

      console.log("✅ NDR créée avec succès:", result);
      return result;
    } catch (error) {
      console.error("Erreur lors de la création de la NDR:", error);
      throw error;
    }
  }

  async getNdrsByFamily(familyId: string): Promise<NDR[]> {
    try {
      const response = await apiClient.get(
        `/api/ndrs?familyId=${familyId}`
      );
      return (response as NDRsResponse).ndrs || [];
    } catch (error) {
      console.error("Erreur lors de la récupération des NDRs:", error);
      return [];
    }
  }

  async getAllNdrs(
    page: number = 1,
    limit: number = 10
  ): Promise<NDRsResponse> {
    try {
      const response = await apiClient.get(
        `/api/ndrs?page=${page}&limit=${limit}`
      );
      return response as NDRsResponse;
    } catch (error) {
      console.error("Erreur lors de la récupération des NDRs:", error);
      throw error;
    }
  }

  async getNdrById(id: string): Promise<NDR> {
    try {
      const response = await apiClient.get(`/api/ndrs/${id}`);
      return response as NDR;
    } catch (error) {
      console.error("Erreur lors de la récupération de la NDR:", error);
      throw error;
    }
  }

  async updateNdr(id: string, updates: Partial<NDR>): Promise<NDR> {
    try {
      console.log("🔄 Mise à jour de la NDR:", id, updates);
      // Utilisation d'une requête manuelle car patch n'est pas disponible dans rateLimitedApiClient
      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"
        }/api/ndrs/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiClient.getToken()}`,
          },
          body: JSON.stringify(updates),
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ NDR mise à jour:", result);
      return result as NDR;
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la NDR:", error);
      throw error;
    }
  }

  async getDeletionPreview(id: string): Promise<any> {
    try {
      const response = await apiClient.get(`/api/ndrs/${id}/deletion-preview`);
      return response;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération de l'aperçu de suppression:",
        error
      );
      throw error;
    }
  }

  async deleteNdr(
    _id: string,
    _familyId?: string
  ): Promise<{ message: string }> {
    return await apiClient.delete(`/api/ndr/${_id}`);
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
      console.log(
        `🔄 Génération PDF - Note: ${settlementNoteId}, Type: ${type}`
      );
      const response = await apiClient.post(
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
      const response = await apiClient.get(
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
      console.log(
        `⬇️ Téléchargement PDF - Note: ${settlementNoteId}, PDF: ${pdfId}`
      );

      // Utiliser apiClient pour bénéficier de l'authentification automatique
      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"
        }/api/pdfs/${settlementNoteId}/${pdfId}/download`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${apiClient.getToken()}`,
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
      console.log(
        `👁️ Prévisualisation PDF - Note: ${settlementNoteId}, PDF: ${pdfId}`
      );

      // Faire une requête authentifiée pour récupérer le PDF
      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"
        }/api/pdfs/${settlementNoteId}/${pdfId}/preview`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${apiClient.getToken()}`,
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
      const newWindow = window.open(pdfUrl, "_blank");

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

  async deletePDF(
    settlementNoteId: string,
    pdfId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log(
        `🗑️ Suppression PDF - Note: ${settlementNoteId}, PDF: ${pdfId}`
      );
      const response = await apiClient.delete(
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

export const ndrService = new NdrService();
export type { NDR, NDRsResponse };
