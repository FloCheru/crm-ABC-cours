import { apiClient } from "../utils/apiClient";
import type { StudentWithStats } from "../types/student";

// Interface pour typer les réponses API
interface ApiResponse<T> {
  data: T;
  success?: boolean;
  message?: string;
}

class StudentService {
  /**
   * Récupère la liste des élèves du professeur connecté
   * Les élèves sont identifiés via les coupons saisis par le professeur
   */
  async getMyStudents(): Promise<StudentWithStats[]> {
    const response = await apiClient.get("/api/professors/me/students") as ApiResponse<StudentWithStats[]>;
    return response.data;
  }

  /**
   * Récupère les détails complets d'un élève avec historique des cours
   */
  async getStudentDetail(studentId: string): Promise<StudentWithStats> {
    const response = await apiClient.get(`/api/professors/me/students/${studentId}`) as ApiResponse<StudentWithStats>;
    return response.data;
  }

  /**
   * Ajoute ou modifie un commentaire pédagogique sur une séance
   * Le commentaire est lié au coupon et donc à la séance spécifique
   */
  async addSessionComment(
    couponId: string,
    comment: string
  ): Promise<void> {
    await apiClient.patch(`/api/coupons/${couponId}/comment`, {
      comment,
    });
  }

  /**
   * Supprime un commentaire pédagogique
   */
  async deleteSessionComment(couponId: string): Promise<void> {
    await apiClient.delete(`/api/coupons/${couponId}/comment`);
  }

  /**
   * Supprimer un étudiant
   * @param studentId ID de l'étudiant à supprimer
   */
  async deleteStudent(studentId: string): Promise<void> {
    // Validation de l'ID
    if (
      !studentId ||
      typeof studentId !== "string" ||
      studentId.trim().length === 0
    ) {
      throw new Error("ID étudiant invalide pour la suppression");
    }
  }
}

export default new StudentService();
