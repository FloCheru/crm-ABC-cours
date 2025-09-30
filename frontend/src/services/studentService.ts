import { apiClient } from "../utils";

class StudentService {
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
