import type { Family, Student } from "../types/family";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

class FamilyService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async getFamilies(): Promise<Family[]> {
    const response = await fetch(`${API_BASE_URL}/families`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.message || "Erreur lors de la récupération des familles"
      );
    }

    return response.json();
  }

  async getStudentsByFamily(familyId: string): Promise<Student[]> {
    const response = await fetch(
      `${API_BASE_URL}/families/${familyId}/students`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.message || "Erreur lors de la récupération des élèves"
      );
    }

    return response.json();
  }

  async getAllStudents(): Promise<Student[]> {
    const response = await fetch(`${API_BASE_URL}/students`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.message || "Erreur lors de la récupération des élèves"
      );
    }

    return response.json();
  }
}

export const familyService = new FamilyService();
