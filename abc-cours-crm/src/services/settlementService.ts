import type {
  SettlementNote,
  CreateSettlementNoteData,
  SettlementNoteStats,
} from "../types/settlement";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

class SettlementService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async getSettlementNotes(): Promise<SettlementNote[]> {
    const headers = this.getAuthHeaders();
    console.log("🔍 Récupération des notes de règlement...");

    const response = await fetch(`${API_BASE_URL}/settlement-notes`, {
      method: "GET",
      headers,
    });

    console.log("🔍 Status de la réponse:", response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error("🔍 Erreur de l'API:", error);
      throw new Error(
        error.message || "Erreur lors de la récupération des notes de règlement"
      );
    }

    const data = await response.json();
    console.log("🔍 Données reçues:", data);

    // Extraire les données du format de réponse paginée
    return data.data || [];
  }

  async getSettlementNoteById(id: string): Promise<SettlementNote> {
    const response = await fetch(`${API_BASE_URL}/settlement-notes/${id}`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.message ||
          "Erreur lors de la récupération de la note de règlement"
      );
    }

    return response.json();
  }

  async createSettlementNote(
    data: CreateSettlementNoteData
  ): Promise<SettlementNote> {
    const headers = this.getAuthHeaders();
    console.log("🔍 Création note de règlement - Données:", data);

    const response = await fetch(`${API_BASE_URL}/settlement-notes`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    console.log("🔍 Création note de règlement - Status:", response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error("🔍 Création note de règlement - Erreur API:", error);
      throw new Error(
        error.message || "Erreur lors de la création de la note de règlement"
      );
    }

    const result = await response.json();
    console.log("🔍 Création note de règlement - Succès:", result);
    return result;
  }

  async updateSettlementNote(
    id: string,
    data: Partial<CreateSettlementNoteData>
  ): Promise<SettlementNote> {
    const response = await fetch(`${API_BASE_URL}/settlement-notes/${id}`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.message || "Erreur lors de la mise à jour de la note de règlement"
      );
    }

    return response.json();
  }

  async deleteSettlementNote(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/settlement-notes/${id}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.message || "Erreur lors de la suppression de la note de règlement"
      );
    }
  }

  async markAsPaid(id: string): Promise<SettlementNote> {
    const response = await fetch(
      `${API_BASE_URL}/settlement-notes/${id}/mark-paid`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Erreur lors du marquage comme payé");
    }

    return response.json();
  }

  async getSettlementStats(): Promise<SettlementNoteStats> {
    const response = await fetch(`${API_BASE_URL}/settlement-notes/stats`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.message || "Erreur lors de la récupération des statistiques"
      );
    }

    return response.json();
  }
}

export const settlementService = new SettlementService();
