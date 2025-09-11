import { apiClient } from "../utils";
import ActionCacheService from "./actionCacheService";

class StudentService {
  /**
   * Supprimer un étudiant
   * @param studentId ID de l'étudiant à supprimer
   */
  async deleteStudent(studentId: string): Promise<void> {
    // Validation de l'ID
    if (!studentId || typeof studentId !== 'string' || studentId.trim().length === 0) {
      throw new Error('ID étudiant invalide pour la suppression');
    }

    // ✨ NOUVEAU: Utilisation du ActionCacheService pour DELETE_STUDENT
    return ActionCacheService.executeAction(
      'DELETE_STUDENT',
      async () => {
        console.log(`🗑️ Suppression étudiant ID: ${studentId}`);
        
        const response = await apiClient.delete(`/api/students/${studentId}`);
        
        console.log(`✅ Étudiant ${studentId} supprimé avec succès`);
        return response;
      }
    ) as Promise<void>;
  }
}

export default new StudentService();