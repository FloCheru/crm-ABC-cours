import { apiClient } from "../utils";
import type { Subject } from "../types/subject";

class SubjectService {
  async getSubjects(): Promise<Subject[]> {
    try {
      const response = await apiClient.get("/api/subjects");
      console.log("🔍 Réponse brute de l'API /subjects:", response);
      console.log("🔍 Type de la réponse:", typeof response);
      console.log("🔍 Est-ce un tableau?", Array.isArray(response));

      // Si c'est directement un tableau
      if (Array.isArray(response)) {
        return response as Subject[];
      }

      // Si c'est encapsulé dans un objet
      if (response && typeof response === "object" && "subjects" in response) {
        return (response as { subjects: Subject[] }).subjects || [];
      }

      // Fallback
      console.warn("🔍 Format de réponse inattendu, retour d'un tableau vide");
      return [];
    } catch (error) {
      console.error("🔍 Erreur dans getSubjects:", error);
      return [];
    }
  }

  async getActiveSubjects(): Promise<Subject[]> {
    console.log("🔍 Récupération des matières actives...");

    try {
      const response = await apiClient.get("/api/subjects");
      console.log("🔍 Réponse brute de l'API /subjects (getActiveSubjects):", response);
      console.log("🔍 Type de la réponse:", typeof response);
      console.log("🔍 Est-ce un tableau?", Array.isArray(response));

      // Si c'est directement un tableau
      if (Array.isArray(response)) {
        console.log("🔍 Matières trouvées (tableau direct):", response.length);
        return response as Subject[];
      }

      // Si c'est encapsulé dans un objet
      if (response && typeof response === "object" && "subjects" in response) {
        const subjects = (response as { subjects: Subject[] }).subjects || [];
        console.log("🔍 Matières trouvées (objet.subjects):", subjects.length);
        return subjects;
      }

      // Fallback
      console.warn("🔍 Format de réponse inattendu, retour d'un tableau vide");
      return [];
    } catch (error) {
      console.error("🔍 Erreur lors de la récupération des matières:", error);
      throw error;
    }
  }
}

export const subjectService = new SubjectService();
