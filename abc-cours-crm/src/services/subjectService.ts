import type { Subject } from "../types/subject";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

class SubjectService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async getSubjects(): Promise<Subject[]> {
    const headers = this.getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/subjects`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.message || "Erreur lors de la récupération des matières"
      );
    }

    const data = await response.json();

    // L'API retourne directement le tableau, pas encapsulé dans { data: [...] }
    return Array.isArray(data) ? data : data.data || [];
  }

  async getActiveSubjects(): Promise<Subject[]> {
    const headers = this.getAuthHeaders();
    console.log("🔍 Récupération des matières actives...");

    // Pour l'instant, récupérer toutes les matières au lieu de seulement les actives
    const response = await fetch(`${API_BASE_URL}/subjects`, {
      method: "GET",
      headers,
    });

    console.log("🔍 Status de la réponse:", response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error("🔍 Erreur de l'API:", error);
      throw new Error(
        error.message || "Erreur lors de la récupération des matières actives"
      );
    }

    const data = await response.json();
    console.log("🔍 Données reçues:", data);

    // L'API retourne directement le tableau, pas encapsulé dans { data: [...] }
    const subjects = Array.isArray(data) ? data : data.data || [];
    console.log("🔍 Matières trouvées:", subjects.length);

    return subjects;
  }
}

export const subjectService = new SubjectService();
