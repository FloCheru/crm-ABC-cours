// const API_BASE_URL =
//   import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const API_BASE_URL = "https://crm-abc-cours-production.up.railway.app/api";

export interface Subject {
  _id: string;
  name: string;
  description?: string;
  category: string;
  isActive: boolean;
}

class SubjectService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async getSubjects(): Promise<Subject[]> {
    const response = await fetch(`${API_BASE_URL}/subjects`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.message || "Erreur lors de la récupération des matières"
      );
    }

    return response.json();
  }

  async getActiveSubjects(): Promise<Subject[]> {
    const response = await fetch(`${API_BASE_URL}/subjects?active=true`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.message || "Erreur lors de la récupération des matières actives"
      );
    }

    return response.json();
  }
}

export const subjectService = new SubjectService();
