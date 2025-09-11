import { apiClient } from "../utils";
import type { Subject } from "../types/subject";

class SubjectService {
  async getSubjects(): Promise<Subject[]> {
    try {
      const response = await apiClient.get("/api/subjects");

      // Si c'est directement un tableau
      if (Array.isArray(response)) {
        return response as Subject[];
      }

      // Si c'est encapsulé dans un objet
      if (response && typeof response === "object" && "subjects" in response) {
        return (response as { subjects: Subject[] }).subjects || [];
      }

      // Fallback
      return [];
    } catch (error) {
      return [];
    }
  }

  async getActiveSubjects(): Promise<Subject[]> {
    try {
      const response = await apiClient.get("/api/subjects");

      // Si c'est directement un tableau
      if (Array.isArray(response)) {
        return response as Subject[];
      }

      // Si c'est encapsulé dans un objet
      if (response && typeof response === "object" && "subjects" in response) {
        const subjects = (response as { subjects: Subject[] }).subjects || [];
        return subjects;
      }

      // Fallback
      return [];
    } catch (error) {
      throw error;
    }
  }
}

export const subjectService = new SubjectService();
