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

    const data = await response.json();
    return data.families || [];
  }

  async getStudentsByFamily(familyId: string): Promise<Student[]> {
    const response = await fetch(
      `${API_BASE_URL}/students?family=${familyId}`,
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

    const data = await response.json();
    return data.students || [];
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

    const data = await response.json();
    return data.students || [];
  }
}

export const familyService = new FamilyService();
