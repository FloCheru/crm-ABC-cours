import type {
  PaymentNote,
  CreatePaymentNoteRequest,
  UpdatePaymentNoteRequest,
} from "../types/paymentNote";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

class PaymentNoteService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async getAllPaymentNotes(): Promise<PaymentNote[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/payment-notes`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des notes de règlement:",
        error
      );
      throw error;
    }
  }

  async getPaymentNoteById(id: string): Promise<PaymentNote> {
    try {
      const response = await fetch(`${API_BASE_URL}/payment-notes/${id}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(
        "Erreur lors de la récupération de la note de règlement:",
        error
      );
      throw error;
    }
  }

  async createPaymentNote(
    data: CreatePaymentNoteRequest
  ): Promise<PaymentNote> {
    try {
      const response = await fetch(`${API_BASE_URL}/payment-notes`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(
        "Erreur lors de la création de la note de règlement:",
        error
      );
      throw error;
    }
  }

  async updatePaymentNote(
    id: string,
    data: UpdatePaymentNoteRequest
  ): Promise<PaymentNote> {
    try {
      const response = await fetch(`${API_BASE_URL}/payment-notes/${id}`, {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(
        "Erreur lors de la mise à jour de la note de règlement:",
        error
      );
      throw error;
    }
  }

  async deletePaymentNote(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/payment-notes/${id}`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }
    } catch (error) {
      console.error(
        "Erreur lors de la suppression de la note de règlement:",
        error
      );
      throw error;
    }
  }

  async getPaymentNotesByFamily(familyId: string): Promise<PaymentNote[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/payment-notes/families/${familyId}`,
        {
          method: "GET",
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des notes de règlement de la famille:",
        error
      );
      throw error;
    }
  }

  async getPaymentNotesByStudent(studentId: string): Promise<PaymentNote[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/payment-notes/students/${studentId}`,
        {
          method: "GET",
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des notes de règlement de l'élève:",
        error
      );
      throw error;
    }
  }

  async markAsPaid(id: string, paymentDate?: string): Promise<PaymentNote> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/payment-notes/${id}/mark-paid`,
        {
          method: "PATCH",
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ paymentDate }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Erreur lors du marquage comme payé:", error);
      throw error;
    }
  }

  async cancelPaymentNote(id: string): Promise<PaymentNote> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/payment-notes/${id}/cancel`,
        {
          method: "PATCH",
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(
        "Erreur lors de l'annulation de la note de règlement:",
        error
      );
      throw error;
    }
  }

  async downloadPDF(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/payment-notes/${id}/pdf`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }

      // Récupérer le nom du fichier depuis les headers
      const contentDisposition = response.headers.get("content-disposition");
      let filename = "note_reglement.pdf";

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Créer un blob et télécharger le fichier
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erreur lors du téléchargement du PDF:", error);
      throw error;
    }
  }
}

export const paymentNoteService = new PaymentNoteService();
