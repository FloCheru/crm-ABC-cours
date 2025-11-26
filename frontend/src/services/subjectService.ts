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

  async createSubject(data: {
    name: string;
    description?: string;
    category: string;
  }): Promise<Subject> {
    const response = await apiClient.post("/api/subjects", data);
    return response as Subject;
  }

  async updateSubject(id: string, data: Partial<Subject>): Promise<Subject> {
    const response = await apiClient.put(`/api/subjects/${id}`, data);
    return response as Subject;
  }

  async deleteSubject(id: string): Promise<void> {
    await apiClient.delete(`/api/subjects/${id}`);
  }

  async checkSubjectUsage(
    id: string
  ): Promise<{ isUsed: boolean; count: number; ndrs: any[] }> {
    const response = await apiClient.get(`/api/subjects/check-usage/${id}`);
    return response as { isUsed: boolean; count: number; ndrs: any[] };
  }

  async getCategories(): Promise<string[]> {
    try {
      const response = await apiClient.get("/api/subjects/categories");
      return Array.isArray(response) ? response : [];
    } catch (error) {
      return [];
    }
  }
}

export const subjectService = new SubjectService();
